// DESIGN PROTOTYPE — NOT PRODUCTION. SVG chart helpers for "Lamplight".
// Grammar (TerraFlux-derived): context bars dim, the bar that needs attention is lit, days that haven't happened are hatched.
// Callers set role="img" + aria-label with the data in words; these helpers only draw.
let _gid = 0;
function _defs(id) {
  return `<defs>
  <linearGradient id="lit${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--lamp-deep)"/><stop offset=".62" style="stop-color:var(--lamp)"/><stop offset="1" style="stop-color:var(--cream)"/></linearGradient>
  <linearGradient id="hot${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--lamp)"/><stop offset=".55" style="stop-color:var(--cream)"/><stop offset="1" style="stop-color:#fff"/></linearGradient>
  <linearGradient id="dim${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:oklch(0.25 0.006 60)"/><stop offset="1" style="stop-color:oklch(0.52 0.008 60)"/></linearGradient>
  <linearGradient id="dimdown${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:oklch(0.38 0.007 60)"/><stop offset="1" style="stop-color:oklch(0.22 0.005 60)"/></linearGradient>
  <linearGradient id="loss${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:oklch(0.45 0.14 27)"/><stop offset="1" style="stop-color:var(--loss)"/></linearGradient>
  <pattern id="hatch${id}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" style="fill:oklch(0.19 0.005 60)"/><rect width="1.3" height="4" style="fill:oklch(0.44 0.008 60)"/></pattern>
  <pattern id="stripe${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.4" height="5" style="fill:oklch(1 0 0 / .28)"/></pattern>
  <filter id="glow${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
}
const _el = (sel) => (typeof sel === 'string' ? document.querySelector(sel) : sel);
const _fmt = (n) => n.toLocaleString('en-IN');

/* Vertical bars. kind(i) → 'hot' | 'lit' | 'loss' | 'dim' | 'hatch'.
   opts: { values, kind, max, labels, bracket:{from,to}, stripes:true, w, h, gap } */
function bars(sel, o) {
  const id = ++_gid, W = o.w || 300, H = o.h || 96, n = o.values.length;
  const top = o.bracket ? 22 : 4, bottom = o.labels ? 16 : 2, ch = H - top - bottom;
  const gap = o.gap ?? Math.max(1.5, (W / n) * 0.28), bw = (W - gap * (n - 1)) / n;
  const max = o.max || Math.max(...o.values.map((v) => v ?? 0)) * 1.05;
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${_defs(id)}`;
  s += `<line x1="0" x2="${W}" y1="${top + ch + .5}" y2="${top + ch + .5}" style="stroke:var(--line)" />`;
  o.values.forEach((v, i) => {
    const k = o.kind ? o.kind(i) : 'dim';
    const h = Math.max(2, (v / max) * ch), x = i * (bw + gap), y = top + ch - h;
    const fill = k === 'hatch' ? `url(#hatch${id})` : `url(#${k}${id})`;
    const r = Math.min(2, bw / 3);
    s += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" rx="${r}" fill="${fill}" ${k === 'hot' ? `filter="url(#glow${id})"` : ''}/>`;
    if (o.stripes && (k === 'lit' || k === 'hot')) s += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" rx="${r}" fill="url(#stripe${id})"/>`;
    if (k === 'hatch') s += `<rect x="${(x + .5).toFixed(2)}" y="${(y + .5).toFixed(2)}" width="${(bw - 1).toFixed(2)}" height="${(h - 1).toFixed(2)}" rx="${r}" style="fill:none;stroke:oklch(0.40 0.008 60)"/>`;
  });
  if (o.bracket) {
    const x1 = o.bracket.from * (bw + gap), x2 = o.bracket.to * (bw + gap) + bw;
    s += `<g style="stroke:var(--lamp)"><line x1="${x1}" x2="${x2}" y1="8" y2="8"/><line x1="${x1}" x2="${x1}" y1="4" y2="12"/><line x1="${x2}" x2="${x2}" y1="4" y2="12"/></g>`;
  }
  if (o.labels) o.labels.forEach((t, i) => { if (t != null) s += `<text x="${(i * (bw + gap) + bw / 2).toFixed(1)}" y="${H - 3}" text-anchor="middle" style="font-size:10.5px;fill:var(--fg-subtle);font-family:var(--font)">${t}</text>`; });
  if (o.ref) { const y = (top + ch - (o.ref.v / max) * ch).toFixed(1); s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" style="stroke:var(--cream);stroke-dasharray:4 4;opacity:.7" vector-effect="non-scaling-stroke"/>`; }
  _el(sel).innerHTML = s + '</svg>';
}

/* Brick columns: each column is a stack of small blocks, `lit` of them lit from the bottom. */
function bricks(sel, o) {
  const id = ++_gid, W = o.w || 300, H = o.h || 96, cols = o.cols, per = o.per || 4, bottom = o.labels ? 16 : 2;
  const cg = 10, colW = (W - cg * (cols.length - 1)) / cols.length, b = (colW - (per - 1) * 2) / per;
  const rowsMax = Math.max(...cols.map((c) => Math.ceil(c.n / per)));
  const bh = Math.min(b * .62, (H - bottom - 4 - (rowsMax - 1) * 2) / rowsMax);
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${_defs(id)}`;
  cols.forEach((c, ci) => {
    const x0 = ci * (colW + cg);
    for (let k = 0; k < c.n; k++) {
      const r = Math.floor(k / per), cx = k % per;
      const x = x0 + cx * (b + 2), y = H - bottom - (r + 1) * bh - r * 2;
      const lit = k < c.lit;
      s += lit
        ? `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${b.toFixed(2)}" height="${bh.toFixed(2)}" rx="1.2" fill="url(#lit${id})"/>`
        : `<rect x="${(x + .5).toFixed(2)}" y="${(y + .5).toFixed(2)}" width="${(b - 1).toFixed(2)}" height="${(bh - 1).toFixed(2)}" rx="1.2" style="fill:oklch(0.22 0.006 60);stroke:oklch(0.36 0.008 60)"/>`;
    }
    if (o.labels) s += `<text x="${(x0 + colW / 2).toFixed(1)}" y="${H - 3}" text-anchor="middle" style="font-size:10.5px;fill:var(--fg-subtle);font-family:var(--font)">${o.labels[ci]}</text>`;
  });
  _el(sel).innerHTML = s + '</svg>';
}

/* Unit squares: one square per item. groups: [{n, kind:'lit'|'hatch'|'wrong'}]. */
function units(sel, o) {
  const id = ++_gid, W = o.w || 300, H = o.h || 40, total = o.groups.reduce((a, g) => a + g.n, 0), perRow = o.perRow || total;
  const gap = 3, sq = Math.min((W - gap * (perRow - 1)) / perRow, 14), rows = Math.ceil(total / perRow);
  let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${_defs(id)}`, k = 0;
  const y0 = H - rows * sq - (rows - 1) * gap;
  o.groups.forEach((g) => { for (let j = 0; j < g.n; j++, k++) {
    const x = (k % perRow) * (sq + gap), y = y0 + Math.floor(k / perRow) * (sq + gap);
    if (g.kind === 'lit') s += `<rect x="${x}" y="${y}" width="${sq}" height="${sq}" rx="2.5" fill="url(#lit${id})"/>`;
    else if (g.kind === 'hatch') s += `<rect x="${x + .5}" y="${y + .5}" width="${sq - 1}" height="${sq - 1}" rx="2.5" fill="url(#hatch${id})" style="stroke:oklch(0.44 0.008 60)"/>`;
    else s += `<rect x="${x + .75}" y="${y + .75}" width="${sq - 1.5}" height="${sq - 1.5}" rx="2.5" style="fill:none;stroke:var(--fg-muted);stroke-width:1.5"/><path d="M${x + 4} ${y + 4}L${x + sq - 4} ${y + sq - 4}M${x + sq - 4} ${y + 4}L${x + 4} ${y + sq - 4}" style="stroke:var(--fg-muted);stroke-width:1.4;stroke-linecap:round"/>`;
  } });
  _el(sel).innerHTML = s + '</svg>';
}

/* Tick rail: one tick per `step` minutes, coloured by state; a lit knob marks the moment that matters.
   o: { total, step, segs:[{from,to,s:'move'|'stop'|'flag'|'fuel'}], knob:{t,label} } */
function rail(sel, o) {
  const id = ++_gid, W = 1000, H = 34, n = Math.floor(o.total / o.step) + 1, dx = W / (n - 1);
  const state = (t) => { for (const g of o.segs) if (t >= g.from && t <= g.to) return g.s; return 'move'; };
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${_defs(id)}`;
  for (let i = 0; i < n; i++) {
    const t = i * o.step, st = state(t), x = (i * dx).toFixed(1);
    const c = st === 'flag' ? 'var(--loss)' : st === 'fuel' ? 'var(--cream)' : st === 'stop' ? 'oklch(0.40 0.008 60)' : 'var(--lamp)';
    const h = st === 'flag' ? 26 : st === 'stop' ? 12 : 18, op = st === 'move' ? .78 : 1;
    s += `<line x1="${x}" x2="${x}" y1="${(H - h) / 2}" y2="${(H + h) / 2}" style="stroke:${c};stroke-width:2.2;opacity:${op}" vector-effect="non-scaling-stroke"/>`;
  }
  _el(sel).innerHTML = s + '</svg>';
  if (o.knob) {
    const k = document.createElement('span');
    k.className = 'knob'; k.style.left = `${(o.knob.t / o.total) * 100}%`; k.innerHTML = `<i></i><b>${o.knob.label}</b>`;
    _el(sel).append(k);
  }
}

/* Fuel waveform: fuel in the tank above the axis, speed mirrored below it.
   A stationary drop reads at a glance: the top falls while the bottom is empty. */
function wave(sel, o) {
  const id = ++_gid, W = o.w || 1000, H = o.h || 300, n = o.fuel.length, axis = H * 0.64, topH = axis - 20, botH = H - axis - 26, FM = o.max || 320;
  const gap = o.gap ?? 1.6, bw = (W - 44 - gap * (n - 1)) / n, x0 = 44;
  let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${_defs(id)}`;
  [0, 100, 200, 300].forEach((v) => { const y = axis - (v / FM) * topH; s += `<line x1="${x0}" x2="${W}" y1="${y}" y2="${y}" style="stroke:var(--line-soft)"/><text x="${x0 - 8}" y="${y + 4}" text-anchor="end" style="font-size:${o.fs || 11}px;fill:var(--fg-subtle);font-family:var(--font)">${v}${v ? '' : ' L'}</text>`; });
  if (o.window) { const a = x0 + o.window[0] * (bw + gap) - 2, b = x0 + (o.window[1] + 1) * (bw + gap); s += `<rect x="${a}" y="${axis - topH - 6}" width="${b - a}" height="${topH + botH + 12}" rx="4" style="fill:var(--loss-bg)"/>`; }
  o.fuel.forEach((v, i) => {
    const x = x0 + i * (bw + gap), h = (v / FM) * topH, k = o.kind(i);
    const f = k === 'flag' ? `url(#loss${id})` : k === 'fuel' ? `url(#hot${id})` : `url(#dim${id})`;
    s += `<rect x="${x.toFixed(2)}" y="${(axis - h).toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" rx="1" fill="${f}" ${k === 'fuel' ? `filter="url(#glow${id})"` : ''}/>`;
    const sp = o.speed[i], sh = (sp / 80) * botH;
    if (sh > 0.5) s += `<rect x="${x.toFixed(2)}" y="${(axis + 3).toFixed(2)}" width="${bw.toFixed(2)}" height="${sh.toFixed(2)}" rx="1" fill="url(#dimdown${id})"/>`;
  });
  s += `<line x1="${x0}" x2="${W}" y1="${axis + 1.5}" y2="${axis + 1.5}" style="stroke:var(--line)"/>`;
  if (o.expected) {
    const pts = o.expected.map(([i, v]) => `${(x0 + i * (bw + gap) + bw / 2).toFixed(1)},${(axis - (v / FM) * topH).toFixed(1)}`).join(' ');
    s += `<polyline points="${pts}" style="fill:none;stroke:var(--cream);stroke-width:1.6;stroke-dasharray:5 5;opacity:.8"/>`;
  }
  (o.notes || []).forEach((t) => { s += `<text x="${x0 + t.i * (bw + gap)}" y="${t.y}" text-anchor="${t.a || 'start'}" style="font-size:${t.fs || o.fs || 12}px;fill:${t.c || 'var(--fg-muted)'};font-weight:${t.w || 400};font-family:var(--font)">${t.text}</text>`; });
  (o.times || []).forEach((t) => { s += `<text x="${x0 + t.i * (bw + gap)}" y="${H - 6}" text-anchor="middle" style="font-size:${o.fs || 11}px;fill:var(--fg-subtle);font-family:var(--font)">${t.text}</text>`; });
  s += `<text x="${x0 - 8}" y="${axis + 16}" text-anchor="end" style="font-size:${o.fs || 11}px;fill:var(--fg-subtle);font-family:var(--font)">km/h</text>`;
  _el(sel).innerHTML = s + '</svg>';
}

/* ---- the night of Trip 0926-04, sampled every `step` minutes from 9:05 PM (t=0) to 6:40 AM (t=575) ---- */
function night0926(step) {
  const fuelAt = (t) => {
    if (t <= 95) return 210 - 0.166 * t;
    if (t <= 145) return 194.2;
    if (t <= 303) return 194.2 - 0.166 * (t - 145);
    if (t <= 309) return 168;
    if (t <= 335) return 168 - 38 * (t - 309) / 26;
    if (t <= 339) return 130;
    if (t <= 360) return 130 - 2 * (t - 339) / 21;
    if (t <= 366) return 128;
    if (t <= 372) return 128 + 138 * (t - 366) / 6;
    return 266 - 36 * Math.max(0, t - 373) / 202;
  };
  const stopped = (t) => (t > 95 && t < 145) || (t > 303 && t < 339) || (t > 360 && t < 373);
  const speedAt = (t) => stopped(t) ? 0 : ([163, 386, 527].some((p) => Math.abs(t - p) < 4) ? 14 : 52 + 9 * Math.sin(t / 17) + 4 * Math.sin(t / 5.3));
  const fuel = [], speed = [], kind = [];
  for (let t = 0; t <= 575; t += step) {
    fuel.push(fuelAt(t) + 0.6 * Math.sin(t * 1.7));
    speed.push(speedAt(t));
    kind.push(t >= 309 && t <= 335 ? 'flag' : t >= 366 && t <= 372 ? 'fuel' : 'move');
  }
  return { fuel, speed, kind, idx: (t) => Math.round(t / step) };
}
