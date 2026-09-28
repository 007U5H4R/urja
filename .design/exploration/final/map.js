// DESIGN PROTOTYPE — NOT PRODUCTION. Approximate NH48 geometry for the mockup maps.
const STYLE = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};
// MapLibre can't parse oklch(); resolve a CSS token to rgba via a 1px canvas.
const _cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
const css = (v) => {
  _cx.clearRect(0, 0, 1, 1);
  _cx.fillStyle = getComputedStyle(document.body).getPropertyValue(v).trim();
  _cx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = _cx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
};

const NH48_JAI_DEL = [
  [75.787, 26.912], [75.93, 27.14], [75.959, 27.389], [76.08, 27.53], [76.198, 27.703],
  [76.287, 27.888], [76.386, 27.987], [76.44, 28.004], [76.797, 28.206], [76.939, 28.356],
  [77.026, 28.459], [77.12, 28.545], [77.27, 28.53],
];
const ACTUAL_JAI_DEL = [
  ...NH48_JAI_DEL.slice(0, 6), [76.262, 27.873], [76.255, 27.869], [76.262, 27.873], [76.287, 27.888],
  ...NH48_JAI_DEL.slice(6),
];

const CITIES = [
  { name: 'Jaipur', c: [75.787, 26.912] }, { name: 'Delhi', c: [77.21, 28.61] },
  { name: 'Ahmedabad', c: [72.57, 23.02] }, { name: 'Mumbai', c: [72.87, 19.07] },
];

// 24 trucks: moving (on trip), idle, workshop
const TRUCKS = [
  ...[[76.198,27.703],[76.797,28.206],[74.64,26.45],[73.71,24.58],[72.96,23.6],[73.18,22.3],[72.83,21.17],[73.05,19.3],[75.2,26.2],[76.5,28.1],[74.1,25.4]]
    .map((c) => ({ c, s: 'moving' })),
  ...[[75.80,26.90],[75.81,26.92],[75.79,26.93],[75.82,26.91],[75.78,26.89],[75.80,26.94],[77.27,28.53],[77.25,28.52],[73.06,19.29]]
    .map((c) => ({ c, s: 'idle' })),
  ...[[75.83,26.88]].map((c) => ({ c, s: 'shop' })),
  ...[[72.58,23.03],[77.1,28.62],[72.9,19.1]].map((c) => ({ c, s: 'idle' })),
];

function fc(features) { return { type: 'FeatureCollection', features }; }
function pt(c, props = {}) { return { type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: props }; }
function line(cs, props = {}) { return { type: 'Feature', geometry: { type: 'LineString', coordinates: cs }, properties: props }; }

function label(map, c, text, kind) {
  const el = document.createElement('div');
  el.className = 'map-label map-label-' + kind;
  el.textContent = text;
  new maplibregl.Marker({ element: el, anchor: kind === 'city' ? 'top' : 'left', offset: kind === 'city' ? [0, 8] : [12, 0] }).setLngLat(c).addTo(map);
}

function fleetMap(el, theme = 'dark') {
  const map = new maplibregl.Map({ container: el, style: STYLE[theme], bounds: [[71.6, 18.6], [78.2, 29.2]], fitBoundsOptions: { padding: 24 }, attributionControl: { compact: true }, interactive: true });
  map.on('load', () => {
    map.addSource('routes', { type: 'geojson', data: fc([line(NH48_JAI_DEL), line([[75.787,26.912],[74.64,26.45],[73.71,24.58],[72.96,23.6],[72.57,23.02],[73.18,22.3],[72.83,21.17],[72.87,19.07]])]) });
    map.addLayer({ id: 'routes', type: 'line', source: 'routes', paint: { 'line-color': css('--line'), 'line-width': 2 } });
    map.addSource('trucks', { type: 'geojson', data: fc(TRUCKS.map((t) => pt(t.c, { s: t.s }))) });
    map.addLayer({ id: 'trucks', type: 'circle', source: 'trucks', paint: {
      'circle-radius': 5,
      'circle-color': ['match', ['get', 's'], 'moving', css('--brand'), 'shop', 'rgba(0,0,0,0)', css('--fg-subtle')],
      'circle-stroke-width': ['match', ['get', 's'], 'shop', 1.6, 1],
      'circle-stroke-color': ['match', ['get', 's'], 'shop', css('--fg-muted'), css('--bg')],
    } });
    CITIES.forEach((x) => label(map, x.c, x.name, 'city'));
    map.resize();
  });
  return map;
}

function tripMap(el, theme = 'dark', compact = false) {
  const map = new maplibregl.Map({ container: el, style: STYLE[theme], bounds: [[75.6, 26.8], [77.4, 28.7]], fitBoundsOptions: { padding: compact ? 20 : 40 }, attributionControl: { compact: true } });
  map.on('load', () => {
    map.addSource('plan', { type: 'geojson', data: line(NH48_JAI_DEL) });
    map.addLayer({ id: 'plan', type: 'line', source: 'plan', paint: { 'line-color': css('--route-plan'), 'line-width': 2, 'line-dasharray': [2, 2] } });
    map.addSource('actual', { type: 'geojson', data: line(ACTUAL_JAI_DEL) });
    map.addLayer({ id: 'actual', type: 'line', source: 'actual', paint: { 'line-color': css('--brand'), 'line-width': 3.5, 'line-opacity': .9 } });
    const ev = [
      pt([75.787, 26.912], { k: 'end', t: 'Jaipur · 9:05 PM' }),
      pt([75.959, 27.389], { k: 'ok', t: 'Shahpura dhaba · 50 min · fuel steady' }),
      pt([76.255, 27.869], { k: 'bad', t: 'Parked near Behror · −38 L' }),
      pt([76.386, 27.987], { k: 'fuel', t: 'Refuel, Neemrana · bill matches tank' }),
      pt([77.27, 28.53], { k: 'end', t: 'Okhla, Delhi · 6:40 AM' }),
    ];
    map.addSource('ev', { type: 'geojson', data: fc(ev) });
    map.addLayer({ id: 'ev', type: 'circle', source: 'ev', paint: {
      'circle-radius': ['match', ['get', 'k'], 'bad', 8, 5.5],
      'circle-color': ['match', ['get', 'k'], 'bad', css('--loss'), 'ok', css('--gain'), 'fuel', css('--fg'), css('--fg')],
      'circle-stroke-width': 2, 'circle-stroke-color': css('--bg'),
    } });
    if (!compact) ev.forEach((f) => label(map, f.geometry.coordinates, f.properties.t, f.properties.k));
    map.resize();
  });
  return map;
}
