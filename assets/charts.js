'use strict';
/* 网页上的几种图（纯 SVG，不用第三方库）：横向条形、直方图、分组箱线图、散点。
   规格按 dataviz：细条（≤24px）、数据端 4px 圆角、基线方角、相邻柱子 2px 空隙、点 r≥4 带 2px 底色描边、
   网格线 1px 实线、文字用文字色（不用系列色）、每个图都有悬停提示。 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmt(x) {
    if (x === null || x === undefined || !Number.isFinite(x)) return '';
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e6 || a < 1e-3)) return x.toExponential(2).replace('e+', 'e');
    if (a >= 1000) return x.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return String(+x.toPrecision(4));
  }
  function compact(x) {
    const a = Math.abs(x);
    if (a >= 1e9) return +(x / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return +(x / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return +(x / 1e3).toFixed(1) + 'K';
    return fmt(x);
  }
  function niceTicks(lo, hi, n = 5) {
    if (!(hi > lo)) { const d = Math.abs(lo) || 1; lo -= d / 2; hi += d / 2; }
    const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    const step = (f >= 5 ? 10 : f >= 2 ? 5 : f >= 1 ? 2 : 1) * p;
    const ticks = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) ticks.push(+v.toPrecision(12));
    return ticks;
  }
  function logTicks(lo, hi) {
    const out = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) out.push(Math.pow(10, e));
    return out.filter((v) => v >= lo / 1.0001 && v <= hi * 1.0001);
  }
  function quantile(sorted, q) {
    if (!sorted.length) return NaN;
    const pos = (sorted.length - 1) * q, b = Math.floor(pos), r = pos - b;
    return sorted[b + 1] !== undefined ? sorted[b] + r * (sorted[b + 1] - sorted[b]) : sorted[b];
  }
  // 数据端圆角、基线方角的柱子
  function barPath(x, y, w, h, horizontal) {
    const r = Math.min(4, horizontal ? w / 2 : h / 2, horizontal ? h / 2 : w / 2);
    if (w <= 0 || h <= 0) return '';
    if (horizontal) return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  function mount(el, w, h, body) {
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${body}</svg><div class="tip" hidden></div>`;
    return { svg: el.querySelector('svg'), tip: el.querySelector('.tip') };
  }
  function bindTips(el, tip, html) {
    el.querySelector('svg').addEventListener('mousemove', (e) => {
      const t = e.target.closest('[data-tip]');
      if (!t) { tip.hidden = true; return; }
      tip.innerHTML = html(t.dataset.tip);
      tip.hidden = false;
      const box = el.getBoundingClientRect();
      let x = e.clientX - box.left + 14, y = e.clientY - box.top + 14;
      if (x + tip.offsetWidth > box.width) x = e.clientX - box.left - tip.offsetWidth - 10;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    });
    el.querySelector('svg').addEventListener('mouseleave', () => { tip.hidden = true; });
  }

  /** 横向条形：items [{key, label, value, note?}]，按给的顺序画；点一下调用 onClick(key) */
  function hbar(el, items, opt = {}) {
    const W = Math.max(300, el.clientWidth || 600);
    const labelW = Math.min(opt.labelWidth || 200, W * 0.42), valW = 56, band = 26, bar = 16, top = 4;
    const H = top + items.length * band + 4;
    const max = Math.max(1, ...items.map((d) => d.value));
    const span = W - labelW - valW - 8;
    let body = '';
    items.forEach((d, i) => {
      const y = top + i * band, w = Math.max(2, (d.value / max) * span);
      const label = d.label.length > 34 ? d.label.slice(0, 33) + '…' : d.label;
      body += `<g class="bar-g" data-key="${esc(d.key)}" data-tip="${i}">
        <rect class="hit" x="0" y="${y}" width="${W}" height="${band}"></rect>
        <text class="cat-text" x="${labelW - 8}" y="${y + band / 2 + 4}" text-anchor="end">${esc(label)}</text>
        <path class="mark-1" d="${barPath(labelW, y + (band - bar) / 2, w, bar, true)}"></path>
        <text class="val-text" x="${labelW + w + 6}" y="${y + band / 2 + 4}">${esc(opt.valueFmt ? opt.valueFmt(d.value) : compact(d.value))}</text></g>`;
    });
    const { tip } = mount(el, W, H, body);
    bindTips(el, tip, (i) => { const d = items[+i]; return `<b>${esc(d.label)}</b><br>${esc((opt.valueFmt || fmt)(d.value))}${d.note ? '<br>' + esc(d.note) : ''}`; });
    if (opt.onClick) el.querySelector('svg').addEventListener('click', (e) => { const g = e.target.closest('.bar-g'); if (g) opt.onClick(g.dataset.key); });
  }

  /** 直方图：vals 数组（同一单位），opt {log, xLabel, yLabel, countFmt} */
  function histogram(el, vals, opt = {}) {
    const W = Math.max(320, el.clientWidth || 700), H = 260, m = { l: 52, r: 16, t: 12, b: 42 };
    let xs = vals.filter((v) => Number.isFinite(v) && (!opt.log || v > 0));
    if (!xs.length) { el.innerHTML = `<div class="chart-empty">${esc(opt.empty || '')}</div>`; return; }
    const tx = opt.log ? Math.log10 : (v) => v;
    xs = xs.map(tx).sort((a, b) => a - b);
    let lo = xs[0], hi = xs[xs.length - 1];
    if (hi === lo) { lo -= 0.5; hi += 0.5; }
    const iqr = quantile(xs, 0.75) - quantile(xs, 0.25);
    let nb = iqr > 0 ? Math.ceil((hi - lo) / (2 * iqr / Math.cbrt(xs.length))) : 20;
    nb = Math.max(8, Math.min(48, nb));
    const step = (hi - lo) / nb, bins = new Array(nb).fill(0);
    for (const v of xs) bins[Math.min(nb - 1, Math.floor((v - lo) / step))]++;
    const ymax = Math.max(...bins), yt = niceTicks(0, ymax, 4), ytop = yt[yt.length - 1];
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const X = (v) => m.l + ((v - lo) / (hi - lo)) * pw, Y = (c) => m.t + ph - (c / ytop) * ph;
    let body = '<g class="grid">' + yt.map((c) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(c)}" y2="${Y(c)}"></line>`).join('') + '</g>';
    body += '<g class="ax">' + yt.map((c) => `<text x="${m.l - 8}" y="${Y(c) + 4}" text-anchor="end">${compact(c)}</text>`).join('');
    const xt = opt.log ? logTicks(Math.pow(10, lo), Math.pow(10, hi)).map(Math.log10) : niceTicks(lo, hi, Math.max(3, Math.floor(pw / 90)));
    body += xt.filter((v) => v >= lo - 1e-9 && v <= hi + 1e-9).map((v) => `<text x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${opt.log ? compact(Math.pow(10, v)) : compact(v)}</text>`).join('');
    body += `<line x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}"></line></g>`;
    const bw = pw / nb;
    bins.forEach((c, i) => {
      const x = m.l + i * bw + 1, w = Math.max(1, bw - 2);
      body += `<g data-tip="${i}"><rect class="hit" x="${m.l + i * bw}" y="${m.t}" width="${bw}" height="${ph}"></rect>${c ? `<path class="mark-1" d="${barPath(x, Y(c), w, m.t + ph - Y(c), false)}"></path>` : ''}</g>`;
    });
    if (opt.xLabel) body += `<text class="ax-title" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(opt.xLabel)}</text>`;
    if (opt.yLabel) body += `<text class="ax-title" transform="translate(13 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(opt.yLabel)}</text>`;
    const { tip } = mount(el, W, H, body);
    const back = (v) => (opt.log ? Math.pow(10, v) : v);
    bindTips(el, tip, (i) => `<b>${fmt(back(lo + i * step))} – ${fmt(back(lo + (+i + 1) * step))}</b><br>${esc(opt.countFmt ? opt.countFmt(bins[i]) : bins[i])}`);
  }

  /** 分组箱线图（横向）：groups [{key, label, values(已排序)}]，opt {log, xLabel, onClick, nFmt} */
  function boxplot(el, groups, opt = {}) {
    const W = Math.max(320, el.clientWidth || 700), band = 30, m = { l: Math.min(210, W * 0.36), r: 70, t: 8, b: 40 };
    const tx = opt.log ? Math.log10 : (v) => v;
    const gs = groups.map((g) => {
      const v = g.values.filter((x) => Number.isFinite(x) && (!opt.log || x > 0)).map(tx);
      const q1 = quantile(v, 0.25), q3 = quantile(v, 0.75), iqr = q3 - q1;
      const lw = v.find((x) => x >= q1 - 1.5 * iqr), hw = [...v].reverse().find((x) => x <= q3 + 1.5 * iqr);
      return { ...g, v, q1, q3, med: quantile(v, 0.5), lw, hw, min: v[0], max: v[v.length - 1] };
    }).filter((g) => g.v.length);
    if (!gs.length) { el.innerHTML = `<div class="chart-empty">${esc(opt.empty || '')}</div>`; return; }
    let lo = Math.min(...gs.map((g) => g.lw)), hi = Math.max(...gs.map((g) => g.hw));
    if (hi === lo) { lo -= 0.5; hi += 0.5; }
    const pad = (hi - lo) * 0.04; lo -= pad; hi += pad;
    const H = m.t + gs.length * band + m.b, pw = W - m.l - m.r;
    const X = (v) => m.l + ((v - lo) / (hi - lo)) * pw;
    const xt = opt.log ? logTicks(Math.pow(10, lo), Math.pow(10, hi)).map(Math.log10) : niceTicks(lo, hi, Math.max(3, Math.floor(pw / 90)));
    let body = '<g class="grid">' + xt.map((v) => `<line x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${H - m.b}"></line>`).join('') + '</g><g class="ax">';
    body += xt.map((v) => `<text x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${opt.log ? compact(Math.pow(10, v)) : compact(v)}</text>`).join('') + '</g>';
    gs.forEach((g, i) => {
      const y = m.t + i * band, cy = y + band / 2, bh = 14;
      const label = g.label.length > 30 ? g.label.slice(0, 29) + '…' : g.label;
      body += `<g class="bar-g" data-key="${esc(g.key)}" data-tip="${i}"><rect class="hit" x="0" y="${y}" width="${W}" height="${band}"></rect>
        <text class="cat-text" x="${m.l - 10}" y="${cy + 4}" text-anchor="end">${esc(label)}</text>
        <line class="box-line" x1="${X(g.lw)}" x2="${X(g.q1)}" y1="${cy}" y2="${cy}"></line>
        <line class="box-line" x1="${X(g.q3)}" x2="${X(g.hw)}" y1="${cy}" y2="${cy}"></line>
        <rect class="box-fill" x="${X(g.q1)}" y="${cy - bh / 2}" width="${Math.max(2, X(g.q3) - X(g.q1))}" height="${bh}" rx="3"></rect>
        <line class="median" x1="${X(g.med)}" x2="${X(g.med)}" y1="${cy - bh / 2}" y2="${cy + bh / 2}"></line>
        <text class="val-text" x="${W - m.r + 8}" y="${cy + 4}">n = ${compact(g.v.length)}</text></g>`;
    });
    if (opt.xLabel) body += `<text class="ax-title" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(opt.xLabel)}</text>`;
    const { tip } = mount(el, W, H, body);
    const b = (v) => fmt(opt.log ? Math.pow(10, v) : v);
    bindTips(el, tip, (i) => { const g = gs[+i]; return `<b>${esc(g.label)}</b><br>${esc(opt.medLbl || 'median')} ${b(g.med)} · IQR ${b(g.q1)} – ${b(g.q3)}<br>${esc(opt.rangeLbl || 'range')} ${b(g.min)} – ${b(g.max)} · n = ${g.v.length}`; });
    if (opt.onClick) el.querySelector('svg').addEventListener('click', (e) => { const g = e.target.closest('.bar-g'); if (g) opt.onClick(g.dataset.key); });
  }

  /** 散点：pts [{x, y, s(0 作者 / 1 模型), tip}]，opt {xLabel, yLabel, logY, series:[名, 名]} */
  function scatter(el, pts, opt = {}) {
    const W = Math.max(320, el.clientWidth || 700), H = 300, m = { l: 56, r: 16, t: 12, b: 42 };
    const P = pts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && (!opt.logY || p.y > 0));
    if (!P.length) { el.innerHTML = `<div class="chart-empty">${esc(opt.empty || '')}</div>`; return; }
    const ty = opt.logY ? Math.log10 : (v) => v;
    let xlo = Math.min(...P.map((p) => p.x)), xhi = Math.max(...P.map((p) => p.x));
    let ylo = Math.min(...P.map((p) => ty(p.y))), yhi = Math.max(...P.map((p) => ty(p.y)));
    if (xhi === xlo) { xlo -= 1; xhi += 1; }
    if (yhi === ylo) { ylo -= 0.5; yhi += 0.5; }
    const xpad = (xhi - xlo) * 0.03, ypad = (yhi - ylo) * 0.05;
    xlo -= xpad; xhi += xpad; ylo -= ypad; yhi += ypad;
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const X = (v) => m.l + ((v - xlo) / (xhi - xlo)) * pw, Y = (v) => m.t + ph - ((ty(v) - ylo) / (yhi - ylo)) * ph;
    const yt = opt.logY ? logTicks(Math.pow(10, ylo), Math.pow(10, yhi)) : niceTicks(ylo, yhi, 4);
    const xt = niceTicks(xlo, xhi, Math.max(3, Math.floor(pw / 80)));
    let body = '<g class="grid">' + yt.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"></line>`).join('') + '</g><g class="ax">';
    body += yt.map((v) => `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${compact(v)}</text>`).join('');
    body += xt.filter((v) => v >= xlo && v <= xhi).map((v) => `<text x="${X(v)}" y="${H - m.b + 16}" text-anchor="middle">${compact(v)}</text>`).join('');
    body += `<line x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}"></line></g>`;
    P.forEach((p, i) => { body += `<circle class="dot-${p.s ? 2 : 1}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4" data-tip="${i}"></circle>`; });
    if (opt.xLabel) body += `<text class="ax-title" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(opt.xLabel)}</text>`;
    if (opt.yLabel) body += `<text class="ax-title" transform="translate(13 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(opt.yLabel)}</text>`;
    const { tip } = mount(el, W, H, body);
    bindTips(el, tip, (i) => P[+i].tip);
  }

  window.PFDCharts = { hbar, histogram, boxplot, scatter, fmt, compact, quantile };
})();
