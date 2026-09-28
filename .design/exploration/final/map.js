// DESIGN PROTOTYPE — NOT PRODUCTION. Approximate highway geometry for the mockup maps.
// Real MapLibre map, tilted and warmed to night — the route is the light trail. (No fake "live map" render.)
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
// MapLibre can't parse oklch(); resolve a CSS token to rgba via a 1px canvas.
const _cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
const css = (v) => {
  _cx.clearRect(0, 0, 1, 1);
  _cx.fillStyle = getComputedStyle(document.body).getPropertyValue(v).trim();
  _cx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = _cx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
};

const P = {
  jaipur: [75.787, 26.912], delhi: [77.21, 28.61], okhla: [77.27, 28.53], behror: [76.255, 27.869], neemrana: [76.386, 27.987],
  kishangarh: [74.86, 26.58], beawar: [74.32, 26.10], udaipur: [73.71, 24.58], himmatnagar: [72.96, 23.60], ahmedabad: [72.57, 23.02],
  vadodara: [73.18, 22.30], bharuch: [72.99, 21.70], surat: [72.83, 21.17], vapi: [72.90, 20.37], bhiwandi: [73.06, 19.30], mumbai: [72.87, 19.07],
};
const NH48_JAI_DEL = [[75.787, 26.912], [75.93, 27.14], [75.959, 27.389], [76.08, 27.53], [76.198, 27.703], [76.287, 27.888], [76.386, 27.987], [76.44, 28.004], [76.797, 28.206], [76.939, 28.356], [77.026, 28.459], [77.12, 28.545], [77.27, 28.53]];
const ACTUAL_JAI_DEL = [...NH48_JAI_DEL.slice(0, 5), [76.23, 27.80], [76.262, 27.873], [76.255, 27.869], [76.262, 27.873], [76.287, 27.888], ...NH48_JAI_DEL.slice(6)];
const AHM_JAI = [P.ahmedabad, P.himmatnagar, [73.25, 24.1], P.udaipur, [73.9, 25.2], [74.1, 25.72], P.beawar, [74.63, 26.45], P.kishangarh, [75.3, 26.8], P.jaipur];
const JAI_BHW = [...AHM_JAI].reverse().concat([P.vadodara, P.bharuch, P.surat, P.vapi, [73.0, 19.8], P.bhiwandi]);

const FLAGS = [
  { n: 1, at: P.behror, place: 'Behror', route: ACTUAL_JAI_DEL, plan: NH48_JAI_DEL, cam: { center: [76.36, 27.72], zoom: 7.25, pitch: 56, bearing: 24 }, camM: { center: [76.4, 27.75], zoom: 6.6, pitch: 45, bearing: 20 } },
  { n: 2, at: P.kishangarh, place: 'Kishangarh pump', route: AHM_JAI, cam: { center: [74.3, 25.4], zoom: 6.25, pitch: 52, bearing: 28 }, camM: { center: [74.3, 25.3], zoom: 5.6, pitch: 40, bearing: 20 } },
  { n: 3, at: P.udaipur, place: 'whole trip', route: JAI_BHW, cam: { center: [73.55, 22.9], zoom: 5.25, pitch: 42, bearing: 8 }, camM: { center: [73.6, 22.9], zoom: 4.6, pitch: 30, bearing: 5 } },
];
const TRUCKS = [
  ...[[76.198, 27.703], [76.797, 28.206], [74.64, 26.45], [73.71, 24.58], [72.96, 23.6], [73.18, 22.3], [72.83, 21.17], [73.05, 19.3], [75.2, 26.2], [76.5, 28.1], [74.1, 25.4]].map((c) => ({ c, s: 'moving' })),
  ...[[75.80, 26.90], [75.81, 26.92], [75.79, 26.93], [75.82, 26.91], [75.78, 26.89], [75.80, 26.94], [77.27, 28.53], [77.25, 28.52], [73.06, 19.29], [72.58, 23.03], [77.1, 28.62], [72.9, 19.1]].map((c) => ({ c, s: 'idle' })),
  ...[[75.83, 26.88]].map((c) => ({ c, s: 'shop' })),
];

const node = (el) => (typeof el === 'string' ? document.getElementById(el) : el);
const fc = (features) => ({ type: 'FeatureCollection', features });
const pt = (c, props = {}) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: props });
const ln = (cs, props = {}) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: cs }, properties: props });

function label(map, c, text, cls = '', anchor = 'top', offset = [0, 8]) {
  const el = document.createElement('div');
  el.className = 'map-label ' + cls; el.textContent = text;
  return new maplibregl.Marker({ element: el, anchor, offset }).setLngLat(c).addTo(map);
}

// Warm the basemap to "night yard": near-black land, faint sodium-lit highways.
function warm(map) {
  for (const l of map.getStyle().layers) {
    try {
      if (l.type === 'background') map.setPaintProperty(l.id, 'background-color', '#0d0c0b');
      else if (l.type === 'fill') map.setPaintProperty(l.id, 'fill-color', /water/.test(l.id) ? '#070707' : '#100e0c');
      else if (l.type === 'line') {
        if (/water/.test(l.id)) map.setPaintProperty(l.id, 'line-color', '#090909');
        else if (/boundary/.test(l.id)) map.setPaintProperty(l.id, 'line-color', 'rgba(215,175,135,0.20)');
        else if (/mot|trunk/.test(l.id)) map.setPaintProperty(l.id, 'line-color', 'rgba(236,150,70,0.46)');
        else if (/pri|sec/.test(l.id)) map.setPaintProperty(l.id, 'line-color', 'rgba(215,170,120,0.22)');
        else map.setPaintProperty(l.id, 'line-color', 'rgba(210,180,150,0.08)');
      }
    } catch (e) { /* layer without that paint property */ }
  }
}

function glowLine(map, id, data, color, width = 2.6) {
  map.addSource(id, { type: 'geojson', data });
  const layout = { 'line-cap': 'round', 'line-join': 'round' };
  map.addLayer({ id: id + '-glow', type: 'line', source: id, layout, paint: { 'line-color': color, 'line-width': width * 6, 'line-blur': width * 5, 'line-opacity': .42 } });
  map.addLayer({ id: id + '-core', type: 'line', source: id, layout, paint: { 'line-color': color, 'line-width': width } });
}

/* Today hero map: flagged trips (list ↔ map linked) or the whole fleet. */
function heroMap(el, onReady) {
  const compact = innerWidth < 760;
  const map = new maplibregl.Map({ container: el, style: STYLE, ...(compact ? FLAGS[0].camM : FLAGS[0].cam), attributionControl: { compact: true }, dragRotate: false });
  const api = { map, sel: 0, mode: 'flags', marks: [] };
  map.on('load', () => {
    warm(map);
    const lamp = css('--lamp'), cream = css('--cream');
    map.addSource('others', { type: 'geojson', data: fc(FLAGS.map((f) => ln(f.route))) });
    map.addLayer({ id: 'others', type: 'line', source: 'others', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': lamp, 'line-width': 1.6, 'line-opacity': .35 } });
    map.addSource('plan', { type: 'geojson', data: ln(NH48_JAI_DEL) });
    map.addLayer({ id: 'plan', type: 'line', source: 'plan', paint: { 'line-color': css('--route-plan'), 'line-width': 1.6, 'line-dasharray': [2, 2] } });
    glowLine(map, 'sel', ln(FLAGS[0].route), cream, 2.4);
    map.addSource('trucks', { type: 'geojson', data: fc(TRUCKS.map((t) => pt(t.c, { s: t.s }))) });
    map.addLayer({ id: 'trucks-glow', type: 'circle', source: 'trucks', filter: ['==', ['get', 's'], 'moving'], layout: { visibility: 'none' }, paint: { 'circle-radius': 14, 'circle-color': lamp, 'circle-blur': 1, 'circle-opacity': .5 } });
    map.addLayer({ id: 'trucks', type: 'circle', source: 'trucks', layout: { visibility: 'none' }, paint: {
      'circle-radius': 4.5,
      'circle-color': ['match', ['get', 's'], 'moving', cream, 'shop', 'rgba(0,0,0,0)', css('--fg-subtle')],
      'circle-stroke-width': ['match', ['get', 's'], 'shop', 1.6, 1], 'circle-stroke-color': ['match', ['get', 's'], 'shop', css('--fg-muted'), 'rgba(0,0,0,.6)'] } });
    [['Jaipur', P.jaipur], ['Delhi', P.delhi], ['Ahmedabad', P.ahmedabad], ['Mumbai', P.mumbai]].forEach(([t, c]) => label(map, c, t, 'city'));
    FLAGS.forEach((f, i) => {
      const m = document.createElement('button');
      m.className = 'fmark' + (i === 0 ? ' on' : ''); m.textContent = f.n; m.setAttribute('aria-label', `Show flag ${f.n} on the map`);
      m.onclick = () => api.select(i);
      api.marks.push(m);
      new maplibregl.Marker({ element: m }).setLngLat(f.at).addTo(map);
      label(map, f.at, f.place, 'place', 'left', [18, 0]);
    });
    const pool = document.createElement('div'); pool.className = 'pool'; node(el).parentElement.appendChild(pool); api.pool = pool;
    const place = () => { const p = map.project(FLAGS[api.sel].at); pool.style.transform = `translate(${p.x}px, ${p.y}px)`; };
    map.on('move', place); place();
    map.resize();
    onReady && onReady(api);
  });
  api.select = (i) => {
    api.sel = i; api.setMode('flags', true);
    const f = FLAGS[i];
    map.getSource('sel').setData(ln(f.route));
    map.setLayoutProperty('plan', 'visibility', f.plan ? 'visible' : 'none');
    api.marks.forEach((m, k) => m.classList.toggle('on', k === i));
    const cam = innerWidth < 760 ? f.camM : f.cam;
    REDUCED ? map.jumpTo(cam) : map.flyTo({ ...cam, duration: 1400, curve: 1.3 });
    api.onselect && api.onselect(i);
  };
  api.setMode = (mode, quiet) => {
    api.mode = mode;
    const fleet = mode === 'fleet';
    ['trucks', 'trucks-glow'].forEach((l) => map.setLayoutProperty(l, 'visibility', fleet ? 'visible' : 'none'));
    ['sel-glow', 'sel-core'].forEach((l) => map.setLayoutProperty(l, 'visibility', fleet ? 'none' : 'visible'));
    if (fleet) map.setLayoutProperty('plan', 'visibility', 'none');
    api.pool && api.pool.classList.toggle('off', fleet);
    if (fleet && !quiet) { const cam = { center: [74.9, 23.9], zoom: innerWidth < 760 ? 4.4 : 5.05, pitch: 38, bearing: 0 }; REDUCED ? map.jumpTo(cam) : map.flyTo({ ...cam, duration: 1400 }); }
    api.onmode && api.onmode(mode);
  };
  return api;
}

/* Trip page: the one route, tilted, with every event on it. */
function tripMap(el) {
  const compact = innerWidth < 760;
  const map = new maplibregl.Map({ container: el, style: STYLE, center: compact ? [76.5, 27.62] : [76.5, 27.5], zoom: compact ? 6.55 : 7.2, pitch: compact ? 42 : 55, bearing: 26, attributionControl: { compact: true }, dragRotate: false });
  map.on('load', () => {
    warm(map);
    map.addSource('plan', { type: 'geojson', data: ln(NH48_JAI_DEL) });
    map.addLayer({ id: 'plan', type: 'line', source: 'plan', paint: { 'line-color': css('--route-plan'), 'line-width': 1.8, 'line-dasharray': [2, 2] } });
    glowLine(map, 'actual', ln(ACTUAL_JAI_DEL), css('--cream'), 2.6);
    const ev = [
      { c: P.jaipur, k: 'end', t: 'Jaipur · 9:05 PM' },
      { c: [75.959, 27.389], k: 'ok', t: 'Shahpura dhaba · fuel steady' },
      { c: P.behror, k: 'bad', t: 'Parked near Behror · −38 L' },
      { c: P.neemrana, k: 'fuel', t: 'Neemrana pump · bill matches' },
      { c: P.okhla, k: 'end', t: 'Okhla · 6:40 AM' },
    ];
    ev.forEach((e) => {
      const d = document.createElement('div');
      d.className = 'evmark ' + e.k;
      new maplibregl.Marker({ element: d }).setLngLat(e.c).addTo(map);
      if (!compact || e.k === 'bad') label(map, e.c, e.t, e.k === 'bad' ? 'place bad' : 'place', 'left', [14, 0]);
    });
    const pool = document.createElement('div'); pool.className = 'pool'; node(el).parentElement.appendChild(pool);
    const place = () => { const p = map.project(P.behror); pool.style.transform = `translate(${p.x}px, ${p.y}px)`; };
    map.on('move', place); place();
    map.resize();
  });
  return map;
}
