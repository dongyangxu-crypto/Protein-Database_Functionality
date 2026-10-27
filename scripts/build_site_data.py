#!/usr/bin/env python
# -*- coding: utf-8 -*-
r"""
build_site_data.py —— 数据库 CSV → 网站数据（data/ 下按需加载的几种文件）+ 公开下载包（data/protein_db_csv.zip）

    python scripts/build_site_data.py                       # 默认读 D:\protein_database（ACS + Elsevier 合成库）
    python scripts/build_site_data.py --db <数据库目录>

数据库由 pipeline.py build-db 生成（每篇 datapoint.md「样品数据」表里的数）。公开版的处理：
  - 不公开原文句子：去掉 samples.evidence、measurements.source_text（及平铺表里的同名列）
  - 读图得到的数标注为来源于模型：model_estimated 换成 data_origin（「来源于模型 (model-derived)」/「作者原值 (author-reported)」）
  - check_note 是程序核对时的内部提醒，不公开

网页按需加载（2026-10-27 用户要求「为大数据量做按需加载」，数据涨十倍也能用）：
  data/index.json.gz   词表（期刊、蛋白来源、处理类型、测试方法、单位…）、DOI、分块范围、二进制列的位置
  data/index.bin.gz    筛选、计数、画图要用的列，二进制（每个数值十几个字节），打开网页时只下这两个
  data/search.json.gz  关键词要用的文字（输入关键词时才下）
  data/chunk/NNN.json.gz  按文章分块的详细内容（样品组成、处理步骤、数值原文写法、测试方法概述），翻到哪页下哪块
"""
import argparse
import csv
import gzip
import hashlib
import io
import json
import math
import os
import re
import shutil
import struct
import time
import unicodedata
import zipfile

DB_DIR = r'D:\protein_database'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data')
PROPS = ['solubility', 'emulsifying', 'foaming', 'gelling', 'water_holding', 'oil_holding', 'particle_size',
         'zeta_potential', 'pdi', 'sulfhydryl', 'disulfide', 'surface_hydrophobicity', 'turbidity',
         'degree_of_hydrolysis', 'free_amino', 'encapsulation', 'antioxidant']
MODEL_SOURCES = ('图反读', '图片表格反读')
ORIGIN_MODEL = '来源于模型 (model-derived)'
ORIGIN_AUTHOR = '作者原值 (author-reported)'
PRIVATE_COLS = {'evidence', 'source_text', 'check_note', 'model_estimated'}
TABLES = ['papers', 'samples', 'ingredients', 'treatments', 'treatment_params', 'measurements',
          'measurement_conditions', 'methods', 'flat_measurements']
OPTIONAL = {'methods'}
CHUNK_VALUES = 8000                     # 每块大约多少个数值（gzip 后两三百 KB）
TCAT_BITS = {'物理法': 1, '化学法': 2, '生物法': 4, '复合法': 8, '其他': 16}
UNTREATED_BIT = 32
METHOD_NONE, METHOD_NOT_STATED, METHOD_UNCLEAR = 0, 1, 2      # 数值的测试方法编码：0 = 这篇没提取方法


def read(db, name):
    with io.open(os.path.join(db, name + '.csv'), encoding='utf-8-sig', newline='') as fh:
        r = csv.DictReader(fh)
        return r.fieldnames, list(r)


def num(s):
    try:
        x = float(s)
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


def public_csv(cols, rows):
    """去掉不公开的列；有 model_estimated 的表换成 data_origin。返回 CSV 文本（UTF-8 带 BOM，Excel 直接打开）。"""
    keep = [c for c in cols if c not in PRIVATE_COLS]
    if 'model_estimated' in cols:
        keep.insert(keep.index('source_type') + 1, 'data_origin')
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator='\n')
    w.writerow(keep)
    for r in rows:
        if 'model_estimated' in cols:
            r = dict(r, data_origin=ORIGIN_MODEL if r['model_estimated'] == '是' else ORIGIN_AUTHOR)
        w.writerow([r[c] for c in keep])
    return '\ufeff' + buf.getvalue()


class Vocab:
    """词表：值 → 编号（按第一次出现的顺序；网页里按出现次数排）。"""
    def __init__(self, first=()):
        self.items, self.index = [], {}
        for x in first:
            self.id(x)

    def id(self, x):
        if x not in self.index:
            self.index[x] = len(self.items)
            self.items.append(x)
        return self.index[x]


def norm_unit(u):
    return ' '.join(unicodedata.normalize('NFKC', u or '').split())


PH_ONE = re.compile(r'^\s*(?:ph\s*)?(-?\d+(?:\.\d+)?)\s*$', re.I)


def one_ph(s):
    """测定 pH：单个数才认（「7.0」「pH 7」）；范围、几个值、文字都不认。"""
    m = PH_ONE.match(unicodedata.normalize('NFKC', s or ''))
    x = float(m.group(1)) if m else None
    return x if x is not None and 0 <= x <= 14 else None


def split_multi(s):
    return [x for x in (s or '').split(' | ') if x]


class Bin:
    """几列二进制拼成一个文件，每列 4 字节对齐；返回 (字节, {列名: [类型, 起点, 个数]})。"""
    CODES = {'u8': 'B', 'u16': 'H', 'u32': 'I', 'f32': 'f'}

    def __init__(self):
        self.buf, self.cols = bytearray(), {}

    def add(self, name, kind, values):
        while len(self.buf) % 4:
            self.buf.append(0)
        vals = [float('nan') if (kind == 'f32' and v is None) else v for v in values]
        self.cols[name] = [kind, len(self.buf), len(vals)]
        self.buf += struct.pack('<%d%s' % (len(vals), self.CODES[kind]), *vals)


def gz_json(obj):
    return gzip.compress(json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf-8'), 9, mtime=0)


def site_files(t):
    """网页用的几种文件：{相对路径: 字节}，以及统计。"""
    papers, samples, ings, steps, vals = (t[k][1] for k in ('papers', 'samples', 'ingredients', 'treatments',
                                                            'measurements'))
    methods = t['methods'][1] if 'methods' in t else []
    p_index = {r['doi']: i for i, r in enumerate(papers)}
    s_index = {r['sample_id']: i for i, r in enumerate(samples)}
    nP, nS, nV = len(papers), len(samples), len(vals)

    journals, pcat, sysv, form = Vocab(), Vocab(), Vocab(), Vocab([''])
    src, tt, unit = Vocab(), Vocab(), Vocab([''])
    method = Vocab([('', ''), ('', ''), ('', '')])        # 0 没提取、1 原文未写明、2 不确定，其余是测试方法（英文, 中文）
    m_of = {}                                               # (doi, M1) → 编码
    p_methods = [[] for _ in papers]
    for r in methods:
        en = r.get('test_method_en') or 'Other method'
        zh = r['test_method'] if en != 'Other method' else '其他方法'
        code = method.id((en, zh))
        m_of[(r['doi'], r['method_id'])] = code
        p_methods[p_index[r['doi']]].append(r)

    # ---- 样品
    s_ing = [[] for _ in samples]
    for r in ings:
        s_ing[s_index[r['sample_id']]].append([r['name'], r['category'], r['amount']])
    s_step = [[] for _ in samples]
    s_temp = [[] for _ in samples]
    for r in steps:
        k = s_index[r['sample_id']]
        s_step[k].append([r['treatment_method'], r['category'], r.get('treatment_type', ''), r['params']])
        x = num(r['temperature_c'])
        if x is not None:
            s_temp[k].append(x)
    sp, scat, ssys, sform, stcat = [], [], [], [], []
    ssrc_off, ssrc, stt_off, stt, stemp_off, stemp = [0], [], [0], [], [0], []
    for k, r in enumerate(samples):
        sp.append(p_index[r['doi']])
        scat.append(pcat.id(r['protein_category'] or '不明'))
        ssys.append(sysv.id(r['system'] or '不明'))
        sform.append(form.id(r.get('protein_form_std', '')))
        ssrc += [src.id(x) for x in split_multi(r.get('protein_source_std'))]
        ssrc_off.append(len(ssrc))
        stt += [tt.id(x) for x in split_multi(r.get('treatment_types'))]
        stt_off.append(len(stt))
        bits = 0
        for c in (r['treatment_categories'] or '').split('、'):
            bits |= TCAT_BITS.get(c, 0)
        stcat.append(bits or UNTREATED_BIT)
        stemp += s_temp[k]
        stemp_off.append(len(stemp))
    pj = [journals.id(r['journal'] or '') for r in papers]

    # ---- 数值
    vs, vp, vv, vstd, vu, vm, vo, vph = [], [], [], [], [], [], [], []
    names = Vocab()
    vname = []
    p_code = {c: i for i, c in enumerate(PROPS)}
    for r in vals:
        vs.append(s_index[r['sample_id']])
        vp.append(p_code[r['property']])
        vv.append(num(r['value']))
        vstd.append(num(r['value_std']))
        vu.append(unit.id(r['unit_std'] or norm_unit(r['unit'])))
        st = r.get('method_status', '')
        vm.append(m_of.get((r['doi'], r['method_id']), METHOD_NONE) if r.get('method_id') else
                  METHOD_NOT_STATED if st.startswith('原文未写明') else METHOD_UNCLEAR if st else METHOD_NONE)
        vo.append((1 if r['source_type'] in MODEL_SOURCES else 0))
        vph.append(one_ph(r.get('cond_ph')))
        vname.append(names.id(r['measure_name'].lower()))

    b = Bin()
    for name, kind, col in (('vs', 'u32', vs), ('vp', 'u8', vp), ('vv', 'f32', vv), ('vstd', 'f32', vstd),
                            ('vu', 'u16', vu), ('vm', 'u16', vm), ('vo', 'u8', vo), ('vph', 'f32', vph),
                            ('sp', 'u32', sp), ('scat', 'u8', scat), ('ssys', 'u8', ssys), ('sform', 'u8', sform),
                            ('stcat', 'u8', stcat), ('ssrc_off', 'u32', ssrc_off), ('ssrc', 'u16', ssrc),
                            ('stt_off', 'u32', stt_off), ('stt', 'u16', stt), ('stemp_off', 'u32', stemp_off),
                            ('stemp', 'f32', stemp), ('pj', 'u16', pj)):
        b.add(name, kind, col)

    # ---- 分块：按文章切，一篇的样品、数值、方法都在同一块
    v_of_s0 = [0] * (nS + 1)
    for s in vs:
        v_of_s0[s + 1] += 1
    for s in range(nS):
        v_of_s0[s + 1] += v_of_s0[s]
    s_of_p0 = [0] * (nP + 1)
    for p in sp:
        s_of_p0[p + 1] += 1
    for p in range(nP):
        s_of_p0[p + 1] += s_of_p0[p]
    chunks, files = [], {}
    p0 = 0
    while p0 < nP:
        p1 = p0
        while p1 < nP and (p1 == p0 or v_of_s0[s_of_p0[p1 + 1]] - v_of_s0[s_of_p0[p0]] <= CHUNK_VALUES):
            p1 += 1
        s0, s1 = s_of_p0[p0], s_of_p0[p1]
        v0, v1 = v_of_s0[s0], v_of_s0[s1]
        S = samples[s0:s1]
        V = vals[v0:v1]
        body = {
            'papers': {'title': [r['title'] for r in papers[p0:p1]],
                       'methods': [[[m['method_id'], p_code.get(m['property'], -1), m_of[(m['doi'], m['method_id'])],
                                     m.get('method_raw', ''), m.get('method_summary', ''), m.get('applies_to', ''),
                                     m.get('n_measurements', ''), m.get('reference', ''), m.get('instrument', '')]
                                    for m in p_methods[p]] for p in range(p0, p1)]},
            'samples': {'no': [int(r['sample_no']) for r in S], 'name': [r['sample_name'] for r in S],
                        'desc': [r['description'] for r in S], 'psrc': [r['protein_source'] for r in S],
                        'pform': [r['protein_form'] for r in S], 'pconc': [r['protein_conc'] for r in S],
                        'treat': [r['treatment_summary'] for r in S], 'ings': s_ing[s0:s1], 'steps': s_step[s0:s1]},
            'values': {k: [r.get(c, '') for r in V] for k, c in (
                ('name', 'measure_name'), ('vt', 'value_text'), ('sd', 'sd'), ('unit', 'unit'), ('mul', 'multiplier'),
                ('lo', 'err_low'), ('hi', 'err_high'), ('sig', 'significance'), ('vstd', 'value_std'),
                ('ustd', 'unit_std'), ('cond', 'conditions_all'), ('mid', 'method_id'), ('mp', 'method_params'),
                ('src', 'source_type'), ('item', 'source_item'), ('panel', 'source_panel'), ('series', 'series'),
                ('x', 'x'), ('xu', 'x_unit'), ('xv', 'x_variable'))},
        }
        data = gz_json(body)
        rel = 'chunk/%03d.json.gz' % len(chunks)
        files[rel] = data
        chunks.append([p0, p1, s0, s1, v0, v1, hashlib.sha1(data).hexdigest()[:10]])
        p0 = p1

    # ---- 关键词要用的文字
    ptext = []
    for p, r in enumerate(papers):
        ptext.append(' \u0001 '.join([r['title'], r['doi'], r['journal']] +
                                     [m.get('method_raw', '') for m in p_methods[p]]).lower())
    stext = [' \u0001 '.join([r['sample_name'], r['description'], r['protein_source'], r['protein_form'],
                              r.get('protein_source_std', ''), r['protein_conc'], r['ingredients_summary'],
                              r['treatment_summary']]).lower() for r in samples]
    search = gz_json({'ptext': ptext, 'stext': stext, 'names': names.items, 'vname': vname})
    files['search.json.gz'] = search
    binary = gzip.compress(bytes(b.buf), 9, mtime=0)
    files['index.bin.gz'] = binary
    index = {
        'meta': {'version': 2, 'built': time.strftime('%Y-%m-%d'), 'papers': nP, 'samples': nS, 'values': nV,
                 'methods': len(methods), 'props': PROPS, 'bin': hashlib.sha1(binary).hexdigest()[:10],
                 'search': hashlib.sha1(search).hexdigest()[:10], 'cols': b.cols, 'chunks': chunks,
                 'tcat_bits': TCAT_BITS, 'untreated_bit': UNTREATED_BIT},
        'dict': {'journal': journals.items, 'pcat': pcat.items, 'sys': sysv.items, 'form': form.items,
                 'src': src.items, 'tt': tt.items, 'unit': unit.items, 'method': method.items},
        'doi': [r['doi'] for r in papers],
    }
    files['index.json.gz'] = gz_json(index)
    return files, len(chunks)


def stamp_versions():
    """index.html 里引用的 style.css、app.js 和数据加上版本号（文件内容的哈希）：文件一变地址就变，
    浏览器不会一直用旧缓存（2026-10-19 用户的浏览器按 Ctrl+F5 也一直显示旧版）。改了网页文件后跑一次本脚本就会更新。"""
    def h(rel):
        with open(os.path.join(ROOT, rel), 'rb') as fh:
            return hashlib.sha1(fh.read()).hexdigest()[:10]
    path = os.path.join(ROOT, 'index.html')
    with io.open(path, encoding='utf-8') as fh:
        html = fh.read()
    for rel in ('assets/style.css', 'assets/app.js', 'assets/charts.js', 'assets/xlsx.js'):
        if os.path.exists(os.path.join(ROOT, rel)):
            html = re.sub(r'%s(\?v=[0-9a-f]*)?"' % re.escape(rel), '%s?v=%s"' % (rel, h(rel)), html)
    html = re.sub(r'<meta name="data-version" content="[^"]*">',
                  '<meta name="data-version" content="%s">' % h('data/index.json.gz'), html)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(html)


def main(argv=None):
    ap = argparse.ArgumentParser(description='数据库 CSV → 网站数据 + 公开下载包')
    ap.add_argument('--db', default=DB_DIR, help='数据库目录，默认 %s' % DB_DIR)
    args = ap.parse_args(argv)
    t = {name: read(args.db, name) for name in TABLES
         if name not in OPTIONAL or os.path.exists(os.path.join(args.db, name + '.csv'))}
    files, n_chunks = site_files(t)
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(OUT, '.new')
    if os.path.exists(tmp):
        shutil.rmtree(tmp)
    for rel, data in files.items():
        path = os.path.join(tmp, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as fh:
            fh.write(data)
    # 换上新文件：旧的分块整个删掉（块数可能变少），旧版的 db.json.gz 不再用
    if os.path.exists(os.path.join(OUT, 'chunk')):
        shutil.rmtree(os.path.join(OUT, 'chunk'))
    for rel in files:
        dst = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        os.replace(os.path.join(tmp, rel), dst)
    shutil.rmtree(tmp)
    old = os.path.join(OUT, 'db.json.gz')
    if os.path.exists(old):
        os.remove(old)
    zpath = os.path.join(OUT, 'protein_db_csv.zip')
    with zipfile.ZipFile(zpath + '.tmp', 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name in TABLES:
            if name in t:
                z.writestr(name + '.csv', public_csv(*t[name]).encode('utf-8'))
        for doc in ('README.md', 'LICENSE-DATA.md'):          # 说明和数据许可（CC BY 4.0）跟着下载包走
            if os.path.exists(os.path.join(ROOT, doc)):
                z.write(os.path.join(ROOT, doc), doc)
    os.replace(zpath + '.tmp', zpath)
    stamp_versions()
    size = lambda rel: len(files[rel]) / 1e6
    print('网站数据：打开时下载 %.1f MB（index %.2f + bin %.2f），关键词 %.1f MB，%d 块详细内容共 %.1f MB；'
          '下载包 %.1f MB；文章 %d、样品 %d、数值 %d' % (
              size('index.json.gz') + size('index.bin.gz'), size('index.json.gz'), size('index.bin.gz'),
              size('search.json.gz'), n_chunks, sum(len(v) for k, v in files.items() if k.startswith('chunk/')) / 1e6,
              os.path.getsize(zpath) / 1e6, len(t['papers'][1]), len(t['samples'][1]), len(t['measurements'][1])))


if __name__ == '__main__':
    main()
