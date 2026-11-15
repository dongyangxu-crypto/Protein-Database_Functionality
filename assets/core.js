'use strict';
/* PDF · Protein Database of Functionality —— 核心：文字、数据加载、标签、筛选状态、筛选和计数、高级查询、批量检索、数据篮、导出格式、检索提示。
   打开时只下 data/index.json.gz + index.bin.gz；关键词用到时才下 search.json.gz；详细内容按文章分块（data/chunk/NNN.json.gz），用到哪块下哪块。
   几个脚本共用 window.PDF（A）：core.js → search.js（检索页）→ pages.js（其余页面）→ main.js（路由、启动）。 */
(() => {
  const A = window.PDF = {};
  const X = window.PDF_TEXT;
  const ROUTINE_TT = new Set(X.ROUTINE_TT);
  const TCAT_NAMES = X.TCAT_NAMES;
  const MODEL_SRC = new Set(['图反读', '图片表格反读']);

  // ================================================================ 文字、工具 ==
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (s) => { if (s === '' || s === null || s === undefined) return null; const x = parseFloat(s); return Number.isFinite(x) ? x : null; };
  const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');
  let LANG = (() => {
    try { const v = localStorage.getItem('lang'); if (v === 'zh' || v === 'en') return v; } catch (e) { /* 无痕模式等 */ }
    return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  })();
  const t = (k, vars) => {
    let s = X.I18N[LANG][k] ?? X.I18N.zh[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split('{' + a + '}').join(b);
    return s;
  };
  const cat = (v) => (LANG === 'en' ? (X.EN[v] || v) : v);
  const zh = (v) => (LANG === 'zh' ? (X.ZH[v] || v) : v);
  const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US') : '');
  const pct = (a, b) => (b ? (a / b * 100).toFixed(a / b < 0.1 ? 1 : 0) : '0');
  const SUP = { '-': '⁻', '+': '⁺', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sci = (s) => String(s).replace(/^([-+]?\d+(?:\.\d+)?)e([-+]?\d+)$/i, (_, m, e) => m + ' × 10' + String(+e).split('').map((c) => SUP[c]).join(''));
  const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
  const bytes = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : (n / 1e3).toFixed(0) + ' KB');
  function toast(msg) {
    document.querySelectorAll('.toast').forEach((x) => x.remove());
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
  function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { /* 忽略 */ }
      ta.remove();
      return ok;
    }
  }
  const cell = (v) => String(v ?? '');
  const csvText = (rows) => '﻿' + rows.map((r) => r.map((v) => { const s = cell(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n') + '\n';
  const tsvText = (rows) => '﻿' + rows.map((r) => r.map((v) => cell(v).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n') + '\n';
  const jsonText = (rows) => JSON.stringify(rows.slice(1).map((r) => Object.fromEntries(rows[0].map((h, k) => [h, r[k] ?? '']))), null, 1);
  const P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>', doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6l-5.2 9.4A1.7 1.7 0 0 0 6.3 21h11.4a1.7 1.7 0 0 0 1.5-2.6L14 9V3"/><path d="M7.5 15h9"/>',
    chart: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/>', leaf: '<path d="M5 19C5 10 11 5 20 5c0 9-5.5 14-14 14"/><path d="M5 19l8-8"/>',
    wave: '<path d="M3 9c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M3 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>', down: '<path d="M7 10l5 5 5-5"/>',
    quote: '<path d="M6 8h4v4c0 3-1.5 4.5-4 5.5"/><path d="M14 8h4v4c0 3-1.5 4.5-4 5.5"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    download: '<path d="M12 4v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M5 20h14"/>', filter: '<path d="M4 5h16l-6.2 7.6V19l-3.6 1.8v-8.2z"/>',
    cart: '<path d="M3 4h2.2l2.3 11.2h10.8L20.5 8H6.4"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
    query: '<rect x="3" y="4" width="8" height="6" rx="1.5"/><rect x="13" y="14" width="8" height="6" rx="1.5"/><path d="M7 10v4.5a2 2 0 0 0 2 2h4"/>',
    browse: '<path d="M4 6h16M4 12h16M4 18h10"/>', help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.6v.4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>', swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    tag: '<path d="M3.5 12.5V4h8.5L21 13l-8.5 8.5z"/><circle cx="8" cy="8.5" r="1.3"/>', gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="M12 13l4-4"/>',
    book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z"/><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5"/>',
    bell: '<path d="M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>', info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    home: '<path d="M4 11l8-6.5 8 6.5v8.5a1 1 0 0 1-1 1h-4.5v-5.5h-5V20.5H5a1 1 0 0 1-1-1z"/>',
    robot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/>',
    ring: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v5M20.5 12h-5M12 20.5v-5M3.5 12h5"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
  };
  const ic = (n, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
  const STORE = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 存不了就算了 */ } } };

  // ================================================================ 数据 ==
  const D = { chunkData: [], chunkWait: [] };
  let pending = 0;
  function progress(delta) {
    pending += delta;
    const el = $('progress');
    if (!el) return;
    el.hidden = pending <= 0;
    el.style.width = pending > 0 ? '70%' : '100%';
  }
  async function gz(path, ver, asBuffer) {
    if (typeof DecompressionStream === 'undefined') throw new Error(t('no_stream'));
    progress(1);
    try {
      const res = await fetch(path + (ver ? '?v=' + ver : ''), { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + path);
      const r = new Response(res.body.pipeThrough(new DecompressionStream('gzip')));
      return asBuffer ? await r.arrayBuffer() : JSON.parse(await r.text());
    } finally { progress(-1); }
  }
  async function loadIndex() {
    const ver = document.querySelector('meta[name="data-version"]')?.content || '';
    const idx = await gz('data/index.json.gz', ver);
    Object.assign(D, idx);
    const buf = await gz('data/index.bin.gz', idx.meta.bin, true);
    const T = { u8: Uint8Array, u16: Uint16Array, u32: Uint32Array, f32: Float32Array };
    D.c = {};
    for (const [name, [kind, off, n]] of Object.entries(idx.meta.cols)) D.c[name] = new T[kind](buf, off, n);
    const C = D.c;
    if (!C.vflag) C.vflag = new Uint8Array(C.vs.length);
    if (!C.sflag) C.sflag = new Uint8Array(C.sp.length);
    if (!C.spar_off) { C.spar_off = new Uint32Array(C.sp.length + 1); C.spar_k = new Uint8Array(0); C.spar_v = new Float32Array(0); }
    D.nV = C.vs.length; D.nS = C.sp.length; D.nP = C.pj.length;
    D.veff = new Float32Array(D.nV);
    for (let i = 0; i < D.nV; i++) D.veff[i] = Number.isNaN(C.vstd[i]) ? C.vv[i] : C.vstd[i];
    D.sFirst = new Uint32Array(D.nP + 1);
    for (let s = 0; s < D.nS; s++) D.sFirst[C.sp[s] + 1]++;
    for (let p = 0; p < D.nP; p++) D.sFirst[p + 1] += D.sFirst[p];
    D.vFirst = new Uint32Array(D.nS + 1);
    for (let i = 0; i < D.nV; i++) D.vFirst[C.vs[i] + 1]++;
    for (let s = 0; s < D.nS; s++) D.vFirst[s + 1] += D.vFirst[s];
    D.doiIndex = new Map(D.doi.map((d, i) => [d, i]));
    D.doiLower = new Map(D.doi.map((d, i) => [d.toLowerCase(), i]));
    D.sMaxT = new Float32Array(D.nS).fill(NaN);
    for (let s = 0; s < D.nS; s++) for (let k = C.stemp_off[s]; k < C.stemp_off[s + 1]; k++) if (!(C.stemp[k] <= D.sMaxT[s])) D.sMaxT[s] = C.stemp[k];
    computeStats();
  }
  let searchLoad = null;
  function loadSearch() {
    if (!searchLoad) searchLoad = gz('data/search.json.gz', D.meta.search).then((x) => { D.search = x; });
    return searchLoad;
  }
  const sampleNo = (s) => s - D.sFirst[D.c.sp[s]] + 1;
  const sampleKey = (s) => D.doi[D.c.sp[s]] + '~' + sampleNo(s);
  function sampleFromKey(key) {
    const k = key.lastIndexOf('~');
    if (k < 0) return -1;
    let p = D.doiIndex.get(key.slice(0, k));
    if (p === undefined) p = D.doiLower.get(key.slice(0, k).toLowerCase());
    const n = parseInt(key.slice(k + 1), 10);
    if (p === undefined || !(n >= 1) || D.sFirst[p] + n - 1 >= D.sFirst[p + 1]) return -1;
    return D.sFirst[p] + n - 1;
  }
  function chunkOf(field, x) {           // field 0 论文、2 样品、4 数值
    const ch = D.meta.chunks;
    let lo = 0, hi = ch.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ch[mid][field] <= x) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function loadChunk(k) {
    if (!D.chunkWait[k]) {
      const c = D.meta.chunks[k];
      D.chunkWait[k] = gz('data/chunk/' + String(k).padStart(3, '0') + '.json.gz', c[6]).then((x) => { D.chunkData[k] = x; return x; });
    }
    return D.chunkWait[k];
  }
  const ensure = (ks) => Promise.all([...new Set(ks)].map(loadChunk));
  const ensureValues = (idx) => ensure(idx.map((i) => chunkOf(4, i)));
  const ensureSamples = (ss) => ensure(ss.map((s) => chunkOf(2, s)));
  const ensurePapers = (ps) => ensure(ps.map((p) => chunkOf(0, p)));
  const VX = (i, f) => { const k = chunkOf(4, i); return D.chunkData[k].values[f][i - D.meta.chunks[k][4]]; };
  const SX = (s, f) => { const k = chunkOf(2, s); return D.chunkData[k].samples[f][s - D.meta.chunks[k][2]]; };
  const PX = (p, f) => { const k = chunkOf(0, p); return D.chunkData[k].papers[f][p - D.meta.chunks[k][0]]; };

  // ================================================================ 标签 ==
  const propKey = (c) => D.meta.props[c];
  const propName = (c) => X.PROP_NAMES[D.meta.props[c]][LANG === 'zh' ? 0 : 1];
  const methodName = (c) => (c === 0 ? t('m_unextracted') : c === 1 ? t('m_none') : c === 2 ? t('m_amb') : D.dict.method[c][LANG === 'zh' ? 1 : 0]);
  const csr = (off, ids, s) => { const out = []; for (let k = off[s]; k < off[s + 1]; k++) out.push(ids[k]); return out; };
  const srcOf = (s) => csr(D.c.ssrc_off, D.c.ssrc, s);
  const ttOf = (s) => csr(D.c.stt_off, D.c.stt, s);
  const tcatOf = (s) => { const b = D.c.stcat[s], out = []; for (let k = 0; k < 6; k++) if (b & (1 << k)) out.push(k); return out; };
  const srcLabel = (c) => zh(D.dict.src[c]);
  const formLabel = (c) => (c ? zh(D.dict.form[c]) : t('not_stated'));
  const ttLabel = (c) => zh(D.dict.tt[c]);
  const journalName = (p) => D.dict.journal[D.c.pj[p]] || '';
  const isRoutine = (c) => ROUTINE_TT.has(D.dict.tt[c]);
  const sampleName = (s) => SX(s, 'name') || t('sample_n', { n: sampleNo(s) });
  const paperHref = (p) => '#/paper?doi=' + encodeURIComponent(D.doi[p]);
  const sampleHref = (s) => '#/sample?doi=' + encodeURIComponent(D.doi[D.c.sp[s]]) + '&n=' + sampleNo(s);
  const doiHref = (p) => 'https://doi.org/' + encodeURI(D.doi[p]);
  const propHref = (prop, src, tt) => { const h = new URLSearchParams(); h.set('prop', prop); if (src) h.set('src', src); if (tt) h.set('tt', tt); return '#/property?' + h; };

  // 全库统计（首页、浏览、统计、检索提示共用）
  function computeStats() {
    const C = D.c, d = D.dict, nP = D.meta.props.length;
    const st = {
      propV: new Uint32Array(nP), propModel: new Uint32Array(nP), propSD: new Uint32Array(nP), propS: new Uint32Array(nP), propP: new Uint32Array(nP),
      methodV: new Uint32Array(d.method.length), srcS: new Uint32Array(d.src.length), srcV: new Uint32Array(d.src.length), srcP: new Uint32Array(d.src.length),
      ttS: new Uint32Array(d.tt.length), ttV: new Uint32Array(d.tt.length), ttP: new Uint32Array(d.tt.length), formS: new Uint32Array(d.form.length),
      pcatS: new Uint32Array(d.pcat.length), sysS: new Uint32Array(d.sys.length), tcatS: new Uint32Array(6), journalP: new Uint32Array(d.journal.length),
      journalV: new Uint32Array(d.journal.length), unitV: new Uint32Array(d.unit.length), model: 0, sd: 0,
      propMethod: [...Array(nP)].map(() => new Map()), propUnit: [...Array(nP)].map(() => new Map()), srcCat: new Uint16Array(d.src.length),
    };
    const seenSP = new Uint8Array(D.nS * nP > 4e7 ? 0 : D.nS * nP);
    const seenPP = new Uint8Array(D.nP * nP);
    for (let i = 0; i < D.nV; i++) {
      const p = C.vp[i], s = C.vs[i], pp = C.sp[s];
      st.propV[p]++; st.methodV[C.vm[i]]++; st.unitV[C.vu[i]]++; st.journalV[C.pj[pp]]++;
      if (C.vo[i] & 1) { st.model++; st.propModel[p]++; }
      if (C.vflag[i] & 1) { st.sd++; st.propSD[p]++; }
      if (seenSP.length && !seenSP[s * nP + p]) { seenSP[s * nP + p] = 1; st.propS[p]++; }
      if (!seenPP[pp * nP + p]) { seenPP[pp * nP + p] = 1; st.propP[p]++; }
      const pm = st.propMethod[p]; pm.set(C.vm[i], (pm.get(C.vm[i]) || 0) + 1);
      const pu = st.propUnit[p]; pu.set(C.vu[i], (pu.get(C.vu[i]) || 0) + 1);
    }
    const catCount = new Map();
    const lastP = (n) => new Int32Array(n).fill(-1);
    const srcLastP = lastP(d.src.length), ttLastP = lastP(d.tt.length);
    for (let s = 0; s < D.nS; s++) {
      const nv = D.vFirst[s + 1] - D.vFirst[s], p = C.sp[s];
      for (const c of new Set(srcOf(s))) {
        st.srcS[c]++; st.srcV[c] += nv;
        if (srcLastP[c] !== p) { srcLastP[c] = p; st.srcP[c]++; }
        const key = c * 64 + C.scat[s]; catCount.set(key, (catCount.get(key) || 0) + 1);
      }
      for (const c of new Set(ttOf(s))) { st.ttS[c]++; st.ttV[c] += nv; if (ttLastP[c] !== p) { ttLastP[c] = p; st.ttP[c]++; } }
      st.formS[C.sform[s]]++; st.pcatS[C.scat[s]]++; st.sysS[C.ssys[s]]++;
      for (const k of tcatOf(s)) st.tcatS[k]++;
    }
    const best = new Map();
    for (const [key, n] of catCount) { const c = Math.floor(key / 64), pc = key % 64; if (!best.has(c) || best.get(c)[1] < n) best.set(c, [pc, n]); }
    for (const [c, [pc]] of best) st.srcCat[c] = pc;
    for (let p = 0; p < D.nP; p++) st.journalP[C.pj[p]]++;
    D.stats = st;
  }

  // ================================================================ 分面 ==
  // level: v 数值、s 样品、p 论文；kind: one 单值、multi 多值（CSR）、bits 位
  let FACETS = [];
  function setupFacets() {
    const C = D.c, d = D.dict;
    // 单位筛选只列标准单位（有数值换算到它）和「无单位」，其余约 9 千种没换算的原文写法合成一项「其他」（11-12 用户：单位筛选 9,170 项太乱）
    const U_OTHER = d.unit.length, uStd = new Uint8Array(d.unit.length);
    for (let i = 0; i < D.nV; i++) if (C.vstd[i] === C.vstd[i]) uStd[C.vu[i]] = 1;
    if (d.unit.indexOf('') >= 0) uStd[d.unit.indexOf('')] = 1;
    FACETS = [
      { key: 'prop', level: 'v', n: D.meta.props.length, get: (i) => C.vp[i], label: propName, tok: (c) => D.meta.props[c], fixed: true },
      { key: 'src', level: 's', kind: 'multi', off: C.ssrc_off, ids: C.ssrc, n: d.src.length, label: srcLabel, tok: (c) => d.src[c], find: true, top: 24 },
      { key: 'pcat', level: 's', n: d.pcat.length, get: (s) => C.scat[s], label: (c) => cat(d.pcat[c]), tok: (c) => d.pcat[c] },
      { key: 'form', level: 's', n: d.form.length, get: (s) => C.sform[s], label: formLabel, tok: (c) => d.form[c] || '-', top: 16 },
      { key: 'tt', level: 's', kind: 'multi', off: C.stt_off, ids: C.stt, n: d.tt.length, label: ttLabel, tok: (c) => d.tt[c], find: true, top: 24 },
      { key: 'tcat', level: 's', kind: 'bits', n: 6, label: (c) => cat(TCAT_NAMES[c]), tok: (c) => TCAT_NAMES[c], fixed: true },
      { key: 'method', level: 'v', n: d.method.length, get: (i) => C.vm[i], label: methodName,
        tok: (c) => (c < 3 ? ['unextracted', 'notstated', 'unclear'][c] : d.method[c][0]), find: true, top: 24 },
      { key: 'sys', level: 's', n: d.sys.length, get: (s) => C.ssys[s], label: (c) => cat(d.sys[c]), tok: (c) => d.sys[c] },
      { key: 'journal', level: 'p', n: d.journal.length, get: (p) => C.pj[p], label: (c) => d.journal[c] || t('unknown'), tok: (c) => d.journal[c], find: true, top: 12 },
      { key: 'unit', level: 'v', n: d.unit.length + 1, get: (i) => (uStd[C.vu[i]] ? C.vu[i] : U_OTHER),
        label: (c) => (c === U_OTHER ? t('unit_other') : d.unit[c] || t('no_unit')), tok: (c) => (c === U_OTHER ? '~other' : d.unit[c] || '-'), top: 20, last: U_OTHER },
      { key: 'origin', level: 'v', n: 2, get: (i) => C.vo[i] & 1, label: (c) => t(c ? 'o_model' : 'o_author'), tok: (c) => (c ? 'model' : 'author'), fixed: true },
    ];
    FACETS.forEach((f, fi) => {
      f.bit = 1 << fi;
      f.fromTok = new Map();
      for (let c = 0; c < f.n; c++) f.fromTok.set(f.tok(c), c);
      f.count = new Uint32Array(f.n);
      f.mask = new Uint8Array(f.n);
    });
  }
  const facetByKey = (k) => FACETS.find((f) => f.key === k);
  // 某个样品 / 数值在某分面上的编码
  function facetCodes(f, i, s, p) {
    if (f.level === 'v') return [f.get(i)];
    if (f.level === 'p') return [f.get(p)];
    if (f.kind === 'multi') return csr(f.off, f.ids, s);
    if (f.kind === 'bits') return tcatOf(s);
    return [f.get(s)];
  }

  // ================================================================ 检索状态 ==
  // 范围：[最小键, 最大键, 文字键, 层级, 处理参数编号（0 温度，1 时间，2 pH，3 压力，4 功率，5 频率）]
  const RANGE_DEFS = [['vmin', 'vmax', 'r_value', 'v'], ['phmin', 'phmax', 'r_ph', 'v'], ['tmin', 'tmax', 'r_temp', 's', 0],
    ['dmin', 'dmax', 'r_time', 's', 1], ['tpmin', 'tpmax', 'r_tph', 's', 2], ['prmin', 'prmax', 'r_pres', 's', 3],
    ['pwmin', 'pwmax', 'r_pow', 's', 4], ['fqmin', 'fqmax', 'r_freq', 's', 5]];
  const RANGES = RANGE_DEFS.flatMap((r) => [r[0], r[1]]);
  const SORTS = ['paper', 'prop', 'vasc', 'vdesc', 'src', 'method', 'journal', 'ph'];
  const S = { q: '', paper: '', sort: 'paper', page: 0, size: 50, sel: {}, sd: false, pure: false, batch: '', adv: [], view: 'v' };
  RANGES.forEach((k) => { S[k] = ''; });
  { const v = STORE.get('pdfdb_ui', {}); if ([25, 50, 100, 200].includes(v.size)) S.size = v.size; }

  function readSearch(params) {
    S.q = params.get('q') || '';
    S.paper = params.get('paper') || '';
    for (const f of FACETS) {
      f.mask.fill(0);
      const v = params.get(f.key);
      S.sel[f.key] = new Set();
      if (v) for (const tok of v.split('|')) { const c = f.fromTok.get(tok); if (c !== undefined) { S.sel[f.key].add(c); f.mask[c] = 1; } }
    }
    RANGES.forEach((k) => { S[k] = params.get(k) || ''; });
    S.sd = params.get('sd') === '1';
    S.pure = params.get('pure') === '1';
    S.batch = params.get('batch') || '';
    try { const a = JSON.parse(params.get('adv') || '[]'); S.adv = Array.isArray(a) ? a.filter((r) => r && ADV_FIELDS[r.f]) : []; } catch (e) { S.adv = []; }
    S.view = ['v', 's', 'p'].includes(params.get('view')) ? params.get('view') : 'v';
    S.sort = SORTS.includes(params.get('sort')) ? params.get('sort') : 'paper';
    S.page = Math.max(0, (parseInt(params.get('page'), 10) || 1) - 1);
  }
  function searchParams() {
    const h = new URLSearchParams();
    if (S.q) h.set('q', S.q);
    if (S.paper) h.set('paper', S.paper);
    for (const f of FACETS) if (S.sel[f.key] && S.sel[f.key].size) h.set(f.key, [...S.sel[f.key]].map(f.tok).join('|'));
    RANGES.forEach((k) => { if (S[k] !== '') h.set(k, S[k]); });
    if (S.sd) h.set('sd', '1');
    if (S.pure) h.set('pure', '1');
    if (S.batch) h.set('batch', S.batch);
    if (S.adv.length) h.set('adv', JSON.stringify(S.adv));
    if (S.view !== 'v') h.set('view', S.view);
    if (S.sort !== 'paper') h.set('sort', S.sort);
    if (S.page) h.set('page', S.page + 1);
    return h;
  }
  const searchHref = (h) => '#/search' + (h && h.toString() ? '?' + h.toString() : '');
  function clearFilters() {
    S.q = ''; S.paper = ''; S.sd = false; S.pure = false; S.batch = ''; S.adv = [];
    for (const f of FACETS) { S.sel[f.key] = new Set(); f.mask.fill(0); }
    RANGES.forEach((k) => { S[k] = ''; });
  }
  // 当前生效的筛选组（用于「去掉一个条件」的建议和标签）
  function activeGroups() {
    const g = [];
    if (S.q) g.push(['q', `${t('f_q')}: ${S.q}`]);
    if (S.paper) g.push(['paper', `${t('f_paper')}: ${S.paper}`]);
    for (const f of FACETS) if (S.sel[f.key].size) g.push(['f:' + f.key, `${t('f_' + f.key)}: ${[...S.sel[f.key]].map(f.label).join(' / ')}`]);
    for (const [a, b, k] of RANGE_DEFS) if (S[a] !== '' || S[b] !== '') g.push(['r:' + a, `${t(k)}: ${S[a] || '…'} – ${S[b] || '…'}`]);
    if (S.sd) g.push(['sd', t('flag_sd')]);
    if (S.pure) g.push(['pure', t('flag_pure')]);
    if (S.batch) g.push(['batch', t('b_chip', { n: parseBatchTokens(S.batch).length })]);
    if (S.adv.length) g.push(['adv', t('a_chip', { q: clip(advText(S.adv), 80) })]);
    return g;
  }
  function removeGroup(key) {
    if (key === 'q') S.q = '';
    else if (key === 'paper') S.paper = '';
    else if (key === 'sd') S.sd = false;
    else if (key === 'pure') S.pure = false;
    else if (key === 'batch') S.batch = '';
    else if (key === 'adv') S.adv = [];
    else if (key.startsWith('f:')) { const f = facetByKey(key.slice(2)); S.sel[f.key] = new Set(); f.mask.fill(0); }
    else if (key.startsWith('r:')) { const r = RANGE_DEFS.find((x) => x[0] === key.slice(2)); S[r[0]] = ''; S[r[1]] = ''; }
  }
  function snapshot() {
    return { q: S.q, paper: S.paper, sd: S.sd, pure: S.pure, batch: S.batch, adv: S.adv, r: RANGES.map((k) => S[k]),
      sel: Object.fromEntries(FACETS.map((f) => [f.key, new Set(S.sel[f.key])])) };
  }
  function restore(x) {
    Object.assign(S, { q: x.q, paper: x.paper, sd: x.sd, pure: x.pure, batch: x.batch, adv: x.adv });
    RANGES.forEach((k, j) => { S[k] = x.r[j]; });
    for (const f of FACETS) { S.sel[f.key] = x.sel[f.key]; f.mask.fill(0); for (const c of S.sel[f.key]) f.mask[c] = 1; }
  }

  // ================================================================ 高级查询 ==
  const FACET_OPS = ['is', 'not'], HAS_OPS = ['has', 'hasnot'], RANGE_OPS = ['between', 'ge', 'le'];
  const ADV_FIELDS = {
    prop: { lbl: 'f_prop', kind: 'facet', ops: FACET_OPS }, src: { lbl: 'f_src', kind: 'facet', ops: HAS_OPS },
    pcat: { lbl: 'f_pcat', kind: 'facet', ops: FACET_OPS }, form: { lbl: 'f_form', kind: 'facet', ops: FACET_OPS },
    tt: { lbl: 'f_tt', kind: 'facet', ops: HAS_OPS }, tcat: { lbl: 'f_tcat', kind: 'facet', ops: HAS_OPS },
    method: { lbl: 'f_method', kind: 'facet', ops: FACET_OPS }, sys: { lbl: 'f_sys', kind: 'facet', ops: FACET_OPS },
    journal: { lbl: 'f_journal', kind: 'facet', ops: FACET_OPS }, unit: { lbl: 'f_unit', kind: 'facet', ops: FACET_OPS },
    origin: { lbl: 'f_origin', kind: 'facet', ops: ['is'] },
    value: { lbl: 'q_value', kind: 'vrange', ops: RANGE_OPS }, ph: { lbl: 'q_ph', kind: 'vrange', ops: RANGE_OPS },
    temp: { lbl: 'q_temp', kind: 'srange', par: 0, ops: RANGE_OPS }, time: { lbl: 'q_time', kind: 'srange', par: 1, ops: RANGE_OPS },
    tph: { lbl: 'q_tph', kind: 'srange', par: 2, ops: RANGE_OPS }, pres: { lbl: 'q_pres', kind: 'srange', par: 3, ops: RANGE_OPS },
    pow: { lbl: 'q_pow', kind: 'srange', par: 4, ops: RANGE_OPS }, freq: { lbl: 'q_freq', kind: 'srange', par: 5, ops: RANGE_OPS },
    kw: { lbl: 'q_kw', kind: 'text', ops: HAS_OPS }, doi: { lbl: 'q_doi', kind: 'doi', ops: FACET_OPS },
  };
  const OP_SYM = { is: '=', not: '≠', has: '∋', hasnot: '∌', between: '∈', ge: '≥', le: '≤' };
  function advValueLabel(r) {
    const F = ADV_FIELDS[r.f];
    if (F.kind === 'facet') { const f = facetByKey(r.f), c = f.fromTok.get(r.v); return c === undefined ? r.v : f.label(c); }
    if (r.o === 'between') return `[${r.v ?? ''}, ${r.v2 ?? ''}]`;
    if (F.kind === 'text') return `"${r.v}"`;
    return String(r.v ?? '');
  }
  function advText(rows) {
    return rows.map((r, k) => `${k ? r.c + ' ' : ''}{${t(ADV_FIELDS[r.f].lbl)} ${OP_SYM[r.o] || r.o} ${advValueLabel(r)}}`).join(' ');
  }
  function sampleParMatch(s, par, lo, hi) {
    const C = D.c, ok = (x) => (lo === null || x >= lo) && (hi === null || x <= hi);
    if (par === 0) { for (let k = C.stemp_off[s]; k < C.stemp_off[s + 1]; k++) if (ok(C.stemp[k])) return true; return false; }
    for (let k = C.spar_off[s]; k < C.spar_off[s + 1]; k++) if (C.spar_k[k] === par && ok(C.spar_v[k])) return true;
    return false;
  }
  function rangeOf(r) {
    const a = num(r.v), b = num(r.v2);
    return r.o === 'ge' ? [a, null] : r.o === 'le' ? [null, a] : [a, b];
  }
  async function evalRow(r) {
    const C = D.c, nV = D.nV, m = new Uint8Array(nV), F = ADV_FIELDS[r.f];
    if (F.kind === 'facet') {
      const f = facetByKey(r.f), code = f.fromTok.get(r.v), neg = r.o === 'not' || r.o === 'hasnot';
      if (code === undefined) { if (neg) m.fill(1); return m; }
      if (f.level === 'v') { for (let i = 0; i < nV; i++) m[i] = (f.get(i) === code) !== neg ? 1 : 0; return m; }
      const okS = new Uint8Array(D.nS);
      for (let s = 0; s < D.nS; s++) okS[s] = facetCodes(f, -1, s, C.sp[s]).includes(code) !== neg ? 1 : 0;
      for (let i = 0; i < nV; i++) m[i] = okS[C.vs[i]];
      return m;
    }
    if (F.kind === 'vrange') {
      const [lo, hi] = rangeOf(r), arr = r.f === 'value' ? D.veff : C.vph;
      if (lo === null && hi === null) return m;
      for (let i = 0; i < nV; i++) { const x = arr[i]; m[i] = x === x && (lo === null || x >= lo) && (hi === null || x <= hi) ? 1 : 0; }
      return m;
    }
    if (F.kind === 'srange') {
      const [lo, hi] = rangeOf(r);
      if (lo === null && hi === null) return m;
      const okS = new Uint8Array(D.nS);
      for (let s = 0; s < D.nS; s++) okS[s] = sampleParMatch(s, F.par, lo, hi) ? 1 : 0;
      for (let i = 0; i < nV; i++) m[i] = okS[C.vs[i]];
      return m;
    }
    if (F.kind === 'doi') {
      const p = D.doiLower.get(String(r.v || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase()), neg = r.o === 'not';
      for (let i = 0; i < nV; i++) m[i] = (C.sp[C.vs[i]] === p) !== neg ? 1 : 0;
      return m;
    }
    // 关键词
    const tokens = String(r.v || '').trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 16), neg = r.o === 'hasnot';
    if (!tokens.length) { if (neg) m.fill(1); return m; }
    await loadSearch();
    const full = (1 << tokens.length) - 1, Xs = D.search;
    const bits = (arr) => { const out = new Uint32Array(arr.length); for (let k = 0; k < arr.length; k++) { let b = 0; for (let j = 0; j < tokens.length; j++) if (arr[k].includes(tokens[j])) b |= 1 << j; out[k] = b; } return out; };
    const pt = bits(Xs.ptext), stx = bits(Xs.stext), nt = bits(Xs.names);
    for (let i = 0; i < nV; i++) { const s = C.vs[i]; m[i] = ((pt[C.sp[s]] | stx[s] | nt[Xs.vname[i]]) === full) !== neg ? 1 : 0; }
    return m;
  }
  let advCache = { key: '', mask: null };
  async function advMask(rows) {
    const key = JSON.stringify(rows);
    if (advCache.key === key) return advCache.mask;
    let acc = null;
    for (const r of rows) {
      const m = await evalRow(r);
      if (!acc) { acc = m; continue; }
      if (r.c === 'OR') for (let i = 0; i < m.length; i++) acc[i] |= m[i];
      else if (r.c === 'NOT') for (let i = 0; i < m.length; i++) acc[i] &= m[i] ^ 1;
      else for (let i = 0; i < m.length; i++) acc[i] &= m[i];
    }
    advCache = { key, mask: acc };
    return acc;
  }

  // ================================================================ 批量检索 ==
  const parseBatchTokens = (text) => [...new Set(String(text || '').split(/[\n\r,;，；|]+/).map((x) => x.trim()).filter(Boolean))];
  let batchCache = { key: '', val: null };
  async function batchSets(text) {
    if (batchCache.key === text) return batchCache.val;
    const toks = parseBatchTokens(text), pSet = new Uint8Array(D.nP), sSet = new Uint8Array(D.nS);
    let nameMap = null, np = 0, ns = 0;
    const missing = [];
    for (const raw of toks) {
      const tok = raw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
      if (/^10\.\S+~\d+$/.test(tok)) { const s = sampleFromKey(tok); if (s >= 0) { if (!sSet[s]) ns++; sSet[s] = 1; } else missing.push(raw); continue; }
      if (/^10\.\d{4,9}\//.test(tok)) { const p = D.doiLower.get(tok.toLowerCase()); if (p !== undefined) { if (!pSet[p]) np++; pSet[p] = 1; } else missing.push(raw); continue; }
      if (!nameMap) {
        await loadSearch();
        nameMap = new Map();
        D.search.stext.forEach((txt, s) => { const name = txt.split(' \u0001 ')[0].trim(); if (!name) return; for (const alias of name.split(' / ')) { const a = alias.trim(); if (!a) continue; if (!nameMap.has(a)) nameMap.set(a, []); nameMap.get(a).push(s); } });
      }
      const hit = nameMap.get(tok.toLowerCase());
      if (hit) for (const s of hit) { if (!sSet[s]) ns++; sSet[s] = 1; } else missing.push(raw);
    }
    const val = { pSet, sSet, np, ns, missing, n: toks.length };
    batchCache = { key: text, val };
    return val;
  }

  // ================================================================ 筛选、计数 ==
  // dry：只数个数（「去掉一个条件」的建议用），不改结果和分面计数
  async function compute(dry) {
    const C = D.c, nV = D.nV, nS = D.nS, nP = D.nP;
    const tokens = S.q.trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 16);
    let pTok = null, sTok = null, nTok = null, full = 0;
    if (tokens.length) {
      if (!D.search) await loadSearch();
      const Xs = D.search;
      full = (1 << tokens.length) - 1;
      const bits = (arr) => { const out = new Uint32Array(arr.length); for (let k = 0; k < arr.length; k++) { const s = arr[k]; let b = 0; for (let j = 0; j < tokens.length; j++) if (s.includes(tokens[j])) b |= 1 << j; out[k] = b; } return out; };
      pTok = bits(Xs.ptext); sTok = bits(Xs.stext); nTok = bits(Xs.names);
    }
    const adv = S.adv.length ? await advMask(S.adv) : null;
    const batch = S.batch ? await batchSets(S.batch) : null;
    const paper = S.paper ? (D.doiIndex.get(S.paper) ?? D.doiLower.get(S.paper.toLowerCase()) ?? -1) : undefined;
    const rv = (k) => num(S[k]);
    const vmin = rv('vmin'), vmax = rv('vmax'), phmin = rv('phmin'), phmax = rv('phmax');
    const useV = vmin !== null || vmax !== null, usePH = phmin !== null || phmax !== null;
    const sFail = new Uint16Array(nS), pFail = new Uint16Array(nP), sHard = new Uint8Array(nS);
    for (const f of FACETS) {
      if (!S.sel[f.key].size) continue;
      if (f.level === 's') {
        for (let s = 0; s < nS; s++) {
          let ok = false;
          if (f.kind === 'multi') { for (let k = f.off[s]; k < f.off[s + 1]; k++) if (f.mask[f.ids[k]]) { ok = true; break; } }
          else if (f.kind === 'bits') { const b = C.stcat[s]; for (let k = 0; k < 6; k++) if ((b & (1 << k)) && f.mask[k]) { ok = true; break; } }
          else ok = f.mask[f.get(s)] === 1;
          if (!ok) sFail[s] |= f.bit;
        }
      } else if (f.level === 'p') {
        for (let p = 0; p < nP; p++) if (!f.mask[f.get(p)]) pFail[p] |= f.bit;
      }
    }
    for (const [a, b, , level, par] of RANGE_DEFS) {
      if (level !== 's') continue;
      const lo = rv(a), hi = rv(b);
      if (lo === null && hi === null) continue;
      for (let s = 0; s < nS; s++) if (!sHard[s] && !sampleParMatch(s, par, lo, hi)) sHard[s] = 1;
    }
    if (S.pure) for (let s = 0; s < nS; s++) if (C.sflag[s] & 1) sHard[s] = 1;
    const vFacets = FACETS.filter((f) => f.level === 'v' && S.sel[f.key].size);
    if (!dry) for (const f of FACETS) f.count.fill(0);
    const add = (f, i, s, p) => {
      if (f.level === 'v') f.count[f.get(i)]++;
      else if (f.level === 'p') f.count[f.get(p)]++;
      else if (f.kind === 'multi') { for (let k = f.off[s]; k < f.off[s + 1]; k++) f.count[f.ids[k]]++; }
      else if (f.kind === 'bits') { const b = C.stcat[s]; for (let k = 0; k < 6; k++) if (b & (1 << k)) f.count[k]++; }
      else f.count[f.get(s)]++;
    };
    const out = dry ? null : new Uint32Array(nV);
    let n = 0;
    const vs = C.vs, sp = C.sp, veff = D.veff, vph = C.vph, vname = D.search?.vname, vflag = C.vflag, sd = S.sd;
    const lo = paper === undefined ? 0 : paper < 0 ? 0 : D.vFirst[D.sFirst[paper]];
    const hi = paper === undefined ? nV : paper < 0 ? 0 : D.vFirst[D.sFirst[paper + 1]];
    for (let i = lo; i < hi; i++) {
      const s = vs[i];
      if (sHard[s]) continue;
      const p = sp[s];
      if (adv && !adv[i]) continue;
      if (batch && !(batch.pSet[p] || batch.sSet[s])) continue;
      if (sd && !(vflag[i] & 1)) continue;
      if (full && ((pTok[p] | sTok[s] | nTok[vname[i]]) !== full)) continue;
      if (useV) { const x = veff[i]; if (!(x === x) || (vmin !== null && x < vmin) || (vmax !== null && x > vmax)) continue; }
      if (usePH) { const x = vph[i]; if (!(x === x) || (phmin !== null && x < phmin) || (phmax !== null && x > phmax)) continue; }
      let fails = sFail[s] | pFail[p];
      for (let k = 0; k < vFacets.length; k++) { const f = vFacets[k]; if (!f.mask[f.get(i)]) fails |= f.bit; }
      if (fails === 0) { if (dry) n++; else { out[n++] = i; for (let k = 0; k < FACETS.length; k++) add(FACETS[k], i, s, p); } }
      else if (!dry && (fails & (fails - 1)) === 0) add(FACETS[31 - Math.clz32(fails)], i, s, p);
    }
    if (dry) return n;
    A.result = out.slice(0, n);
    sortResult();
    return n;
  }
  async function countWithout(key) {
    const snap = snapshot();
    removeGroup(key);
    try { return await compute(true); } finally { restore(snap); }
  }
  function sortResult() {
    const C = D.c, V = D.veff, result = A.result;
    let srcRank = null;
    if (S.sort === 'src') {
      const order = D.dict.src.map((_, c) => c).sort((a, b) => srcLabel(a).localeCompare(srcLabel(b)));
      const rank = new Uint32Array(D.dict.src.length);
      order.forEach((c, k) => { rank[c] = k; });
      srcRank = new Uint32Array(D.nS);
      for (let s = 0; s < D.nS; s++) srcRank[s] = C.ssrc_off[s] < C.ssrc_off[s + 1] ? rank[C.ssrc[C.ssrc_off[s]]] : 0xffffffff;
    }
    const by = {
      prop: (a, b) => C.vp[a] - C.vp[b] || a - b,
      vasc: (a, b) => { const x = V[a], y = V[b]; return (x !== x) - (y !== y) || (x - y) || a - b; },
      vdesc: (a, b) => { const x = V[a], y = V[b]; return (x !== x) - (y !== y) || (y - x) || a - b; },
      src: (a, b) => { const x = srcRank[C.vs[a]], y = srcRank[C.vs[b]]; return x - y || a - b; },
      method: (a, b) => (C.vm[a] < 3) - (C.vm[b] < 3) || (C.vm[a] !== C.vm[b] ? methodName(C.vm[a]).localeCompare(methodName(C.vm[b])) : 0) || a - b,
      journal: (a, b) => journalName(C.sp[C.vs[a]]).localeCompare(journalName(C.sp[C.vs[b]])) || a - b,
      ph: (a, b) => { const x = C.vph[a], y = C.vph[b]; return (x !== x) - (y !== y) || (x - y) || a - b; },
    }[S.sort];
    if (by) result.sort(by);
  }
  function resultSamples(idx) { const seen = new Uint8Array(D.nS), out = []; for (const i of idx) { const s = D.c.vs[i]; if (!seen[s]) { seen[s] = 1; out.push(s); } } return out; }
  function resultPapers(idx) { const seen = new Uint8Array(D.nP), out = []; for (const i of idx) { const p = D.c.sp[D.c.vs[i]]; if (!seen[p]) { seen[p] = 1; out.push(p); } } return out; }

  // ================================================================ 数据篮 ==
  const MAX_BASKET = 2000;
  let BASKET = STORE.get('pdfdb_basket', null);
  if (!Array.isArray(BASKET)) { BASKET = STORE.get('pfd_cmp', []); if (!Array.isArray(BASKET)) BASKET = []; }
  BASKET = BASKET.filter((x) => typeof x === 'string').slice(0, MAX_BASKET);
  const basketKeys = () => BASKET.slice();
  const basketHas = (s) => BASKET.includes(sampleKey(s));
  function saveBasket() { STORE.set('pdfdb_basket', BASKET); const el = $('basket-count'); if (el) el.textContent = BASKET.length; }
  function basketAdd(ss) {
    const have = new Set(BASKET);
    let added = 0;
    for (const s of ss) { const k = sampleKey(s); if (have.has(k)) continue; if (BASKET.length >= MAX_BASKET) { toast(t('b_full', { n: MAX_BASKET })); break; } BASKET.push(k); have.add(k); added++; }
    saveBasket();
    toast(t('b_added', { n: BASKET.length }));
    return added;
  }
  function basketRemove(ss) { const rm = new Set(ss.map(sampleKey)); BASKET = BASKET.filter((k) => !rm.has(k)); saveBasket(); toast(t('b_removed')); }
  function basketClear() { BASKET = []; saveBasket(); }
  function basketSamples() { return BASKET.map(sampleFromKey).filter((s) => s >= 0); }

  // ================================================================ 导出 ==
  function methodStatus(c) { return c === 0 ? '' : c === 1 ? '原文未写明方法 (not stated)' : c === 2 ? '方法不确定 (unclear)' : '已对应 (matched)'; }
  const ingText = (s) => SX(s, 'ings').map(([n, c, a]) => `${n} (${c}${a ? ', ' + a : ''})`).join('; ');
  const VALUE_HEAD = ['doi', 'title', 'journal', 'sample_no', 'sample_name', 'description', 'protein_source', 'protein_source_std',
    'protein_category', 'protein_form', 'protein_form_std', 'protein_conc', 'ingredients', 'treatment', 'treatment_types',
    'treatment_categories', 'system', 'property', 'property_name', 'measure_name', 'value', 'value_text', 'sd', 'unit', 'value_std',
    'unit_std', 'multiplier', 'err_low', 'err_high', 'significance', 'conditions', 'measurement_ph', 'test_method', 'method_params',
    'method_summary', 'method_status', 'data_origin', 'source_type', 'source_item', 'source_panel', 'series', 'x', 'x_unit', 'x_variable'];
  const SAMPLE_COLS = 17;
  function sampleCells(s) {
    const p = D.c.sp[s];
    return [D.doi[p], PX(p, 'title'), journalName(p), sampleNo(s), SX(s, 'name'), SX(s, 'desc'), SX(s, 'psrc'),
      srcOf(s).map((c) => D.dict.src[c]).join(' | '), D.dict.pcat[D.c.scat[s]], SX(s, 'pform'), D.dict.form[D.c.sform[s]],
      SX(s, 'pconc'), ingText(s), SX(s, 'treat'), ttOf(s).map((c) => D.dict.tt[c]).join(' | '),
      tcatOf(s).map((k) => TCAT_NAMES[k]).join('、'), D.dict.sys[D.c.ssys[s]]];
  }
  function methodOf(i) {
    const mid = VX(i, 'mid');
    if (!mid) return null;
    const p = D.c.sp[D.c.vs[i]];
    return (PX(p, 'methods') || []).find((m) => m[0] === mid) || null;
  }
  function valueRow(i) {
    const C = D.c, s = C.vs[i], m = methodOf(i), mc = C.vm[i], vv = C.vv[i];
    return [...sampleCells(s), D.meta.props[C.vp[i]], X.PROP_NAMES[D.meta.props[C.vp[i]]][1], VX(i, 'name'), vv === vv ? +vv.toPrecision(7) : '',
      VX(i, 'vt'), VX(i, 'sd'), VX(i, 'unit'), num(VX(i, 'vstd')) ?? '', VX(i, 'ustd'), VX(i, 'mul'), VX(i, 'lo'), VX(i, 'hi'), VX(i, 'sig'),
      VX(i, 'cond'), C.vph[i] === C.vph[i] ? +C.vph[i].toFixed(2) : '', mc >= 3 ? D.dict.method[mc][0] : '', VX(i, 'mp'),
      m ? m[4] : '', methodStatus(mc), C.vo[i] & 1 ? '来源于模型 (model-derived)' : '作者原值 (author-reported)',
      VX(i, 'src'), VX(i, 'item'), VX(i, 'panel'), VX(i, 'series'), VX(i, 'x'), VX(i, 'xu'), VX(i, 'xv')];
  }
  function valueTable(idx, cols) {
    const keep = cols && cols.length ? VALUE_HEAD.map((h, k) => (cols.includes(h) ? k : -1)).filter((k) => k >= 0) : null;
    const pick = (r) => (keep ? keep.map((k) => r[k]) : r);
    return [pick(VALUE_HEAD), ...idx.map((i) => pick(valueRow(i)))];
  }
  function wideTable(sampleList, valueList) {
    const C = D.c;
    const props = [...new Set(valueList.map((i) => C.vp[i]))].sort((a, b) => a - b);
    const byS = new Map();
    for (const i of valueList) { const s = C.vs[i]; if (!byS.has(s)) byS.set(s, new Map()); const m = byS.get(s); if (!m.has(C.vp[i])) m.set(C.vp[i], []); m.get(C.vp[i]).push(i); }
    const head = [...VALUE_HEAD.slice(0, SAMPLE_COLS), 'n_values', ...props.map((c) => D.meta.props[c])];
    const rows = sampleList.map((s) => {
      const m = byS.get(s) || new Map();
      return [...sampleCells(s), [...m.values()].reduce((a, b) => a + b.length, 0), ...props.map((c) => (m.get(c) || []).map((i) => {
        const cond = VX(i, 'cond');
        return `${VX(i, 'name')} = ${VX(i, 'vt')}${C.vo[i] & 1 ? '*' : ''}${VX(i, 'sd') ? ' ± ' + VX(i, 'sd') : ''}${VX(i, 'unit') ? ' ' + VX(i, 'unit') : ''}${cond ? ' [' + cond + ']' : ''}`;
      }).join(' | '))];
    });
    return [head, ...rows];
  }
  function methodSheet(papers) {
    const rows = [['doi', 'method_id', 'property', 'test_method', 'method_raw', 'method_summary', 'reference', 'instrument', 'applies_to', 'n_values']];
    for (const p of papers) for (const m of PX(p, 'methods') || []) rows.push([D.doi[p], m[0], m[1] >= 0 ? D.meta.props[m[1]] : '', m[2] >= 3 ? D.dict.method[m[2]][0] : '', m[3], m[4], m[7], m[8], m[5], num(m[6]) ?? '']);
    return rows;
  }
  const ABOUT = () => [['PDF · Protein Database of Functionality'], [location.href], ['version', D.meta.release ? D.meta.release.version : ''],
    ['data_updated', D.meta.built], ['exported', new Date().toISOString().slice(0, 19).replace('T', ' ')],
    ['data_origin', '来源于模型 (model-derived) = value read from a figure by a model (estimate); 作者原值 (author-reported) = value from a table or the main text; * in wide tables = model-derived'],
    ['license', 'Data CC BY 4.0 — please cite this database and the original articles (DOI)']];
  async function prepareChunks(ks, nRows) {
    const need = [...new Set(ks)].filter((k) => !D.chunkData[k]);
    if (need.length > 8 && !confirm(t('ex_confirm', { n: fmt(nRows || 0), k: need.length }))) return false;
    if (need.length) toast(t('ex_loading'));
    await ensure(need);
    return true;
  }
  // 按格式存表：kind csv / tsv / json / xlsx；sheets 只在 xlsx 时用
  async function saveTable(rows, base, kind, extraSheets) {
    let name = base + '.' + (kind === 'xlsx' ? 'xlsx' : kind);
    if (kind === 'csv') saveBlob(new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }), name);
    else if (kind === 'tsv') saveBlob(new Blob([tsvText(rows)], { type: 'text/tab-separated-values;charset=utf-8' }), name);
    else if (kind === 'json') saveBlob(new Blob([jsonText(rows)], { type: 'application/json' }), name);
    else saveBlob(await PFDXlsx.makeXlsx([{ name: 'data', rows }, ...(extraSheets || []), { name: 'about', rows: ABOUT() }]), name);
    toast(t('ex_done', { f: name }));
  }
  function citations(papers, kind) {
    if (kind === 'txt') return papers.map((p, k) => `[${k + 1}] ${PX(p, 'title')}. ${journalName(p)}. https://doi.org/${D.doi[p]}`).join('\n') + '\n';
    if (kind === 'ris') return papers.map((p) => `TY  - JOUR\nTI  - ${PX(p, 'title')}\nJO  - ${journalName(p)}\nDO  - ${D.doi[p]}\nUR  - https://doi.org/${D.doi[p]}\nER  - \n`).join('\n');
    const bib = (s) => String(s || '').replace(/[{}]/g, '');
    return papers.map((p) => `@article{${D.doi[p].replace(/[^A-Za-z0-9]+/g, '_')},\n  title = {${bib(PX(p, 'title'))}},\n  journal = {${bib(journalName(p))}},\n  doi = {${D.doi[p]}},\n  url = {https://doi.org/${D.doi[p]}}\n}\n`).join('\n');
  }
  async function saveCitations(papers, kind) {
    await ensurePapers(papers);
    const ext = { txt: 'txt', ris: 'ris', bib: 'bib' }[kind], name = 'pdfdb_references.' + ext;
    saveBlob(new Blob([citations(papers, kind)], { type: 'text/plain;charset=utf-8' }), name);
    toast(t('ex_done', { f: name }));
  }
  // 图表下载按钮（每张图都带）
  const chartDl = (id) => `<span class="chart-dl" data-chart="${id}"><button type="button" data-cdl="png">PNG</button><button type="button" data-cdl="svg">SVG</button><button type="button" data-cdl="csv">${esc(t('c_csv'))}</button></span>`;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cdl]');
    if (!b) return;
    const wrap = b.closest('[data-chart]'), el = $(wrap.dataset.chart);
    if (el) PFDCharts.save(el, b.dataset.cdl, 'pdfdb_' + wrap.dataset.chart.replace(/[^a-z0-9]+/gi, '_'), csvText);
  });

  // ================================================================ 检索提示 ==
  let acCache = { lang: '', items: [] };
  function acItems() {
    if (acCache.lang === LANG) return acCache.items;
    const st = D.stats, d = D.dict, items = [];
    const push = (type, key, tok, label, alt, n) => items.push({ type, key, tok, label, alt, n, hay: (label + ' \u0001 ' + (alt || '') + ' \u0001 ' + tok).toLowerCase() });
    D.meta.props.forEach((p, c) => push('prop', 'prop', p, propName(c), X.PROP_NAMES[p].join(' '), st.propV[c]));
    d.src.forEach((v, c) => { if (st.srcS[c]) push('src', 'src', v, srcLabel(c), v + ' ' + (X.ZH[v] || ''), st.srcS[c]); });
    d.tt.forEach((v, c) => { if (st.ttS[c]) push('tt', 'tt', v, ttLabel(c), v + ' ' + (X.ZH[v] || ''), st.ttS[c]); });
    d.method.forEach((v, c) => { if (c >= 3 && st.methodV[c]) push('method', 'method', v[0], methodName(c), v.join(' '), st.methodV[c]); });
    d.form.forEach((v, c) => { if (c && st.formS[c]) push('form', 'form', v, formLabel(c), v + ' ' + (X.ZH[v] || ''), st.formS[c]); });
    d.pcat.forEach((v, c) => { if (st.pcatS[c]) push('pcat', 'pcat', v, cat(v), v + ' ' + (X.EN[v] || ''), st.pcatS[c]); });
    d.journal.forEach((v, c) => { if (v && st.journalP[c]) push('journal', 'journal', v, v, '', st.journalP[c]); });
    acCache = { lang: LANG, items };
    return items;
  }
  const AC_TYPE = { prop: 'f_prop', src: 'f_src', tt: 'f_tt', method: 'f_method', form: 'f_form', pcat: 'f_pcat', journal: 'f_journal', doi: 'q_doi' };
  function acSearch(q, only) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    if ((!only || only === 'doi') && /^(https?:\/\/(dx\.)?doi\.org\/)?10\./.test(q)) {
      const qq = q.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
      for (let p = 0; p < D.nP && out.length < 8; p++) if (D.doi[p].toLowerCase().startsWith(qq)) out.push({ type: 'doi', key: 'paper', tok: D.doi[p], label: D.doi[p], n: D.sFirst[p + 1] - D.sFirst[p] });
      return out;
    }
    if (only === 'doi') return out;
    const scored = [];
    for (const it of acItems()) {
      if (only && it.type !== only) continue;
      const k = it.hay.indexOf(q);
      if (k < 0) continue;
      scored.push([k === 0 || it.label.toLowerCase().startsWith(q) ? 0 : /[\s(/（-]/.test(it.hay[k - 1] || '') ? 1 : 2, -it.n, it]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return scored.slice(0, 14).map((x) => x[2]);
  }
  // 给输入框挂上提示：opt { only()（只提示某类，可无）, onPick(item), onEnter(text) }
  function attachAC(input, opt) {
    const box = input.parentElement;
    let pop = box.querySelector('.ac-pop');
    if (!pop) { pop = document.createElement('div'); pop.className = 'ac-pop'; pop.hidden = true; pop.setAttribute('role', 'listbox'); box.appendChild(pop); }
    let items = [], cur = -1;
    const close = () => { pop.hidden = true; cur = -1; input.setAttribute('aria-expanded', 'false'); };
    const render = () => {
      if (!items.length) { close(); return; }
      let lastType = '', h = '';
      items.forEach((it, k) => {
        if (it.type !== lastType) { h += `<div class="grp">${esc(t(AC_TYPE[it.type]))}</div>`; lastType = it.type; }
        h += `<button type="button" role="option" data-k="${k}" aria-selected="${k === cur}"><span>${esc(it.label)}${it.type === 'src' || it.type === 'tt' || it.type === 'form' ? `<span class="dim"> ${esc(LANG === 'zh' && it.label !== it.tok ? it.tok : '')}</span>` : ''}</span><span class="n">${fmt(it.n)}</span></button>`;
      });
      h += `<div class="foot">↑↓ Enter · Esc</div>`;
      pop.innerHTML = h; pop.hidden = false; input.setAttribute('aria-expanded', 'true');
    };
    const update = () => { items = D.stats ? acSearch(input.value, opt.only && opt.only()) : []; cur = -1; render(); };
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-autocomplete', 'list');
    input.addEventListener('input', debounce(update, 80));
    input.addEventListener('focus', () => { if (input.value.trim()) update(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); cur = (cur + 1) % items.length; render(); }
      else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); cur = (cur - 1 + items.length) % items.length; render(); }
      else if (e.key === 'Escape') close();
      else if (e.key === 'Enter') { e.preventDefault(); const it = cur >= 0 ? items[cur] : null; close(); if (it) opt.onPick(it); else opt.onEnter(input.value.trim()); }
    });
    pop.addEventListener('mousedown', (e) => e.preventDefault());
    pop.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (!b) return; const it = items[+b.dataset.k]; close(); opt.onPick(it); });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }

  Object.assign(A, {
    X, $, esc, num, clip, t, cat, zh, fmt, pct, sci, debounce, bytes, toast, saveBlob, copyText, csvText, tsvText, jsonText, ic, STORE,
    ROUTINE_TT, TCAT_NAMES, MODEL_SRC, D, loadIndex, loadSearch, sampleNo, sampleKey, sampleFromKey, chunkOf, loadChunk, ensure, ensureValues,
    ensureSamples, ensurePapers, VX, SX, PX, propKey, propName, methodName, srcOf, ttOf, tcatOf, srcLabel, formLabel, ttLabel, journalName,
    isRoutine, sampleName, paperHref, sampleHref, doiHref, propHref, setupFacets, facetByKey, facets: () => FACETS, facetCodes, RANGE_DEFS, RANGES,
    S, readSearch, searchParams, searchHref, clearFilters, activeGroups, removeGroup, ADV_FIELDS, OP_SYM, advText, advValueLabel, advMask,
    parseBatchTokens, batchSets, compute, countWithout, sortResult, resultSamples, resultPapers, result: new Uint32Array(0), MAX_BASKET,
    basketKeys, basketHas, basketAdd, basketRemove, basketClear, basketSamples, saveBasket, VALUE_HEAD, SAMPLE_COLS, sampleCells, methodOf, valueRow,
    valueTable, wideTable, methodSheet, ABOUT, prepareChunks, saveTable, citations, saveCitations, ingText, chartDl, acSearch, attachAC,
    lang: () => LANG, setLang: (l) => { LANG = l; try { localStorage.setItem('lang', l); } catch (e) { /* 存不了就只对这次有效 */ } },
  });
})();
