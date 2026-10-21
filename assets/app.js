'use strict';
/* 蛋白质功能特性数据库 · 网页（纯静态：数据 data/db.json.gz 在浏览器里解压、筛选，不需要服务器） */
(() => {
  // ---------------------------------------------------------------- 文字 ----
  const PROP_NAMES = {
    solubility: ['溶解度', 'Solubility'],
    emulsifying: ['乳化性', 'Emulsifying properties'],
    foaming: ['起泡性', 'Foaming properties'],
    gelling: ['凝胶性', 'Gelling properties'],
    water_holding: ['持水性', 'Water-holding capacity'],
    oil_holding: ['持油性', 'Oil-holding capacity'],
    particle_size: ['粒径', 'Particle size'],
    zeta_potential: ['ζ-电位', 'ζ-Potential'],
    pdi: ['PDI', 'PDI'],
    sulfhydryl: ['巯基含量', 'Sulfhydryl content'],
    disulfide: ['二硫键含量', 'Disulfide bond content'],
    surface_hydrophobicity: ['表面疏水性', 'Surface hydrophobicity'],
    turbidity: ['浊度', 'Turbidity'],
    degree_of_hydrolysis: ['水解度', 'Degree of hydrolysis'],
    free_amino: ['游离氨基含量', 'Free amino group content'],
    encapsulation: ['包埋率/负载率', 'Encapsulation / loading efficiency'],
    antioxidant: ['抗氧化活性', 'Antioxidant activity'],
  };
  // 库里的类别值是固定的几种（中文），英文界面按这张表显示；蛋白来源、形态这类自由文本保持原样
  const EN = {
    '植物蛋白': 'Plant protein', '乳蛋白': 'Dairy protein', '蛋类蛋白': 'Egg protein',
    '肉类或水产蛋白': 'Meat / aquatic protein', '其他动物蛋白': 'Other animal protein', '微生物蛋白': 'Microbial protein',
    '藻类蛋白': 'Algal protein', '昆虫蛋白': 'Insect protein', '多种来源': 'Mixed sources', '不明': 'Unknown',
    '溶液或分散液': 'Solution / dispersion', '乳液': 'Emulsion', '泡沫': 'Foam', '凝胶': 'Gel',
    '颗粒或纳米颗粒': 'Particles / nanoparticles', '复合物': 'Complex', '膜': 'Film', '粉末或固体': 'Powder / solid',
    '其他': 'Other', '物理法': 'Physical', '化学法': 'Chemical', '生物法': 'Biological', '复合法': 'Combined',
    '多糖': 'Polysaccharide', '多酚': 'Polyphenol', '油脂': 'Oil / lipid', '其他蛋白': 'Other protein', '肽': 'Peptide',
    '糖': 'Sugar', '盐或离子': 'Salt / ion', '表面活性剂或乳化剂': 'Surfactant / emulsifier', '交联剂': 'Cross-linker',
    '活性物质': 'Bioactive compound', '作者表格': 'Author table', '正文': 'Main text', '图反读': 'Figure',
    '图片表格反读': 'Table image', '未处理': 'Untreated', '样品': 'sample',
  };
  const ORDER = {
    pcat: ['植物蛋白', '乳蛋白', '蛋类蛋白', '肉类或水产蛋白', '其他动物蛋白', '微生物蛋白', '藻类蛋白', '昆虫蛋白', '多种来源', '不明'],
    tcat: ['物理法', '化学法', '生物法', '复合法', '其他', '未处理'],
    sys: ['溶液或分散液', '乳液', '泡沫', '凝胶', '颗粒或纳米颗粒', '复合物', '膜', '粉末或固体', '其他', '不明'],
  };
  const MODEL_SRC = new Set(['图反读', '图片表格反读']);
  const I18N = {
    zh: {
      title: '蛋白质功能特性数据库',
      stats: '{papers} 篇论文 · {samples} 个样品 · {values} 个数值 · 17 项功能特性',
      notice: '带 <span class="badge model">模型</span> 标记的数值<b>来源于模型</b>：由模型从论文的图中读取，是估计值，不是作者给出的原值；没有标记的是作者在表格或正文中给出的原值。全部数据由自动流程从已发表论文中提取，使用前请点 DOI 对照原文核对。',
      filters: '筛选', reset: '清除全部', keyword: '关键词',
      keyword_hint: '在题目、DOI、样品、蛋白、复配物、样品处理、测试方法、测量名称里找；空格隔开的几个词都要出现',
      value_range: '数值范围（原单位）', temp_range: '样品处理温度（°C）', temp_hint: '任一样品处理步骤的温度落在范围内',
      min: '最小', max: '最大', sort: '排序', sort_paper: '按文章', sort_prop: '按性质',
      sort_vasc: '数值从小到大', sort_vdesc: '数值从大到小', export: '导出当前结果',
      col_prop: '性质', col_value: '数值', col_sample: '样品', col_protein: '蛋白', col_treat: '样品处理',
      col_cond: '测试方法', cond_lbl: '测定条件：', m_none: '原文未写明', m_amb: '方法不确定', col_source: '来源', loading: '正在加载数据…', close: '关闭',
      download_all: '下载全部数据（CSV）', source_code: 'GitHub',
      footer: '数据来自已发表的期刊论文，只收录数值、样品组成和处理条件，不含论文原文句子；论文的版权归原作者和出版商所有，使用数据请引用对应论文（DOI）。',
      built: '数据更新：{date}',
      f_prop: '功能特性', f_pcat: '蛋白类别', f_tcat: '样品处理类别', f_sys: '体系', f_origin: '数据来源',
      o_author: '作者原值', o_model: '来源于模型（读图）',
      count: '共 <b>{n}</b> 个数值，来自 <b>{s}</b> 个样品、<b>{p}</b> 篇论文',
      empty: '没有符合条件的数据', load_fail: '数据加载失败：{e}',
      no_stream: '这个浏览器太旧，不能解压数据。请换用新版 Chrome、Edge、Firefox 或 Safari。',
      badge_model: '模型', badge_model_tip: '来源于模型：从论文图中读取的估计值，不是作者原值',
      badge_author: '原值', sample_n: '样品 {n}', axis: '轴倍率 {m}', errbar: '误差棒 {lo} – {hi}',
      series: '系列 {s}', x: 'X = {x}', std: '= {v} {u}',
      d_paper: '论文', d_journal: '期刊', d_desc: '说明', d_psrc: '蛋白来源', d_pcat: '蛋白类别', d_pform: '蛋白形态',
      d_pconc: '蛋白浓度', d_sys: '体系', d_ing: '复配物', d_steps: '样品处理步骤', d_values: '数值',
      d_none: '无', d_untreated: '未处理', d_all_paper: '查看这篇论文的全部数据', d_doi: '打开原文（DOI）',
      col_measure: '测量名称', col_origin: '数据来源', prev: '上一页', next: '下一页',
      page: '第 {p} / {n} 页',
    },
    en: {
      title: 'Protein Functional Properties Database',
      stats: '{papers} papers · {samples} samples · {values} values · 17 functional properties',
      notice: 'Values marked <span class="badge model">Model</span> are <b>model-derived</b>: they were read from figures in the papers by a model and are estimates, not author-reported numbers. Unmarked values are author-reported (tables or main text). All data were extracted automatically from published papers — please check against the original article (DOI) before use.',
      filters: 'Filters', reset: 'Clear all', keyword: 'Keyword',
      keyword_hint: 'Searches title, DOI, sample, protein, ingredients, sample treatment, test method and measure name; all space-separated words must match',
      value_range: 'Value range (original unit)', temp_range: 'Sample treatment temperature (°C)',
      temp_hint: 'Any sample treatment step within the range', min: 'Min', max: 'Max', sort: 'Sort',
      sort_paper: 'By paper', sort_prop: 'By property', sort_vasc: 'Value ascending', sort_vdesc: 'Value descending',
      export: 'Export results', col_prop: 'Property', col_value: 'Value', col_sample: 'Sample', col_protein: 'Protein',
      col_treat: 'Sample treatment', col_cond: 'Test method', cond_lbl: 'Conditions: ', m_none: 'Not stated in the article', m_amb: 'Method unclear', col_source: 'Source', loading: 'Loading data…',
      close: 'Close', download_all: 'Download all data (CSV)', source_code: 'GitHub',
      footer: 'Data were extracted from published journal articles. Only numerical values, sample composition and processing conditions are included — no text from the articles. Copyright of the articles remains with their authors and publishers; please cite the original article (DOI) when using the data.',
      built: 'Data updated: {date}',
      f_prop: 'Functional property', f_pcat: 'Protein category', f_tcat: 'Sample treatment category', f_sys: 'System',
      f_origin: 'Data origin', o_author: 'Author-reported', o_model: 'Model-derived (from figure)',
      count: '<b>{n}</b> values from <b>{s}</b> samples in <b>{p}</b> papers',
      empty: 'No data match the filters', load_fail: 'Failed to load data: {e}',
      no_stream: 'This browser is too old to decompress the data. Please use a recent Chrome, Edge, Firefox or Safari.',
      badge_model: 'Model', badge_model_tip: 'Model-derived: estimated from a figure, not an author-reported value',
      badge_author: 'Author', sample_n: 'Sample {n}', axis: 'axis multiplier {m}', errbar: 'error bar {lo} – {hi}',
      series: 'series {s}', x: 'X = {x}', std: '= {v} {u}',
      d_paper: 'Paper', d_journal: 'Journal', d_desc: 'Description', d_psrc: 'Protein source',
      d_pcat: 'Protein category', d_pform: 'Protein form', d_pconc: 'Protein concentration', d_sys: 'System',
      d_ing: 'Ingredients', d_steps: 'Sample treatment steps', d_values: 'Values', d_none: 'None', d_untreated: 'Untreated',
      d_all_paper: 'Show all data from this paper', d_doi: 'Open article (DOI)', col_measure: 'Measure',
      col_origin: 'Data origin', prev: 'Previous', next: 'Next', page: 'Page {p} of {n}',
    },
  };

  const $ = (id) => document.getElementById(id);
  const PAGE = 50;
  let LANG = (() => {
    try { const v = localStorage.getItem('lang'); if (v === 'zh' || v === 'en') return v; } catch (e) { /* 无痕模式等 */ }
    return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  })();
  let DB = null;
  let FACETS = [];
  let result = [];
  const state = { q: '', prop: new Set(), pcat: new Set(), tcat: new Set(), sys: new Set(), origin: new Set(),
                  vmin: '', vmax: '', tmin: '', tmax: '', sort: 'paper', page: 0 };

  const t = (k, vars) => {
    let s = (I18N[LANG][k] ?? I18N.zh[k] ?? k);
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split('{' + a + '}').join(b);
    return s;
  };
  const cat = (v) => (LANG === 'en' ? (EN[v] || v) : v);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => n.toLocaleString(LANG === 'zh' ? 'zh-CN' : 'en-US');
  const propName = (i) => PROP_NAMES[DB.meta.props[i]][LANG === 'zh' ? 0 : 1];
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const num = (s) => { const x = parseFloat(s); return Number.isFinite(x) ? x : null; };

  // ---------------------------------------------------------------- 加载 ----
  async function load() {
    if (typeof DecompressionStream === 'undefined') throw new Error(t('no_stream'));
    // 数据地址带版本号（build_site_data.py 每次写进 index.html 的 data-version）：数据一更新地址就变，浏览器不会拿旧缓存
    const ver = document.querySelector('meta[name="data-version"]')?.content || '';
    const res = await fetch('data/db.json.gz' + (ver ? '?v=' + ver : ''), { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).text();
    DB = JSON.parse(text);
    prepare();
  }

  function prepare() {
    const S = DB.samples, V = DB.values, P = DB.papers;
    const nS = S.paper.length;
    S.text = new Array(nS);
    S.tcats = new Array(nS);
    S.doiL = new Array(nS);
    for (let s = 0; s < nS; s++) {
      const p = S.paper[s];
      S.text[s] = [P.title[p], P.doi[p], S.name[s], S.desc[s], S.psrc[s], S.pform[s], S.pconc[s], S.ingr[s], S.treat[s]]
        .join(' \u0001 ').toLowerCase();
      S.tcats[s] = S.tcat[s] ? S.tcat[s].split('、') : ['未处理'];
    }
    for (const k of ['tm', 'mp', 'ms']) if (!V[k]) V[k] = V.s.map(() => '');   // 还没提取测试方法的数据
    V.nameL = V.name.map((x, i) => (x + ' \u0001 ' + V.tm[i]).toLowerCase());     // 关键词也找测量名称、测试方法
    V.model = Uint8Array.from(V.src, (x) => (MODEL_SRC.has(x) ? 1 : 0));
    const seen = (arr) => { const o = new Set(); arr.forEach((x) => (Array.isArray(x) ? x.forEach((y) => o.add(y)) : o.add(x))); return o; };
    const ordered = (key, values) => {
      const have = seen(values);
      return ORDER[key].filter((x) => have.has(x)).concat([...have].filter((x) => !ORDER[key].includes(x)).sort());
    };
    FACETS = [
      { key: 'prop', title: 'f_prop', level: 'v', opts: DB.meta.props.map((_, i) => String(i)),
        label: (o) => propName(+o), of: (i) => String(V.p[i]) },
      { key: 'pcat', title: 'f_pcat', level: 's', opts: ordered('pcat', S.pcat), label: cat, of: (i, s) => S.pcat[s] },
      { key: 'tcat', title: 'f_tcat', level: 's', multi: true, opts: ordered('tcat', S.tcats), label: cat, of: (i, s) => S.tcats[s] },
      { key: 'sys', title: 'f_sys', level: 's', opts: ordered('sys', S.sys), label: cat, of: (i, s) => S.sys[s] },
      { key: 'origin', title: 'f_origin', level: 'v', opts: ['author', 'model'], label: (o) => t('o_' + o),
        of: (i) => (V.model[i] ? 'model' : 'author') },
    ];
  }

  // ---------------------------------------------------------------- 网址里的筛选条件（可以分享链接） ----
  function readHash() {
    const h = new URLSearchParams(location.hash.slice(1));
    state.q = h.get('q') || '';
    for (const f of ['prop', 'pcat', 'tcat', 'sys', 'origin']) {
      const v = h.get(f);
      state[f] = new Set(v ? v.split('|') : []);
    }
    if (state.prop.size) {   // 网址里写性质代号（solubility），内部用下标
      const idx = new Set();
      state.prop.forEach((c) => { const i = DB.meta.props.indexOf(c); if (i >= 0) idx.add(String(i)); });
      state.prop = idx;
    }
    for (const k of ['vmin', 'vmax', 'tmin', 'tmax']) state[k] = h.get(k) || '';
    state.sort = ['paper', 'prop', 'vasc', 'vdesc'].includes(h.get('sort')) ? h.get('sort') : 'paper';
    state.page = Math.max(0, (parseInt(h.get('page'), 10) || 1) - 1);
  }

  function writeHash() {
    const h = new URLSearchParams();
    if (state.q) h.set('q', state.q);
    for (const f of ['prop', 'pcat', 'tcat', 'sys', 'origin']) {
      if (!state[f].size) continue;
      const vals = f === 'prop' ? [...state.prop].map((i) => DB.meta.props[+i]) : [...state[f]];
      h.set(f, vals.join('|'));
    }
    for (const k of ['vmin', 'vmax', 'tmin', 'tmax']) if (state[k] !== '') h.set(k, state[k]);
    if (state.sort !== 'paper') h.set('sort', state.sort);
    if (state.page) h.set('page', state.page + 1);
    const s = h.toString();
    history.replaceState(null, '', s ? '#' + s : location.pathname + location.search);
  }

  // ---------------------------------------------------------------- 筛选 ----
  // 每一行（一个数值）逐个条件判断；只差一个条件不满足的行，计入那个条件各选项的数目（选项后面的数字 = 改选它会多出多少行）
  let counts = [];
  function compute() {
    const S = DB.samples, V = DB.values;
    const nS = S.paper.length, nV = V.s.length, nF = FACETS.length;
    const tokens = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const sTok = tokens.map((tok) => { const a = new Uint8Array(nS); for (let s = 0; s < nS; s++) a[s] = S.text[s].includes(tok) ? 1 : 0; return a; });
    const vmin = num(state.vmin), vmax = num(state.vmax), tmin = num(state.tmin), tmax = num(state.tmax);
    const useV = vmin !== null || vmax !== null, useT = tmin !== null || tmax !== null;
    let tPass = null;
    if (useT) {
      tPass = new Uint8Array(nS);
      for (let s = 0; s < nS; s++) tPass[s] = S.temps[s].some((x) => (tmin === null || x >= tmin) && (tmax === null || x <= tmax)) ? 1 : 0;
    }
    const active = FACETS.map((f) => state[f.key].size > 0);
    const sets = FACETS.map((f) => state[f.key]);
    counts = FACETS.map(() => new Map());
    const add = (fi, i, s) => {
      const v = FACETS[fi].of(i, s), m = counts[fi];
      if (Array.isArray(v)) for (const x of v) m.set(x, (m.get(x) || 0) + 1);
      else m.set(v, (m.get(v) || 0) + 1);
    };
    const out = [];
    for (let i = 0; i < nV; i++) {
      const s = V.s[i];
      let fails = 0, at = -1;
      for (let k = 0; k < tokens.length; k++) {
        if (!sTok[k][s] && !V.nameL[i].includes(tokens[k])) { fails = 2; break; }   // 关键词不算分面，不计数
      }
      if (fails > 1) continue;
      if (useV) { const x = V.v[i]; if (x === null || (vmin !== null && x < vmin) || (vmax !== null && x > vmax)) continue; }
      if (useT && !tPass[s]) continue;
      for (let f = 0; f < nF && fails < 2; f++) {
        if (!active[f]) continue;
        const v = FACETS[f].of(i, s);
        const ok = Array.isArray(v) ? v.some((x) => sets[f].has(x)) : sets[f].has(v);
        if (!ok) { fails++; at = f; }
      }
      if (fails === 0) { out.push(i); for (let f = 0; f < nF; f++) add(f, i, s); }
      else if (fails === 1) add(at, i, s);
    }
    if (state.sort === 'prop') out.sort((a, b) => V.p[a] - V.p[b] || a - b);
    else if (state.sort === 'vasc' || state.sort === 'vdesc') {
      const d = state.sort === 'vasc' ? 1 : -1;
      out.sort((a, b) => {
        const x = V.v[a], y = V.v[b];
        if (x === null || y === null) return (x === null) - (y === null) || a - b;
        return d * (x - y) || a - b;
      });
    }
    result = out;
  }

  // ---------------------------------------------------------------- 画界面 ----
  function applyStatic() {
    document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $('lang-btn').textContent = LANG === 'zh' ? 'EN' : '中文';
    document.title = LANG === 'zh' ? '蛋白质功能特性数据库' : 'Protein Functional Properties Database';
    if (DB) {
      $('stats').textContent = t('stats', { papers: fmt(DB.meta.papers), samples: fmt(DB.meta.samples), values: fmt(DB.meta.values) });
      $('built').textContent = t('built', { date: DB.meta.built });
      buildFacets();
    }
  }

  function buildFacets() {
    $('facets').innerHTML = FACETS.map((f, fi) => `
      <section class="facet"><h3>${esc(t(f.title))}</h3><div class="facet-opts">${f.opts.map((o) => `
        <label class="facet-opt" data-f="${fi}" data-o="${esc(o)}">
          <input type="checkbox" ${state[f.key].has(o) ? 'checked' : ''}>
          <span class="lbl">${esc(f.label(o))}</span><span class="n"></span>
        </label>`).join('')}</div></section>`).join('');
  }

  function updateFacetCounts() {
    document.querySelectorAll('.facet-opt').forEach((el) => {
      const n = counts[+el.dataset.f].get(el.dataset.o) || 0;
      el.querySelector('.n').textContent = fmt(n);
      el.classList.toggle('zero', n === 0 && !el.querySelector('input').checked);
    });
  }

  // 「5.82e7」显示成 5.82 × 10⁷（库里照存 5.82e7）
  const SUP = { '-': '⁻', '+': '⁺', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sci = (s) => String(s).replace(/^([-+]?\d+(?:\.\d+)?)e([-+]?\d+)$/i,
    (_, m, e) => m + ' × 10' + String(+e).split('').map((c) => SUP[c]).join(''));

  function valueHTML(i, badge) {
    const V = DB.values;
    let h = `<span class="num">${esc(sci(V.vt[i]))}</span>`;
    if (V.sd[i]) h += ` ± ${esc(V.sd[i])}`;
    if (V.unit[i]) h += ` ${esc(V.unit[i])}`;
    if (V.sig[i]) h += `<span class="sig">${esc(V.sig[i])}</span>`;
    if (badge) h += V.model[i]
      ? `<span class="badge model" title="${esc(t('badge_model_tip'))}">${esc(t('badge_model'))}</span>` : '';
    const extra = [];
    if (V.mul[i]) extra.push(t('axis', { m: esc(V.mul[i]) }));
    if (V.lo[i] || V.hi[i]) extra.push(t('errbar', { lo: esc(V.lo[i] || '?'), hi: esc(V.hi[i] || '?') }));
    if (V.vstd[i] && V.ustd[i] && !(V.unit[i] === V.ustd[i] && num(V.vstd[i]) === V.v[i])) {
      extra.push(t('std', { v: esc(V.vstd[i]), u: esc(V.ustd[i]) }));
    }
    if (extra.length) h += `<div class="extra">${extra.join(' · ')}</div>`;
    return h;
  }

  // 「测试方法」一格：方法名（提取过方法的文章才有）+ 关键参数 + 测定条件
  function methodHTML(i, clampIt) {
    const V = DB.values;
    const parts = [];
    if (V.tm[i]) parts.push(`<div class="mtd">${esc(V.tm[i])}</div>`);
    else if (V.ms[i]) parts.push(`<div class="dim">${esc(t(V.ms[i].startsWith('方法不确定') ? 'm_amb' : 'm_none'))}</div>`);
    if (V.mp[i]) parts.push(`<div class="dim${clampIt ? ' clamp c2' : ''}" title="${esc(V.mp[i])}">${esc(V.mp[i])}</div>`);
    if (V.cond[i]) {
      const c = (parts.length ? t('cond_lbl') : '') + V.cond[i];
      parts.push(`<div class="${parts.length ? 'dim ' : ''}${clampIt ? 'clamp c2' : ''}" title="${esc(V.cond[i])}">${esc(c)}</div>`);
    }
    return parts.join('');
  }

  function sourceHTML(i, withDoi) {
    const V = DB.values, S = DB.samples, P = DB.papers;
    const p = S.paper[V.s[i]];
    let h = esc(cat(V.item[i]));
    if (V.panel[i]) h += ` <span class="dim" title="${esc(V.panel[i])}">${esc(clip(V.panel[i], 18))}</span>`;
    const more = [];
    if (MODEL_SRC.has(V.src[i])) {
      if (V.series[i]) more.push(t('series', { s: esc(clip(V.series[i], 30)) }));
      if (V.x[i]) more.push(t('x', { x: esc(clip(V.x[i] + (V.xu[i] ? ' ' + V.xu[i] : ''), 30)) }));
    }
    if (more.length) h += `<div class="dim">${more.join(' · ')}</div>`;
    if (withDoi) h += `<div><a href="https://doi.org/${encodeURI(P.doi[p])}" target="_blank" rel="noopener" title="${esc(P.title[p])}">${esc(P.doi[p])}</a></div>`;
    return h;
  }

  function renderRows() {
    const V = DB.values, S = DB.samples;
    const nPages = Math.max(1, Math.ceil(result.length / PAGE));
    if (state.page >= nPages) state.page = nPages - 1;
    const slice = result.slice(state.page * PAGE, state.page * PAGE + PAGE);
    if (!slice.length) {
      $('rows').innerHTML = `<tr><td colspan="7" class="empty">${esc(t('empty'))}</td></tr>`;
    } else {
      $('rows').innerHTML = slice.map((i) => {
        const s = V.s[i];
        const name = S.name[s] || t('sample_n', { n: S.no[s] });
        const treat = S.treat[s] === '未处理' ? t('d_untreated') : S.treat[s];
        const prot = [S.psrc[s], S.pform[s]].filter(Boolean).join(' · ');
        return `<tr>
          <td><div class="prop">${esc(propName(V.p[i]))}</div><div class="mname clamp c2" title="${esc(V.name[i])}">${esc(V.name[i])}</div></td>
          <td class="val">${valueHTML(i, true)}</td>
          <td><button class="sample-btn clamp c2" type="button" data-s="${s}" title="${esc(name)}">${esc(name)}</button>
            <div class="dim">${esc(t('sample_n', { n: S.no[s] }))}</div></td>
          <td><div class="clamp c2" title="${esc(prot)}">${esc(prot)}</div>
            <div class="dim">${esc(cat(S.pcat[s]))}</div></td>
          <td><div class="clamp c3" title="${esc(treat)}">${esc(treat)}</div>
            ${S.tcat[s] ? `<div class="dim">${esc(S.tcats[s].map(cat).join(LANG === 'zh' ? '、' : ', '))}</div>` : ''}</td>
          <td class="cond">${methodHTML(i, true)}</td>
          <td class="src">${sourceHTML(i, true)}</td>
        </tr>`;
      }).join('');
    }
    renderPager(nPages);
  }

  function renderPager(nPages) {
    if (nPages <= 1) { $('pager').innerHTML = ''; return; }
    const p = state.page;
    const pages = new Set([0, nPages - 1, p - 2, p - 1, p, p + 1, p + 2].filter((x) => x >= 0 && x < nPages));
    const list = [...pages].sort((a, b) => a - b);
    let h = `<button type="button" data-page="${p - 1}" ${p === 0 ? 'disabled' : ''} aria-label="${esc(t('prev'))}">‹</button>`;
    list.forEach((x, k) => {
      if (k && x - list[k - 1] > 1) h += '<span>…</span>';
      h += `<button type="button" data-page="${x}" ${x === p ? 'aria-current="page"' : ''}>${x + 1}</button>`;
    });
    h += `<button type="button" data-page="${p + 1}" ${p >= nPages - 1 ? 'disabled' : ''} aria-label="${esc(t('next'))}">›</button>`;
    $('pager').innerHTML = h;
  }

  function renderCount() {
    const V = DB.values, S = DB.samples;
    const ms = new Uint8Array(S.paper.length), mp = new Uint8Array(DB.papers.doi.length);
    let ns = 0, np = 0;
    for (const i of result) {
      const s = V.s[i];
      if (!ms[s]) { ms[s] = 1; ns++; const p = S.paper[s]; if (!mp[p]) { mp[p] = 1; np++; } }
    }
    if (LANG === 'en') {   // 英文单复数
      const pl = (n, w) => `<b>${fmt(n)}</b> ${w}${n === 1 ? '' : 's'}`;
      $('count').innerHTML = `${pl(result.length, 'value')} from ${pl(ns, 'sample')} in ${pl(np, 'paper')}`;
    } else {
      $('count').innerHTML = t('count', { n: fmt(result.length), s: fmt(ns), p: fmt(np) });
    }
  }

  function refresh(keepPage) {
    if (!keepPage) state.page = 0;
    compute();
    updateFacetCounts();
    renderCount();
    renderRows();
    writeHash();
  }

  function syncInputs() {
    $('q').value = state.q;
    for (const k of ['vmin', 'vmax', 'tmin', 'tmax']) $(k).value = state[k];
    $('sort').value = state.sort;
  }

  // ---------------------------------------------------------------- 样品详情 ----
  function openSample(s) {
    const S = DB.samples, V = DB.values, P = DB.papers;
    const p = S.paper[s];
    const name = S.name[s] || t('sample_n', { n: S.no[s] });
    $('detail-title').textContent = name;
    const row = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${v}</dd>` : '');
    const ings = S.ings[s].length
      ? `<ul>${S.ings[s].map(([n, c, a]) => `<li>${esc(n)} <span class="dim">(${esc(cat(c))}${a ? ', ' + esc(a) : ''})</span></li>`).join('')}</ul>`
      : esc(t('d_none'));
    const steps = S.steps[s].length
      ? `<ol>${S.steps[s].map(([m, c, pr]) => `<li><b>${esc(m)}</b> <span class="dim">(${esc(cat(c))})</span>${pr ? '<div class="dim">' + esc(pr) + '</div>' : ''}</li>`).join('')}</ol>`
      : esc(t('d_untreated'));
    const mine = [];
    for (let i = 0; i < V.s.length; i++) if (V.s[i] === s) mine.push(i);
    mine.sort((a, b) => V.p[a] - V.p[b] || a - b);
    $('detail-body').innerHTML = `
      <p class="paper-line">${esc(P.title[p])} — <i>${esc(DB.journals[P.journal[p]])}</i> ·
        <a href="https://doi.org/${encodeURI(P.doi[p])}" target="_blank" rel="noopener">${esc(P.doi[p])}</a></p>
      <dl class="kv">
        ${row('d_desc', esc(S.desc[s]))}${row('d_psrc', esc(S.psrc[s]))}${row('d_pcat', esc(cat(S.pcat[s])))}
        ${row('d_pform', esc(S.pform[s]))}${row('d_pconc', esc(S.pconc[s]))}${row('d_sys', esc(cat(S.sys[s])))}
        <dt>${esc(t('d_ing'))}</dt><dd>${ings}</dd>
        <dt>${esc(t('d_steps'))}</dt><dd>${steps}</dd>
      </dl>
      <h3>${esc(t('d_values'))}${LANG === 'zh' ? '（' + fmt(mine.length) + '）' : ' (' + fmt(mine.length) + ')'}</h3>
      <div class="mini-wrap"><table class="mini"><thead><tr>
        <th>${esc(t('col_prop'))}</th><th>${esc(t('col_measure'))}</th><th>${esc(t('col_value'))}</th>
        <th>${esc(t('col_cond'))}</th><th>${esc(t('col_source'))}</th></tr></thead><tbody>
        ${mine.map((i) => `<tr><td class="prop">${esc(propName(V.p[i]))}</td><td>${esc(V.name[i])}</td>
          <td class="val">${valueHTML(i, true)}</td><td class="cond">${methodHTML(i, false)}</td>
          <td class="src">${sourceHTML(i, false)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="dlg-actions">
        <button class="btn" type="button" id="all-paper">${esc(t('d_all_paper'))}</button>
        <a class="btn ghost" href="https://doi.org/${encodeURI(P.doi[p])}" target="_blank" rel="noopener">${esc(t('d_doi'))}</a>
      </div>`;
    $('all-paper').onclick = () => {
      clearFilters();
      state.q = P.doi[p];
      syncInputs();
      buildFacets();
      refresh();
      $('detail').close();
    };
    $('detail').showModal();
    $('detail-body').scrollTop = 0;
  }

  // ---------------------------------------------------------------- 导出 ----
  function exportCSV() {
    const S = DB.samples, V = DB.values, P = DB.papers;
    const head = ['doi', 'title', 'journal', 'sample_no', 'sample_name', 'description', 'protein_source', 'protein_category',
      'protein_form', 'protein_conc', 'ingredients', 'treatment', 'treatment_categories', 'system', 'property',
      'property_name', 'measure_name', 'value', 'value_text', 'sd', 'unit', 'multiplier', 'err_low', 'err_high',
      'significance', 'value_std', 'unit_std', 'conditions', 'test_method', 'method_params', 'method_status',
      'source_type', 'data_origin', 'source_item',
      'source_panel', 'series', 'x', 'x_unit', 'x_variable'];
    const q = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [head.join(',')];
    for (const i of result) {
      const s = V.s[i], p = S.paper[s];
      lines.push([P.doi[p], P.title[p], DB.journals[P.journal[p]], S.no[s], S.name[s], S.desc[s], S.psrc[s], S.pcat[s],
        S.pform[s], S.pconc[s], S.ingr[s], S.treat[s], S.tcat[s], S.sys[s], DB.meta.props[V.p[i]], propName(V.p[i]),
        V.name[i], V.v[i] ?? '', V.vt[i], V.sd[i], V.unit[i], V.mul[i], V.lo[i], V.hi[i], V.sig[i], V.vstd[i], V.ustd[i],
        V.cond[i], V.tm[i], V.mp[i], V.ms[i], V.src[i],
        V.model[i] ? '来源于模型 (model-derived)' : '作者原值 (author-reported)', V.item[i],
        V.panel[i], V.series[i], V.x[i], V.xu[i], V.xv[i]].map(q).join(','));
    }
    const blob = new Blob(['﻿' + lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'protein_db_results.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ---------------------------------------------------------------- 事件 ----
  function clearFilters() {
    state.q = '';
    for (const f of ['prop', 'pcat', 'tcat', 'sys', 'origin']) state[f] = new Set();
    for (const k of ['vmin', 'vmax', 'tmin', 'tmax']) state[k] = '';
  }

  function debounce(fn, ms) { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; }

  function bind() {
    const later = debounce(() => refresh(), 200);
    $('q').addEventListener('input', (e) => { state.q = e.target.value; later(); });
    for (const k of ['vmin', 'vmax', 'tmin', 'tmax']) $(k).addEventListener('input', (e) => { state[k] = e.target.value.trim(); later(); });
    $('sort').addEventListener('change', (e) => { state.sort = e.target.value; refresh(); });
    $('facets').addEventListener('change', (e) => {
      const el = e.target.closest('.facet-opt');
      if (!el) return;
      const set = state[FACETS[+el.dataset.f].key];
      if (e.target.checked) set.add(el.dataset.o); else set.delete(el.dataset.o);
      refresh();
    });
    $('reset').addEventListener('click', () => { clearFilters(); syncInputs(); buildFacets(); refresh(); });
    $('rows').addEventListener('click', (e) => { const b = e.target.closest('.sample-btn'); if (b) openSample(+b.dataset.s); });
    $('pager').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-page]');
      if (!b || b.disabled) return;
      state.page = +b.dataset.page;
      renderRows();
      writeHash();
      $('count').scrollIntoView({ block: 'nearest' });
    });
    $('export').addEventListener('click', exportCSV);
    $('detail-close').addEventListener('click', () => $('detail').close());
    $('detail').addEventListener('click', (e) => { if (e.target === $('detail')) $('detail').close(); });
    $('toggle-filters').addEventListener('click', () => $('filters').classList.toggle('open'));
    $('lang-btn').addEventListener('click', () => {
      LANG = LANG === 'zh' ? 'en' : 'zh';
      try { localStorage.setItem('lang', LANG); } catch (e) { /* 存不了就只对这次有效 */ }
      applyStatic();
      if (DB) refresh(true);
    });
  }

  function repoLink() {
    // 发布在 <用户名>.github.io/<仓库名> 时，自动指向 github.com/<用户名>/<仓库名>
    const host = location.hostname;
    if (!host.endsWith('.github.io')) return;
    const owner = host.split('.')[0];
    const repo = location.pathname.split('/').filter(Boolean)[0] || host;
    const a = $('repo-link');
    a.href = `https://github.com/${owner}/${repo}`;
    a.hidden = false;
  }

  async function main() {
    applyStatic();
    bind();
    repoLink();
    try {
      await load();
    } catch (e) {
      $('rows').innerHTML = `<tr><td colspan="7" class="empty">${esc(t('load_fail', { e: e.message || e }))}</td></tr>`;
      return;
    }
    readHash();
    syncInputs();
    applyStatic();
    refresh(true);
    window.addEventListener('hashchange', () => {
      readHash(); syncInputs(); buildFacets(); refresh(true);
    });
  }

  main();
})();
