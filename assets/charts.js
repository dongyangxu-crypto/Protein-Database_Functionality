'use strict';
/* 网页上的几种图（纯 SVG，不用第三方库）：横向条形、直方图、分组箱线图、散点、按组分列的点图；每张图可下载 PNG / SVG / 数据 CSV。
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
  function zeroTicks(max, n = 4) {
    const t = niceTicks(0, max, n);
    if (t.length > 1 && t[t.length - 1] < max) t.push(+(t[t.length - 1] + t[1] - t[0]).toPrecision(12));
    return t;
  }
  // 线性坐标下少数极端值（单位写错、读错等）把范围拉到几十亿倍时，按 0.5%–99.5% 分位截取范围，范围外的不画、由调用方在图下说明
  function robustRange(sorted) {
    const n = sorted.length, lo = sorted[0], hi = sorted[n - 1];
    if (n < 50) return { lo, hi, out: 0 };
    const a = quantile(sorted, 0.005), b = quantile(sorted, 0.995);
    if (!(b > a) || hi - lo <= 4 * (b - a)) return { lo, hi, out: 0 };
    let out = 0;
    for (const v of sorted) if (v < a || v > b) out++;
    return { lo: a, hi: b, out, min: lo, max: hi };
  }
  function logTicks(lo, hi) {
    const out = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) out.push(Math.pow(10, e));
    return out.filter((v) => v >= lo / 1.0001 && v <= hi * 1.0001);
  }
  const r6 = (v) => (Number.isFinite(v) ? +v.toPrecision(6) : '');
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

  // 量文字宽度（和图里 .cat-text 一样 12px、正文字体）；标签放不下时截断加省略号，悬停提示里是全名
  let measure = null;
  function textWidth(s, px = 12) {
    if (!measure) measure = document.createElement('canvas').getContext('2d');
    measure.font = `${px}px ${getComputedStyle(document.body).fontFamily}`;
    return measure.measureText(String(s)).width;
  }
  function fitLabel(s, maxW) {
    if (textWidth(s) <= maxW) return s;
    let lo = 0, hi = s.length;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (textWidth(s.slice(0, mid) + '…') <= maxW) lo = mid; else hi = mid - 1; }
    return s.slice(0, lo).trimEnd() + '…';
  }
  // 标签列宽：按最长的标签量（英文名比中文长），不超过图宽的 frac
  const labelColumn = (labels, W, frac) => Math.max(60, Math.min(Math.max(0, ...labels.map((s) => textWidth(s))) + 16, W * frac));

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
    const vf = (v) => (opt.valueFmt ? opt.valueFmt(v) : compact(v));
    const labelW = labelColumn(items.map((d) => d.label), W, 0.45), valW = Math.max(40, ...items.map((d) => textWidth(vf(d.value)) + 10)), band = 26, bar = 16, top = 4;
    const H = top + items.length * band + 4;
    const max = Math.max(1, ...items.map((d) => d.value));
    const span = W - labelW - valW - 8;
    let body = '';
    items.forEach((d, i) => {
      const y = top + i * band, w = Math.max(2, (d.value / max) * span);
      const label = fitLabel(d.label, labelW - 10);
      body += `<g class="bar-g" data-key="${esc(d.key)}" data-tip="${i}">
        <rect class="hit" x="0" y="${y}" width="${W}" height="${band}"></rect>
        <text class="cat-text" x="${labelW - 8}" y="${y + band / 2 + 4}" text-anchor="end">${esc(label)}</text>
        <path class="mark-1" d="${barPath(labelW, y + (band - bar) / 2, w, bar, true)}"></path>
        <text class="val-text" x="${labelW + w + 6}" y="${y + band / 2 + 4}">${esc(vf(d.value))}</text></g>`;
    });
    const { tip } = mount(el, W, H, body);
    el._csv = [[opt.csvLabel || 'label', opt.csvValue || 'value'], ...items.map((d) => [d.label, d.value])];
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
    const rr = opt.log ? { lo: xs[0], hi: xs[xs.length - 1], out: 0 } : robustRange(xs);
    if (rr.out) xs = xs.filter((v) => v >= rr.lo && v <= rr.hi);
    let lo = rr.lo, hi = rr.hi;
    if (hi === lo) { lo -= 0.5; hi += 0.5; }
    const iqr = quantile(xs, 0.75) - quantile(xs, 0.25);
    let nb = iqr > 0 ? Math.ceil((hi - lo) / (2 * iqr / Math.cbrt(xs.length))) : 20;
    nb = Math.max(8, Math.min(48, nb));
    const step = (hi - lo) / nb, bins = new Array(nb).fill(0);
    for (const v of xs) bins[Math.min(nb - 1, Math.floor((v - lo) / step))]++;
    const ymax = Math.max(...bins), yt = zeroTicks(ymax, 4), ytop = yt[yt.length - 1];
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
    el._csv = [['bin_from', 'bin_to', 'count'], ...bins.map((c, i) => [r6(back(lo + i * step)), r6(back(lo + (i + 1) * step)), c])];
    bindTips(el, tip, (i) => `<b>${fmt(back(lo + i * step))} – ${fmt(back(lo + (+i + 1) * step))}</b><br>${esc(opt.countFmt ? opt.countFmt(bins[i]) : bins[i])}`);
    return rr;
  }

  /** 分组箱线图（横向）：groups [{key, label, values(已排序)}]，opt {log, xLabel, onClick, nFmt} */
  function boxplot(el, groups, opt = {}) {
    const W = Math.max(320, el.clientWidth || 700), band = 30, m = { l: labelColumn(groups.map((g) => g.label), W, 0.36), r: 70, t: 8, b: 40 };
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
      const label = fitLabel(g.label, m.l - 14);
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
    const raw = (v) => r6(opt.log ? Math.pow(10, v) : v);
    el._csv = [['group', 'n', 'q1', 'median', 'q3', 'min', 'max'], ...gs.map((g) => [g.label, g.v.length, raw(g.q1), raw(g.med), raw(g.q3), raw(g.min), raw(g.max)])];
    bindTips(el, tip, (i) => { const g = gs[+i]; return `<b>${esc(g.label)}</b><br>${esc(opt.medLbl || 'median')} ${b(g.med)} · IQR ${b(g.q1)} – ${b(g.q3)}<br>${esc(opt.rangeLbl || 'range')} ${b(g.min)} – ${b(g.max)} · n = ${g.v.length}`; });
    if (opt.onClick) el.querySelector('svg').addEventListener('click', (e) => { const g = e.target.closest('.bar-g'); if (g) opt.onClick(g.dataset.key); });
  }

  /** 散点：pts [{x, y, s(0 作者 / 1 模型), tip}]，opt {xLabel, yLabel, logY, series:[名, 名]} */
  function scatter(el, pts, opt = {}) {
    const W = Math.max(320, el.clientWidth || 700), H = 300, m = { l: 56, r: 16, t: 12, b: 42 };
    let P = pts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && (!opt.logY || p.y > 0));
    if (!P.length) { el.innerHTML = `<div class="chart-empty">${esc(opt.empty || '')}</div>`; return; }
    const rr = opt.logY ? { out: 0 } : robustRange(P.map((p) => p.y).sort((a, b) => a - b));
    if (rr.out) P = P.filter((p) => p.y >= rr.lo && p.y <= rr.hi);
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
    // 来源于模型的点画空心圆：颜色之外再用形状区分（配色检查里蓝-青绿的 tritan 差距偏小）
    P.forEach((p, i) => { body += `<circle class="${p.s ? 'ring-2' : 'dot-1'}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4" data-tip="${i}"></circle>`; });
    if (opt.xLabel) body += `<text class="ax-title" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${esc(opt.xLabel)}</text>`;
    if (opt.yLabel) body += `<text class="ax-title" transform="translate(13 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(opt.yLabel)}</text>`;
    const { tip } = mount(el, W, H, body);
    el._csv = [['x', 'y', 'series'], ...P.map((p) => [p.x, p.y, p.s ? 'model-derived' : 'author-reported'])];
    bindTips(el, tip, (i) => P[+i].tip);
    return rr;
  }

  /** 按组分列的点图（每组一列，纵轴是数值）：groups [{key, label, sub, values:[{v, m(1 = 来源于模型), tip}]}]，
      opt {yLabel, median, byOrigin, log, onClick(key), empty} —— 单一系列色；区分数据来源时模型值画成空心圆（形状区分，不只靠颜色） */
  function strip(el, groups, opt = {}) {
    const G = groups.filter((g) => g.values.some((x) => Number.isFinite(x.v) && (!opt.log || x.v > 0)));
    if (!G.length) { el.innerHTML = `<div class="chart-empty">${esc(opt.empty || '')}</div>`; el._csv = null; return; }
    const W = Math.max(320, el.clientWidth || 700), m = { l: 58, r: 14, t: 14, b: 58 };
    // 组多、列窄时组名斜着写：底部留白按最长的组名算（最多 110px 长），每个组名再按到左边界的距离截断，不出图框
    const gw0 = (W - m.l - m.r) / G.length, tilt = gw0 < 78, SIN = Math.sin(35 * Math.PI / 180), COS = Math.cos(35 * Math.PI / 180);
    const labMax = tilt ? Math.min(110, Math.max(...G.map((g) => textWidth(g.label)))) : 0;
    if (tilt) m.b = Math.max(58, Math.ceil(labMax * SIN + 24));
    const H = 262 + m.b;
    const tv = opt.log ? Math.log10 : (v) => v;
    const all = G.flatMap((g) => g.values.map((x) => x.v)).filter((v) => Number.isFinite(v) && (!opt.log || v > 0)).map(tv);
    let lo = Math.min(...all), hi = Math.max(...all);
    if (hi === lo) { lo -= 0.5; hi += 0.5; }
    const pad = (hi - lo) * 0.05; lo -= pad; hi += pad;
    if (!opt.log && lo > 0 && lo < (hi - lo) * 0.6) lo = 0;
    const pw = W - m.l - m.r, ph = H - m.t - m.b, gw = pw / G.length;
    const Y = (v) => m.t + ph - ((tv(v) - lo) / (hi - lo)) * ph;
    const yt = opt.log ? logTicks(Math.pow(10, lo), Math.pow(10, hi)) : niceTicks(lo, hi, 5);
    let body = '<g class="grid">' + yt.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"></line>`).join('') + '</g><g class="ax">';
    body += yt.map((v) => `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${compact(v)}</text>`).join('');
    body += `<line x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}"></line></g>`;
    const pts = [];
    G.forEach((g, gi) => {
      const cx = m.l + gw * gi + gw / 2, span = Math.min(gw * 0.3, 26);
      const vals = g.values.filter((x) => Number.isFinite(x.v) && (!opt.log || x.v > 0));
      vals.forEach((x, j) => {
        const jit = vals.length > 1 ? (((j * 7919) % 97) / 96 - 0.5) * 2 * span : 0;
        pts.push(x);
        body += `<circle class="${opt.byOrigin && x.m ? 'ring-1' : 'dot-1'}" cx="${(cx + jit).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="4.5" data-tip="${pts.length - 1}"></circle>`;
      });
      if (opt.median && vals.length) {
        const s = vals.map((x) => tv(x.v)).sort((a, b) => a - b), med = quantile(s, 0.5), my = m.t + ph - ((med - lo) / (hi - lo)) * ph;
        body += `<line class="median" x1="${cx - Math.min(gw * 0.38, 34)}" x2="${cx + Math.min(gw * 0.38, 34)}" y1="${my}" y2="${my}" stroke-linecap="round"></line>`;
      }
      const label = tilt ? fitLabel(g.label, Math.min(labMax, (cx - 8) / COS)) : fitLabel(g.label, gw - 6);
      body += tilt
        ? `<g class="bar-g grp-lbl" data-key="${esc(g.key)}"><text class="cat-text" transform="translate(${cx + 4} ${m.t + ph + 12}) rotate(-35)" text-anchor="end">${esc(label)}</text></g>`
        : `<g class="bar-g grp-lbl" data-key="${esc(g.key)}"><text class="cat-text" x="${cx}" y="${m.t + ph + 18}" text-anchor="middle">${esc(label)}</text><text class="lbl-text" x="${cx}" y="${m.t + ph + 33}" text-anchor="middle">${esc(g.sub || '')}</text></g>`;
    });
    if (opt.yLabel) body += `<text class="ax-title" transform="translate(13 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${esc(opt.yLabel)}</text>`;
    const { tip } = mount(el, W, H, body);
    el._csv = [['group', 'value', 'data_origin'], ...G.flatMap((g) => g.values.map((x) => [g.label, x.v, x.m ? 'model-derived' : 'author-reported']))];
    bindTips(el, tip, (i) => pts[+i].tip);
    if (opt.onClick) el.querySelector('svg').addEventListener('click', (e) => { const g = e.target.closest('.grp-lbl'); if (g) opt.onClick(g.dataset.key); });
  }

  /** 下载图：kind svg / png / csv；把计算后的颜色、字号写进副本，离开网页样式也能正常显示 */
  const STYLE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'opacity', 'font-size', 'font-family', 'font-weight'];
  function svgString(el) {
    const src = el.querySelector('svg');
    if (!src) return null;
    const copy = src.cloneNode(true), a = src.querySelectorAll('*'), b = copy.querySelectorAll('*');
    a.forEach((n, k) => { const cs = getComputedStyle(n); b[k].setAttribute('style', STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';')); b[k].removeAttribute('class'); b[k].removeAttribute('data-tip'); });
    copy.querySelectorAll('rect[style*="fill:transparent"], rect[style*="fill: transparent"]').forEach((r) => r.remove());
    const vb = src.viewBox.baseVal, bg = getComputedStyle(document.body).getPropertyValue('--surface').trim() || '#fff';
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.insertAdjacentHTML('afterbegin', `<rect x="0" y="0" width="${vb.width}" height="${vb.height}" fill="${bg}"></rect>`);
    return { text: new XMLSerializer().serializeToString(copy), w: vb.width, h: vb.height };
  }
  function save(el, kind, name, csvText) {
    const dl = (blob, fn) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); };
    if (kind === 'csv') { if (el._csv) dl(new Blob([csvText(el._csv)], { type: 'text/csv;charset=utf-8' }), name + '.csv'); return; }
    const s = svgString(el);
    if (!s) return;
    if (kind === 'svg') { dl(new Blob([s.text], { type: 'image/svg+xml' }), name + '.svg'); return; }
    const img = new Image(), scale = 2;
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = s.w * scale; c.height = s.h * scale;
      const g = c.getContext('2d');
      g.scale(scale, scale); g.drawImage(img, 0, 0, s.w, s.h);
      c.toBlob((blob) => dl(blob, name + '.png'), 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.text);
  }

  window.PFDCharts = { hbar, histogram, boxplot, scatter, strip, save, fmt, compact, quantile };
})();
