#!/usr/bin/env python
# -*- coding: utf-8 -*-
r"""
build_site_data.py —— 数据库 CSV → 网站数据（data/db.json.gz）+ 公开下载包（data/protein_db_csv.zip）

    python scripts/build_site_data.py                       # 默认读 D:\acs_papers_数据库
    python scripts/build_site_data.py --db <数据库目录>

数据库由 build_database.py 生成（每篇 datapoint.md「样品数据」表里的数）。公开版的处理：
  - 不公开原文句子：去掉 samples.evidence、measurements.source_text（及平铺表里的同名列）
  - 读图得到的数标注为来源于模型：model_estimated 换成 data_origin（「来源于模型 (model-derived)」/「作者原值 (author-reported)」）
  - check_note 是程序核对时的内部提醒，不公开
网页只读 data/db.json.gz（按列存放、gzip 压缩，浏览器里解压），不需要服务器。
"""
import argparse
import csv
import gzip
import hashlib
import io
import json
import os
import re
import time
import zipfile

DB_DIR = r'D:\acs_papers_数据库'
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
OPTIONAL = {'methods'}                        # 测试方法表（2026-10-19 加）：库里有才放进下载包


def read(db, name):
    with io.open(os.path.join(db, name + '.csv'), encoding='utf-8-sig', newline='') as fh:
        r = csv.DictReader(fh)
        return r.fieldnames, list(r)


def num(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


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


def site_json(t):
    """网页用的数据：按列存放（一列一个数组），编号换成数组下标。"""
    papers, samples, ings, steps, vals = (t[k][1] for k in ('papers', 'samples', 'ingredients', 'treatments',
                                                              'measurements'))
    p_index = {r['doi']: i for i, r in enumerate(papers)}
    s_index = {r['sample_id']: i for i, r in enumerate(samples)}
    journals = sorted({r['journal'] for r in papers})
    j_index = {j: i for i, j in enumerate(journals)}
    s_ings = [[] for _ in samples]
    for r in ings:
        s_ings[s_index[r['sample_id']]].append([r['name'], r['category'], r['amount']])
    s_steps = [[] for _ in samples]
    s_temps = [[] for _ in samples]
    for r in steps:
        k = s_index[r['sample_id']]
        s_steps[k].append([r.get('treatment_method', r.get('method', '')), r['category'], r['params']])
        if num(r['temperature_c']) is not None:
            s_temps[k].append(num(r['temperature_c']))
    out = {
        'meta': {'built': time.strftime('%Y-%m-%d'), 'papers': len(papers), 'samples': len(samples),
                 'values': len(vals), 'props': PROPS},
        'journals': journals,
        'papers': {'doi': [r['doi'] for r in papers], 'title': [r['title'] for r in papers],
                   'journal': [j_index[r['journal']] for r in papers]},
        'samples': {'paper': [p_index[r['doi']] for r in samples], 'no': [int(r['sample_no']) for r in samples],
                    'name': [r['sample_name'] for r in samples], 'desc': [r['description'] for r in samples],
                    'psrc': [r['protein_source'] for r in samples], 'pcat': [r['protein_category'] for r in samples],
                    'pform': [r['protein_form'] for r in samples], 'pconc': [r['protein_conc'] for r in samples],
                    'ingr': [r['ingredients_summary'] for r in samples],
                    'treat': [r['treatment_summary'] for r in samples],
                    'tcat': [r['treatment_categories'] for r in samples], 'sys': [r['system'] for r in samples],
                    'temps': s_temps, 'ings': s_ings, 'steps': s_steps},
        'values': {k: [] for k in ('s', 'p', 'name', 'v', 'vt', 'sd', 'unit', 'mul', 'lo', 'hi', 'sig', 'vstd',
                                   'ustd', 'cond', 'tm', 'mp', 'ms', 'src', 'item', 'panel', 'series', 'x', 'xu',
                                   'xv')},
    }
    v = out['values']
    p_code = {c: i for i, c in enumerate(PROPS)}
    for r in vals:
        v['s'].append(s_index[r['sample_id']])
        v['p'].append(p_code[r['property']])
        v['v'].append(num(r['value']))
        for k, c in (('name', 'measure_name'), ('vt', 'value_text'), ('sd', 'sd'), ('unit', 'unit'),
                     ('mul', 'multiplier'), ('lo', 'err_low'), ('hi', 'err_high'), ('sig', 'significance'),
                     ('vstd', 'value_std'), ('ustd', 'unit_std'), ('cond', 'conditions_all'), ('src', 'source_type'),
                     ('item', 'source_item'), ('panel', 'source_panel'), ('series', 'series'), ('x', 'x'),
                     ('xu', 'x_unit'), ('xv', 'x_variable'), ('tm', 'test_method'), ('mp', 'method_params'),
                     ('ms', 'method_status')):
            v[k].append(r.get(c, ''))         # 测试方法三列：库里还没有（没提取方法）时为空
    return out


def stamp_versions():
    """index.html 里引用的 style.css、app.js 和数据加上版本号（文件内容的哈希）：文件一变地址就变，
    浏览器不会一直用旧缓存（2026-10-19 用户的浏览器按 Ctrl+F5 也一直显示旧版）。改了网页文件后跑一次本脚本就会更新。"""
    def h(rel):
        with open(os.path.join(ROOT, rel), 'rb') as fh:
            return hashlib.sha1(fh.read()).hexdigest()[:10]
    path = os.path.join(ROOT, 'index.html')
    with io.open(path, encoding='utf-8') as fh:
        html = fh.read()
    for rel in ('assets/style.css', 'assets/app.js'):
        html = re.sub(r'%s(\?v=[0-9a-f]*)?"' % re.escape(rel), '%s?v=%s"' % (rel, h(rel)), html)
    html = re.sub(r'<meta name="data-version" content="[^"]*">',
                  '<meta name="data-version" content="%s">' % h('data/db.json.gz'), html)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(html)


def main(argv=None):
    ap = argparse.ArgumentParser(description='数据库 CSV → 网站数据 + 公开下载包')
    ap.add_argument('--db', default=DB_DIR, help='数据库目录，默认 %s' % DB_DIR)
    args = ap.parse_args(argv)
    t = {name: read(args.db, name) for name in TABLES
         if name not in OPTIONAL or os.path.exists(os.path.join(args.db, name + '.csv'))}
    os.makedirs(OUT, exist_ok=True)
    data = json.dumps(site_json(t), ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    with open(os.path.join(OUT, 'db.json.gz'), 'wb') as fh:
        fh.write(gzip.compress(data, compresslevel=9, mtime=0))
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
    print('网站数据 %.1f MB（解压前 %.1f MB）；下载包 %.1f MB；文章 %d、样品 %d、数值 %d' % (
        os.path.getsize(os.path.join(OUT, 'db.json.gz')) / 1e6, len(data) / 1e6, os.path.getsize(zpath) / 1e6,
        len(t['papers'][1]), len(t['samples'][1]), len(t['measurements'][1])))


if __name__ == '__main__':
    main()
