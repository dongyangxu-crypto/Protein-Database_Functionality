'use strict';
/* PDF —— 检索页以外的页面：首页（风格 A 深色横幅 + 统计仪表盘）、浏览、统计、性质分布页、下载、帮助、更新日志、数据篮、对比、论文页、样品页。 */
(() => {
  const A = window.PDF;
  const { $, esc, t, cat, zh, fmt, pct, clip, num, toast, ic, D, VX, SX, PX } = A;
  const SV = () => A.searchView;
  const hrefSearch = (obj) => { const h = new URLSearchParams(); for (const [k, v] of Object.entries(obj)) if (v !== '' && v !== undefined && v !== null) h.set(k, v); return A.searchHref(h); };
  let redraw = null;
  A.redrawPage = () => { if (redraw) redraw(); };
  const setRedraw = (fn) => { redraw = fn; fn(); };

  // 首页横幅右侧的凝胶网络纹理（logo 的六边形网络 + 天蓝蛋白链，低透明度）
  function heroArt() {
    let lines = '', nodes = '';
    const R = 34, w = Math.sqrt(3) * R;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) {
      const cx = c * w + (r % 2) * w / 2, cy = r * R * 1.5;
      const V = [...Array(6)].map((_, k) => { const a = (-90 + 60 * k) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
      lines += `<path d="M${V.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}Z"/>`;
      if ((r * 7 + c * 3) % 4 === 0) nodes += V.slice(0, 3).map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4"/>`).join('');
    }
    let coil = 'M';
    for (let i = 0; i <= 260; i++) { const tt = i / 260 * 5 * 2 * Math.PI, x = 4.2 * tt - 13 * Math.sin(tt), y = -13 * Math.cos(tt), a = -32 * Math.PI / 180;
      coil += `${(300 + x * Math.cos(a) - y * Math.sin(a)).toFixed(1)} ${(470 + x * Math.sin(a) + y * Math.cos(a)).toFixed(1)}${i < 260 ? 'L' : ''}`; }
    return `<svg class="hero-art" viewBox="0 0 560 520" aria-hidden="true"><g fill="none" stroke="#ffffff" stroke-width="1.6">${lines}</g><g fill="#ffffff">${nodes}</g><path d="${coil}" fill="none" stroke="#7cc8f2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  // 数据来源：一根两段的条（作者原值 / 来源于模型）+ 图例
  function originBar(el) {
    const st = D.stats, W = Math.max(260, el.clientWidth || 320), a = D.nV - st.model, m = st.model;
    const wa = Math.round((W - 2) * a / D.nV), wb = W - 2 - wa, r = Math.min(4, wb);
    el.innerHTML = `<svg viewBox="0 0 ${W} 58" width="${W}" height="58" role="img"><rect class="mark-1" x="0" y="4" width="${wa}" height="18"></rect>
      <path class="mark-2" d="M${wa + 2},4H${W - r}Q${W},4 ${W},${4 + r}V${22 - r}Q${W},22 ${W - r},22H${wa + 2}Z"></path>
      <rect class="mark-1" x="0" y="36" width="10" height="10" rx="2"></rect><text class="cat-text" x="15" y="45">${esc(t('o_author'))} ${fmt(a)}（${pct(a, D.nV)}%）</text>
      <rect class="mark-2" x="${W / 2 + 6}" y="36" width="10" height="10" rx="2"></rect><text class="cat-text" x="${W / 2 + 21}" y="45">${esc(t('badge_model'))} ${fmt(m)}（${pct(m, D.nV)}%）</text></svg>`;
    el._csv = [['data_origin', 'values'], ['author-reported', a], ['model-derived', m]];
  }
  const top = (arr, n, keep = () => true) => [...arr.keys()].filter((c) => arr[c] && keep(c)).sort((a, b) => arr[b] - arr[a]).slice(0, n);
  const EXAMPLES = [
    { zh: '大豆 · 超声 · 溶解度', en: 'Soybean · Ultrasound · Solubility', p: { prop: 'solubility', src: 'Soybean', tt: 'Ultrasound' } },
    { zh: '牛乳 · 加热 · 凝胶性', en: 'Bovine milk · Heating · Gelling', p: { prop: 'gelling', src: 'Milk (bovine)', tt: 'Heating' } },
    { zh: '粒径 · 动态光散射', en: 'Particle size · DLS', p: { prop: 'particle_size', method: 'Dynamic light scattering (DLS)' } },
    { zh: '10.1021/jf103771x', en: '10.1021/jf103771x', p: { paper: '10.1021/jf103771x' } },
  ];
  // 卡片标题；图表的下载按钮（PNG / SVG / 数据 CSV）放在卡片底部右侧
  const cardHead = (title, sub) => `<div class="card-head"><h3>${esc(title)}${sub ? ` <span class="sub">${esc(sub)}</span>` : ''}</h3></div>`;
  const cardFoot = (link, dl) => `<div class="card-foot">${link || ''}${dl ? A.chartDl(dl) : ''}</div>`;

  // ================================================================ 首页 ==
  function renderHome() {
    const el = $('view-home'), st = D.stats, d = D.dict, rel = D.meta.release || {}, L = A.lang();
    const nSrc = st.srcS.filter((x) => x).length, nTT = st.ttS.filter((x) => x).length;
    const fields = ['all', 'prop', 'src', 'tt', 'method', 'journal', 'doi'];
    el.innerHTML = `<section class="hero">${heroArt()}<div class="hero-in">
        <h1>${t('h_title')}</h1>
        <div class="hero-badges"><span>${esc(t('h_ver', { v: rel.version || '' }))}</span><span>${esc(t('h_built', { d: D.meta.built }))}</span><span>${esc(t('h_nprops', { n: D.meta.props.length }))}</span></div>
        <p class="hero-lead">${esc(t('h_lead'))}</p>
        <form class="hero-search" id="hero-form" role="search"><select id="hero-fld" aria-label="${esc(t('fld_all'))}">${fields.map((f) => `<option value="${f}">${esc(t('fld_' + f))}</option>`).join('')}</select>
          <div class="ac"><input id="hero-q" type="search" placeholder="${esc(t('h_ph'))}" aria-label="${esc(t('h_ph'))}"></div><button class="go" type="submit">${ic('search')}${esc(t('h_go'))}</button></form>
        <div class="hero-links"><span class="ex">${esc(t('h_try'))}${EXAMPLES.map((e) => `<a href="${hrefSearch(e.p)}">${esc(e[L])}</a>`).join('')}</span></div>
        <div class="hero-links"><a href="#/search?tab=adv">${esc(t('h_adv'))}</a><a href="#/browse">${esc(t('h_browse'))}</a><a href="#/help">${esc(t('h_help'))}</a></div>
        <div class="hero-stats">${[['doc', D.nP, 'h_papers', hrefSearch({ view: 'p' })], ['flask', D.nS, 'h_samples', hrefSearch({ view: 's' })], ['chart', D.nV, 'h_values', '#/search'],
          ['leaf', nSrc, 'h_sources', '#/browse?tab=src'], ['wave', nTT, 'h_ttypes', '#/browse?tab=tt']].map(([i, n, k, h]) => `<a href="${h}">${ic(i, '')}<b>${fmt(n)}</b><span>${esc(t(k))}</span></a>`).join('')}</div>
      </div></section>
      <div class="wrap page">
        <div class="grid-3">
          <section class="card">${cardHead(t('h_props'), t('h_props_sub'))}<div class="chart-box" id="d-props"></div>${cardFoot(`<a href="#/stats">${esc(t('h_props_more'))}</a>`, 'd-props')}</section>
          <section class="card">${cardHead(t('h_src'), t('h_src_sub'))}<div class="chart-box" id="d-src"></div>${cardFoot(`<a href="#/browse?tab=src">${esc(t('h_src_more', { n: fmt(nSrc) }))}</a>`, 'd-src')}</section>
          <section class="card">${cardHead(t('h_tt'), t('h_tt_sub'))}<div class="chart-box" id="d-tt"></div>${cardFoot(`<a href="#/browse?tab=tt">${esc(t('h_tt_more', { n: fmt(nTT) }))}</a>`, 'd-tt')}</section>
        </div>
        <div class="grid-3 mt">
          <section class="card">${cardHead(t('h_origin'))}<div class="chart-box" id="d-origin" style="min-height:70px"></div><div class="card-body" style="padding-top:0"><p class="cite-box">${esc(t('h_origin_note', { p: pct(st.sd, D.nV) }))}</p></div>${cardFoot('', 'd-origin')}</section>
          <section class="card"><div class="card-head"><h3>${ic('quote')}${esc(t('h_cite'))}</h3></div><div class="card-body"><p class="cite-box">${esc(t('h_cite_text'))}</p>
            <div class="pills"><button class="btn ghost small" type="button" id="cite-copy">${ic('copy')}${esc(t('h_cite_copy'))}</button><button class="btn ghost small" type="button" id="cite-bib">BibTeX</button></div></div></section>
          <section class="card"><div class="card-head"><h3>${ic('clock')}${esc(t('h_versions'))}</h3></div><div class="card-body"><ul class="ver-list">${(D.meta.releases || []).slice(0, 3).map((r) => `<li><b>${esc(r.version)}</b><span>${esc(r.date)}</span><div>${esc(clip(r[L] || r.zh, 70))}</div></li>`).join('')}</ul>
            <div style="margin-top:8px"><a href="#/changelog">${esc(t('h_versions_all'))}</a></div></div></section>
        </div>
        <p class="banner mt">${esc(t('h_contrib'))} <a href="#/help?s=feedback">${esc(t('h_contrib_link'))}</a></p>
      </div>`;
    const go = (key, tok) => { location.hash = hrefSearch({ [key]: tok }); };
    setRedraw(() => {
      PFDCharts.hbar($('d-props'), top(st.propV, 10).map((c) => ({ key: D.meta.props[c], label: A.propName(c), value: st.propV[c] })), { labelWidth: 120, onClick: (k) => go('prop', k), valueFmt: fmt });
      PFDCharts.hbar($('d-src'), top(st.srcS, 10).map((c) => ({ key: d.src[c], label: A.srcLabel(c), value: st.srcS[c] })), { labelWidth: 110, onClick: (k) => go('src', k), valueFmt: fmt });
      PFDCharts.hbar($('d-tt'), top(st.ttS, 10, (c) => !A.isRoutine(c)).map((c) => ({ key: d.tt[c], label: A.ttLabel(c), value: st.ttS[c] })), { labelWidth: 130, onClick: (k) => go('tt', k), valueFmt: fmt });
      originBar($('d-origin'));
    });
    const fld = $('hero-fld'), q = $('hero-q');
    const pick = (it) => { location.hash = it.type === 'doi' ? hrefSearch({ paper: it.tok }) : hrefSearch({ [it.key]: it.tok }); };
    const submit = (text) => {
      const f = fld.value;
      if (!text) { location.hash = '#/search'; return; }
      if (f === 'doi' || /^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,9}\//i.test(text)) { location.hash = hrefSearch({ paper: text.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') }); return; }
      if (f !== 'all') { const it = A.acSearch(text, f)[0]; if (it) { pick(it); return; } }
      location.hash = hrefSearch({ q: text });
    };
    A.attachAC(q, { only: () => (fld.value === 'all' ? null : fld.value), onPick: pick, onEnter: submit });
    $('hero-form').onsubmit = (e) => { e.preventDefault(); submit(q.value.trim()); };
    const citeText = () => `PDF · Protein Database of Functionality (${t('h_ver', { v: rel.version || '' })}). ${location.href.split('#')[0]} (${new Date().toISOString().slice(0, 10)}).`;
    $('cite-copy').onclick = async () => { if (await A.copyText(citeText())) toast(t('copied')); };
    $('cite-bib').onclick = async () => { if (await A.copyText(`@misc{pdfdb,\n  title = {PDF: Protein Database of Functionality},\n  note = {Version ${rel.version || ''}},\n  url = {${location.href.split('#')[0]}},\n  urldate = {${new Date().toISOString().slice(0, 10)}}\n}\n`)) toast(t('copied')); };
  }

  // ================================================================ 浏览 ==
  function renderBrowse(params) {
    const el = $('view-browse'), st = D.stats, d = D.dict, tab = ['prop', 'src', 'tt', 'method', 'journal'].includes(params.get('tab')) ? params.get('tab') : 'prop';
    const az = params.get('sort') === 'az';
    const item = (href, label, right, ratio, sub) => `<a class="bitem" href="${href}"><div class="t">${esc(label)}<span>${esc(right)}</span></div><div class="bar"><i style="width:${Math.max(2, ratio * 100).toFixed(1)}%"></i></div>${sub ? `<div class="s">${esc(sub)}</div>` : ''}</a>`;
    const sortCodes = (codes, n, label) => codes.sort(az ? (a, b) => label(a).localeCompare(label(b)) : (a, b) => n[b] - n[a]);
    let body = '';
    if (tab === 'prop') {
      const rows = top(st.propV, 99).map((c) => {
        const units = [...st.propUnit[c].entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([u]) => d.unit[u] || t('no_unit')).join(' · ');
        return `<tr><td><b>${esc(A.propName(c))}</b><div class="dim">${esc(A.lang() === 'zh' ? A.X.PROP_NAMES[D.meta.props[c]][1] : A.X.PROP_NAMES[D.meta.props[c]][0])}</div></td>
          <td class="tnum">${fmt(st.propV[c])}</td><td class="tnum">${fmt(st.propS[c])}</td><td class="tnum">${fmt(st.propP[c])}</td><td class="tnum">${pct(st.propModel[c], st.propV[c])}%</td>
          <td class="tnum">${pct(st.propSD[c], st.propV[c])}%</td><td>${esc(units)}</td>
          <td><div class="actions"><a class="btn small" href="${hrefSearch({ prop: D.meta.props[c] })}">${esc(t('br_search'))}</a><a class="btn ghost small" href="${A.propHref(D.meta.props[c])}">${esc(t('br_dist'))}</a></div></td></tr>`;
      }).join('');
      body = `<div class="mini-wrap"><table class="mini ptable"><thead><tr><th>${esc(t('f_prop'))}</th><th>${esc(t('h_values'))}</th><th>${esc(t('h_samples'))}</th><th>${esc(t('h_papers'))}</th><th>${esc(t('k_model'))}</th><th>${esc(t('k_sd'))}</th><th>${esc(t('br_units'))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    } else if (tab === 'src') {
      const byCat = new Map();
      d.src.forEach((v, c) => { if (!st.srcS[c]) return; const k = st.srcCat[c]; if (!byCat.has(k)) byCat.set(k, []); byCat.get(k).push(c); });
      const cats = [...byCat.keys()].sort((a, b) => st.pcatS[b] - st.pcatS[a]), max = Math.max(...st.srcS);
      body = cats.map((k) => `<div class="bgroup"><h3>${esc(cat(d.pcat[k]))} <span class="dim">${esc(t('n_samples', { n: fmt(st.pcatS[k]) }))}</span></h3><div class="bitems">${sortCodes(byCat.get(k), st.srcS, A.srcLabel).map((c) =>
        item(hrefSearch({ src: d.src[c] }), A.srcLabel(c), fmt(st.srcS[c]), st.srcS[c] / max, `${A.lang() === 'zh' ? d.src[c] + ' · ' : ''}${t('br_n', { v: fmt(st.srcV[c]), s: fmt(st.srcS[c]), p: fmt(st.srcP[c]) })}`)).join('')}</div></div>`).join('');
    } else if (tab === 'tt') {
      const mod = [], rout = [];
      d.tt.forEach((v, c) => { if (st.ttS[c]) (A.isRoutine(c) ? rout : mod).push(c); });
      const max = Math.max(...st.ttS);
      const grp = (title, codes) => `<div class="bgroup"><h3>${esc(title)} <span class="dim">${codes.length}</span></h3><div class="bitems">${sortCodes(codes, st.ttS, A.ttLabel).map((c) =>
        item(hrefSearch({ tt: d.tt[c] }), A.ttLabel(c), fmt(st.ttS[c]), st.ttS[c] / max, `${A.lang() === 'zh' ? d.tt[c] + ' · ' : ''}${t('br_n', { v: fmt(st.ttV[c]), s: fmt(st.ttS[c]), p: fmt(st.ttP[c]) })}`)).join('')}</div></div>`;
      body = grp(t('br_mod'), mod) + grp(t('br_routine'), rout);
    } else if (tab === 'method') {
      body = `<p class="hint" style="margin:0 0 12px">${esc(t('br_method_note'))}</p>` + top(st.propV, 99).map((c) => {
        const ms = [...st.propMethod[c].entries()].filter(([m]) => m >= 3).sort((a, b) => b[1] - a[1]);
        const max = ms.length ? ms[0][1] : 1;
        return `<div class="bgroup"><h3>${esc(A.propName(c))} <span class="dim">${esc(t('n_values', { n: fmt(st.propV[c]) }))}</span></h3><div class="bitems">${ms.slice(0, 12).map(([m, n]) =>
          item(hrefSearch({ prop: D.meta.props[c], method: d.method[m][0] }), A.methodName(m), fmt(n), n / max, A.lang() === 'zh' ? d.method[m][0] : '')).join('')}</div></div>`;
      }).join('');
    } else {
      const codes = sortCodes(d.journal.map((_, c) => c).filter((c) => st.journalP[c]), st.journalP, (c) => d.journal[c]), max = Math.max(...st.journalP);
      body = `<div class="bitems">${codes.map((c) => item(hrefSearch({ journal: d.journal[c] }), d.journal[c] || t('unknown'), t('n_papers', { n: fmt(st.journalP[c]) }), st.journalP[c] / max, t('n_values', { n: fmt(st.journalV[c]) }))).join('')}</div>`;
    }
    const tabs = [['prop', 'br_tab_prop'], ['src', 'br_tab_src'], ['tt', 'br_tab_tt'], ['method', 'br_tab_method'], ['journal', 'br_tab_journal']];
    const sortable = tab === 'src' || tab === 'tt' || tab === 'journal';
    el.innerHTML = `<div class="wrap page"><div class="panel"><div class="panel-head"><div class="page-title">${ic('grid')}<h1>${esc(t('br_title'))}</h1></div><p class="page-sub">${esc(t('br_sub'))}</p></div>
      <div class="tabbar" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === tab}" onclick="location.hash='#/browse?tab=${k}${az ? '&sort=az' : ''}'">${esc(t(l))}</button>`).join('')}</div>
      <div class="pane">${sortable ? `<div class="actions" style="margin-bottom:12px"><span class="seg"><button type="button" aria-pressed="${!az}" onclick="location.hash='#/browse?tab=${tab}'">${esc(t('br_sort_n'))}</button><button type="button" aria-pressed="${az}" onclick="location.hash='#/browse?tab=${tab}&sort=az'">${esc(t('br_sort_az'))}</button></span></div>` : ''}${body}</div></div></div>`;
    redraw = null;
  }

  // ================================================================ 统计 ==
  function renderStats() {
    const el = $('view-stats'), st = D.stats, d = D.dict;
    const nSrc = st.srcS.filter((x) => x).length, nTT = st.ttS.filter((x) => x).length, nM = st.methodV.filter((x, c) => x && c >= 3).length;
    const kpi = (lbl, v, note) => `<div class="kpi"><div class="lbl">${esc(lbl)}</div><div class="val">${v}</div>${note ? `<div class="note">${esc(note)}</div>` : ''}</div>`;
    const charts = [['st-props', 'st_props'], ['st-model', 'st_model'], ['st-src', 'st_src'], ['st-tt', 'st_tt'], ['st-mt', 'st_mt'], ['st-pcat', 'st_pcat'],
      ['st-form', 'st_form'], ['st-tcat', 'st_tcat'], ['st-sd', 'st_sd'], ['st-jr', 'st_jr'], ['st-sys', 'st_sys']];
    el.innerHTML = `<div class="wrap page"><div class="page-title">${ic('chart')}<h1>${esc(t('st_title'))}</h1></div><p class="page-sub">${esc(t('st_sub'))}</p>
      <div class="kpis mt">${kpi(t('h_papers'), fmt(D.nP))}${kpi(t('h_samples'), fmt(D.nS))}${kpi(t('h_values'), fmt(D.nV))}${kpi(t('k_methods'), fmt(D.meta.methods))}
        ${kpi(t('h_sources'), fmt(nSrc))}${kpi(t('h_ttypes'), fmt(nTT))}${kpi(t('k_mnames'), fmt(nM))}${kpi(t('k_journals'), fmt(st.journalP.filter((x) => x).length))}
        ${kpi(t('k_model'), pct(st.model, D.nV) + '%', fmt(st.model))}${kpi(t('k_sd'), pct(st.sd, D.nV) + '%', fmt(st.sd))}</div>
      <div class="grid-2 mt">${charts.map(([id, k]) => `<section class="card">${cardHead(t(k))}<div class="chart-box" id="${id}"></div>${cardFoot('', id)}</section>`).join('')}</div></div>`;
    const go = (key, tok) => { location.hash = hrefSearch({ [key]: tok }); };
    const P = D.meta.props, pcFmt = (v) => v.toFixed(1) + '%';
    setRedraw(() => {
      PFDCharts.hbar($('st-props'), top(st.propV, 99).map((c) => ({ key: P[c], label: A.propName(c), value: st.propV[c] })), { labelWidth: 150, onClick: (k) => go('prop', k), valueFmt: fmt, csvValue: 'values' });
      PFDCharts.hbar($('st-model'), top(st.propV, 99).map((c) => ({ key: P[c], label: A.propName(c), value: st.propModel[c] / st.propV[c] * 100 })).sort((a, b) => b.value - a.value), { labelWidth: 150, valueFmt: pcFmt, csvValue: 'percent' });
      PFDCharts.hbar($('st-sd'), top(st.propV, 99).map((c) => ({ key: P[c], label: A.propName(c), value: st.propSD[c] / st.propV[c] * 100 })).sort((a, b) => b.value - a.value), { labelWidth: 150, valueFmt: pcFmt, csvValue: 'percent' });
      PFDCharts.hbar($('st-src'), top(st.srcS, 20).map((c) => ({ key: d.src[c], label: A.srcLabel(c), value: st.srcS[c] })), { labelWidth: 150, onClick: (k) => go('src', k), valueFmt: fmt, csvValue: 'samples' });
      PFDCharts.hbar($('st-tt'), top(st.ttS, 20, (c) => !A.isRoutine(c)).map((c) => ({ key: d.tt[c], label: A.ttLabel(c), value: st.ttS[c] })), { labelWidth: 170, onClick: (k) => go('tt', k), valueFmt: fmt, csvValue: 'samples' });
      PFDCharts.hbar($('st-mt'), top(st.methodV, 20, (c) => c >= 3 && d.method[c][0] !== 'Other method').map((c) => ({ key: d.method[c][0], label: A.methodName(c), value: st.methodV[c] })), { labelWidth: 200, onClick: (k) => go('method', k), valueFmt: fmt, csvValue: 'values' });
      PFDCharts.hbar($('st-pcat'), top(st.pcatS, 99).map((c) => ({ key: d.pcat[c], label: cat(d.pcat[c]), value: st.pcatS[c] })), { labelWidth: 150, onClick: (k) => go('pcat', k), valueFmt: fmt, csvValue: 'samples' });
      PFDCharts.hbar($('st-form'), top(st.formS, 99).map((c) => ({ key: d.form[c] || '-', label: A.formLabel(c), value: st.formS[c] })), { labelWidth: 170, onClick: (k) => go('form', k), valueFmt: fmt, csvValue: 'samples' });
      PFDCharts.hbar($('st-tcat'), top(st.tcatS, 99).map((c) => ({ key: A.TCAT_NAMES[c], label: cat(A.TCAT_NAMES[c]), value: st.tcatS[c] })), { labelWidth: 120, onClick: (k) => go('tcat', k), valueFmt: fmt, csvValue: 'samples' });
      PFDCharts.hbar($('st-jr'), top(st.journalP, 99).map((c) => ({ key: d.journal[c], label: d.journal[c] || t('unknown'), value: st.journalP[c] })), { labelWidth: 240, onClick: (k) => go('journal', k), valueFmt: fmt, csvValue: 'papers' });
      PFDCharts.hbar($('st-sys'), top(st.sysS, 99).map((c) => ({ key: d.sys[c], label: cat(d.sys[c]), value: st.sysS[c] })), { labelWidth: 150, onClick: (k) => go('sys', k), valueFmt: fmt, csvValue: 'samples' });
    });
  }

  // ================================================================ 性质分布页 ==
  async function renderProperty(params) {
    const el = $('view-property'), C = D.c, d = D.dict, st = D.stats;
    let pc = D.meta.props.indexOf(params.get('prop') || 'solubility');
    if (pc < 0) pc = 0;
    const srcTok = params.get('src') || '', ttTok = params.get('tt') || '';
    const sc = srcTok ? d.src.indexOf(srcTok) : -1, tc = ttTok ? d.tt.indexOf(ttTok) : -1;
    const opt = { median: params.get('median') !== '0', sort: params.get('sort') === 'median', origin: params.get('origin') === '1' };
    const idx = [];
    for (let i = 0; i < D.nV; i++) {
      if (C.vp[i] !== pc) continue;
      const s = C.vs[i];
      if (sc >= 0 && !A.srcOf(s).includes(sc)) continue;
      if (tc >= 0 && !A.ttOf(s).includes(tc)) continue;
      idx.push(i);
    }
    const samples = A.resultSamples(idx), papers = A.resultPapers(idx);
    const uc = new Map(), mc = new Map();
    let nModel = 0;
    for (const i of idx) { if (D.veff[i] === D.veff[i]) uc.set(C.vu[i], (uc.get(C.vu[i]) || 0) + 1); mc.set(C.vm[i], (mc.get(C.vm[i]) || 0) + 1); nModel += C.vo[i] & 1; }
    const units = [...uc.entries()].sort((a, b) => b[1] - a[1]);
    let unit = units.length ? units[0][0] : -1;
    const up = params.get('unit');
    if (up !== null) { const u = d.unit.indexOf(up === '-' ? '' : up); if (uc.has(u)) unit = u; }
    const unitLbl = unit >= 0 ? (d.unit[unit] || t('no_unit')) : '';
    const plotted = idx.filter((i) => C.vu[i] === unit && D.veff[i] === D.veff[i]);
    const byP = new Map();
    for (const i of plotted) { const p = C.sp[C.vs[i]]; if (!byP.has(p)) byP.set(p, []); byP.get(p).push(i); }
    const q = PFDCharts.quantile, med = (arr) => q(arr.map((i) => D.veff[i]).sort((a, b) => a - b), 0.5);
    let groups = [...byP.entries()].sort((a, b) => b[1].length - a[1].length);
    const MAXG = 30, cut = groups.length > MAXG;
    groups = groups.slice(0, MAXG);
    if (opt.sort) groups.sort((a, b) => med(a[1]) - med(b[1]));
    const self = (o) => { const h = new URLSearchParams(); h.set('prop', D.meta.props[pc]); if (srcTok) h.set('src', srcTok); if (ttTok) h.set('tt', ttTok);
      const u = o.unit !== undefined ? o.unit : (unit >= 0 && units.length && unit !== units[0][0] ? (d.unit[unit] || '-') : null); if (u !== null && u !== undefined) h.set('unit', u);
      const m = o.median ?? opt.median, so = o.sort ?? opt.sort, or = o.origin ?? opt.origin; if (!m) h.set('median', '0'); if (so) h.set('sort', 'median'); if (or) h.set('origin', '1'); return '#/property?' + h; };
    const title = [A.propName(pc), sc >= 0 ? A.srcLabel(sc) : '', tc >= 0 ? A.ttLabel(tc) : ''].filter(Boolean).join(' · ');
    const srcOpts = top(st.srcS, 80), ttOpts = top(st.ttS, 99, (c) => !A.isRoutine(c));
    const sel = (id, items, cur, label) => `<label class="lbl-inline">${esc(label)} <select id="${id}">${items}</select></label>`;
    const sumRow = (arr) => { const v = arr.map((i) => D.veff[i]).sort((a, b) => a - b); return [v.length, v[0], q(v, 0.25), q(v, 0.5), q(v, 0.75), v[v.length - 1]]; };
    const methods = [...mc.entries()].sort((a, b) => b[1] - a[1]);
    el.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/">${esc(t('nav_home'))}</a> / <a href="#/browse">${esc(t('nav_browse'))}</a> / ${esc(t('pp_prop'))}</div>
      <div class="page-head"><div><h1>${esc(t('pp_title', { x: title }))}</h1>
        <div class="stat-line" style="margin-top:8px"><span>${t('br_n', { v: `<b>${fmt(idx.length)}</b>`, s: `<b>${fmt(samples.length)}</b>`, p: `<b>${fmt(papers.length)}</b>`})}</span>
          <span>${esc(t('pp_origin'))}: ${esc(t('o_author'))} <b>${fmt(idx.length - nModel)}</b> · ${esc(t('badge_model'))} <b>${fmt(nModel)}</b></span></div></div>
        <div class="actions"><a class="btn small" href="${hrefSearch({ prop: D.meta.props[pc], src: srcTok, tt: ttTok })}">${ic('search')}${esc(t('pp_in_search'))}</a>
          <button class="btn ghost small" type="button" id="pp-basket">${ic('cart')}${esc(t('pp_basket'))}</button>
          <button class="btn ghost small" type="button" id="pp-csv">${ic('download')}CSV</button><button class="btn ghost small" type="button" id="pp-xlsx">Excel</button>
          <button class="btn ghost small" type="button" id="pp-copy">${ic('link')}${esc(t('pp_copy'))}</button></div></div>
      <div class="panel"><div class="pane"><div class="pselect">
        ${sel('pp-prop', D.meta.props.map((p, c) => `<option value="${p}" ${c === pc ? 'selected' : ''}>${esc(A.propName(c))}</option>`).join(''), pc, t('pp_prop'))}
        ${sel('pp-src', `<option value="">${esc(t('pp_any'))}</option>` + srcOpts.map((c) => `<option value="${esc(d.src[c])}" ${c === sc ? 'selected' : ''}>${esc(A.srcLabel(c))} (${fmt(st.srcS[c])})</option>`).join(''), sc, t('pp_src'))}
        ${sel('pp-tt', `<option value="">${esc(t('pp_any'))}</option>` + ttOpts.map((c) => `<option value="${esc(d.tt[c])}" ${c === tc ? 'selected' : ''}>${esc(A.ttLabel(c))} (${fmt(st.ttS[c])})</option>`).join(''), tc, t('pp_tt'))}
        ${units.length ? sel('pp-unit', units.map(([u, n]) => `<option value="${esc(d.unit[u] || '-')}" ${u === unit ? 'selected' : ''}>${esc(d.unit[u] || t('no_unit'))} (${fmt(n)})</option>`).join(''), unit, t('pp_unit')) : ''}
        <label class="lbl-inline"><input type="checkbox" id="pp-med" ${opt.median ? 'checked' : ''}> ${esc(t('pp_median'))}</label>
        <label class="lbl-inline"><input type="checkbox" id="pp-sort" ${opt.sort ? 'checked' : ''}> ${esc(t('pp_sort'))}</label>
        <label class="lbl-inline"><input type="checkbox" id="pp-orig" ${opt.origin ? 'checked' : ''}> ${esc(t('pp_byorigin'))}</label></div>
        <div class="stat-line" style="margin-top:12px"><span>${esc(t('pp_methods'))}:</span>${methods.slice(0, 10).map(([m, n]) => `<span class="chip">${esc(A.methodName(m))} <b>${fmt(n)}</b></span>`).join('')}</div></div></div>
      <section class="card mt">${cardHead(t('pp_chart'), unitLbl ? t('pp_unit_note', { u: unitLbl, n: fmt(plotted.length) }) : '')}
        ${opt.origin ? `<div class="legend" style="padding-top:8px"><span><i style="background:var(--series-1)"></i>${esc(t('o_author'))}</span><span><i class="ring"></i>${esc(t('o_model'))}</span></div>` : ''}
        <div class="chart-box" id="pp-chart"></div>${cut ? `<div class="chart-note">${esc(t('pp_more_groups', { n: MAXG }))}</div>` : ''}${cardFoot('', 'pp-chart')}</section>
      <div class="mt">
        <details class="fold" open><summary>${esc(t('pp_sum'))}</summary><div class="fold-body"><div class="mini-wrap"><table class="mini data-table"><thead><tr><th>${esc(t('pp_paper'))}</th><th>n</th><th>min</th><th>${esc(t('q1'))}</th><th>${esc(t('median'))}</th><th>${esc(t('q3'))}</th><th>max</th></tr></thead>
          <tbody>${plotted.length ? `<tr><td><b>${esc(t('all'))}</b> (${esc(unitLbl)})</td>${sumRow(plotted).map((x) => `<td class="n">${esc(PFDCharts.fmt(x))}</td>`).join('')}</tr>` : ''}${groups.map(([p, arr]) => `<tr><td><a href="${A.paperHref(p)}">${esc(D.doi[p])}</a></td>${sumRow(arr).map((x) => `<td class="n">${esc(PFDCharts.fmt(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></details>
        <details class="fold" data-lazy="msum"><summary>${esc(t('pp_msum'))}</summary><div class="fold-body">${esc(t('loading'))}</div></details>
        <details class="fold" data-lazy="treat"><summary>${esc(t('pp_treat'))}</summary><div class="fold-body">${esc(t('loading'))}</div></details>
        <details class="fold" data-lazy="raw"><summary>${esc(t('pp_raw', { n: fmt(idx.length) }))}</summary><div class="fold-body">${esc(t('loading'))}</div></details>
      </div></div>`;
    const label = (p) => { let s = D.doi[p].split('/').slice(1).join('/'); if (s.startsWith('acs.')) s = s.slice(4); return s; };
    setRedraw(() => PFDCharts.strip($('pp-chart'), groups.map(([p, arr]) => ({ key: String(p), label: label(p), sub: 'n = ' + arr.length,
      values: arr.map((i) => ({ v: D.veff[i], m: C.vo[i] & 1, tip: `<b>${esc(PFDCharts.fmt(D.veff[i]))} ${esc(unitLbl)}</b>${C.vo[i] & 1 ? ' · ' + esc(t('badge_model')) : ''}<br>${esc(A.srcOf(C.vs[i]).map(A.srcLabel).join(' · '))}<br>${esc(D.doi[p])}` })) })),
      { yLabel: `${A.propName(pc)}${unitLbl ? ' (' + unitLbl + ')' : ''}`, median: opt.median, byOrigin: opt.origin, empty: t('pp_none'), onClick: (k) => { location.hash = A.paperHref(+k); } }));
    const go = (o) => { location.hash = self(o); };
    $('pp-prop').onchange = (e) => { const h = new URLSearchParams(); h.set('prop', e.target.value); if (srcTok) h.set('src', srcTok); if (ttTok) h.set('tt', ttTok); location.hash = '#/property?' + h; };
    $('pp-src').onchange = (e) => { const h = new URLSearchParams(); h.set('prop', D.meta.props[pc]); if (e.target.value) h.set('src', e.target.value); if (ttTok) h.set('tt', ttTok); location.hash = '#/property?' + h; };
    $('pp-tt').onchange = (e) => { const h = new URLSearchParams(); h.set('prop', D.meta.props[pc]); if (srcTok) h.set('src', srcTok); if (e.target.value) h.set('tt', e.target.value); location.hash = '#/property?' + h; };
    if ($('pp-unit')) $('pp-unit').onchange = (e) => go({ unit: e.target.value });
    $('pp-med').onchange = (e) => go({ median: e.target.checked });
    $('pp-sort').onchange = (e) => go({ sort: e.target.checked });
    $('pp-orig').onchange = (e) => go({ origin: e.target.checked });
    $('pp-basket').onclick = () => { if (samples.length > 20 && !confirm(t('b_confirm_all', { n: fmt(samples.length) }))) return; A.basketAdd(samples); };
    const dl = async (kind) => { if (!(await A.prepareChunks([...idx.map((i) => A.chunkOf(4, i)), ...papers.map((p) => A.chunkOf(0, p))], idx.length))) return;
      await A.saveTable(A.valueTable(idx), 'pdfdb_' + D.meta.props[pc], kind, [{ name: 'methods', rows: A.methodSheet(papers) }]); };
    $('pp-csv').onclick = () => dl('csv').catch((e) => toast(t('load_fail', { e: e.message || e })));
    $('pp-xlsx').onclick = () => dl('xlsx').catch((e) => toast(t('load_fail', { e: e.message || e })));
    $('pp-copy').onclick = async () => { if (await A.copyText(location.href)) toast(t('copied')); };
    el.querySelectorAll('details[data-lazy]').forEach((det) => det.addEventListener('toggle', async () => {
      if (!det.open || det.dataset.done) return;
      det.dataset.done = '1';
      const body = det.querySelector('.fold-body'), kind = det.dataset.lazy;
      try {
        if (kind === 'msum') {
          await A.ensurePapers(papers);
          const out = [];
          for (const p of papers) for (const m of PX(p, 'methods') || []) if (m[1] === pc) out.push([p, m]);
          const show = (n) => out.slice(0, n).map(([p, m]) => `<div class="method-item" style="margin-bottom:8px"><div class="head"><b>${esc(A.methodName(m[2]))}</b><a class="dim" href="${A.paperHref(p)}">${esc(D.doi[p])} · ${esc(m[0])}</a></div>${SV().summaryHTML(m)}</div>`).join('');
          body.innerHTML = out.length ? show(40) + (out.length > 40 ? `<button class="link" type="button" id="msum-all">${esc(t('pp_show_more', { n: fmt(out.length) }))}</button>` : '') : `<div class="dim">${esc(t('pp_none'))}</div>`;
          if ($('msum-all')) $('msum-all').onclick = () => { body.innerHTML = show(out.length); };
        } else if (kind === 'treat') {
          const ss = samples.slice(0, 150);
          await A.ensureSamples(ss); await A.ensurePapers(ss.map((s) => C.sp[s]));
          body.innerHTML = `<div class="mini-wrap"><table class="mini"><thead><tr><th>${esc(t('col_sample'))}</th><th>${esc(t('col_treat'))}</th><th>${esc(t('col_paper'))}</th></tr></thead><tbody>${ss.map((s) => `<tr><td><a href="${A.sampleHref(s)}">${esc(A.sampleName(s))}</a></td><td><div>${esc(SV().treatText(s))}</div><div>${SV().typesHTML(s, 6)}</div></td><td class="dim">${esc(D.doi[C.sp[s]])}</td></tr>`).join('')}</tbody></table></div>${samples.length > 150 ? `<p class="hint">${esc(t('pp_shown', { n: 150 }))}</p>` : ''}`;
        } else {
          const vv = idx.slice(0, 300);
          await A.ensureValues(vv); await A.ensureSamples(vv.map((i) => C.vs[i]));
          body.innerHTML = `<div class="mini-wrap"><table class="mini"><thead><tr><th>${esc(t('col_sample'))}</th><th>${esc(t('col_measure'))}</th><th>${esc(t('col_value'))}</th><th>${esc(t('col_method'))}</th><th>${esc(t('col_source'))}</th></tr></thead><tbody>${vv.map((i) => `<tr><td><a href="${A.sampleHref(C.vs[i])}">${esc(A.sampleName(C.vs[i]))}</a></td><td>${esc(VX(i, 'name'))}</td><td class="val">${SV().valueHTML(i, true)}</td><td>${SV().methodHTML(i, false)}</td><td>${SV().sourceHTML(i, true)}</td></tr>`).join('')}</tbody></table></div>${idx.length > 300 ? `<p class="hint">${esc(t('pp_shown', { n: 300 }))} · <a href="${hrefSearch({ prop: D.meta.props[pc], src: srcTok, tt: ttTok })}">${esc(t('pp_in_search'))}</a></p>` : ''}`;
        }
      } catch (e) { body.textContent = t('load_fail', { e: e.message || e }); }
    }));
  }

  // ================================================================ 下载 ==
  const KEY_COLS = {
    papers: 'doi, title, journal', samples: 'sample_id, sample_name, protein_source(_std), protein_form(_std), protein_category, ingredients_summary, treatment_summary, treatment_types, system',
    ingredients: 'sample_id, name, category, amount', treatments: 'sample_id, step_no, treatment_method, category, treatment_type, temperature_c, time_min, ph, pressure_mpa, power_w, frequency_khz',
    treatment_params: 'sample_id, step_no, name, value, unit', measurements: 'measurement_id, sample_id, property, measure_name, value, sd, unit, value_std, unit_std, test_method, data_origin',
    measurement_conditions: 'measurement_id, name, value, unit', methods: 'doi, method_id, property, test_method(_en), method_summary, reference, instrument, applies_to',
    flat_measurements: '…',
  };
  async function renderDownload() {
    const el = $('view-download'), rel = D.meta.release || {};
    el.innerHTML = `<div class="wrap page"><div class="page-title">${ic('download')}<h1>${esc(t('dl_title'))}</h1></div><p class="page-sub">${esc(t('dl_sub'))}</p><div id="dl-body" class="mt">${esc(t('loading'))}</div></div>`;
    let man;
    try {
      const ver = document.querySelector('meta[name="data-version"]')?.content || '';
      const res = await fetch('data/download/manifest.json?v=' + ver, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      man = await res.json();
    } catch (e) { $('dl-body').innerHTML = `<div class="card empty-state">${esc(t('dl_manifest_fail', { e: e.message || e }))}</div>`; return; }
    const hash = (h) => `<span class="hash">${esc(h)}</span><button class="copy" type="button" data-copy="${esc(h)}">${esc(t('copy'))}</button>`;
    const repo = A.repoUrl();
    $('dl-body').innerHTML = `<section class="card"><div class="dl-all"><div style="flex:1;min-width:240px"><div class="big">${esc(t('dl_all'))}</div><div class="dim">${esc(t('dl_all_sub'))} · protein_db_csv.zip · ${esc(A.bytes(man.all.bytes))} · ${esc(t('h_ver', { v: rel.version || '' }))} · ${esc(t('h_built', { d: man.built }))}</div>
        <div style="margin-top:4px">SHA-256 ${hash(man.all.sha256)}</div></div><a class="btn" href="${esc(man.all.path)}" download>${ic('download')}${esc(t('dl_btn'))}</a></div></section>
      <section class="card mt"><div class="card-head"><h3>${esc(t('dl_tables'))}</h3></div><div class="card-body"><div class="mini-wrap"><table class="mini"><thead><tr><th>${esc(t('dl_th_file'))}</th><th>${esc(t('dl_th_row'))}</th><th>${esc(t('dl_th_cols'))}</th><th>${esc(t('dl_th_rows'))}</th><th>${esc(t('dl_th_size'))}</th><th>${esc(t('dl_th_hash'))}</th><th></th></tr></thead>
        <tbody>${man.files.map((f) => `<tr><td><b>${esc(f.table)}.csv</b><div class="dim">${esc(t('ex_cols_all', { n: f.cols }))}</div></td><td>${esc(t('tb_' + f.table))}</td><td class="dim">${esc(KEY_COLS[f.table] || '')}</td><td class="tnum">${fmt(f.rows)}</td><td class="tnum">${esc(A.bytes(f.bytes))}</td><td style="max-width:230px">${hash(f.sha256)}</td><td><a class="btn ghost small" href="${esc(f.path)}" download>${ic('download')}${esc(t('dl_btn'))}</a></td></tr>`).join('')}</tbody></table></div>
        <p class="hint">${esc(t('dl_fields'))} <a href="#/help?s=fields">${esc(t('dl_fields_link'))}</a></p></div></section>
      <div class="grid-2 mt">
        <section class="card"><div class="card-head"><h3>${esc(t('dl_custom'))}</h3></div><div class="card-body"><p class="cite-box">${esc(t('dl_custom_text'))}</p><div style="margin-top:10px"><a class="btn small" href="#/search">${esc(t('dl_go_search'))}</a></div></div></section>
        <section class="card"><div class="card-head"><h3>${esc(t('dl_history'))}</h3></div><div class="card-body"><ul class="ver-list">${(D.meta.releases || []).map((r) => `<li><b>${esc(r.version)}</b><span>${esc(r.date)}</span><div>${esc(clip(r[A.lang()] || r.zh, 80))}</div></li>`).join('')}</ul>
          <p class="hint">${esc(t('dl_history_text'))}${repo ? ` <a href="${esc(repo)}/commits/main" target="_blank" rel="noopener">GitHub</a>` : ''}</p>
          <p class="hint">${esc(t('dl_verify'))} <code>certutil -hashfile protein_db_csv.zip SHA256</code> · macOS / Linux: <code>shasum -a 256 protein_db_csv.zip</code></p></div></section>
      </div>`;
    $('dl-body').onclick = async (e) => { const b = e.target.closest('[data-copy]'); if (b && await A.copyText(b.dataset.copy)) toast(t('copied')); };
  }

  // ================================================================ 帮助、更新日志 ==
  function renderHelp(params) {
    const el = $('view-help'), secs = A.X.HELP[A.lang()] || A.X.HELP.zh;
    el.innerHTML = `<div class="wrap page"><div class="page-title">${ic('help')}<h1>${esc(t('nav_help'))}</h1></div>
      <div class="help mt"><nav class="card toc" aria-label="${esc(t('nav_help'))}">${secs.map(([id, title]) => `<a href="#/help?s=${id}">${esc(title)}</a>`).join('')}<a href="#/changelog">${esc(t('nav_changelog'))}</a></nav>
        <div class="card help-body">${secs.map(([id, title, html]) => `<section id="help-${id}"><h2>${esc(title)}</h2>${html}</section>`).join('')}</div></div></div>`;
    const s = params.get('s');
    if (s && $('help-' + s)) setTimeout(() => $('help-' + s).scrollIntoView({ block: 'start' }), 0);
    redraw = null;
  }
  function renderChangelog() {
    $('view-changelog').innerHTML = `<div class="wrap page"><div class="page-title">${ic('clock')}<h1>${esc(t('cl_title'))}</h1></div><p class="page-sub">${esc(t('cl_sub'))}</p>
      <div class="card mt"><div class="card-body" style="padding:22px 26px"><ul class="timeline">${(D.meta.releases || []).map((r) => `<li><span class="v">${esc(t('h_ver', { v: r.version }))}</span><span class="d">${esc(r.date)}</span><p>${esc(r[A.lang()] || r.zh)}</p></li>`).join('')}</ul></div></div></div>`;
    redraw = null;
  }

  // ================================================================ 数据篮、对比 ==
  const BK = { sel: new Set() };
  async function renderBasket() {
    const el = $('view-basket'), ss = A.basketSamples();
    redraw = null;
    const head = `<div class="page-title">${ic('cart')}<h1>${esc(t('bk_title'))}</h1></div><p class="page-sub">${esc(t('bk_sub'))}</p>`;
    if (!ss.length) { el.innerHTML = `<div class="wrap page">${head}<div class="card empty-state mt">${esc(t('bk_empty'))}</div></div>`; return; }
    el.innerHTML = `<div class="wrap page">${head}<div class="card empty-state mt">${esc(t('loading'))}</div></div>`;
    await A.ensureSamples(ss); await A.ensurePapers(ss.map((s) => D.c.sp[s]));
    const keys = new Set(ss);
    for (const s of [...BK.sel]) if (!keys.has(s)) BK.sel.delete(s);
    const nV = ss.reduce((a, s) => a + D.vFirst[s + 1] - D.vFirst[s], 0);
    const propsOf = (s) => { const m = new Map(); for (let i = D.vFirst[s]; i < D.vFirst[s + 1]; i++) m.set(D.c.vp[i], (m.get(D.c.vp[i]) || 0) + 1); return [...m.entries()].map(([c, n]) => `<span class="chip">${esc(A.propName(c))} <b>${n}</b></span>`).join(''); };
    el.innerHTML = `<div class="wrap page">${head}
      <div class="actions mt"><b>${esc(t('bk_count', { n: fmt(ss.length), v: fmt(nV) }))}</b><span style="flex:1"></span>
        <button class="btn small" type="button" id="bk-cmp">${esc(t('bk_compare'))}</button><button class="btn ghost small" type="button" id="bk-rm">${esc(t('bk_remove'))}</button>
        <button class="btn ghost small" type="button" id="bk-csv">${ic('download')}${esc(t('bk_csv'))}</button><button class="btn ghost small" type="button" id="bk-xlsx">${esc(t('bk_xlsx'))}</button>
        <button class="btn ghost small" type="button" id="bk-wide">${esc(t('bk_wide'))}</button><a class="btn ghost small" href="${hrefSearch({ batch: ss.map(A.sampleKey).join('|') })}">${esc(t('bk_search'))}</a>
        <button class="btn ghost small" type="button" id="bk-clear">${esc(t('bk_clear'))}</button></div>
      <div class="card mt"><div class="mini-wrap" style="border:0"><table class="mini"><thead><tr><th class="col-chk"><input type="checkbox" id="bk-all" aria-label="all"></th><th>${esc(t('col_sample'))}</th><th>${esc(t('col_protein'))}</th><th>${esc(t('col_treat'))}</th><th>${esc(t('col_props'))}</th><th>${esc(t('col_paper'))}</th></tr></thead>
        <tbody>${ss.map((s) => `<tr><td class="col-chk"><input type="checkbox" data-bks="${s}" ${BK.sel.has(s) ? 'checked' : ''}></td><td><a class="strong" href="${A.sampleHref(s)}">${esc(A.sampleName(s))}</a><div class="dim">${esc(t('sample_n', { n: A.sampleNo(s) }))}</div></td>
          <td>${esc(A.srcOf(s).map(A.srcLabel).join(' · ') || SX(s, 'psrc'))}<div class="dim">${esc(A.formLabel(D.c.sform[s]))}</div></td><td><div class="clamp c2">${esc(SV().treatText(s))}</div></td><td>${propsOf(s)}</td>
          <td><a class="clamp c2" href="${A.paperHref(D.c.sp[s])}">${esc(PX(D.c.sp[s], 'title'))}</a><div class="dim">${esc(D.doi[D.c.sp[s]])}</div></td></tr>`).join('')}</tbody></table></div></div></div>`;
    el.querySelectorAll('[data-bks]').forEach((x) => { x.onchange = () => { if (x.checked) BK.sel.add(+x.dataset.bks); else BK.sel.delete(+x.dataset.bks); }; });
    $('bk-all').onchange = (e) => { el.querySelectorAll('[data-bks]').forEach((x) => { x.checked = e.target.checked; if (x.checked) BK.sel.add(+x.dataset.bks); else BK.sel.delete(+x.dataset.bks); }); };
    $('bk-cmp').onclick = () => { const s = [...BK.sel]; if (s.length < 2 || s.length > 6) { toast(t('bk_need')); return; } const h = new URLSearchParams(); s.forEach((x) => h.append('s', A.sampleKey(x))); location.hash = '#/compare?' + h; };
    $('bk-rm').onclick = () => { if (!BK.sel.size) return; A.basketRemove([...BK.sel]); BK.sel.clear(); renderBasket(); };
    $('bk-clear').onclick = () => { if (!confirm(t('bk_confirm_clear', { n: fmt(ss.length) }))) return; A.basketClear(); BK.sel.clear(); toast(t('bk_cleared')); renderBasket(); };
    const vals = () => ss.flatMap((s) => { const out = []; for (let i = D.vFirst[s]; i < D.vFirst[s + 1]; i++) out.push(i); return out; });
    const papers = () => [...new Set(ss.map((s) => D.c.sp[s]))];
    const exp = async (kind, wide) => { const idx = vals(); if (!(await A.prepareChunks(idx.map((i) => A.chunkOf(4, i)), idx.length))) return;
      if (wide) await A.saveTable(A.wideTable(ss, idx), 'pdfdb_basket_samples', 'xlsx', [{ name: 'methods', rows: A.methodSheet(papers()) }]);
      else await A.saveTable(A.valueTable(idx), 'pdfdb_basket_values', kind, [{ name: 'methods', rows: A.methodSheet(papers()) }]); };
    $('bk-csv').onclick = () => exp('csv', false); $('bk-xlsx').onclick = () => exp('xlsx', false); $('bk-wide').onclick = () => exp('xlsx', true);
  }
  async function renderCompare(params) {
    const el = $('view-compare'), ss = params.getAll('s').map(A.sampleFromKey).filter((s) => s >= 0).slice(0, 6);
    redraw = null;
    if (!ss.length) { el.innerHTML = `<div class="wrap page"><div class="page-head"><h1>${esc(t('cmp_title'))}</h1></div><div class="card empty-state">${esc(t('cmp_empty'))} <a href="#/basket">${esc(t('cmp_back'))}</a></div></div>`; return; }
    await A.ensureSamples(ss); await A.ensurePapers(ss.map((s) => D.c.sp[s]));
    const C = D.c, vals = ss.map((s) => { const out = []; for (let i = D.vFirst[s]; i < D.vFirst[s + 1]; i++) out.push(i); return out; });
    await A.ensureValues(vals.flat());
    const props = [...new Set(vals.flat().map((i) => C.vp[i]))].sort((a, b) => a - b);
    const row = (label, f) => `<tr><td>${esc(label)}</td>${ss.map((s) => `<td>${f(s)}</td>`).join('')}</tr>`;
    const valCell = (k, c) => { const list = vals[k].filter((i) => C.vp[i] === c);
      return list.length ? `<ul>${list.map((i) => `<li><span class="val">${SV().valueHTML(i, true)}</span><div class="dim">${esc(VX(i, 'name'))}${VX(i, 'cond') ? ' · ' + esc(VX(i, 'cond')) : ''}</div><div class="dim">${esc(A.methodName(C.vm[i]))}</div></li>`).join('')}</ul>` : '<span class="dim">—</span>'; };
    el.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/basket">${esc(t('bk_title'))}</a> / ${esc(t('cmp_title'))}</div>
      <div class="page-head"><h1>${esc(t('cmp_title'))}</h1><div class="actions"><button class="btn ghost small" type="button" id="cmp-csv">${esc(t('cmp_export_csv'))}</button><button class="btn ghost small" type="button" id="cmp-xlsx">${esc(t('cmp_export_xlsx'))}</button><a class="btn ghost small" href="#/basket">${esc(t('cmp_back'))}</a></div></div>
      <div class="card cmp-wrap"><table class="cmp"><thead><tr><th></th>${ss.map((s) => `<th><a class="strong" href="${A.sampleHref(s)}">${esc(A.sampleName(s))}</a></th>`).join('')}</tr></thead><tbody>
        ${row(t('cmp_paper'), (s) => `<a href="${A.paperHref(C.sp[s])}">${esc(clip(PX(C.sp[s], 'title'), 90))}</a><div class="dim">${esc(A.journalName(C.sp[s]))}</div>`)}
        ${row(t('d_psrc'), (s) => `${esc(A.srcOf(s).map(A.srcLabel).join(' · ') || '—')}<div class="dim">${esc(SX(s, 'psrc'))}</div>`)}
        ${row(t('d_pcat'), (s) => esc(cat(D.dict.pcat[C.scat[s]])))}
        ${row(t('d_pform'), (s) => `${esc(A.formLabel(C.sform[s]))}<div class="dim">${esc(SX(s, 'pform'))}</div>`)}
        ${row(t('d_pconc'), (s) => esc(SX(s, 'pconc') || '—'))}
        ${row(t('d_sys'), (s) => esc(cat(D.dict.sys[C.ssys[s]])))}
        ${row(t('d_ing'), (s) => esc(A.ingText(s) || t('d_none')))}
        ${row(t('col_treat'), (s) => `${esc(SV().treatText(s))}<div>${SV().typesHTML(s, 6)}</div>`)}
        <tr class="sec"><td colspan="${ss.length + 1}">${esc(t('cmp_values'))}</td></tr>
        ${props.map((c) => `<tr><td class="prop">${esc(A.propName(c))}</td>${ss.map((s, k) => `<td>${valCell(k, c)}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div></div>`;
    const table = () => [['', ...ss.map((s) => `${A.sampleName(s)} (${A.sampleKey(s)})`)], ['doi', ...ss.map((s) => D.doi[C.sp[s]])], ['title', ...ss.map((s) => PX(C.sp[s], 'title'))],
      ['protein_source_std', ...ss.map((s) => A.srcOf(s).map((c) => D.dict.src[c]).join(' | '))], ['protein_source', ...ss.map((s) => SX(s, 'psrc'))], ['protein_form', ...ss.map((s) => SX(s, 'pform'))],
      ['protein_conc', ...ss.map((s) => SX(s, 'pconc'))], ['ingredients', ...ss.map(A.ingText)], ['treatment', ...ss.map((s) => SX(s, 'treat'))],
      ['treatment_types', ...ss.map((s) => A.ttOf(s).map((c) => D.dict.tt[c]).join(' | '))],
      ...props.map((c) => [D.meta.props[c], ...ss.map((s, k) => vals[k].filter((i) => C.vp[i] === c).map((i) => `${VX(i, 'name')} = ${VX(i, 'vt')}${C.vo[i] & 1 ? '*' : ''}${VX(i, 'sd') ? ' ± ' + VX(i, 'sd') : ''} ${VX(i, 'unit')}${VX(i, 'cond') ? ' [' + VX(i, 'cond') + ']' : ''}`).join(' | '))])];
    $('cmp-csv').onclick = () => A.saveTable(table(), 'pdfdb_compare', 'csv');
    $('cmp-xlsx').onclick = () => A.saveTable(table(), 'pdfdb_compare', 'xlsx');
  }

  // ================================================================ 论文页、样品页 ==
  function methodsHTML(p, only) {
    const ms = (PX(p, 'methods') || []).filter((m) => !only || only.has(m[0]));
    return ms.length ? `<div class="method-list">${ms.map((m) => `<div class="method-item"><div class="head"><span class="id">${esc(m[0])}</span><b>${esc(m[1] >= 0 ? A.propName(m[1]) : '')}</b><span class="chip brand">${esc(A.methodName(m[2]))}</span>
      ${m[6] ? `<span class="dim">${esc(t('n_values', { n: m[6] }))}</span>` : ''}</div>${SV().summaryHTML(m)}${m[5] ? `<div class="dim" style="margin-top:4px">${esc(t('p_applies'))}: ${esc(m[5])}</div>` : ''}</div>`).join('')}</div>`
      : `<div class="dim">${esc(t('unextracted_note'))}</div>`;
  }
  async function renderPaper(params) {
    const el = $('view-paper'), raw = params.get('doi') || '', p = D.doiIndex.get(raw) ?? D.doiLower.get(raw.toLowerCase());
    redraw = null;
    if (p === undefined) { el.innerHTML = `<div class="wrap page"><div class="card empty-state">${esc(t('p_notfound'))}</div></div>`; return; }
    await A.loadChunk(A.chunkOf(0, p));
    const C = D.c, s0 = D.sFirst[p], s1 = D.sFirst[p + 1], nVal = D.vFirst[s1] - D.vFirst[s0];
    let nModel = 0;
    for (let i = D.vFirst[s0]; i < D.vFirst[s1]; i++) nModel += C.vo[i] & 1;
    const ms = PX(p, 'methods') || [], ss = [];
    for (let s = s0; s < s1; s++) ss.push(s);
    el.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/">${esc(t('nav_home'))}</a> / <a href="#/search">${esc(t('nav_search'))}</a> / ${esc(t('f_paper'))}</div>
      <div class="page-head"><div><h1>${esc(PX(p, 'title'))}</h1><div class="meta"><i>${esc(A.journalName(p))}</i> · <a href="${A.doiHref(p)}" target="_blank" rel="noopener">${esc(D.doi[p])}</a></div>
        <div class="meta">${esc(t('n_samples', { n: fmt(s1 - s0) }))} · ${esc(t('n_values', { n: fmt(nVal) }))}${nModel ? ` · ${esc(t('o_model'))} ${fmt(nModel)}` : ''}</div></div>
        <div class="actions"><a class="btn small" href="${hrefSearch({ paper: D.doi[p] })}">${esc(t('p_in_search'))}</a><button class="btn ghost small" type="button" id="p-basket">${ic('cart')}${esc(t('pp_basket'))}</button>
          <button class="btn ghost small" type="button" id="p-csv">${ic('download')}CSV</button><button class="btn ghost small" type="button" id="p-xlsx">Excel</button>
          <a class="btn ghost small" href="${A.doiHref(p)}" target="_blank" rel="noopener">${esc(t('open_doi'))}</a></div></div>
      <div class="two-col"><section class="card"><div class="card-head"><div><h3>${esc(t('p_methods', { n: ms.length }))}</h3><div class="sub">${esc(t('p_methods_sub'))}</div></div></div><div class="card-body">${methodsHTML(p)}</div></section>
        <section class="card"><div class="card-head"><h3>${esc(t('p_samples'))} (${fmt(s1 - s0)})</h3></div><div class="card-body"><div class="mini-wrap"><table class="mini"><thead><tr><th>#</th><th>${esc(t('col_sample'))}</th><th>${esc(t('col_protein'))}</th><th>${esc(t('col_treat'))}</th><th>${esc(t('p_n_values'))}</th></tr></thead>
          <tbody>${ss.map((s) => `<tr><td class="tnum">${A.sampleNo(s)}</td><td><a class="strong" href="${A.sampleHref(s)}">${esc(A.sampleName(s))}</a><div class="dim clamp c2">${esc(SX(s, 'desc'))}</div></td>
            <td>${esc(A.srcOf(s).map(A.srcLabel).join(' · ') || SX(s, 'psrc'))}<div class="dim">${esc(A.formLabel(C.sform[s]))}</div></td><td><div class="clamp c3">${esc(SV().treatText(s))}</div><div>${SV().typesHTML(s, 4)}</div></td><td class="tnum">${fmt(D.vFirst[s + 1] - D.vFirst[s])}</td></tr>`).join('')}</tbody></table></div></div></section></div></div>`;
    const idx = [];
    for (let i = D.vFirst[s0]; i < D.vFirst[s1]; i++) idx.push(i);
    const dl = async (kind) => { await A.ensureValues(idx); await A.saveTable(A.valueTable(idx), 'pdfdb_' + D.doi[p].replace(/[^A-Za-z0-9]+/g, '_'), kind, [{ name: 'methods', rows: A.methodSheet([p]) }]); };
    $('p-csv').onclick = () => dl('csv'); $('p-xlsx').onclick = () => dl('xlsx');
    $('p-basket').onclick = () => A.basketAdd(ss);
  }
  async function renderSample(params) {
    const el = $('view-sample'), raw = params.get('doi') || '', p = D.doiIndex.get(raw) ?? D.doiLower.get(raw.toLowerCase()), n = parseInt(params.get('n'), 10);
    const s = p === undefined ? -1 : A.sampleFromKey(D.doi[p] + '~' + n);
    redraw = null;
    if (s < 0) { el.innerHTML = `<div class="wrap page"><div class="card empty-state">${esc(t('s_notfound'))}</div></div>`; return; }
    await A.loadChunk(A.chunkOf(2, s)); await A.loadChunk(A.chunkOf(0, p));
    const C = D.c, vals = [];
    for (let i = D.vFirst[s]; i < D.vFirst[s + 1]; i++) vals.push(i);
    await A.ensureValues(vals);
    const mids = new Set(vals.map((i) => VX(i, 'mid')).filter(Boolean)), steps = SX(s, 'steps'), ings = SX(s, 'ings');
    const kv = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${v}</dd>` : '');
    el.innerHTML = `<div class="wrap page"><div class="crumbs"><a href="#/">${esc(t('nav_home'))}</a> / <a href="${A.paperHref(p)}">${esc(clip(PX(p, 'title'), 80))}</a> / ${esc(t('sample_n', { n: A.sampleNo(s) }))}</div>
      <div class="page-head"><div><h1>${esc(A.sampleName(s))}</h1><div class="meta"><a href="${A.paperHref(p)}">${esc(PX(p, 'title'))}</a></div><div class="meta"><i>${esc(A.journalName(p))}</i> · <a href="${A.doiHref(p)}" target="_blank" rel="noopener">${esc(D.doi[p])}</a></div></div>
        <div class="actions"><button class="btn small" type="button" id="s-bk">${ic('cart')}${esc(t(A.basketHas(s) ? 'b_remove' : 'b_add'))}</button><button class="btn ghost small" type="button" id="s-csv">${ic('download')}CSV</button><button class="btn ghost small" type="button" id="s-xlsx">Excel</button>
          <a class="btn ghost small" href="${A.paperHref(p)}">${esc(t('paper_page'))}</a><a class="btn ghost small" href="${A.doiHref(p)}" target="_blank" rel="noopener">${esc(t('open_doi'))}</a></div></div>
      <div class="two-col"><section class="card"><div class="card-head"><h3>${esc(t('s_info'))}</h3></div><div class="card-body"><dl class="kv">
          ${kv('d_desc', esc(SX(s, 'desc')))}
          ${kv('d_psrc', `${esc(SX(s, 'psrc') || '—')}${A.srcOf(s).length ? '<div>' + A.srcOf(s).map((c) => `<a class="chip brand" href="${hrefSearch({ src: D.dict.src[c] })}">${esc(A.srcLabel(c))}</a>`).join('') + '</div>' : ''}`)}
          ${kv('d_pcat', esc(cat(D.dict.pcat[C.scat[s]])))}
          ${kv('d_pform', `${esc(SX(s, 'pform') || '—')}${C.sform[s] ? ` <span class="chip">${esc(A.formLabel(C.sform[s]))}</span>` : ''}`)}
          ${kv('d_pconc', esc(SX(s, 'pconc')))}${kv('d_sys', esc(cat(D.dict.sys[C.ssys[s]])))}
          ${kv('d_ing', ings.length ? ings.map(([nn, c, a]) => `<div>${esc(nn)} <span class="dim">(${esc(cat(c))}${a ? ', ' + esc(a) : ''})</span></div>`).join('') : esc(t('d_none')))}
          ${kv('d_steps', steps.length ? `<ol class="steps">${steps.map(([m, c, ty, pr]) => `<li><b>${esc(m)}</b> <span class="dim">${esc(cat(c))}</span>${ty ? '<div>' + ty.split(' | ').map((x) => `<a class="chip" href="${hrefSearch({ tt: x })}">${esc(zh(x))}</a>`).join('') + '</div>' : ''}${pr ? `<div class="dim">${esc(pr)}</div>` : ''}</li>`).join('')}</ol>` : esc(t('d_untreated')))}
        </dl></div></section>
        <section class="card"><div class="card-head"><div><h3>${esc(t('s_methods'))}</h3><div class="sub">${esc(t('p_methods_sub'))}</div></div></div><div class="card-body">${methodsHTML(p, mids)}</div></section></div>
      <section class="card mt"><div class="card-head"><h3>${esc(t('s_values', { n: fmt(vals.length) }))}</h3></div><div class="card-body"><div class="mini-wrap"><table class="mini"><thead><tr><th>${esc(t('col_prop'))}</th><th>${esc(t('col_measure'))}</th><th>${esc(t('col_value'))}</th><th>${esc(t('col_method'))}</th><th>${esc(t('col_source'))}</th></tr></thead>
        <tbody>${vals.map((i) => `<tr><td class="prop">${esc(A.propName(C.vp[i]))}</td><td>${esc(VX(i, 'name'))}</td><td class="val">${SV().valueHTML(i, true)}</td><td>${SV().methodHTML(i, false)}</td><td>${SV().sourceHTML(i, false)}</td></tr>`).join('')}</tbody></table></div></div></section></div>`;
    $('s-bk').onclick = () => { if (A.basketHas(s)) A.basketRemove([s]); else A.basketAdd([s]); $('s-bk').innerHTML = ic('cart') + esc(t(A.basketHas(s) ? 'b_remove' : 'b_add')); };
    const dl = async (kind) => A.saveTable(A.valueTable(vals), 'pdfdb_' + A.sampleKey(s).replace(/[^A-Za-z0-9]+/g, '_'), kind, [{ name: 'methods', rows: A.methodSheet([p]) }]);
    $('s-csv').onclick = () => dl('csv'); $('s-xlsx').onclick = () => dl('xlsx');
  }

  A.pages = { renderHome, renderBrowse, renderStats, renderProperty, renderDownload, renderHelp, renderChangelog, renderBasket, renderCompare, renderPaper, renderSample };
})();
