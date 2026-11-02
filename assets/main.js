'use strict';
/* PDF —— 路由、页头页脚、语言切换、快捷键、启动。 */
(() => {
  const A = window.PDF;
  const { $, esc, t, ic, D } = A;
  const ROUTES = { '/': 'home', '/search': 'search', '/browse': 'browse', '/stats': 'stats', '/download': 'download', '/help': 'help',
    '/changelog': 'changelog', '/basket': 'basket', '/compare': 'compare', '/paper': 'paper', '/sample': 'sample', '/property': 'property' };
  let VIEW = '';
  A.currentView = () => VIEW;

  function parseRoute() {
    const h = location.hash.replace(/^#/, '');
    if (h.startsWith('/')) { const k = h.indexOf('?'); return { path: (k < 0 ? h : h.slice(0, k)) || '/', params: new URLSearchParams(k < 0 ? '' : h.slice(k + 1)) }; }
    if (h) return { path: '/search', params: new URLSearchParams(h) };        // 旧版链接（#q=…&prop=…）
    return { path: '/', params: new URLSearchParams() };
  }
  async function render() {
    const { path, params } = parseRoute(), view = ROUTES[path] || 'home', P = A.pages;
    const changed = view !== VIEW;
    VIEW = view;
    document.querySelectorAll('main .view').forEach((m) => { m.hidden = m.id !== 'view-' + view; });
    document.querySelectorAll('[data-nav]').forEach((a) => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('nav').classList.remove('open'); $('nav-toggle').setAttribute('aria-expanded', 'false');
    if (changed || view !== 'search') window.scrollTo(0, 0);
    document.title = (view === 'home' ? '' : (t('nav_' + view) !== 'nav_' + view ? t('nav_' + view) + ' · ' : '')) + t('title');
    try {
      if (view === 'search') await A.searchView.show(params);
      else if (view === 'home') P.renderHome();
      else if (view === 'browse') P.renderBrowse(params);
      else if (view === 'stats') P.renderStats();
      else if (view === 'property') await P.renderProperty(params);
      else if (view === 'download') await P.renderDownload();
      else if (view === 'help') P.renderHelp(params);
      else if (view === 'changelog') P.renderChangelog();
      else if (view === 'basket') await P.renderBasket();
      else if (view === 'compare') await P.renderCompare(params);
      else if (view === 'paper') await P.renderPaper(params);
      else if (view === 'sample') await P.renderSample(params);
    } catch (e) {
      console.error(e);
      $('view-' + view).innerHTML = `<div class="wrap page"><div class="card empty-state">${esc(t('load_fail', { e: e.message || e }))}</div></div>`;
    }
  }
  function repoUrl() {
    const host = location.hostname;
    if (!host.endsWith('.github.io')) return '';
    return `https://github.com/${host.split('.')[0]}/${location.pathname.split('/').filter(Boolean)[0] || host}`;
  }
  A.repoUrl = repoUrl;
  function renderFoot() {
    const rel = D.meta && D.meta.release ? D.meta.release.version : '', repo = repoUrl();
    const links = [['#/', 'nav_home'], ['#/search', 'nav_search'], ['#/browse', 'nav_browse'], ['#/stats', 'nav_stats'], ['#/download', 'nav_download'], ['#/help', 'nav_help'], ['#/changelog', 'nav_changelog'], ['#/basket', 'nav_basket']];
    $('foot').innerHTML = `<div class="wrap foot-cols">
        <div><div class="foot-brand">${$('logo-mark').outerHTML.replace('id="logo-mark"', '')}<b>PDF</b></div><p>${esc(t('f_about'))}</p></div>
        <div><h4>${esc(t('f_pages'))}</h4><ul>${links.map(([h, k]) => `<li><a href="${h}">${esc(t(k))}</a></li>`).join('')}${repo ? `<li><a href="${repo}" target="_blank" rel="noopener">GitHub</a></li>` : ''}</ul></div>
        <div><h4>${esc(t('f_data'))}</h4><p>${esc(t('f_data_1'))}</p><p>${esc(t('f_data_2'))}</p><p>${esc(t('f_data_3'))}</p>
          <h4 style="margin-top:14px">${esc(t('f_cite'))}</h4><p>${esc(t('f_cite_1'))}</p><p>${esc(t('f_cite_2'))} <a href="#/help?s=feedback">${esc(t('f_cite_link'))}</a></p></div></div>
      <div class="wrap foot-bottom"><span>PDF · Protein Database of Functionality</span>${rel ? `<span>${esc(t('f_version', { v: rel }))}</span>` : ''}${D.meta ? `<span>${esc(t('f_built', { d: D.meta.built }))}</span>` : ''}<span>${esc(t('f_copy'))}</span></div>`;
  }
  function applyStatic() {
    document.documentElement.lang = A.lang() === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $('lang-btn').textContent = A.lang() === 'zh' ? 'EN' : '中文';
    $('nav-toggle').setAttribute('aria-label', t('menu'));
    renderFoot();
  }
  function bind() {
    window.addEventListener('hashchange', render);
    $('lang-btn').addEventListener('click', () => {
      A.setLang(A.lang() === 'zh' ? 'en' : 'zh');
      A.searchView.rebuild();
      applyStatic();
      if (D.meta) render();
    });
    $('nav-toggle').addEventListener('click', () => { const open = !$('nav').classList.contains('open'); $('nav').classList.toggle('open', open); $('nav-toggle').setAttribute('aria-expanded', String(open)); });
    window.addEventListener('resize', A.debounce(() => { if (VIEW === 'search') A.searchView.redrawCharts(); else A.redrawPage(); }, 200));
    document.addEventListener('keydown', (e) => {      // 「/」跳到检索框
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || document.activeElement.isContentEditable) return;
      e.preventDefault();
      if (VIEW === 'home' && $('hero-q')) $('hero-q').focus();
      else if (VIEW === 'search') A.searchView.focusKeyword();
      else { location.hash = '#/search'; setTimeout(() => A.searchView.focusKeyword(), 300); }
    });
    const repo = repoUrl();
    if (repo) { $('repo-link').href = repo; $('repo-link').hidden = false; }
  }
  async function main() {
    applyStatic();
    bind();
    A.saveBasket();
    try { await A.loadIndex(); } catch (e) {
      document.querySelectorAll('main .view').forEach((m) => { m.hidden = m.id !== 'view-home'; });
      $('view-home').innerHTML = `<div class="wrap page"><div class="card empty-state">${esc(t('load_fail', { e: e.message || e }))}</div></div>`;
      return;
    }
    A.setupFacets();
    A.clearFilters();
    applyStatic();
    await render();
  }
  main();
})();
