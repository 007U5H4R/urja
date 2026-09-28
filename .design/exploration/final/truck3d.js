// DESIGN PROTOTYPE — NOT PRODUCTION. Procedural 3D truck scene (three.js via import map + dynamic import,
// so it also works from file://). User decision 2026-09-28: include a TerraFlux-style 3D truck as the
// dashboard delighter (3D necessity gate explicitly overridden). Kept honest: it reconstructs the flagged
// moment (RJ14 GB 4521 parked off NH48, ignition off, fuel tank lit red), with a poster fallback.
window.truckScene = async function truckScene(el, opts = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !!opts.still;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let THREE, OrbitControls, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ OrbitControls } = await import('three/addons/controls/OrbitControls.js'));
    ({ EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js'));
    ({ RenderPass } = await import('three/addons/postprocessing/RenderPass.js'));
    ({ UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js'));
    ({ OutputPass } = await import('three/addons/postprocessing/OutputPass.js'));
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (e) { el.classList.add('fallback'); return null; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { el.classList.add('fallback'); return null; }
  // guard: software WebGL (SwiftShader, llvmpipe, VMs) can freeze the page on this scene, so show the poster instead
  try {
    const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software|basic render/i.test(name) && !opts.forceSoftware) { renderer.dispose(); el.classList.add('fallback'); return null; }
  } catch (e) { /* no debug info: assume hardware */ }
  const W = () => Math.max(1, el.clientWidth), H = () => Math.max(1, el.clientHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.25 : 1.5));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x0b0a09, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.touchAction = 'pan-y';
  el.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a09);
  scene.fog = new THREE.FogExp2(0x0b0a09, 0.0125);
  const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 700);
  // soft reflections so the dark metal panels read (like the reference's glossy truck)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  // ---------- textures ----------
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const glow = tex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const tail = tex(256, 4, (x) => { const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.85, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 0, 256, 4); });
  const asphalt = tex(256, 256, (x) => { x.fillStyle = '#100e0c'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { const v = 14 + Math.random() * 16 | 0; x.fillStyle = `rgb(${v + 4},${v + 2},${v})`; x.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4); } });
  asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping; asphalt.repeat.set(90, 3);
  if (document.fonts) { try { await document.fonts.ready; } catch (e) {} }
  const plateTex = tex(512, 128, (x) => {
    x.fillStyle = '#f2cf38'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#1b1a14'; x.lineWidth = 8; x.strokeRect(6, 6, 500, 116);
    x.fillStyle = '#16140f'; x.font = '700 78px "Anek Devanagari", "Arial Narrow", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('RJ14 GB 4521', 256, 70);
  });

  // ---------- materials ----------
  const M = {
    body: new THREE.MeshStandardMaterial({ color: 0x1d1a17, roughness: .48, metalness: .6 }),
    cargo: new THREE.MeshStandardMaterial({ color: 0x2b251f, roughness: .82, metalness: .12 }),
    rib: new THREE.MeshStandardMaterial({ color: 0x3a3229, roughness: .6, metalness: .35 }),
    tarp: new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: .95 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: .95 }),
    hub: new THREE.MeshStandardMaterial({ color: 0x8a7c6c, roughness: .3, metalness: .9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: .06, metalness: .95 }),
    edge: new THREE.LineBasicMaterial({ color: 0xffe0b3, transparent: true, opacity: .9, toneMapped: false }),
    amber: new THREE.MeshBasicMaterial({ color: 0xffa04a, toneMapped: false }),
    red: new THREE.MeshBasicMaterial({ color: 0xff3a2e, toneMapped: false }),
    off: new THREE.MeshStandardMaterial({ color: 0x2c2a27, roughness: .2, metalness: .8 }),
    tank: new THREE.MeshStandardMaterial({ color: 0x3a0e0a, emissive: 0xff3b2f, emissiveIntensity: 2.2, roughness: .35, metalness: .6 }),
    plate: new THREE.MeshBasicMaterial({ map: plateTex, toneMapped: false }),
  };
  const box = (w, h, d, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || scene).add(m); return m; };
  const edges = (mesh, thr = 25) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, thr), M.edge); l.position.copy(mesh.position); l.rotation.copy(mesh.rotation); mesh.parent.add(l); return l; };
  const disc = (size, color, opacity, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); scene.add(m); return m; };

  // ---------- road: NH48 at night, the truck on the shoulder ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), new THREE.MeshStandardMaterial({ color: 0x080706, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(900, 14.5), new THREE.MeshStandardMaterial({ map: asphalt, roughness: .92 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -2); scene.add(road);
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(70, 10), new THREE.MeshStandardMaterial({ color: 0x15120f, roughness: 1 }));
  patch.rotation.x = -Math.PI / 2; patch.position.set(0, 0.005, 11); scene.add(patch);
  const markMat = new THREE.MeshBasicMaterial({ color: 0xb08e62, transparent: true, opacity: .7, toneMapped: false });
  for (const z of [-5.6, -2, 1.6]) for (let x = -300; x < 300; x += 11) box(4.2, .01, .14, markMat, x, .01, z);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xc49a66, transparent: true, opacity: .7, toneMapped: false });
  box(900, .01, .16, lineMat, 0, .012, -9.1); box(900, .01, .16, lineMat, 0, .012, 5.1);

  // ---------- traffic light-trails (the highway keeps moving; the truck doesn't) ----------
  const trails = [];
  const lanes = [{ z: 3.3, dir: -1, c: 0xffe6c2 }, { z: -.2, dir: -1, c: 0xffe6c2 }, { z: -3.8, dir: 1, c: 0xff4636 }, { z: -7.3, dir: 1, c: 0xff4636 }];
  lanes.forEach((ln) => { for (let k = 0; k < 5; k++) {
    const L = 10 + Math.random() * 16;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, .46), new THREE.MeshBasicMaterial({ map: tail, color: ln.c, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; if (ln.dir > 0) m.rotation.z = Math.PI;
    m.position.set(-220 + Math.random() * 440, .75, ln.z + (Math.random() - .5) * .6);
    scene.add(m); trails.push({ m, v: (20 + Math.random() * 12) * ln.dir });
  } });

  // ---------- the truck (Indian heavy truck, closed cargo body) ----------
  const T = new THREE.Group(); T.position.set(0, 0, 11); T.rotation.y = Math.PI; scene.add(T);
  box(10.8, .32, 2.2, M.body, 0, .95, 0, T);                                        // chassis
  const s = new THREE.Shape();                                                      // cab profile (side view)
  s.moveTo(0, 0); s.lineTo(2.3, 0); s.lineTo(2.3, 1.5); s.lineTo(2.08, 2.52); s.quadraticCurveTo(2.0, 2.78, 1.72, 2.8); s.lineTo(.16, 2.8); s.quadraticCurveTo(0, 2.8, 0, 2.62); s.lineTo(0, 0);
  const cabG = new THREE.ExtrudeGeometry(s, { depth: 2.44, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2, curveSegments: 8 });
  cabG.translate(0, 0, -1.22);
  const cab = new THREE.Mesh(cabG, M.body); cab.position.set(3.05, 1.08, 0); T.add(cab); edges(cab, 30);
  const ws = box(.05, .95, 2.12, M.glass, 3.05 + 2.21, 1.08 + 2.0, 0, T); ws.rotation.z = .215;   // windscreen
  for (const z of [1.25, -1.25]) box(1.2, .78, .03, M.glass, 3.05 + 1.25, 1.08 + 2.1, z, T);       // side windows
  box(.3, .42, 2.52, M.body, 5.47, 1.2, 0, T);                                                    // bumper
  box(.46, .08, 2.5, M.body, 5.3, 1.08 + 2.62, 0, T);                                             // sun visor
  const grille = box(.04, .7, 1.4, M.glass, 5.37, 1.08 + .95, 0, T); edges(grille, 1);             // grille
  for (const z of [1.42, -1.42]) { box(.06, .06, .34, M.body, 4.9, 1.08 + 2.0, z > 0 ? z - .1 : z + .1, T); box(.12, .52, .2, M.glass, 4.9, 1.08 + 2.0, z + (z > 0 ? .12 : -.12), T); } // mirrors
  for (const z of [.86, -.86]) box(.06, .16, .42, M.off, 5.63, 1.36, z, T);                        // headlights (ignition off)
  for (let i = 0; i < 5; i++) box(.16, .1, .12, M.amber, 3.3 + i * .4, 1.08 + 2.86, 0, T);          // roof marker lamps
  const plF = new THREE.Mesh(new THREE.PlaneGeometry(.72, .18), M.plate); plF.position.set(5.63, .98, 0); plF.rotation.y = Math.PI / 2; T.add(plF);
  const plR = new THREE.Mesh(new THREE.PlaneGeometry(.72, .18), M.plate); plR.position.set(-5.43, 1.02, 0); plR.rotation.y = -Math.PI / 2; T.add(plR);
  const cargo = box(7.9, 2.6, 2.52, M.cargo, -1.35, 1.11 + 1.3, 0, T); edges(cargo, 20);            // cargo body
  for (let i = 0; i <= 8; i++) box(.09, 2.62, 2.58, M.rib, -5.25 + i * .985, 1.11 + 1.3, 0, T);    // ribs
  box(7.95, .12, 2.56, M.tarp, -1.35, 1.11 + 2.66, 0, T);                                         // tarp
  for (let i = 0; i < 7; i++) for (const z of [1.3, -1.3]) box(.12, .08, .06, M.amber, -5.0 + i * 1.25, 1.11 + 2.62, z, T); // body marker lamps
  for (const z of [.95, -.95]) box(.05, .16, .34, M.red, -5.33, 1.3, z, T);                        // tail lamps
  const wG = new THREE.CylinderGeometry(.53, .53, .44, 28); wG.rotateX(Math.PI / 2);
  const hG = new THREE.CylinderGeometry(.25, .25, .46, 20); hG.rotateX(Math.PI / 2);
  for (const x of [4.25, -2.35, -3.72]) for (const z of [1.07, -1.07]) {
    const w = new THREE.Mesh(wG, M.tire); w.position.set(x, .53, z); T.add(w);
    const h = new THREE.Mesh(hG, M.hub); h.position.set(x, .53, z); T.add(h);
  }
  // the evidence: the fuel tank, lit red
  const tG = new THREE.CylinderGeometry(.34, .34, 1.5, 28); tG.rotateZ(Math.PI / 2);
  const tank = new THREE.Mesh(tG, M.tank); tank.position.set(1.95, .74, -1.2); T.add(tank);
  const tankLight = new THREE.PointLight(0xff3b2f, 9, 7, 2); tankLight.position.set(1.95, .6, -2.1); T.add(tankLight);
  const pool = disc(4.6, 0xff3b2f, .55, -1.95, 13.1);

  // ---------- the lamp: a dhaba pole light, the only warm light on the scene ----------
  box(.14, 7.6, .14, M.body, -9.5, 3.8, 7.2);                                   // pole behind the truck, road side
  box(.09, .09, 1.9, M.body, -9.5, 7.55, 8.1);
  box(.32, .12, .62, new THREE.MeshBasicMaterial({ color: 0xffd08a, toneMapped: false }), -9.5, 7.48, 8.95);
  const spot = new THREE.SpotLight(0xffb468, 360, 42, .8, .85, 2); spot.position.set(-9.5, 7.3, 8.95); spot.target.position.set(-2.5, 0, 11.4); scene.add(spot, spot.target);
  disc(18, 0xff9442, .30, -3.5, 11.8);
  scene.add(new THREE.HemisphereLight(0x3a2d22, 0x060505, .9));
  const rim = new THREE.DirectionalLight(0xffb070, 1.7); rim.position.set(30, 20, -26); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd8c6b2, .35); fill.position.set(-14, 9, 30); scene.add(fill);

  // ---------- camera: high three-quarter view, like the reference ----------
  // framing: the truck sits left of the glass card, clear of the rail; phones pull back (no card there)
  const narrow = W() / H() < 1.15;
  const target = new THREE.Vector3(...(opts.target || (narrow ? [1.2, -1.4, 10.8] : [4.3, -.9, 10.4])));
  const CAM = opts.cam || (narrow ? [-19, 17, 38] : [-17, 14.5, 31]);
  camera.position.set(...CAM);
  camera.lookAt(target);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target); controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minPolarAngle = .72; controls.maxPolarAngle = 1.18;
  const base = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
  controls.minAzimuthAngle = base.theta - .75; controls.maxAzimuthAngle = base.theta + .75;
  controls.enabled = !coarse;                     // touch: the page owns the gesture
  let userAt = -1e9; controls.addEventListener('start', () => { userAt = performance.now(); });
  controls.update();

  // ---------- post: bloom gives the edge-light strips their glow ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), .72, .5, .16);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- tag anchored to the truck (DOM, so it stays text) ----------
  const tag = el.querySelector('.scene-tag');
  const anchor = new THREE.Vector3(-2.6, 4.2, 11);
  const placeTag = () => { if (!tag) return; const v = anchor.clone().project(camera); tag.style.transform = `translate(${((v.x + 1) / 2) * W()}px, ${((1 - v.y) / 2) * H()}px) translate(-50%, -100%)`; };

  // ---------- loop (render only while visible) ----------
  const clock = new THREE.Clock(); let running = false, visible = true, raf = 0, t = 0;
  const sph = new THREE.Spherical();
  function frame() {
    raf = 0; if (!running || !visible) return;
    const dt = Math.min(clock.getDelta(), .05); t += dt;
    if (!reduced) {
      trails.forEach((tr) => { tr.m.position.x += tr.v * dt; if (tr.m.position.x > 230) tr.m.position.x = -230; if (tr.m.position.x < -230) tr.m.position.x = 230; });
      M.tank.emissiveIntensity = 1.7 + .9 * (0.5 + 0.5 * Math.sin(t * 2.3)); tankLight.intensity = 6 + 5 * (0.5 + 0.5 * Math.sin(t * 2.3)); pool.material.opacity = .4 + .22 * Math.sin(t * 2.3);
      if (performance.now() - userAt > 6000) { sph.setFromVector3(camera.position.clone().sub(controls.target)); sph.theta += (base.theta + .1 * Math.sin(t * .22) - sph.theta) * .02; camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph)); }
    }
    controls.update(); composer.render(); placeTag();
    raf = requestAnimationFrame(frame);
  }
  const api = {
    start() { if (opts.still) { api.renderOnce(); return; } running = true; clock.getDelta(); if (!raf) raf = requestAnimationFrame(frame); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    reset() { camera.position.set(...CAM); controls.target.copy(target); userAt = -1e9; controls.update(); },
    renderOnce() { controls.update(); composer.render(); placeTag(); },
  };
  new ResizeObserver(() => { renderer.setSize(W(), H()); composer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); api.renderOnce(); }).observe(el);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && running && !raf) raf = requestAnimationFrame(frame); }).observe(el);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible && running && !raf) raf = requestAnimationFrame(frame); });
  el.classList.add('ready');
  api.renderOnce();
  if (opts.autostart !== false) api.start();
  return api;
};
