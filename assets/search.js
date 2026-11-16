'use strict';
/* PDF —— 检索页（风格 A）：分页签的筛选面板（按性质与数值 / 按蛋白 / 按样品处理 / 按测试方法 / 按文献 / 批量检索 / 高级查询）、
   检索提示、当前条件标签和「去掉一个条件」建议、结果表（按数值 / 样品 / 论文显示）、图表、导出、加入数据篮。 */
(() => {
  const A = window.PDF;
  const { $, esc, t, cat, zh, fmt, clip, sci, num, debounce, toast, ic, STORE, D, S, VX, SX, PX } = A;

  const UI = { tab: 'prop', panel: true, open: new Set(), more: new Set(), find: {}, chart: false, chartType: 'hist', chartProp: -1,
    chartUnit: -1, chartGroup: 'src', chartX: 'ph', chartLog: false, chartTable: false, sel: { v: new Set(), s: new Set(), p: new Set() },
    ex: { fmt: 'csv', scope: 'all', shape: 'long', pick: false, cols: null }, draft: null, built: '', lists: null, relaxSeq: 0 };
  const pref = STORE.get('pdfdb_ui', {});
  if (typeof pref.chart === 'boolean') UI.chart = pref.chart;
  if (pref.chartType) UI.chartType = pref.chartType;
  if (pref.chartGroup) UI.chartGroup = pref.chartGroup;
  if (pref.chartX) UI.chartX = pref.chartX;
  if (pref.tab) UI.tab = pref.tab;
  if (typeof pref.panel === 'boolean') UI.panel = pref.panel;
  if (pref.ex) Object.assign(UI.ex, pref.ex);
  const COLS = [
    { key: 'prop', fixed: true, w: 12, sort: 'prop' }, { key: 'value', fixed: true, w: 14, sort: 'value' }, { key: 'sample', w: 12 },
    { key: 'protein', w: 13, sort: 'src' }, { key: 'treat', w: 18 }, { key: 'method', w: 15, sort: 'method' },
    { key: 'ph', w: 6, sort: 'ph', off: true }, { key: 'journal', w: 11, sort: 'journal', off: true }, { key: 'source', w: 12, sort: 'paper' },
  ];
  let visibleCols = new Set(Array.isArray(pref.cols) && pref.cols.length ? pref.cols.concat(['prop', 'value']) : COLS.filter((c) => !c.off).map((c) => c.key));
  const saveUI = () => STORE.set('pdfdb_ui', { size: S.size, chart: UI.chart, chartType: UI.chartType, chartGroup: UI.chartGroup, chartX: UI.chartX,
    cols: [...visibleCols], tab: UI.tab, panel: UI.panel, ex: UI.ex });
  const shownCols = () => COLS.filter((c) => c.fixed || visibleCols.has(c.key));

  const TABS = [['prop', 'tab_prop'], ['protein', 'tab_protein'], ['treat', 'tab_treat'], ['method', 'tab_method'], ['lit', 'tab_lit'], ['batch', 'tab_batch'], ['adv', 'tab_adv']];
  const TAB_FACETS = { prop: ['origin', 'prop', 'unit'],   // 11-16 用户：数据来源放在功能特性上面
  protein: ['src', 'pcat', 'form', 'sys'], treat: ['tt', 'tcat'], method: ['method'], lit: ['journal'] };
  const WIDE = new Set(['src', 'tt', 'method', 'prop', 'unit', 'origin']);   // 11-16 单位、数据来源也横排，和性质同一套列对齐
  const TAB_RANGES = { prop: ['vmin', 'phmin'], treat: ['tmin', 'dmin', 'tpmin', 'prmin', 'pwmin', 'fqmin'] };
  const TAB_FLAGS = { prop: ['sd'], protein: ['pure'] };
  const rangeDef = (a) => A.RANGE_DEFS.find((r) => r[0] === a);
  function tabCount(tab) {
    let n = 0;
    for (const k of TAB_FACETS[tab] || []) n += S.sel[k] && S.sel[k].size ? 1 : 0;
    for (const a of TAB_RANGES[tab] || []) { const r = rangeDef(a); if (S[r[0]] !== '' || S[r[1]] !== '') n++; }
    for (const f of TAB_FLAGS[tab] || []) if (S[f]) n++;
    if (tab === 'lit' && (S.paper || S.q)) n += (S.paper ? 1 : 0);
    if (tab === 'batch' && S.batch) n++;
    if (tab === 'adv' && S.adv.length) n++;
    return n;
  }

  // ================================================================ 骨架 ==
  let bound = false;
  function skeleton() {
    const el = $('view-search');
    if (UI.built === A.lang()) return;
    UI.built = A.lang();
    const opt = (v) => `<option ${v === S.size ? 'selected' : ''}>${v}</option>`;
    el.innerHTML = `<div class="wrap page">
      <section class="panel" id="s-panel">
        <div class="panel-head">
          <div class="page-title">${ic('search')}<h1>${esc(t('s_title'))}</h1></div>
          <p class="page-sub">${esc(t('s_sub'))}</p>
          <div class="kw-row"><div class="ac"><input id="q" type="search" placeholder="${esc(t('kw_ph'))}" aria-label="${esc(t('f_q'))}" title="${esc(t('kw_hint'))}"></div>
            <button class="btn" type="button" id="kw-go">${ic('search')}${esc(t('kw_go'))}</button>
            <button class="btn ghost" type="button" id="panel-toggle" aria-expanded="${UI.panel}" aria-controls="s-filters">${esc(t(UI.panel ? 'panel_hide' : 'panel_show'))}</button></div>
        </div>
        <div id="s-filters" ${UI.panel ? '' : 'hidden'}><div class="tabbar" role="tablist" id="s-tabs"></div><div class="pane" id="s-pane"></div></div>
      </section>
      <div class="active-row" id="active-row"><div class="active-filters" id="active-filters"></div><button class="link" type="button" id="reset">${esc(t('reset'))}</button></div>
      <section class="panel" id="s-results">
        <div class="res-head">
          <p class="count" id="count" aria-live="polite"></p>
          <span class="lbl-inline">${esc(t('res_by'))} <span class="seg" id="res-view">${['v', 's', 'p'].map((v) => `<button type="button" data-view="${v}" aria-pressed="${S.view === v}">${esc(t('res_' + v))}</button>`).join('')}</span></span>
          <div class="toolbar-right">
            <button class="btn ghost small" type="button" id="chart-toggle" aria-expanded="${UI.chart}">${ic('chart')}${esc(t('chart_btn'))}</button>
            <div class="menu"><button class="btn ghost small" type="button" id="cols-btn" aria-expanded="false">${esc(t('cols_btn'))}</button><div class="menu-pop" id="cols-pop" hidden></div></div>
            <label class="lbl-inline">${esc(t('page_size'))} <select id="page-size">${[25, 50, 100, 200].map(opt).join('')}</select></label>
            <button class="btn ghost small" type="button" id="basket-btn">${ic('cart')}<span id="basket-lbl"></span></button>
            <div class="menu"><button class="btn small" type="button" id="export-btn" aria-expanded="false">${ic('download')}${esc(t('export'))}</button><div class="menu-pop export-pop" id="export-pop" hidden></div></div>
          </div>
        </div>
        <section class="chart-panel" id="chart-panel" hidden></section>
        <div class="table-wrap"><table id="tbl"><thead id="thead"></thead><tbody id="rows"><tr><td class="loading">${esc(t('loading'))}</td></tr></tbody></table></div>
        <nav class="pager" id="pager" aria-label="Pages"></nav>
        <p class="hint sig-note" id="sig-note" hidden></p>
      </section></div>`;
    A.attachAC($('q'), {
      onPick: (it) => { $('q').value = ''; S.q = ''; applyPick(it); },
      onEnter: (text) => { S.q = text; refresh(); },
    });
    renderPane();
    if (!bound) { bind(el); bound = true; }
  }
  function applyPick(it) {
    if (it.type === 'doi') { S.paper = it.tok; refresh(); return; }
    const f = A.facetByKey(it.key), c = f.fromTok.get(it.tok);
    if (c === undefined) return;
    S.sel[f.key].add(c); f.mask[c] = 1;
    refresh();
  }

  // ================================================================ 筛选面板 ==
  function renderTabs() {
    $('s-tabs').innerHTML = TABS.map(([k, lbl]) => { const n = tabCount(k);
      return `<button type="button" role="tab" data-tab="${k}" aria-selected="${UI.tab === k}">${esc(t(lbl))}${n ? `<span class="n">${n}</span>` : ''}</button>`; }).join('');
  }
  function facetOrder(f) {
    const codes = [];
    for (let c = 0; c < f.n; c++) if (f.count[c] || S.sel[f.key].has(c)) codes.push(c);
    if (!f.fixed) codes.sort((a, b) => f.count[b] - f.count[a] || f.label(a).localeCompare(f.label(b)));
    if (f.last !== undefined && codes.includes(f.last)) codes.push(codes.splice(codes.indexOf(f.last), 1)[0]);   // 「其他」放最后
    return codes;
  }
  function facetBlock(f) {
    let codes = facetOrder(f);
    const find = (UI.find[f.key] || '').toLowerCase();
    if (find) codes = codes.filter((c) => f.label(c).toLowerCase().includes(find) || String(f.tok(c)).toLowerCase().includes(find));
    const total = codes.length, top = f.top || 99, showAll = UI.more.has(f.key) || find;
    const shown = showAll ? codes.slice(0, 500) : codes.slice(0, top);
    for (const c of S.sel[f.key]) if (!shown.includes(c)) shown.push(c);
    return `<h3><span>${esc(t('f_' + f.key))}</span>${S.sel[f.key].size ? `<button class="link" type="button" data-fclear="${f.key}">${esc(t('clear'))}</button>` : ''}</h3>
      ${f.find && (total > top || find) ? `<input class="ffind" type="search" data-find="${f.key}" placeholder="${esc(t('find'))}" value="${esc(UI.find[f.key] || '')}" aria-label="${esc(t('find'))}">` : ''}
      <div class="fgrid${WIDE.has(f.key) ? '' : ' narrow'}">${shown.map((c) => { const on = S.sel[f.key].has(c);
        return `<label class="fopt${f.count[c] || on ? '' : ' zero'}${on ? ' on' : ''}" title="${esc(f.label(c))}"><input type="checkbox" data-f="${f.key}" data-o="${c}" ${on ? 'checked' : ''}><span class="lbl">${esc(f.label(c))}</span><span class="n">${fmt(f.count[c])}</span></label>`; }).join('')}</div>
      ${!find && total > top ? `<button class="link fmore" type="button" data-more="${f.key}">${esc(UI.more.has(f.key) ? t('less') : t('more', { n: total }))}</button>` : ''}`;
  }
  function rangeHTML(a) {
    const [k0, k1, lbl, , par] = rangeDef(a);
    const hint = k0 === 'vmin' ? t('r_value_hint') : k0 === 'phmin' ? t('r_ph_hint') : par === 0 ? t('r_treat_hint') : '';
    return `<label class="rng"><span>${esc(t(lbl))}</span><span class="pair"><input type="number" step="any" inputmode="decimal" data-range="${k0}" value="${esc(S[k0])}" placeholder="${esc(t('min'))}" aria-label="${esc(t(lbl) + ' ' + t('min'))}"><span>–</span><input type="number" step="any" inputmode="decimal" data-range="${k1}" value="${esc(S[k1])}" placeholder="${esc(t('max'))}" aria-label="${esc(t(lbl) + ' ' + t('max'))}"></span>${hint ? `<small>${esc(hint)}</small>` : ''}</label>`;
  }
  const flagHTML = (k) => `<label><input type="checkbox" data-flag="${k}" ${S[k] ? 'checked' : ''}> ${esc(t('flag_' + k))}</label>`;
  function renderPane() {
    renderTabs();
    const el = $('s-pane'), tab = UI.tab;
    if (tab === 'batch') { el.innerHTML = batchHTML(); return; }
    if (tab === 'adv') { el.innerHTML = advHTML(); return; }
    const facets = (TAB_FACETS[tab] || []).map((k) => `<div class="fblock${WIDE.has(k) ? ' span-all' : ''}" data-fb="${k}"></div>`).join('');
    const ranges = (TAB_RANGES[tab] || []).map(rangeHTML).join('');
    const flags = (TAB_FLAGS[tab] || []).map(flagHTML).join('');
    let extra = '';
    if (tab === 'prop') extra = '<div class="span-all" id="prop-link"></div>';
    if (tab === 'lit') extra = `<div class="fblock"><h3><span>${esc(t('doi_lbl'))}</span></h3><div class="actions"><input type="search" id="doi-in" value="${esc(S.paper)}" placeholder="${esc(t('doi_ph'))}" style="flex:1;min-width:200px"><button class="btn ghost small" type="button" id="doi-go">${esc(t('doi_go'))}</button></div>
      <h3 style="margin-top:14px"><span>${esc(t('f_q'))}</span></h3><p class="hint" style="margin-top:0">${esc(t('kw_hint'))}</p></div>`;
    el.innerHTML = `<div class="pane-cols">${facets}${ranges ? `<div class="span-all"><div class="rgrid">${ranges}</div></div>` : ''}${flags ? `<div class="span-all flags">${flags}</div>` : ''}${extra}</div>`;
    renderFacetBlocks();
  }
  function renderFacetBlocks() {
    document.querySelectorAll('#s-pane [data-fb]').forEach((box) => { box.innerHTML = facetBlock(A.facetByKey(box.dataset.fb)); });
    if (UI.tab === 'prop') renderPropLink();
  }
  function renderPropLink() {
    const el = $('prop-link');
    if (!el) return;
    if (S.sel.prop.size !== 1) { el.innerHTML = ''; return; }
    const c = [...S.sel.prop][0], one = (k) => (S.sel[k].size === 1 ? A.facetByKey(k).tok([...S.sel[k]][0]) : '');
    el.innerHTML = `<a class="btn ghost small" href="${A.propHref(A.propKey(c), one('src'), one('tt'))}">${ic('chart')}${esc(t('prop_page', { p: A.propName(c) }))}</a>`;
  }

  // ---------------------------------------------------------------- 批量检索
  function batchHTML() {
    return `<p class="hint" style="margin:0 0 8px">${esc(t('b_hint'))}</p><textarea id="batch-text" rows="7" spellcheck="false" placeholder="10.1021/jf103771x&#10;10.1021/acs.jafc.3c09415~1">${esc(S.batch.split('|').join('\n'))}</textarea>
      <div class="actions" style="margin-top:10px"><button class="btn" type="button" id="batch-go">${esc(t('b_go'))}</button><button class="btn ghost" type="button" id="batch-clear">${esc(t('clear'))}</button></div>
      <div id="batch-report" class="hint" style="margin-top:10px"></div>`;
  }
  async function renderBatchReport() {
    const el = $('batch-report');
    if (!el) return;
    if (!S.batch) { el.textContent = ''; return; }
    const b = await A.batchSets(S.batch);
    el.innerHTML = esc(t('b_report', { p: fmt(b.np), s: fmt(b.ns), x: fmt(b.missing.length) })) + (b.missing.length ? `<div>${esc(t('b_missing'))} ${b.missing.slice(0, 30).map(esc).join(', ')}${b.missing.length > 30 ? ' …' : ''}</div>` : '');
  }

  // ---------------------------------------------------------------- 高级查询
  const AF = A.ADV_FIELDS;
  const ADV_ORDER = ['prop', 'src', 'pcat', 'form', 'sys', 'tt', 'tcat', 'method', 'unit', 'origin', 'journal', 'value', 'ph', 'temp', 'time', 'tph', 'pres', 'pow', 'freq', 'kw', 'doi'];
  const EXAMPLE = [{ f: 'prop', o: 'is', v: 'solubility' }, { c: 'AND', f: 'src', o: 'has', v: 'Soybean' }, { c: 'AND', f: 'tt', o: 'has', v: 'Ultrasound' }, { c: 'NOT', f: 'tt', o: 'has', v: 'Enzymatic hydrolysis' }];
  const newRow = (c) => ({ c: c || 'AND', f: 'prop', o: 'is', v: 'solubility' });
  function draft() { if (!UI.draft) UI.draft = S.adv.length ? S.adv.map((r) => ({ ...r })) : [newRow()]; return UI.draft; }
  function valueInput(r, k) {
    const F = AF[r.f];
    if (F.kind === 'facet') {
      const f = A.facetByKey(r.f), st = D.stats;
      const count = { prop: st.propV, src: st.srcS, tt: st.ttS, method: st.methodV, form: st.formS, pcat: st.pcatS, sys: st.sysS, journal: st.journalP, tcat: st.tcatS, unit: st.unitV }[r.f];
      let codes = [...Array(f.n).keys()].filter((c) => !count || count[c] || f.key === 'origin');
      if (!f.fixed && count) codes.sort((a, b) => count[b] - count[a]);
      if (r.f === 'method') codes = codes.filter((c) => c >= 3);
      return `<select data-av="${k}" aria-label="${esc(t(F.lbl))}">${codes.map((c) => `<option value="${esc(f.tok(c))}" ${f.tok(c) === r.v ? 'selected' : ''}>${esc(f.label(c))}${count ? ' (' + fmt(count[c]) + ')' : ''}</option>`).join('')}</select>`;
    }
    if (F.kind === 'vrange' || F.kind === 'srange') {
      const a = `<input type="number" step="any" data-av="${k}" value="${esc(r.v ?? '')}" placeholder="${esc(r.o === 'le' ? t('max') : t('min'))}">`;
      return r.o === 'between' ? `<span class="pair">${a}<span>–</span><input type="number" step="any" data-av2="${k}" value="${esc(r.v2 ?? '')}" placeholder="${esc(t('max'))}"></span>` : a;
    }
    return `<input type="text" data-av="${k}" value="${esc(r.v ?? '')}" placeholder="${esc(F.kind === 'doi' ? t('doi_ph') : t('f_q'))}">`;
  }
  function advRowsHTML() {
    const rows = draft();
    return rows.map((r, k) => `${k ? `<div class="qconn"><span class="seg">${['AND', 'OR', 'NOT'].map((c) => `<button type="button" data-conj="${k}" data-c="${c}" aria-pressed="${r.c === c}">${c}</button>`).join('')}</span><button class="link" type="button" data-swap="${k}">${ic('swap')} ⇅</button></div>` : ''}
      <div class="qrow"><select data-afield="${k}" aria-label="field">${ADV_ORDER.map((f) => `<option value="${f}" ${f === r.f ? 'selected' : ''}>${esc(t(AF[f].lbl))}</option>`).join('')}</select>
        <select data-aop="${k}" aria-label="operator">${AF[r.f].ops.map((o) => `<option value="${o}" ${o === r.o ? 'selected' : ''}>${esc(t('op_' + o))}</option>`).join('')}</select>
        ${valueInput(r, k)}<button class="qx" type="button" data-adel="${k}" aria-label="${esc(t('a_del'))}">${ic('trash')}</button></div>`).join('');
  }
  function advHTML() {
    const saved = STORE.get('pdfdb_queries', []);
    return `<p class="hint" style="margin:0 0 10px">${esc(t('a_hint'))}</p><div id="adv-rows">${advRowsHTML()}</div>
      <div class="actions" style="margin-top:10px"><button class="btn ghost small" type="button" id="adv-add">${ic('plus')}${esc(t('a_add'))}</button>
        <button class="btn ghost small" type="button" id="adv-example">${esc(t('a_example'))}</button><button class="btn ghost small" type="button" id="adv-clear">${esc(t('a_clear'))}</button></div>
      <div class="qtext" id="adv-text">${esc(t('a_preview'))}: ${esc(draft().length ? A.advText(cleanDraft()) : t('a_none'))}</div>
      <div class="actions" style="margin-top:12px"><button class="btn" type="button" id="adv-run">${ic('search')}${esc(t('a_run'))}</button>
        <button class="btn ghost small" type="button" id="adv-copy">${ic('link')}${esc(t('a_copy'))}</button>
        <input type="text" id="adv-name" placeholder="${esc(t('a_name'))}" style="max-width:220px"><button class="btn ghost small" type="button" id="adv-save">${esc(t('a_save'))}</button></div>
      <div class="qsaved"><div class="sec-title" style="font-size:13px">${esc(t('a_saved'))}</div>${saved.length ? `<ul>${saved.map((q, k) => `<li><button class="link" type="button" data-qload="${k}">${esc(q.name)}</button><span class="dim">${esc(clip(A.advText(q.adv), 90))}</span><button class="link" type="button" data-qdel="${k}">${esc(t('a_del'))}</button></li>`).join('')}</ul>` : `<p class="hint">${esc(t('a_saved_none'))}</p>`}</div>`;
  }
  function cleanDraft() {
    return draft().filter((r) => { const F = AF[r.f]; if (F.kind === 'vrange' || F.kind === 'srange') return num(r.v) !== null || num(r.v2) !== null; return String(r.v ?? '').trim() !== ''; })
      .map((r, k) => { const o = { f: r.f, o: r.o, v: r.v }; if (r.o === 'between') o.v2 = r.v2; if (k) o.c = r.c || 'AND'; return o; });
  }
  function redrawAdv(keepFocus) {
    const box = $('adv-rows');
    if (!box) return;
    if (!keepFocus) box.innerHTML = advRowsHTML();
    $('adv-text').textContent = `${t('a_preview')}: ${draft().length ? A.advText(cleanDraft()) : t('a_none')}`;
  }

  // ================================================================ 当前条件、去掉一个条件的建议 ==
  function renderActive() {
    const groups = A.activeGroups();
    $('active-filters').innerHTML = groups.map(([k, txt]) => `<button class="chip brand" type="button" data-group="${esc(k)}" title="${esc(txt)}">${esc(clip(txt, 90))}</button>`).join('');
    $('active-row').hidden = !groups.length;
  }
  async function renderRelax(ncol) {
    const seq = ++UI.relaxSeq, groups = A.activeGroups();
    if (!groups.length) return;
    const out = [];
    for (const [k, txt] of groups.slice(0, 12)) { const n = await A.countWithout(k); if (seq !== UI.relaxSeq) return; if (n) out.push([k, txt, n]); }
    if (seq !== UI.relaxSeq || !out.length) return;
    out.sort((a, b) => b[2] - a[2]);
    const cellEl = $('rows').querySelector('td.empty');
    if (cellEl) cellEl.innerHTML = `${esc(t('empty'))}<div class="relax"><p>${esc(t('relax_t'))}</p>${out.map(([k, txt, n]) => `<button class="chip brand" type="button" data-group="${esc(k)}">${esc(t('relax_i', { f: clip(txt, 60), n: fmt(n) }))}</button>`).join('')}</div>`;
  }

  // ================================================================ 结果 ==
  function lists() {
    if (UI.lists) return UI.lists;
    const C = D.c, sCount = new Map(), sProps = new Map(), pCount = new Map(), pProps = new Map(), pSamples = new Map();
    for (const i of A.result) {
      const s = C.vs[i], p = C.sp[s], pr = C.vp[i];
      sCount.set(s, (sCount.get(s) || 0) + 1);
      if (!sProps.has(s)) sProps.set(s, new Map());
      sProps.get(s).set(pr, (sProps.get(s).get(pr) || 0) + 1);
      pCount.set(p, (pCount.get(p) || 0) + 1);
      if (!pProps.has(p)) { pProps.set(p, new Map()); pSamples.set(p, new Set()); }
      pProps.get(p).set(pr, (pProps.get(p).get(pr) || 0) + 1);
      pSamples.get(p).add(s);
    }
    UI.lists = { s: [...sCount.keys()], p: [...pCount.keys()], sCount, sProps, pCount, pProps, pSamples };
    return UI.lists;
  }
  const unitsOf = () => (S.view === 'v' ? A.result : lists()[S.view]);
  function renderCount() {
    const L = lists(), en = A.lang() === 'en';
    if (en) { const pl = (n, w) => `<b>${fmt(n)}</b> ${w}${n === 1 ? '' : 's'}`; $('count').innerHTML = `${pl(A.result.length, 'value')} from ${pl(L.s.length, 'sample')} in ${pl(L.p.length, 'paper')}`; }
    else $('count').innerHTML = t('count_v', { n: fmt(A.result.length), s: fmt(L.s.length), p: fmt(L.p.length) });
  }
  function renderBasketBtn() {
    const n = UI.sel[S.view].size;
    $('basket-lbl').textContent = n ? t('basket_sel', { n: fmt(n) }) : t('basket_all');
  }
  function renderHead() {
    document.querySelectorAll('#res-view button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
    $('cols-btn').hidden = S.view !== 'v';
    if (S.view !== 'v') {
      const cols = S.view === 's' ? [['col_sample', 16], ['col_protein', 14], ['col_treat', 22], ['col_props', 20], ['col_values', 7], ['col_paper', 21]]
        : [['col_paper', 48], ['col_nsamples', 8], ['col_values', 8], ['col_props', 36]];
      $('thead').innerHTML = `<tr><th class="col-chk" scope="col"><input type="checkbox" id="chk-page" aria-label="select page"></th>${cols.map(([k, w]) => `<th scope="col" style="width:${w}%">${esc(t(k))}</th>`).join('')}</tr>`;
      return;
    }
    const cols = shownCols(), total = cols.reduce((a, c) => a + c.w, 0);
    const ariaSort = (c) => (c.key === 'value' ? (S.sort === 'vasc' ? 'ascending' : S.sort === 'vdesc' ? 'descending' : 'none') : c.sort && S.sort === c.sort ? 'ascending' : 'none');
    $('thead').innerHTML = `<tr><th class="col-chk" scope="col"><input type="checkbox" id="chk-page" aria-label="select page"></th><th class="col-exp" scope="col"></th>${cols.map((c) => {
      const as = ariaSort(c), arrow = as === 'ascending' ? '▲' : as === 'descending' ? '▼' : c.sort ? '↕' : '';
      return `<th scope="col" style="width:${(c.w / total * 100).toFixed(1)}%" ${c.sort ? `class="sortable" data-sort="${c.sort}" aria-sort="${as}"` : ''}>${esc(t('col_' + c.key))}${arrow ? `<span class="arrow">${arrow}</span>` : ''}</th>`;
    }).join('')}</tr>`;
  }
  function valueHTML(i, badge) {
    let h = `<span class="num">${esc(sci(VX(i, 'vt')))}</span>`;
    const sd = VX(i, 'sd'), unit = VX(i, 'unit'), sig = VX(i, 'sig');
    if (sd) h += ` ± ${esc(sd)}`;
    if (unit) h += ` ${esc(unit)}`;
    if (sig) h += `<span class="sig" title="${esc(t('sig_tip'))}">${esc(sig)}</span>`;
    if (badge && D.c.vo[i] & 1) h += `<span class="badge model" title="${esc(t('badge_model_tip'))}">${esc(t('badge_model'))}</span>`;
    const extra = [], mul = VX(i, 'mul'), lo = VX(i, 'lo'), hi = VX(i, 'hi'), vstd = VX(i, 'vstd'), ustd = VX(i, 'ustd');
    if (mul) extra.push(t('axis', { m: esc(mul) }));
    if (lo || hi) extra.push(t('errbar', { lo: esc(lo || '?'), hi: esc(hi || '?') }));
    if (vstd && ustd && !(unit === ustd && num(vstd) === num(VX(i, 'vt')))) extra.push(t('std', { v: esc(sci(vstd)), u: esc(ustd) }));
    if (extra.length) h += `<div class="extra">${extra.join(' · ')}</div>`;
    return h;
  }
  const outNote = (rr) => (rr && rr.out ? ' ' + t('c_out', { n: fmt(rr.out), a: PFDCharts.fmt(rr.min), b: PFDCharts.fmt(rr.max) }) : '');
  // 11-16 用户：结果里蛋白来源、处理类型的「+」（点了加进筛选）和左侧筛选重复、用处不大 → 只留标签，不可点
  const tag = (label) => `<span class="chip tag">${esc(label)}</span>`;
  const addBtn = (key, tok, label, cls = 'chip add') => `<button class="${cls}" type="button" data-addf="${key}" data-tok="${esc(tok)}" title="${esc(t('add_filter'))}">${esc(label)}</button>`;
  function methodHTML(i, clampIt) {
    const parts = [], m = D.c.vm[i];
    parts.push(m >= 3 ? `<div class="mtd">${addBtn('method', D.dict.method[m][0], A.methodName(m), 'fbtn')}</div>` : `<div class="dim">${esc(A.methodName(m))}</div>`);
    const mp = VX(i, 'mp'), cond = VX(i, 'cond');
    if (mp) parts.push(`<div class="dim${clampIt ? ' clamp c2' : ''}" title="${esc(mp)}">${esc(mp)}</div>`);
    if (cond) parts.push(`<div class="dim${clampIt ? ' clamp c2' : ''}" title="${esc(cond)}">${esc(t('cond_lbl') + cond)}</div>`);
    return parts.join('');
  }
  function sourceHTML(i, withDoi) {
    const s = D.c.vs[i], p = D.c.sp[s];
    let h = esc(cat(VX(i, 'item')));
    const panel = VX(i, 'panel');
    if (panel) h += ` <span class="dim" title="${esc(panel)}">${esc(clip(panel, 18))}</span>`;
    const more = [];
    if (A.MODEL_SRC.has(VX(i, 'src'))) {
      if (VX(i, 'series')) more.push(t('series', { s: esc(clip(VX(i, 'series'), 30)) }));
      if (VX(i, 'x')) more.push(t('x', { x: esc(clip(VX(i, 'x') + (VX(i, 'xu') ? ' ' + VX(i, 'xu') : ''), 30)) }));
    }
    if (more.length) h += `<div class="dim">${more.join(' · ')}</div>`;
    if (withDoi) h += `<div><a href="${A.doiHref(p)}" target="_blank" rel="noopener" title="${esc(t('open_doi_tip', { t: PX(p, 'title') }))}">${esc(clip(D.doi[p], 30))} ↗</a></div>`;
    return h;
  }
  function proteinHTML(s) {
    const srcs = A.srcOf(s), raw = SX(s, 'psrc'), f = D.c.sform[s];
    return `<div>${srcs.length ? srcs.map((c) => tag(A.srcLabel(c))).join('') : esc(raw || '—')}</div>
      <div class="dim">${esc([f ? A.formLabel(f) : '', cat(D.dict.pcat[D.c.scat[s]])].filter(Boolean).join(' · '))}</div>`;
  }
  function typesHTML(s, max = 4) {
    const tts = A.ttOf(s), shown = tts.filter((c) => !A.isRoutine(c)), list = (shown.length ? shown : tts).slice(0, max);
    return list.map((c) => tag(A.ttLabel(c))).join('') + (shown.length > max ? `<span class="dim">+${shown.length - max}</span>` : '');
  }
  const treatText = (s) => { const x = SX(s, 'treat'); return x === '未处理' ? t('d_untreated') : x; };
  function cellHTML(key, i) {
    const s = D.c.vs[i], p = D.c.sp[s];
    switch (key) {
      case 'prop': return `<div class="prop">${addBtn('prop', A.propKey(D.c.vp[i]), A.propName(D.c.vp[i]), 'fbtn')}</div><div class="mname clamp c2" title="${esc(VX(i, 'name'))}">${esc(VX(i, 'name'))}</div>`;
      case 'value': return `<div class="val">${valueHTML(i, true)}</div>`;
      case 'sample': return `<a class="strong clamp c2" href="${A.sampleHref(s)}" title="${esc(A.sampleName(s))}">${esc(A.sampleName(s))}</a><div class="dim">${esc(t('sample_n', { n: A.sampleNo(s) }))}</div>`;
      case 'protein': return proteinHTML(s);
      case 'treat': return `<div class="clamp c2" title="${esc(treatText(s))}">${esc(treatText(s))}</div><div>${typesHTML(s, 3)}</div>`;
      case 'method': return methodHTML(i, true);
      case 'ph': { const x = D.c.vph[i]; return x === x ? `<span class="tnum">${+x.toFixed(2)}</span>` : '<span class="dim">—</span>'; }
      case 'journal': return `<span class="clamp c2">${esc(A.journalName(p))}</span>`;
      case 'source': return sourceHTML(i, true);
      default: return '';
    }
  }
  const summaryHTML = (m) => `<div class="summary">${esc(m[4] || m[3])}<span class="lang">(${esc(t('x_summary_lang'))})</span></div>`;
  function expandHTML(i, ncol) {
    const s = D.c.vs[i], p = D.c.sp[s], m = A.methodOf(i), steps = SX(s, 'steps'), ings = SX(s, 'ings'), cond = VX(i, 'cond');
    return `<tr class="expand"><td colspan="${ncol}"><div class="exp-grid">
      <div class="span2"><h4>${esc(t('x_summary'))}${m ? ' · ' + esc(A.methodName(D.c.vm[i])) : ''}</h4>${m ? summaryHTML(m) : `<div class="dim">${esc(D.c.vm[i] ? A.methodName(D.c.vm[i]) : t('x_no_summary'))}</div>`}</div>
      <div><h4>${esc(t('x_cond'))}</h4><div>${esc(cond || '—')}</div></div>
      <div class="span2"><h4>${esc(t('x_steps'))}</h4>${steps.length ? `<ol class="steps">${steps.map(([mm, c, ty, pr]) => `<li><b>${esc(mm)}</b> <span class="dim">${esc(cat(c))}${ty ? ' · ' + esc(ty.split(' | ').map(zh).join(' · ')) : ''}</span>${pr ? `<div class="dim">${esc(pr)}</div>` : ''}</li>`).join('')}</ol>` : esc(t('d_untreated'))}</div>
      <div><h4>${esc(t('x_ing'))}</h4>${ings.length ? ings.map(([n, c, a]) => `<div>${esc(n)} <span class="dim">(${esc(cat(c))}${a ? ', ' + esc(a) : ''})</span></div>`).join('') : esc(t('d_none'))}
        <h4 style="margin-top:10px">${esc(t('x_detail'))}</h4>${sourceHTML(i, false)}<div class="dim">${esc(A.journalName(p))}</div></div>
    </div><div class="exp-actions">
      <a class="btn small" href="${A.sampleHref(s)}">${esc(t('sample_page'))}</a><a class="btn ghost small" href="${A.paperHref(p)}">${esc(t('paper_page'))}</a>
      <button class="btn ghost small" type="button" data-bk="${s}">${ic('cart')}${esc(t(A.basketHas(s) ? 'b_remove' : 'b_add'))}</button>
      <a class="btn ghost small" href="${A.doiHref(p)}" target="_blank" rel="noopener">${esc(t('open_doi'))}</a></div></td></tr>`;
  }
  const propChips = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => `<span class="chip">${esc(A.propName(c))} <b>${fmt(n)}</b></span>`).join('');
  function paperCell(p) {
    return `<a class="strong clamp c2" href="${A.paperHref(p)}" title="${esc(PX(p, 'title'))}">${esc(PX(p, 'title'))}</a><div class="dim"><i>${esc(A.journalName(p))}</i> · <a href="${A.doiHref(p)}" target="_blank" rel="noopener">${esc(D.doi[p])}</a></div>`;
  }
  let renderSeq = 0;
  async function renderRows() {
    const seq = ++renderSeq, units = unitsOf(), nPages = Math.max(1, Math.ceil(units.length / S.size));
    if (S.page >= nPages) S.page = nPages - 1;
    const slice = Array.from(units.slice(S.page * S.size, S.page * S.size + S.size));
    const ncol = S.view === 'v' ? shownCols().length + 2 : S.view === 's' ? 7 : 5;
    renderPager(nPages);
    const sn = $('sig-note');
    if (sn) sn.hidden = true;
    if (!slice.length) { $('rows').innerHTML = `<tr><td colspan="${ncol}" class="empty">${esc(t('empty'))}</td></tr>`; renderRelax(ncol); return; }
    const need = S.view === 'v' ? slice.map((i) => A.chunkOf(4, i)) : S.view === 's' ? slice.map((s) => A.chunkOf(2, s)) : slice.map((p) => A.chunkOf(0, p));
    if (need.some((k) => !D.chunkData[k])) {
      $('rows').innerHTML = `<tr><td colspan="${ncol}" class="loading">${esc(t('loading'))}</td></tr>`;
      await A.ensure(need);
      if (seq !== renderSeq) return;
    }
    const sel = UI.sel[S.view];
    const chk = (id) => `<td class="col-chk"><input type="checkbox" data-sel="${id}" ${sel.has(id) ? 'checked' : ''} aria-label="select"></td>`;
    if (S.view === 'v') {
      const cols = shownCols();
      $('rows').innerHTML = slice.map((i) => { const open = UI.open.has(i);
        return `<tr class="row${open ? ' open' : ''}${sel.has(i) ? ' sel' : ''}" data-i="${i}">${chk(i)}<td class="col-exp"><button class="exp-btn" type="button" data-exp="${i}" aria-expanded="${open}" aria-label="${esc(t('expand'))}">${open ? '−' : '+'}</button></td>
          ${cols.map((c) => `<td>${cellHTML(c.key, i)}</td>`).join('')}</tr>${open ? expandHTML(i, ncol) : ''}`; }).join('');
      if (sn && slice.some((i) => VX(i, 'sig'))) { sn.innerHTML = `<span class="sig">a, b</span> ${esc(t('sig_note'))}`; sn.hidden = false; }
    } else if (S.view === 's') {
      const L = lists();
      $('rows').innerHTML = slice.map((s) => `<tr class="row${sel.has(s) ? ' sel' : ''}">${chk(s)}<td><a class="strong clamp c2" href="${A.sampleHref(s)}">${esc(A.sampleName(s))}</a><div class="dim">${esc(t('sample_n', { n: A.sampleNo(s) }))}</div></td>
        <td>${proteinHTML(s)}</td><td><div class="clamp c2" title="${esc(treatText(s))}">${esc(treatText(s))}</div><div>${typesHTML(s, 3)}</div></td>
        <td>${propChips(L.sProps.get(s))}</td><td class="tnum">${fmt(L.sCount.get(s))}</td><td>${paperCell(D.c.sp[s])}</td></tr>`).join('');
    } else {
      const L = lists();
      $('rows').innerHTML = slice.map((p) => `<tr class="row${sel.has(p) ? ' sel' : ''}">${chk(p)}<td>${paperCell(p)}</td><td class="tnum">${fmt(L.pSamples.get(p).size)}</td><td class="tnum">${fmt(L.pCount.get(p))}</td><td>${propChips(L.pProps.get(p))}</td></tr>`).join('');
    }
    const ck = $('chk-page');
    if (ck) ck.checked = slice.length > 0 && slice.every((x) => sel.has(x));
  }
  function renderPager(nPages) {
    if (nPages <= 1) { $('pager').innerHTML = ''; return; }
    const p = S.page, list = [...new Set([0, nPages - 1, p - 2, p - 1, p, p + 1, p + 2].filter((x) => x >= 0 && x < nPages))].sort((a, b) => a - b);
    let h = `<button type="button" data-page="${p - 1}" ${p === 0 ? 'disabled' : ''} aria-label="${esc(t('prev'))}">‹</button>`;
    list.forEach((x, k) => { if (k && x - list[k - 1] > 1) h += '<span>…</span>'; h += `<button type="button" data-page="${x}" ${x === p ? 'aria-current="page"' : ''}>${x + 1}</button>`; });
    $('pager').innerHTML = h + `<button type="button" data-page="${p + 1}" ${p >= nPages - 1 ? 'disabled' : ''} aria-label="${esc(t('next'))}">›</button>`;
  }
  let refreshSeq = 0;
  async function refresh(keepPage) {
    const seq = ++refreshSeq;
    if (!keepPage) { S.page = 0; UI.open.clear(); }
    UI.relaxSeq++;
    await A.compute();
    if (seq !== refreshSeq || A.currentView() !== 'search') return;
    UI.lists = null;
    renderTabs(); renderFacetBlocks(); renderActive(); renderCount(); renderHead(); renderBasketBtn();
    history.replaceState(null, '', A.searchHref(A.searchParams()));
    renderChart();
    if (UI.tab === 'batch') renderBatchReport();
    await renderRows();
  }
  function syncInputs() {
    if ($('q')) $('q').value = S.q;
    $('page-size').value = String(S.size);
    renderPane();
  }

  // ================================================================ 图表 ==
  const GROUPS = {
    src: (s) => A.srcOf(s).map((c) => ['s' + c, A.srcLabel(c)]),
    tt: (s) => A.ttOf(s).filter((c) => !A.isRoutine(c)).map((c) => ['t' + c, A.ttLabel(c)]),
    method: (s, i) => (D.c.vm[i] >= 3 ? [['m' + D.c.vm[i], A.methodName(D.c.vm[i])]] : []),
    pcat: (s) => [['c' + D.c.scat[s], cat(D.dict.pcat[D.c.scat[s]])]],
    form: (s) => (D.c.sform[s] ? [['f' + D.c.sform[s], A.formLabel(D.c.sform[s])]] : []),
    journal: (s) => [['j' + D.c.pj[D.c.sp[s]], A.journalName(D.c.sp[s]) || t('unknown')]],
    sys: (s) => [['y' + D.c.ssys[s], cat(D.dict.sys[D.c.ssys[s]])]],
  };
  const SC_CAP = 4000;
  function renderChart() {
    const panel = $('chart-panel');
    $('chart-toggle').setAttribute('aria-expanded', UI.chart);
    panel.hidden = !UI.chart;
    if (!UI.chart) return;
    const C = D.c, result = A.result, pc = new Map();
    for (const i of result) pc.set(C.vp[i], (pc.get(C.vp[i]) || 0) + 1);
    const props = [...pc.entries()].sort((a, b) => b[1] - a[1]);
    if (!props.length) { panel.innerHTML = `<div class="chart-empty">${esc(t('c_none'))}</div>`; return; }
    if (!pc.has(UI.chartProp)) { UI.chartProp = props[0][0]; UI.chartUnit = -1; }
    const uc = new Map();
    for (const i of result) if (C.vp[i] === UI.chartProp && D.veff[i] === D.veff[i]) uc.set(C.vu[i], (uc.get(C.vu[i]) || 0) + 1);
    const units = [...uc.entries()].sort((a, b) => b[1] - a[1]);
    if (!uc.has(UI.chartUnit)) UI.chartUnit = units.length ? units[0][0] : -1;
    const unitLbl = UI.chartUnit >= 0 ? (D.dict.unit[UI.chartUnit] || t('no_unit')) : '';
    const rows = [];
    for (const i of result) if (C.vp[i] === UI.chartProp && C.vu[i] === UI.chartUnit && D.veff[i] === D.veff[i]) rows.push(i);
    const opt = (v, cur, label) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(label)}</option>`;
    const seg = (k, lbl) => `<button type="button" data-ctype="${k}" aria-pressed="${UI.chartType === k}">${esc(t(lbl))}</button>`;
    panel.innerHTML = `<div class="chart-controls">
        <span class="seg">${seg('hist', 'c_hist')}${seg('box', 'c_box')}${seg('scatter', 'c_scatter')}</span>
        <label class="lbl-inline">${esc(t('c_prop'))} <select id="c-prop">${props.map(([c, n]) => opt(c, UI.chartProp, `${A.propName(c)} (${fmt(n)})`)).join('')}</select></label>
        <label class="lbl-inline">${esc(t('c_unit'))} <select id="c-unit">${units.map(([c, n]) => opt(c, UI.chartUnit, `${D.dict.unit[c] || t('no_unit')} (${fmt(n)})`)).join('')}</select></label>
        ${UI.chartType === 'box' ? `<label class="lbl-inline">${esc(t('c_group'))} <select id="c-group">${Object.keys(GROUPS).map((g) => opt(g, UI.chartGroup, t('g_' + g))).join('')}</select></label>` : ''}
        ${UI.chartType === 'scatter' ? `<label class="lbl-inline">${esc(t('c_x'))} <select id="c-x">${opt('ph', UI.chartX, t('x_ph'))}${opt('temp', UI.chartX, t('x_temp'))}</select></label>` : ''}
        <label class="lbl-inline"><input type="checkbox" id="c-log" ${UI.chartLog ? 'checked' : ''}> ${esc(t('c_log'))}</label>
        <label class="lbl-inline"><input type="checkbox" id="c-table" ${UI.chartTable ? 'checked' : ''}> ${esc(t('c_table'))}</label>
        <span class="lbl-inline" style="margin-left:auto">${esc(t('c_dl'))} ${A.chartDl('chart-box')}</span></div>
      ${UI.chartType === 'scatter' ? `<div class="legend" style="padding-top:10px"><span><i style="background:var(--series-1)"></i>${esc(t('o_author'))}</span><span><i class="ring2"></i>${esc(t('o_model'))}</span></div>` : ''}
      <div class="chart-box" id="chart-box"></div><div class="chart-note" id="chart-note"></div><div id="chart-table"></div>`;
    const box = $('chart-box'), yLbl = `${A.propName(UI.chartProp)}${D.dict.unit[UI.chartUnit] ? ' (' + unitLbl + ')' : ''}`, total = pc.get(UI.chartProp);
    let table = null;
    if (UI.chartType === 'hist') {
      const rr = PFDCharts.histogram(box, rows.map((i) => D.veff[i]), { log: UI.chartLog, xLabel: yLbl, yLabel: t('c_count'), empty: t('c_none'), countFmt: (n) => t('c_count_fmt', { n: fmt(n) }) });
      $('chart-note').textContent = t('c_note', { n: fmt(rows.length), u: unitLbl, m: fmt(total) }) + outNote(rr);
    } else if (UI.chartType === 'box') {
      const g = new Map();
      for (const i of rows) for (const [k, label] of GROUPS[UI.chartGroup](C.vs[i], i)) { if (!g.has(k)) g.set(k, { key: k, label, values: [] }); g.get(k).values.push(D.veff[i]); }
      const groups = [...g.values()].filter((x) => x.values.length >= 3).sort((a, b) => b.values.length - a.values.length).slice(0, 12);
      groups.forEach((x) => x.values.sort((a, b) => a - b));
      PFDCharts.boxplot(box, groups, { log: UI.chartLog, xLabel: yLbl, empty: t('c_none'), medLbl: t('c_median'), rangeLbl: t('c_range'),
        onClick: (key) => { const f = { s: 'src', t: 'tt', m: 'method', c: 'pcat', f: 'form', j: 'journal', y: 'sys' }[key[0]]; toggleFacet(f, +key.slice(1), true); } });
      $('chart-note').textContent = t('c_note', { n: fmt(rows.length), u: unitLbl, m: fmt(total) }) + ' ' + t('c_group_n');
      const q = PFDCharts.quantile;
      table = [[t('group'), t('n'), t('q1'), t('median'), t('q3')], ...groups.map((x) => [x.label, x.values.length, q(x.values, 0.25), q(x.values, 0.5), q(x.values, 0.75)])];
    } else {
      const pts = [], step = Math.max(1, rows.length / SC_CAP);
      let kept = 0;
      for (let k = 0; k < rows.length; k += step) {
        const i = rows[Math.floor(k)], s = C.vs[i], x = UI.chartX === 'ph' ? C.vph[i] : D.sMaxT[s];
        if (x !== x) continue;
        kept++;
        pts.push({ x, y: D.veff[i], s: C.vo[i] & 1, tip: `<b>${esc(PFDCharts.fmt(D.veff[i]))} ${esc(unitLbl)}</b><br>${esc(t(UI.chartX === 'ph' ? 'x_ph' : 'x_temp'))}: ${esc(PFDCharts.fmt(x))}<br>${esc(A.srcOf(s).map(A.srcLabel).join(' · '))}<br>${esc(D.doi[C.sp[s]])}` });
      }
      const rr = PFDCharts.scatter(box, pts, { logY: UI.chartLog, xLabel: t(UI.chartX === 'ph' ? 'x_ph' : 'x_temp'), yLabel: yLbl, empty: t('c_none') });
      $('chart-note').textContent = t('c_note_sc', { n: fmt(kept), u: unitLbl, cap: fmt(SC_CAP) }) + outNote(rr);
    }
    if (UI.chartTable && table) {
      $('chart-table').innerHTML = `<div class="card-body"><div class="mini-wrap"><table class="data-table"><thead><tr>${table[0].map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${table.slice(1).map((r) => `<tr>${r.map((v, k) => `<td class="${k ? 'n' : ''}">${esc(k ? PFDCharts.fmt(v) : v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    } else if (UI.chartTable && UI.chartType === 'hist' && rows.length) {
      const v = rows.map((i) => D.veff[i]).sort((a, b) => a - b), q = PFDCharts.quantile;
      $('chart-table').innerHTML = `<div class="card-body"><div class="mini-wrap"><table class="data-table"><thead><tr><th>${esc(t('n'))}</th><th>min</th><th>${esc(t('q1'))}</th><th>${esc(t('median'))}</th><th>${esc(t('q3'))}</th><th>max</th></tr></thead><tbody><tr>${[v.length, v[0], q(v, 0.25), q(v, 0.5), q(v, 0.75), v[v.length - 1]].map((x) => `<td class="n">${esc(PFDCharts.fmt(x))}</td>`).join('')}</tr></tbody></table></div></div>`;
    }
  }
  function toggleFacet(key, code, on) {
    const f = A.facetByKey(key);
    if (!f) return;
    if (on) { S.sel[key].add(code); f.mask[code] = 1; } else { S.sel[key].delete(code); f.mask[code] = 0; }
    refresh();
  }

  // ================================================================ 导出 ==
  function scopeIndices(scope) {
    const C = D.c, result = A.result;
    if (scope === 'page') {
      const units = Array.from(unitsOf().slice(S.page * S.size, S.page * S.size + S.size));
      if (S.view === 'v') return units;
      const set = new Set(units);
      return Array.from(result).filter((i) => set.has(S.view === 's' ? C.vs[i] : C.sp[C.vs[i]]));
    }
    if (scope === 'sel') {
      const sel = UI.sel[S.view];
      if (S.view === 'v') return Array.from(result).filter((i) => sel.has(i));
      return Array.from(result).filter((i) => sel.has(S.view === 's' ? C.vs[i] : C.sp[C.vs[i]]));
    }
    return Array.from(result);
  }
  function renderExportMenu() {
    const X = UI.ex, nSel = scopeIndices('sel').length, nPage = scopeIndices('page').length, nAll = A.result.length;
    if (X.scope === 'sel' && !nSel) X.scope = 'all';
    const b = (grp, v, lbl, dis) => `<button class="xopt" type="button" data-x="${grp}" data-v="${v}" aria-pressed="${X[grp] === v}" ${dis ? 'disabled' : ''}>${esc(lbl)}</button>`;
    const cols = X.cols && X.cols.length ? X.cols : A.VALUE_HEAD;
    const nPapers = A.resultPapers(scopeIndices(X.scope)).length;
    $('export-pop').innerHTML = `<h4>${esc(t('ex_title'))}</h4>
      <div class="xrow"><span>${esc(t('ex_fmt'))}</span>${b('fmt', 'csv', 'CSV')}${b('fmt', 'tsv', 'TSV')}${b('fmt', 'xlsx', 'Excel')}${b('fmt', 'json', 'JSON')}</div>
      <div class="xrow"><span>${esc(t('ex_scope'))}</span>${b('scope', 'all', t('ex_all', { n: fmt(nAll) }))}${b('scope', 'page', t('ex_page', { n: fmt(nPage) }))}${b('scope', 'sel', t('ex_sel', { n: fmt(nSel) }), !nSel)}</div>
      <div class="xrow"><span>${esc(t('ex_shape'))}</span>${b('shape', 'long', t('ex_long'))}${b('shape', 'wide', t('ex_wide'))}</div>
      <div class="xrow"><span>${esc(t('ex_cols'))}</span><button class="xopt" type="button" data-xpick="0" aria-pressed="${!X.pick}" ${X.shape === 'wide' ? 'disabled' : ''}>${esc(t('ex_cols_all', { n: A.VALUE_HEAD.length }))}</button><button class="xopt" type="button" data-xpick="1" aria-pressed="${X.pick}" ${X.shape === 'wide' ? 'disabled' : ''}>${esc(X.pick ? t('ex_cols_n', { n: cols.length }) : t('ex_cols_pick'))}</button>
        ${X.pick && X.shape === 'long' ? `<div class="xcols">${A.VALUE_HEAD.map((h) => `<label><input type="checkbox" data-xcol="${h}" ${cols.includes(h) ? 'checked' : ''}>${esc(h)}</label>`).join('')}</div>` : ''}</div>
      <button class="btn xgo" type="button" id="ex-go">${ic('download')}${esc(t('ex_go'))}</button>
      <div class="xrow" style="margin-top:10px"><span>${esc(t('ex_cite'))}</span><span class="dim">${esc(t('ex_refs', { n: fmt(nPapers) }))}</span>${['ris', 'bib', 'txt'].map((k) => `<button class="xopt" type="button" data-cite="${k}">${esc(t('ex_' + k))}</button>`).join('')}</div>`;
  }
  async function doExport() {
    const X = UI.ex, idx = scopeIndices(X.scope);
    if (!idx.length) return;
    const papers = A.resultPapers(idx);
    if (!(await A.prepareChunks([...idx.map((i) => A.chunkOf(4, i)), ...papers.map((p) => A.chunkOf(0, p))], idx.length))) return;
    if (X.shape === 'wide') {
      const rows = A.wideTable(A.resultSamples(idx), idx);
      await A.saveTable(rows, 'pdfdb_samples_wide', X.fmt, [{ name: 'methods', rows: A.methodSheet(papers) }]);
    } else {
      const rows = A.valueTable(idx, X.pick ? X.cols : null);
      await A.saveTable(rows, 'pdfdb_values', X.fmt, [{ name: 'methods', rows: A.methodSheet(papers) }]);
    }
  }
  function renderColsMenu() {
    $('cols-pop').innerHTML = `<div class="hint">${esc(t('cols_hint'))}</div>` + COLS.filter((c) => !c.fixed).map((c) =>
      `<label><input type="checkbox" data-col="${c.key}" ${visibleCols.has(c.key) ? 'checked' : ''}> ${esc(t('col_' + c.key))}</label>`).join('');
  }
  function closeMenus(except) {
    for (const [b, p] of [['cols-btn', 'cols-pop'], ['export-btn', 'export-pop']]) {
      if (b === except || !$(p)) continue;
      $(p).hidden = true; $(b).setAttribute('aria-expanded', 'false');
    }
  }

  // ================================================================ 事件 ==
  function bind(el) {
    const later = debounce(() => refresh(), 300);
    el.addEventListener('input', (e) => {
      const x = e.target;
      if (x.id === 'q') { S.q = x.value; later(); }
      else if (x.dataset.range) { S[x.dataset.range] = x.value.trim(); later(); }
      else if (x.dataset.find) {
        UI.find[x.dataset.find] = x.value;
        const box = el.querySelector(`[data-fb="${x.dataset.find}"]`), pos = x.selectionStart;
        box.innerHTML = facetBlock(A.facetByKey(x.dataset.find));
        const inp = box.querySelector('[data-find]');
        if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
      } else if (x.dataset.av !== undefined) { draft()[+x.dataset.av].v = x.value; redrawAdv(true); }
      else if (x.dataset.av2 !== undefined) { draft()[+x.dataset.av2].v2 = x.value; redrawAdv(true); }
    });
    el.addEventListener('change', (e) => {
      const x = e.target;
      if (x.dataset.f) toggleFacet(x.dataset.f, +x.dataset.o, x.checked);
      else if (x.dataset.flag) { S[x.dataset.flag] = x.checked; refresh(); }
      else if (x.id === 'page-size') { S.size = +x.value; saveUI(); S.page = 0; renderRows(); history.replaceState(null, '', A.searchHref(A.searchParams())); }
      else if (x.dataset.col) { if (x.checked) visibleCols.add(x.dataset.col); else visibleCols.delete(x.dataset.col); saveUI(); renderHead(); renderRows(); }
      else if (x.dataset.sel !== undefined) {
        const id = +x.dataset.sel, sel = UI.sel[S.view];
        if (x.checked) sel.add(id); else sel.delete(id);
        x.closest('tr').classList.toggle('sel', x.checked);
        renderBasketBtn();
      } else if (x.id === 'chk-page') {
        const sel = UI.sel[S.view], units = Array.from(unitsOf().slice(S.page * S.size, S.page * S.size + S.size));
        for (const u of units) { if (x.checked) sel.add(u); else sel.delete(u); }
        renderRows(); renderBasketBtn();
      } else if (x.dataset.xcol) {
        const X = UI.ex, cols = new Set(X.cols && X.cols.length ? X.cols : A.VALUE_HEAD);
        if (x.checked) cols.add(x.dataset.xcol); else cols.delete(x.dataset.xcol);
        X.cols = A.VALUE_HEAD.filter((h) => cols.has(h)); saveUI();
        const btn = el.querySelector('[data-xpick="1"]'); if (btn) btn.textContent = t('ex_cols_n', { n: X.cols.length });
      } else if (x.dataset.afield !== undefined) { const r = draft()[+x.dataset.afield]; r.f = x.value; r.o = AF[r.f].ops[0]; r.v = ''; r.v2 = ''; if (AF[r.f].kind === 'facet') { const f = A.facetByKey(r.f); r.v = f.tok(r.f === 'method' ? 3 : 0); } redrawAdv(); }
      else if (x.dataset.aop !== undefined) { draft()[+x.dataset.aop].o = x.value; redrawAdv(); }
      else if (x.dataset.av !== undefined && x.tagName === 'SELECT') { draft()[+x.dataset.av].v = x.value; redrawAdv(true); }
      else if (x.id.startsWith('c-')) {
        const id = x.id;
        if (id === 'c-prop') { UI.chartProp = +x.value; UI.chartUnit = -1; }
        else if (id === 'c-unit') UI.chartUnit = +x.value;
        else if (id === 'c-group') UI.chartGroup = x.value;
        else if (id === 'c-x') UI.chartX = x.value;
        else if (id === 'c-log') UI.chartLog = x.checked;
        else if (id === 'c-table') UI.chartTable = x.checked;
        saveUI(); renderChart();
      }
    });
    el.addEventListener('click', async (e) => {
      const x = e.target, q = (sel) => x.closest(sel);
      let b;
      if ((b = q('[data-tab]'))) { UI.tab = b.dataset.tab; saveUI(); renderPane(); if (UI.tab === 'batch') renderBatchReport(); return; }
      if ((b = q('[data-more]'))) { const k = b.dataset.more; if (UI.more.has(k)) UI.more.delete(k); else UI.more.add(k); renderFacetBlocks(); return; }
      if ((b = q('[data-fclear]'))) { const f = A.facetByKey(b.dataset.fclear); S.sel[f.key] = new Set(); f.mask.fill(0); refresh(); return; }
      if ((b = q('[data-group]'))) { A.removeGroup(b.dataset.group); if (b.dataset.group === 'adv') UI.draft = null; syncInputs(); refresh(); return; }
      if ((b = q('[data-addf]'))) {
        const f = A.facetByKey(b.dataset.addf), c = f.fromTok.get(b.dataset.tok), name = b.textContent.trim();
        if (c === undefined) return;
        if (S.sel[f.key].has(c)) { toast(t('filter_already', { f: name })); return; }
        toggleFacet(f.key, c, true); toast(t('filter_added', { f: name })); return;
      }
      if ((b = q('[data-view]'))) { S.view = b.dataset.view; S.page = 0; renderHead(); renderBasketBtn(); history.replaceState(null, '', A.searchHref(A.searchParams())); renderRows(); return; }
      if ((b = q('th[data-sort]'))) {
        const k = b.dataset.sort;
        S.sort = k === 'value' ? (S.sort === 'vdesc' ? 'vasc' : 'vdesc') : (S.sort === k ? 'paper' : k);
        A.sortResult(); S.page = 0; renderHead(); renderRows(); history.replaceState(null, '', A.searchHref(A.searchParams())); return;
      }
      if ((b = q('[data-exp]'))) { const i = +b.dataset.exp; if (UI.open.has(i)) UI.open.delete(i); else UI.open.add(i); renderRows(); return; }
      if ((b = q('[data-bk]'))) { const s = +b.dataset.bk; if (A.basketHas(s)) A.basketRemove([s]); else A.basketAdd([s]); renderRows(); return; }
      if ((b = q('[data-page]'))) { if (b.disabled) return; S.page = +b.dataset.page; UI.open.clear(); renderRows(); history.replaceState(null, '', A.searchHref(A.searchParams())); $('s-results').scrollIntoView({ block: 'start' }); return; }
      if ((b = q('[data-ctype]'))) { UI.chartType = b.dataset.ctype; saveUI(); renderChart(); return; }
      if ((b = q('[data-x]'))) { UI.ex[b.dataset.x] = b.dataset.v; saveUI(); renderExportMenu(); return; }
      if ((b = q('[data-xpick]'))) { UI.ex.pick = b.dataset.xpick === '1'; if (UI.ex.pick && !(UI.ex.cols && UI.ex.cols.length)) UI.ex.cols = A.VALUE_HEAD.slice(); saveUI(); renderExportMenu(); return; }
      if ((b = q('[data-cite]'))) { closeMenus(); A.saveCitations(A.resultPapers(scopeIndices(UI.ex.scope)), b.dataset.cite).catch((err) => toast(t('load_fail', { e: err.message || err }))); return; }
      if (x.closest('#ex-go')) { closeMenus(); doExport().catch((err) => toast(t('load_fail', { e: err.message || err }))); return; }
      if (x.closest('#kw-go')) { S.q = $('q').value.trim(); refresh(); return; }
      if (x.closest('#panel-toggle')) { UI.panel = !UI.panel; saveUI(); $('s-filters').hidden = !UI.panel; const tb = $('panel-toggle'); tb.textContent = t(UI.panel ? 'panel_hide' : 'panel_show'); tb.setAttribute('aria-expanded', UI.panel); return; }
      if (x.closest('#reset')) { A.clearFilters(); UI.draft = null; syncInputs(); refresh(); return; }
      if (x.closest('#chart-toggle')) { UI.chart = !UI.chart; saveUI(); renderChart(); return; }
      if (x.closest('#basket-btn')) {
        const sel = UI.sel[S.view], C = D.c;
        let ss;
        if (sel.size) ss = S.view === 'v' ? A.resultSamples([...sel]) : S.view === 's' ? [...sel] : A.resultSamples(Array.from(A.result).filter((i) => sel.has(C.sp[C.vs[i]])));
        else { ss = lists().s; if (ss.length > 20 && !confirm(t('b_confirm_all', { n: fmt(ss.length) }))) return; }
        A.basketAdd(ss); return;
      }
      if (x.closest('#doi-go')) { S.paper = $('doi-in').value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, ''); refresh(); return; }
      if (x.closest('#batch-go')) { S.batch = A.parseBatchTokens($('batch-text').value).join('|'); refresh(); return; }
      if (x.closest('#batch-clear')) { S.batch = ''; $('batch-text').value = ''; refresh(); return; }
      // 高级查询
      if (x.closest('#adv-add')) { draft().push(newRow('AND')); redrawAdv(); return; }
      if (x.closest('#adv-example')) { UI.draft = EXAMPLE.map((r) => ({ ...r })); redrawAdv(); return; }
      if (x.closest('#adv-clear')) { UI.draft = [newRow()]; S.adv = []; redrawAdv(); refresh(); return; }
      if ((b = q('[data-adel]'))) { draft().splice(+b.dataset.adel, 1); if (!draft().length) draft().push(newRow()); redrawAdv(); return; }
      if ((b = q('[data-conj]'))) { draft()[+b.dataset.conj].c = b.dataset.c; redrawAdv(); return; }
      if ((b = q('[data-swap]'))) {       // 交换相邻两行的条件，连接词（AND / OR / NOT）留在原位置
        const k = +b.dataset.swap, d = draft(), cPrev = d[k - 1].c, cCur = d[k].c;
        [d[k - 1], d[k]] = [d[k], d[k - 1]];
        d[k - 1].c = cPrev; d[k].c = cCur;
        if (k - 1 === 0) delete d[0].c;
        redrawAdv(); return;
      }
      if (x.closest('#adv-run')) { S.adv = cleanDraft(); refresh(); return; }
      if (x.closest('#adv-copy')) { S.adv = cleanDraft(); await refresh(); if (await A.copyText(location.href)) toast(t('a_copied')); return; }
      if (x.closest('#adv-save')) {
        const adv = cleanDraft();
        if (!adv.length) { toast(t('a_none')); return; }
        const list = STORE.get('pdfdb_queries', []);
        list.unshift({ name: $('adv-name').value.trim() || A.advText(adv).slice(0, 40), adv });
        STORE.set('pdfdb_queries', list.slice(0, 30)); toast(t('a_saved_ok')); renderPane(); return;
      }
      if ((b = q('[data-qload]'))) { const list = STORE.get('pdfdb_queries', []), it = list[+b.dataset.qload]; if (it) { UI.draft = it.adv.map((r) => ({ ...r })); S.adv = it.adv; renderPane(); refresh(); } return; }
      if ((b = q('[data-qdel]'))) { const list = STORE.get('pdfdb_queries', []); list.splice(+b.dataset.qdel, 1); STORE.set('pdfdb_queries', list); renderPane(); return; }
      // 菜单
      for (const [bt, p, fill] of [['cols-btn', 'cols-pop', renderColsMenu], ['export-btn', 'export-pop', renderExportMenu]]) {
        if (x.closest('#' + bt)) { e.stopPropagation(); closeMenus(bt); const open = $(p).hidden; if (open) fill(); $(p).hidden = !open; $(bt).setAttribute('aria-expanded', String(open)); return; }
      }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) closeMenus(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });
  }

  async function show(params) {
    A.readSearch(params);
    const tab = params.get('tab');
    if (tab && TABS.some(([k]) => k === tab)) { UI.tab = tab; UI.panel = true; UI.built = ''; saveUI(); }
    if (S.adv.length) UI.draft = S.adv.map((r) => ({ ...r }));
    skeleton();
    syncInputs();
    await refresh(true);
  }
  function rebuild() { UI.built = ''; }
  function focusKeyword() { const q = $('q'); if (q) { q.focus(); q.select(); } }
  function redrawCharts() { if (UI.chart) renderChart(); }
  A.searchView = { show, rebuild, focusKeyword, redrawCharts, valueHTML, methodHTML, sourceHTML, typesHTML, treatText, summaryHTML };
})();
