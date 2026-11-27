// "The Last Color" – filmischer Stil (Vorlage 2). Alle Abstaende Figur↔Objekt >= 0,1 bei Nahkontakt, sonst >= 0,6.
import { town } from '/stories/sock-thief/shots.js';
import { houseFront } from '/stories/free-bread/shots.js';

const YEL = '#f2c12e';
const ARLO = { eyes: 'round', coat: '#5d77a8', hat: 'beret', hatColor: '#9a2f3a', head: '#f3dfc9', beard: '#fbfaf7', mustache: true, mustacheColor: '#ffffff',
  glasses: '#3b3026', bushy: true, browColor: '#e9e4da', wrinkles: true, expr: 'smile', buttons: '#2f3a52', glove: '#f3dfc9' };
const JUNE = { eyes: 'round', coat: YEL, dress: true, hair: '#c9c3bb', hat: 'none', head: '#f3dfc9', wrinkles: true, blush: true, expr: 'smile', glove: '#f3dfc9' };
const JUNE_HOOD = { ...JUNE, hair: null, hat: 'hood' };
const KEEPER = { eyes: 'round', coat: '#3d2b4a', dress: true, hair: '#a9a39b', hat: 'none', head: '#e9e1d6', glasses: '#d4aa3a', wrinkles: true, expr: 'stern', glove: '#e9e1d6' };
const RICH = { eyes: 'round', coat: '#9b2f7a', hat: 'tophat', hatColor: '#1d1b22', head: '#f6e6d6', mustache: true, mustacheColor: '#3b2a1a', glasses: '#d4aa3a', expr: 'sneer', buttons: '#e2b93b', glove: '#ffffff' };
const JARS = ['#ff4b4b', '#ffd21f', '#3fd16a', '#3f8bff', '#ff8c42', '#b06bff', '#41e0d0', '#ff6fb5'];
const v = (L, a) => new L.THREE.Vector3(...a);
const NIGHT = { tint: [0.92, 0.96, 1.1], vignette: 0.6, contrast: 1.08 };

// ------------------------------------------------------------ Welten
function nightBase(L, bg = '#0d0f1f', fogD = 0.05) { L.post.on = true; L.newScene({ bg }); L.lights({ night: true, sun: [3, 7, 6], shadowSize: 7 }); L.fog('#141832', fogD); L.bloom(0.6, 0.5, 0.85); L.grade(NIGHT); }
function dayBase(L, sky = { top: '#79b4dc', bottom: '#f6dcb8' }) { L.post.on = true; L.newScene(); L.sky(sky); L.lights({ sun: [-5, 9, 8], amb: 1.15, shadowSize: 10 }); L.bloom(0.35, 0.5, 0.9); L.grade({ vignette: 0.42, contrast: 1.05, tint: [1.03, 1.0, 0.96] }); }

/** Farbenladen: Theke z 1.45..2.55 (Oberkante 1.06). Augen-Apparat bei x -0.4. */
function colorShop(L, { liquid = '#3f8bff', fill = 0.4, arlo = true, keeper = true, tube = true, machine = true } = {}) {
  nightBase(L);
  L.room({ w: 11, d: 9, h: 5, wall: '#2c3554', floor: '#5a3a26' });
  const r = L.rand(4);
  for (let row = 0; row < 5; row++) {
    L.scene.add(L.box(9, 0.08, 0.55, '#3a2618', { pos: [0, 0.9 + row * 0.8, -0.2] }));
    for (let i = 0; i < 14; i++) { const j = L.jar(JARS[Math.floor(r() * 8)], { fill: 0.3 + r() * 0.65, s: 0.75, glow: 0.9 + r() * 0.4 }); j.position.set(-4.2 + i * 0.64, 0.95 + row * 0.8, -0.15); L.scene.add(j); }
  }
  const sign = L.note('COLORS\nBOUGHT & SOLD', { w: 2.0, size: 72, color: '#2a1f3a', ink: '#ffd98a' }); sign.position.set(0, 4.55, -0.42); L.scene.add(sign);
  L.desk(0, 2.0, { w: 3.6, color: '#4a2e1e', top: '#6b4a35' });
  L.hangLamp(0.4, 3.5, 2.0, { power: 5, color: '#ffc98a' });
  // Augen-Apparat
  const m = new L.THREE.Group(); m.position.set(-0.4, 1.06, 2.15); if (machine) L.scene.add(m);
  m.add(L.box(0.5, 0.9, 0.4, '#c9a24a', { pos: [0, 0.45, 0] }));
  m.add(L.box(0.56, 0.06, 0.46, '#8a6a2a', { pos: [0, 0.92, 0] }));
  for (const sx of [-0.12, 0.12]) { m.add(L.cyl(0.07, 0.075, 0.15, '#2a2420', { pos: [sx, 0.79, 0.27], rot: [Math.PI / 2, 0, 0] }, 16)); m.add(L.cyl(0.05, 0.05, 0.01, '#9fd1ff', { pos: [sx, 0.79, 0.346], rot: [Math.PI / 2, 0, 0] }, 16)); }
  for (let i = 0; i < 3; i++) m.add(L.ball(0.035, ['#ff4b4b', '#ffd21f', '#3fd16a'][i], { pos: [0.16, 0.2 + i * 0.12, 0.21] }, 8));
  const jarG = L.jar(liquid, { fill, s: 1.2, glow: 1.4 }); jarG.position.set(-1.25, 1.06, 2.0); if (machine) L.scene.add(jarG);
  const stripe = L.canvasTex(64, 8, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 64, 8); c.fillStyle = 'rgba(255,255,255,0.25)'; for (let x = 0; x < 64; x += 16) c.fillRect(x, 0, 8, 8); }, { repeat: [6, 1] });
  const path = new L.THREE.CatmullRomCurve3([v(L, [-0.65, 1.75, 2.15]), v(L, [-0.9, 2.2, 2.1]), v(L, [-1.25, 2.15, 2.0]), v(L, [-1.25, 1.85, 2.0])]);
  const tubeMat = L.noOutline(new L.THREE.MeshBasicMaterial({ color: new L.THREE.Color(liquid).multiplyScalar(1.5), map: stripe }));
  if (tube && machine) L.scene.add(L.mesh(new L.THREE.TubeGeometry(path, 40, 0.035, 10, false), tubeMat, { shadow: false }));
  const out = { jar: jarG, stripe };
  if (keeper) out.keeper = L.place(L.makeChar(KEEPER), 0.5, 0.9, -0.1);
  if (arlo) out.arlo = L.place(L.makeChar({ ...ARLO, expr: 'worried' }), -0.4, 3.1, Math.PI);   // Gesicht 0,125 vor den Okularen
  return out;
}
function studio(L) {
  dayBase(L); L.scene.background = new L.THREE.Color('#e9d8bc');
  L.room({ w: 9, d: 8, h: 4.6, wall: '#c9a27a', stripe: '#d1ab85', floor: '#8a5a3b' });
  L.windowFrame(0, 3.1, -0.47, { night: false, w: 2.2, h: 1.6 });
  L.pointLight('#fff1d6', 3, [0, 3.5, 3], 9);
  const paint = [paintingSun(L), paintingSea(L), paintingPoppies(L)];
  const eas = [[-1.7, 0.9, 0.35], [0.2, 0.45, 0], [2.0, 0.95, -0.35]].map(([x, z, ry], i) => { const e = L.easel(paint[i]); e.position.set(x, 0, z); e.rotation.y = ry; L.scene.add(e); return e; });
  for (let i = 0; i < 5; i++) { const j = L.jar(JARS[i], { s: 0.6, glow: 1.0 }); j.position.set(-3.2 + i * 0.4, 0.95, 0.2); L.scene.add(j); }
  L.scene.add(L.box(2.2, 0.9, 0.6, '#7a5233', { pos: [-2.4, 0.45, 0.2] }));
  return eas;
}
function paintingSun(L) { return L.canvasTex(256, 200, (c) => { const g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#5aa8ff'); g.addColorStop(1, '#bfe3ff'); c.fillStyle = g; c.fillRect(0, 0, 256, 200); c.fillStyle = '#3f9f3a'; c.fillRect(0, 120, 256, 80);
  for (let i = 0; i < 9; i++) { const x = 20 + i * 28, y = 110 + (i % 2) * 18; c.fillStyle = '#2f7f2a'; c.fillRect(x - 1, y, 3, 60); c.fillStyle = '#ffd21f'; c.beginPath(); c.arc(x, y, 11, 0, 7); c.fill(); c.fillStyle = '#5a3a1e'; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
  c.fillStyle = '#ffe680'; c.beginPath(); c.arc(205, 40, 20, 0, 7); c.fill(); }); }
function paintingSea(L) { return L.canvasTex(256, 200, (c) => { const g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#ff9a5a'); g.addColorStop(0.5, '#ffd27a'); g.addColorStop(0.55, '#2f6fd1'); g.addColorStop(1, '#173f8a'); c.fillStyle = g; c.fillRect(0, 0, 256, 200);
  c.fillStyle = '#ffe680'; c.beginPath(); c.arc(128, 100, 26, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 8; i++) c.fillRect(40 + i * 22, 120 + i * 8, 30, 3); }); }
function paintingPoppies(L) { return L.canvasTex(256, 200, (c) => { c.fillStyle = '#8fd46a'; c.fillRect(0, 0, 256, 200); c.fillStyle = '#5fae45'; c.fillRect(0, 100, 256, 100);
  for (let i = 0; i < 26; i++) { c.fillStyle = '#e8343a'; c.beginPath(); c.arc((i * 53) % 256, 110 + (i * 37) % 85, 7, 0, 7); c.fill(); } c.fillStyle = '#ffffff'; c.beginPath(); c.arc(70, 40, 18, 0, 7); c.arc(92, 36, 22, 0, 7); c.fill(); }); }
function garden(L, { june = true, juneCfg = JUNE, juneAt = [0.9, 0.8, -0.5] } = {}) {
  dayBase(L);
  L.scene.add(L.mesh(new L.THREE.PlaneGeometry(200, 200), L.toon('#6fbf4e'), { rot: [-Math.PI / 2, 0, 0], shadow: false }));
  for (let i = 0; i < 14; i++) L.scene.add(L.box(0.12, 0.9, 0.06, '#f2efe6', { pos: [-4 + i * 0.6, 0.45, -2.4] }));
  L.scene.add(L.box(8.5, 0.08, 0.05, '#f2efe6', { pos: [-0.1, 0.7, -2.4] }));
  const house = L.building({ w: 5, h: 5, color: '#d98b6a', seed: 6 }); house.position.set(-1, 0, -6.5); L.scene.add(house);
  L.tree(4, -4.5, 1.6, '#3f9f3a'); L.tree(-5, -4, 1.4, '#4fae45');
  const flowers = [];
  for (let i = 0; i < 9; i++) { const f = L.sunflower(1.35 + (i % 3) * 0.2, 0.95); f.position.set(-2.4 + i * 0.5, 0, -1.3 + (i % 2) * 0.25); L.scene.add(f); flowers.push(f); }
  let j = null; if (june) j = L.place(L.makeChar(juneCfg), juneAt[0], juneAt[1], juneAt[2]);   // >= 1,4 vor den Blumen
  return { june: j, flowers };
}
function bedroom(L, { night = true } = {}) {
  if (night) nightBase(L, '#141832', 0.03); else dayBase(L);
  L.room({ w: 9, d: 8, h: 4.4, wall: night ? '#3f4a7a' : '#a9c2d6', floor: '#7a5233' });
  L.windowFrame(-2.6, 2.6, -0.47, { night });
  const bed = new L.THREE.Group(); bed.position.set(-0.6, 0, 1.2); L.scene.add(bed);
  bed.add(L.box(2.0, 0.5, 2.6, '#7a5233', { pos: [0, 0.35, 0.2] })); bed.add(L.box(1.9, 0.25, 2.5, '#f2efe6', { pos: [0, 0.72, 0.2] }));
  bed.add(L.box(2.0, 1.3, 0.15, '#7a5233', { pos: [0, 0.9, -1.1] })); bed.add(L.box(1.2, 0.22, 0.55, '#ffffff', { pos: [0, 0.95, -0.6] }));
  const june = L.makeChar({ ...JUNE, expr: night ? 'sad' : 'happy', shoes: null }); june.rotation.set(-Math.PI / 2, 0, 0); june.position.set(0, 1.32, 1.45); bed.add(june);
  bed.add(L.box(1.95, 0.85, 1.42, '#5d77a8', { pos: [0, 1.28, 0.89] }));                                   // Decke deckt Beine ab, beginnt hinter dem Kinn
  if (night) L.hangLamp(1.4, 3.2, 1.0, { power: 3, cone: false });
  return { bed, june };
}
function ledger(L, name, rows, { mono = 0 } = {}) {
  nightBase(L, '#2a1d14', 0.0); L.grade({ ...NIGHT, mono, tint: [1.05, 1.0, 0.92] });
  L.scene.add(L.mesh(new L.THREE.PlaneGeometry(20, 20), L.toon('#5a3a26', { map: L.planks([5, 5], '#5a3a26') }), { rot: [-Math.PI / 2, 0, 0], shadow: false }));
  L.pointLight('#ffd9a0', 4, [0.6, 2.2, 0.6], 6);
  const stamps = [];
  const tex = L.canvasTex(512, 720, (c) => {
    c.fillStyle = '#f3ecd9'; c.fillRect(0, 0, 512, 720); c.strokeStyle = 'rgba(80,110,170,0.3)'; c.lineWidth = 2;
    for (let y = 150; y < 720; y += 70) { c.beginPath(); c.moveTo(30, y); c.lineTo(482, y); c.stroke(); }
    L.fitText(c, 'COLOR ACCOUNT', 256, 50, 440, 46, '700 $px "Playfair Display"', '#2a2a2a'); L.fitText(c, name, 256, 100, 440, 34, '400 $px monospace', '#3a3a3a');
    rows.forEach(([col, swatch, state], i) => {
      const y = 185 + i * 70; c.fillStyle = swatch; c.fillRect(40, y - 18, 36, 36); c.strokeStyle = '#333'; c.strokeRect(40, y - 18, 36, 36);
      L.fitText(c, col, 170, y, 160, 40, '700 $px monospace', '#2a2a2a', 'center');
      if (state === 'SOLD') { c.save(); c.translate(380, y); c.rotate(-0.08); c.strokeStyle = '#c8312f'; c.lineWidth = 5; c.strokeRect(-70, -24, 140, 48); L.fitText(c, 'SOLD', 0, 2, 130, 40, '700 $px Fredoka', '#c8312f'); c.restore(); }
      else L.fitText(c, state, 380, y, 160, 44, '700 $px Fredoka', '#d4aa3a');
    });
  });
  const p = L.mesh(new L.THREE.PlaneGeometry(1.4, 1.97), L.toon('#ffffff', { map: tex }), { rot: [-Math.PI / 2, 0, 0.06], pos: [0, 0.01, 0] }); L.thin(p.material); L.scene.add(p);
  return p;
}
function richTown(L) {
  L.post.on = true; L.newScene(); L.sky({ top: '#ff9ad5', bottom: '#ffe6a8' }); L.lights({ sun: [-4, 9, 8], amb: 1.25 }); L.bloom(0.9, 0.7, 0.7);
  L.grade({ sat: 1.45, vignette: 0.4, contrast: 1.06 });
  L.scene.add(L.street({ len: 90, width: 70 })); L.scene.add(L.sidewalkStrip(-35, 35, -1.0, 2.4));
  const PAL = ['#ff5fa2', '#ffd21f', '#3fd1c0', '#ff8c42', '#9b6bff', '#5fd16a', '#ff4b4b'];
  for (let i = 0; i < 9; i++) { const b = L.building({ w: 4, h: 5.4 + (i % 3) * 0.8, color: PAL[i % 7], seed: i + 2, shop: i % 2 === 0, awning: i % 2 === 0 ? [PAL[(i + 2) % 7], '#ffffff'] : null }); b.position.set(-16 + i * 4, 0.12, -3.7); L.scene.add(b); }
  for (let k = 0; k < 40; k++) L.scene.add(L.mesh(new L.THREE.SphereGeometry(0.07, 8, 6), L.noOutline(new L.THREE.MeshBasicMaterial({ color: new L.THREE.Color(PAL[k % 7]).multiplyScalar(2) })), { pos: [-8 + k * 0.4, 4.2 - Math.sin(k * 0.4) * 0.4, -1.8], shadow: false }));
}
function poorTown(L) {
  town(L, { night: false, lampsAt: [-5] }); L.post.on = true; L.fog('#9a9488', 0.04); L.bloom(0.3, 0.5, 0.9);
  L.grade({ sat: 0.12, sepia: 0.55, vignette: 0.55, contrast: 0.95, grain: 0.05 });
}

// ------------------------------------------------------------ Shots
export const shots = {
  hook_extract(L, dur) {
    const S = colorShop(L, { liquid: '#ffd21f', fill: 0.1 });
    return (t) => { const u = t / dur; S.jar.userData.setFill(0.1 + 0.6 * u); S.stripe.offset.x = -t * 2; L.pose(S.arlo, { t }); L.pose(S.keeper, { t });
      L.camMove(u, { from: [-4.3, 2.4, 4.3], to: [-3.8, 2.3, 3.9], look: [-0.8, 1.65, 2.5] }); L.dof(3.4, 0.0025, 0.01); };
  },
  city_night(L, dur) {
    town(L, { night: true, shopIndex: 4, pickSign: 'COLORS · BOUGHT & SOLD', pickColor: '#2a1f3a', lampsAt: [-6, 5.5] }); L.post.on = true; L.fog('#1a2148', 0.04); L.bloom(0.9, 0.7, 0.7); L.grade(NIGHT);
    for (let i = 0; i < 5; i++) { const j = L.jar(JARS[i], { s: 0.7, glow: 2.2 }); j.position.set(-1.1 + i * 0.4, 0.95, -2.05); L.scene.add(j); }
    const rn = L.rain({ cz: 1, x: 8, z: 5, y: 9 });
    return (t) => { rn(t); L.camMove(t / dur, { from: [0.5, 7.5, 12], to: [0.3, 3.0, 7.5], look: [0, 4, -3], lookTo: [0, 2.2, -2], fov: 42 }); L.dof(9, 0.0015, 0.008); };
  },
  shop_sign(L, dur) {
    town(L, { night: true, shopIndex: 4, pickSign: 'COLORS · BOUGHT & SOLD', pickColor: '#2a1f3a' }); L.post.on = true; L.fog('#1a2148', 0.035); L.bloom(1.0, 0.7, 0.65); L.grade(NIGHT);
    for (let i = 0; i < 5; i++) { const j = L.jar(JARS[i + 2], { s: 0.7, glow: 2.2 }); j.position.set(-1.1 + i * 0.4, 0.95, -2.05); L.scene.add(j); }
    const rn = L.rain({ cz: 0, x: 4, z: 3, y: 6 });
    return (t) => { rn(t); L.camMove(t / dur, { from: [-0.2, 1.5, 2.2], to: [0.1, 1.9, 1.6], look: [-0.3, 1.3, -2.1], lookTo: [0, 2.4, -2.1] }); L.dof(3.4, 0.003, 0.01); };
  },
  machine_close(L, dur) {
    const S = colorShop(L, { liquid: '#ff4b4b', fill: 0.2, arlo: false });
    return (t) => { const u = t / dur; S.jar.userData.setFill(0.2 + 0.45 * u); S.stripe.offset.x = -t * 2; L.camMove(u, { from: [-1.5, 2.0, 3.9], to: [-1.4, 1.95, 3.5], look: [-1.0, 1.6, 2.05] }); L.dof(1.7, 0.004, 0.012); };
  },
  park_green(L, dur) {
    dayBase(L); L.scene.add(L.mesh(new L.THREE.PlaneGeometry(200, 200), L.toon('#6fbf4e'), { rot: [-Math.PI / 2, 0, 0], shadow: false }));
    for (const [x, z, s] of [[-2.6, -3, 1.4], [2.4, -4, 1.6], [-6, -8, 1.8], [6, -9, 2], [0, -12, 2.2], [-1.2, 0.8, 1.15], [1.6, 0.2, 1.0]]) L.tree(x, z, s, '#3f9f3a');
    L.scene.add(L.box(1.6, 0.08, 0.5, '#8a5a3b', { pos: [0.2, 0.5, 1.6] })); for (const sx of [-0.6, 1.0]) L.scene.add(L.box(0.08, 0.5, 0.5, '#5a3a26', { pos: [sx, 0.25, 1.6] }));
    return (t) => { const u = t / dur; L.grade({ remove: { g: L.ease((u - 0.15) / 0.6) }, vignette: 0.42, tint: [1.03, 1.0, 0.96] }); L.camMove(u, { from: [0.4, 1.6, 7], to: [0.3, 1.7, 6.2], look: [0, 1.6, 0] }); L.dof(6, 0.0015, 0.008); };
  },
  roses_red(L, dur) {
    dayBase(L); L.scene.add(L.mesh(new L.THREE.PlaneGeometry(200, 200), L.toon('#6fbf4e'), { rot: [-Math.PI / 2, 0, 0], shadow: false }));
    L.scene.add(L.ball(0.8, '#3f8f3a', { pos: [0, 0.6, 0], scale: [1.3, 0.85, 0.8] }, 20));
    const r = L.rand(2); for (let i = 0; i < 16; i++) { const a = r() * Math.PI, b = r() * Math.PI * 0.8; L.scene.add(L.ball(0.12, '#e8343a', { pos: [Math.cos(a) * 0.95, 0.6 + Math.sin(b) * 0.55, Math.sin(a) * 0.55], scale: [1, 0.8, 1] }, 12)); }
    L.tree(-2.5, -3, 1.3, '#3f9f3a');
    return (t) => { const u = t / dur; L.grade({ remove: { r: L.ease((u - 0.1) / 0.6) }, vignette: 0.45 }); L.camMove(u, { from: [0.3, 1.3, 2.9], to: [0.2, 1.15, 2.4], look: [0, 0.75, 0.3] }); L.dof(2.4, 0.004, 0.012); };
  },
  rich_bucket(L, dur) {
    richTown(L);
    const rich = L.place(L.makeChar(RICH), -0.3, -0.4, 0.2, 0.12);
    const bucket = new L.THREE.Group(); bucket.position.set(0.75, 0.12, -0.1); L.scene.add(bucket);        // 0,65 Abstand zur Figur
    bucket.add(L.cyl(0.3, 0.24, 0.5, '#9aa3ad', { pos: [0, 0.25, 0] }, 24));
    bucket.add(L.mesh(new L.THREE.CylinderGeometry(0.28, 0.28, 0.02, 24), L.noOutline(new L.THREE.MeshBasicMaterial({ color: new L.THREE.Color('#ff6fb5').multiplyScalar(2) })), { pos: [0, 0.48, 0], shadow: false }));
    const cup = L.jar('#b06bff', { s: 0.55, glow: 2 }); cup.position.set(0, -0.68, 0.05); rich.userData.parts.armR.add(cup);
    return (t) => { L.pose(rich, { t, armR: [-2.2, 0.1] }); L.camMove(t / dur, { from: [0.6, 1.9, 4.2], to: [0.4, 1.9, 3.6], look: [0.0, 1.7, -0.4] }); L.dof(3.8, 0.003, 0.01); };
  },
  rich_side(L, dur) {
    richTown(L);
    L.crowd(5, -4, 0.2, 2.0, 0.1, 7, { ry: 0, cfg: { eyes: 'round', expr: 'happy' } });
    return (t) => L.camMove(t / dur, { from: [-3, 4.5, 11], to: [2, 3.2, 9.5], look: [0, 2.6, -2] });
  },
  poor_side(L, dur) {
    poorTown(L);
    const p = L.crowd(4, -3.5, -0.5, 2.2, 0.2, 9, { ry: 0.2, cfg: { eyes: 'round', expr: 'sad', coat: '#7d7d7d' } });
    const rn = L.rain({ cz: 0.5, x: 8, z: 4, y: 8, color: '#d8d4c8' });
    return (t) => { rn(t); p.forEach((c) => L.pose(c, { t: t + c.userData.phase })); L.camMove(t / dur, { from: [2, 2.6, 9], to: [-1, 2.3, 8.2], look: [0, 1.8, -1.5] }); };
  },
  poor_kid(L, dur) {
    poorTown(L);
    const mom = L.place(L.makeChar({ eyes: 'round', coat: '#8a8478', dress: true, hair: '#5a4a3a', hat: 'none', expr: 'talk' }), -0.6, -0.2, 0.35, 0.12);
    const kid = L.place(L.makeChar({ eyes: 'round', coat: '#7d8a9a', hat: 'none', hair: '#3a2a1a', expr: 'surprised', scale: 0.68 }), 0.55, 0.1, -0.4, 0.12);   // 1,2 Abstand
    return (t) => { L.pose(mom, { t, armR: [-2.3, 0.3] }); L.pose(kid, { t }); if (Math.floor(t * 6) % 2) mom.userData.setExpr('talk'); else mom.userData.setExpr('smile');
      L.camMove(t / dur, { from: [0.2, 1.5, 4.2], to: [0.1, 1.55, 3.6], look: [0, 1.4, 0] }); L.dof(3.7, 0.003, 0.01); };
  },
  studio_wide(L, dur) {
    studio(L);
    const a = L.place(L.makeChar({ ...ARLO, expr: 'happy' }), 0.2, 1.9, Math.PI);             // Pinsel 0,5 vor der Leinwand
    const brush = L.cyl(0.015, 0.015, 0.45, '#8a5a3b', { pos: [0, -0.72, 0.1], rot: [0.6, 0, 0] }, 6); a.userData.parts.armR.add(brush);
    brush.add(L.ball(0.03, '#ffd21f', { pos: [0, 0.24, 0] }, 8));
    return (t) => { L.pose(a, { t, armR: [-1.3 + Math.sin(t * 3) * 0.12, -0.15] }); L.camMove(t / dur, { from: [2.6, 2.6, 6.4], to: [2.0, 2.4, 5.6], look: [0.2, 1.6, 0.8] }); L.dof(5.2, 0.002, 0.008); };
  },
  palette(L, dur) {
    studio(L);
    const pal = new L.THREE.Group(); pal.position.set(-2.4, 0.9, 0.55); L.scene.add(pal);
    pal.add(L.cyl(0.5, 0.5, 0.03, '#c9a27a', { scale: [1, 1, 0.7] }, 28));
    JARS.forEach((c, i) => { const a = i / JARS.length * Math.PI * 1.6 + 0.4; pal.add(L.ball(0.07, c, { pos: [Math.cos(a) * 0.33, 0.03, Math.sin(a) * 0.22], scale: [1, 0.45, 1] }, 10)); });
    return (t) => L.camMove(t / dur, { from: [-2.1, 2.9, 2.6], to: [-2.2, 2.6, 2.2], look: [-2.4, 0.92, 0.55] });
  },
  yellow_paint(L, dur) {
    studio(L);
    return (t) => { L.camMove(t / dur, { from: [-1.2, 1.75, 2.4], to: [-1.4, 1.75, 1.9], look: [-1.7, 1.45, 0.9] }); L.dof(1.3, 0.004, 0.012); };
  },
  june_rain(L, dur) {
    town(L, {}); L.post.on = true; L.fog('#7c8aa6', 0.045); L.bloom(0.5, 0.6, 0.85); L.grade({ sat: 0.7, tint: [0.92, 0.97, 1.08], vignette: 0.5 });
    L.scene.background = new L.THREE.Color('#8e9ab3');
    const j = L.place(L.makeChar({ ...JUNE_HOOD, expr: 'happy' }), 0, 0.2, 0.15, 0.12);
    const rn = L.rain({ cz: 1, x: 5, z: 4, y: 7, color: '#dfe8ff' });
    return (t) => { rn(t); L.pose(j, { t }); L.grade({ mono: 0.55, keep: { y: 1 }, tint: [0.92, 0.97, 1.08], vignette: 0.5 }); L.camMove(t / dur, { from: [0.3, 1.9, 4.6], to: [0.2, 1.9, 3.9], look: [0, 1.7, 0.2] }); L.dof(3.8, 0.003, 0.012); };
  },
  june_garden(L, dur) {
    const G = garden(L, { juneAt: [0.9, 0.5, -0.7] });
    const can = new L.THREE.Group(); can.add(L.cyl(0.14, 0.16, 0.3, '#5fae9a', {}, 16)); can.add(L.cyl(0.02, 0.03, 0.35, '#5fae9a', { pos: [-0.2, 0.1, 0], rot: [0, 0, 1.0] }, 8));
    can.position.set(0, -0.78, 0.12); G.june.userData.parts.armR.add(can);
    return (t) => { L.pose(G.june, { t, armR: [-0.9, -0.2] }); L.camMove(t / dur, { from: [2.6, 1.9, 5.0], to: [2.0, 1.8, 4.4], look: [0.4, 1.3, -0.4] }); L.dof(4.4, 0.002, 0.009); };
  },
  june_bed(L, dur) {
    bedroom(L);
    const a = L.place(L.makeChar({ ...ARLO, expr: 'worried' }), 1.05, 1.8, -Math.PI / 2 + 0.25);  // 0,65 zur Bettkante (x 0.4)
    return (t) => { L.pose(a, { t }); L.camMove(t / dur, { from: [2.4, 3.7, 3.9], to: [2.2, 3.5, 3.5], look: [0.2, 1.4, 1.2], fov: 55 }); L.dof(3.2, 0.002, 0.008); };
  },
  pharmacy(L, dur) {
    nightBase(L, '#132a2a', 0.03); L.grade({ ...NIGHT, tint: [0.92, 1.05, 1.0] });
    L.room({ w: 9, d: 8, h: 4.4, wall: '#3f6f6a', floor: '#e9e4da' });
    for (let row = 0; row < 3; row++) { L.scene.add(L.box(7, 0.06, 0.4, '#e9e4da', { pos: [0, 1.6 + row * 0.8, -0.25] })); for (let i = 0; i < 12; i++) L.scene.add(L.cyl(0.09, 0.09, 0.3, ['#c98447', '#e9e4da', '#5f8fd1'][i % 3], { pos: [-3 + i * 0.55, 1.78 + row * 0.8, -0.25] }, 12)); }
    L.desk(0, 1.8, { w: 3, color: '#e9e4da', top: '#ffffff' });
    const bottle = new L.THREE.Group(); bottle.position.set(-0.2, 1.06, 1.8); L.scene.add(bottle);
    bottle.add(L.cyl(0.16, 0.16, 0.42, '#8a4a1e', { pos: [0, 0.21, 0] }, 18)); bottle.add(L.cyl(0.08, 0.08, 0.12, '#ffffff', { pos: [0, 0.48, 0] }, 12));
    bottle.add(L.mesh(new L.THREE.PlaneGeometry(0.26, 0.18), L.noOutline(new L.THREE.MeshBasicMaterial({ map: L.canvasTex(128, 90, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 90); L.fitText(c, 'Rx', 64, 45, 100, 60, '700 $px Fredoka', '#c8312f'); }) })), { pos: [0, 0.22, 0.165], shadow: false }));
    const tag = L.note('1 COLOR\n/ WEEK', { w: 0.55, size: 92, color: '#fffbe8', ink: '#c8312f' }); tag.position.set(0.38, 1.25, 1.95); tag.rotation.x = -0.5; L.scene.add(tag);
    L.hangLamp(0.1, 3.2, 1.8, { power: 4, color: '#e8fff6' });
    return (t) => { L.camMove(t / dur, { from: [0.9, 2.3, 4.4], to: [0.6, 2.1, 3.8], look: [0.1, 1.3, 1.85] }); L.dof(2.3, 0.0035, 0.012); };
  },
  sell_green(L, dur) { const S = colorShop(L, { liquid: '#3fd16a', fill: 0.05 }); return (t) => { S.jar.userData.setFill(0.05 + 0.7 * t / dur); S.stripe.offset.x = -t * 3; L.pose(S.arlo, { t }); L.camMove(t / dur, { from: [-2.2, 1.8, 3.2], to: [-2.1, 1.75, 2.9], look: [-1.25, 1.5, 2.0] }); L.dof(1.4, 0.004, 0.012); }; },
  sell_blue(L, dur) { const S = colorShop(L, { liquid: '#3f8bff', fill: 0.05 }); return (t) => { S.jar.userData.setFill(0.05 + 0.7 * t / dur); S.stripe.offset.x = -t * 3; L.camMove(t / dur, { from: [-1.6, 1.6, 2.9], to: [-1.5, 1.6, 2.7], look: [-1.25, 1.4, 2.0] }); L.dof(1.1, 0.005, 0.014); }; },
  sell_red(L, dur) { const S = colorShop(L, { liquid: '#ff4b4b', fill: 0.05 }); return (t) => { S.jar.userData.setFill(0.05 + 0.7 * t / dur); S.stripe.offset.x = -t * 3; L.pose(S.arlo, { t }); L.camMove(t / dur, { from: [1.5, 2.15, 1.25], to: [1.4, 2.1, 1.4], look: [-0.6, 1.75, 2.6] }); L.dof(2.4, 0.003, 0.012); }; },
  paintings_fade(L, dur) {
    studio(L);
    return (t) => { const u = t / dur; L.grade({ remove: { g: L.ease(u / 0.33), b: L.ease((u - 0.33) / 0.33), r: L.ease((u - 0.66) / 0.33) }, vignette: 0.5, tint: [1.03, 1.0, 0.96] });
      L.camMove(u, { from: [-1.7, 1.85, 3.4], to: [2.0, 1.85, 3.4], look: [-1.7, 1.45, 0.9], lookTo: [2.0, 1.45, 0.95], e: (x) => x }); L.dof(2.6, 0.0025, 0.01); };
  },
  ledger_arlo(L, dur) {
    ledger(L, 'ARLO BELL', [['GREEN', '#3fd16a', 'SOLD'], ['BLUE', '#3f8bff', 'SOLD'], ['RED', '#ff4b4b', 'SOLD'], ['YELLOW', '#ffd21f', '★ LEFT']]);
    L.grade({ ...NIGHT, mono: 1, keep: { y: 1 }, tint: [1.05, 1.0, 0.92] });
    return (t) => L.camMove(t / dur, { from: [0.05, 3.9, 0.45], to: [0.03, 3.3, 0.35], look: [0, 0, -0.05], e: L.easeOut });
  },
  jar_yellow(L, dur) {
    const S = colorShop(L, { liquid: '#ffd21f', fill: 0.0, arlo: false });
    const j = L.jar('#ffd21f', { s: 1.1, glow: 1.15 }); j.position.set(0.5, 1.06, 2.2); L.scene.add(j); L.bloom(0.45, 0.5, 0.9);
    return (t) => { L.camMove(t / dur, { from: [0.9, 1.9, 4.0], to: [0.8, 1.8, 3.6], look: [0.5, 1.4, 2.2] }); L.dof(1.5, 0.005, 0.014); };
  },
  keeper_glasses(L, dur) {
    const S = colorShop(L, { arlo: false }); const k = S.keeper;
    const gl = new L.THREE.Group(); for (const sx of [-0.08, 0.08]) gl.add(L.mesh(new L.THREE.TorusGeometry(0.06, 0.008, 6, 20), L.toon('#d4aa3a'), { pos: [sx, 0, 0] }));
    gl.add(L.box(0.06, 0.008, 0.008, '#d4aa3a')); gl.position.set(0, -0.68, 0.12); gl.visible = false; k.userData.parts.armR.add(gl);
    let off = false;
    return (t) => { const u = t / dur;
      if (u > 0.45 && !off) { off = true; k.userData.cfg.glasses = null; k.userData.setExpr('sad'); gl.visible = true; }
      L.pose(k, { t, armR: u > 0.45 ? [-2.3, -0.6] : [-2.5 * L.ease(u / 0.45), -0.45] });
      L.camMove(u, { from: [0.7, 2.0, 3.6], to: [0.6, 1.98, 3.1], look: [0.5, 1.85, 0.9] }); L.dof(2.2, 0.004, 0.012); };
  },
  keeper_talk(L, dur) {
    const S = colorShop(L, { arlo: false }); const k = S.keeper; k.userData.cfg.glasses = null; k.userData.setExpr('sad');
    return (t) => { const e = Math.floor(t * 7) % 2 ? 'talk' : 'sad'; if (k.userData.parts.expr !== e) k.userData.setExpr(e); L.pose(k, { t });
      L.camMove(t / dur, { from: [0.6, 1.95, 2.9], to: [0.55, 1.95, 2.7], look: [0.5, 1.85, 0.9] }); L.dof(1.9, 0.005, 0.012); };
  },
  arlo_close(L, dur) {
    const S = colorShop(L, { keeper: false, tube: false, machine: false }); S.arlo.rotation.y = Math.PI; S.arlo.userData.setExpr('sad');
    return (t) => { L.pose(S.arlo, { t }); L.camMove(t / dur, { from: [0.15, 1.97, 0.75], to: [0.05, 1.95, 1.05], look: [-0.4, 1.85, 3.1] }); L.dof(2.2, 0.004, 0.012); };
  },
  sell_yellow(L, dur) {
    const S = colorShop(L, { liquid: '#ffd21f', fill: 0.05 });
    return (t) => { const u = t / dur; S.jar.userData.setFill(0.05 + 0.75 * u); S.stripe.offset.x = -t * 3; L.pose(S.arlo, { t });
      L.grade({ ...NIGHT, mono: L.ease((u - 0.35) / 0.6) }); L.camMove(u, { from: [-3.9, 2.2, 4.6], to: [-3.6, 2.15, 4.2], look: [-0.8, 1.7, 2.6] }); L.dof(3.2, 0.0025, 0.01); };
  },
  june_better(L, dur) {
    const B = bedroom(L, { night: false });
    const vase = new L.THREE.Group(); vase.position.set(1.4, 0, 0.2); L.scene.add(vase);
    vase.add(L.box(0.8, 0.9, 0.6, '#7a5233', { pos: [0, 0.45, 0] })); vase.add(L.cyl(0.12, 0.09, 0.3, '#5fae9a', { pos: [0, 1.05, 0] }, 14));
    for (let i = 0; i < 3; i++) { const f = L.sunflower(0.5, 0.45); f.position.set(-0.08 + i * 0.08, 1.1, 0); vase.add(f); }
    return (t) => L.camMove(t / dur, { from: [1.7, 2.8, 3.8], to: [1.5, 2.6, 3.4], look: [-0.5, 1.35, 0.9] });
  },
  june_door(L, dur) {
    dayBase(L, { top: '#9cc9e8', bottom: '#fff1d6' });
    L.scene.add(L.street({ len: 60, width: 60 })); L.scene.add(L.sidewalkStrip(-30, 30, -0.25, 2.5));
    const H = houseFront(L, 0, '#d98b6a'); H.pivot.rotation.y = 1.5;
    for (const x of [-3.2, 3.2]) houseFront(L, x, x < 0 ? '#8fb07a' : '#7d9bc1');
    const j = L.place(L.makeChar({ ...JUNE, expr: 'smile' }), 0.08, -1.65, 0, 0.12);             // Haende hinten: links 0,045 zur Tuer, rechts 0,04 zur Flurwand
    return (t) => { L.pose(j, { t, armL: [0.45, -0.3], armR: [0.45, 0.3] }); L.camMove(t / dur, { from: [0.4, 1.9, 4.8], to: [0.25, 1.85, 3.8], look: [0.05, 1.6, -1.6] }); L.dof(5, 0.002, 0.009); };
  },
  jar_reveal(L, dur) {
    shots.june_door(L, dur); const j = L.scene.children.filter((c) => c.userData && c.userData.parts).at(-1);
    const jar = L.jar('#ffd21f', { s: 0.75, glow: 2.4 }); jar.position.set(0, -0.62, 0.1); j.userData.parts.armR.add(jar);
    return (t) => { L.pose(j, { t, armR: [-1.45, 0.12] });                                         // Glas vorne (Schnitt statt Schwenk – kein Durchdringen)
      L.camMove(t / dur, { from: [0.65, 1.55, 1.5], to: [0.55, 1.5, 1.05], look: [0.3, 1.25, -1.05] }); L.dof(2.2, 0.005, 0.014); };
  },
  june_smile(L, dur) {
    shots.june_door(L, dur); const j = L.scene.children.filter((c) => c.userData && c.userData.parts).at(-1); j.userData.setExpr('happy');
    const jar = L.jar('#ffd21f', { s: 0.75, glow: 2.4 }); jar.position.set(0, -0.62, 0.1); j.userData.parts.armR.add(jar);
    return (t) => { L.pose(j, { t, armR: [-1.4, 0.12] }); L.camMove(t / dur, { from: [0.2, 1.95, 0.9], to: [0.15, 1.92, 0.7], look: [0.05, 1.75, -1.65] }); L.dof(2.4, 0.004, 0.012); };
  },
  june_smile2(L, dur) {
    shots.june_door(L, dur); const j = L.scene.children.filter((c) => c.userData && c.userData.parts).at(-1); j.userData.setExpr('smile');
    const jar = L.jar('#ffd21f', { s: 0.75, glow: 2.4 }); jar.position.set(0, -0.62, 0.1); j.userData.parts.armR.add(jar);
    return (t) => { L.pose(j, { t, armR: [-1.4, 0.12], nod: 0.3 }); L.camMove(t / dur, { from: [-0.4, 1.8, 1.4], to: [-0.3, 1.8, 1.1], look: [0.05, 1.7, -1.65] }); L.dof(2.9, 0.004, 0.012); };
  },
  arlo_pov_raincoat(L, dur) {
    shots.june_door(L, dur); const j = L.scene.children.filter((c) => c.userData && c.userData.parts).at(-1); j.userData.setExpr('smile');
    return (t) => { const u = t / dur; L.pose(j, { t, armR: [-0.2, 0.3] }); L.grade({ mono: 1, keep: { y: L.ease((u - 0.1) / 0.5) }, vignette: 0.55 }); L.bloom(0.35 + 0.5 * L.ease(u), 0.6, 0.8);
      L.camMove(u, { from: [0.1, 1.85, 2.6], to: [0.08, 1.85, 2.2], look: [0.05, 1.5, -1.65] }); L.dof(3.8, 0.003, 0.01); };
  },
  arlo_tears(L, dur) {
    dayBase(L, { top: '#9cc9e8', bottom: '#fff1d6' }); L.scene.background = new L.THREE.Color('#c9a27a');
    L.room({ w: 9, d: 8, h: 4.4, wall: '#c9a27a', stripe: '#d1ab85', floor: '#8a5a3b' });
    const a = L.place(L.makeChar({ ...ARLO, expr: 'cry' }), 0, 1.2, 0.1);
    return (t) => { L.pose(a, { t }); L.camMove(t / dur, { from: [0.15, 1.95, 3.3], to: [0.1, 1.95, 2.95], look: [0, 1.85, 1.2] }); L.dof(1.8, 0.005, 0.012); };
  },
  june_squint(L, dur) {
    shots.june_door(L, dur); const j = L.scene.children.filter((c) => c.userData && c.userData.parts).at(-1); j.userData.setExpr('squint');
    const jar = L.jar('#ffd21f', { s: 0.75, glow: 2.4 }); jar.position.set(0, -0.62, 0.1); j.userData.parts.armR.add(jar);
    return (t) => { jar.rotation.z = Math.sin(t * 2.2) * 0.35; L.pose(j, { t, armR: [-1.75, 0.2], look: 0.25 });
      L.camMove(t / dur, { from: [0.6, 2.0, 1.1], to: [0.5, 1.98, 0.85], look: [0.1, 1.8, -1.6] }); L.dof(2.6, 0.004, 0.012); };
  },
  ledger_june(L, dur) {
    ledger(L, 'JUNE BELL', [['GREEN', '#3fd16a', 'SOLD'], ['BLUE', '#3f8bff', 'SOLD'], ['RED', '#ff4b4b', 'SOLD'], ['YELLOW', '#ffd21f', 'SOLD']], { mono: 1 });
    return (t) => L.camMove(t / dur, { from: [0.08, 3.9, 0.45], to: [0.04, 3.3, 0.35], look: [0, 0, -0.05], roll: 0.04, e: L.easeOut });
  },
  ledger_stamps(L, dur) {
    ledger(L, 'JUNE BELL', [['GREEN', '#3fd16a', 'SOLD'], ['BLUE', '#3f8bff', 'SOLD'], ['RED', '#ff4b4b', 'SOLD'], ['YELLOW', '#ffd21f', 'SOLD']], { mono: 0 });
    return (t) => { const u = t / dur; L.grade({ ...NIGHT, mono: 0, tint: [1.05, 1.0, 0.92] }); L.camMove(u, { from: [0.3, 1.9, 0.9], to: [0.25, 1.8, -0.15], look: [0.1, 0, 0.45], lookTo: [0.1, 0, -0.5], e: (x) => x }); L.dof(1.85, 0.004, 0.012); };
  },
  garden_gray(L, dur) {
    const G = garden(L, { juneAt: [0.3, 0.3, 0.1] }); L.grade({ mono: 1, vignette: 0.5 });
    return (t) => { L.pose(G.june, { t, nod: 0.2, armR: [-0.7, -0.1] }); L.camMove(t / dur, { from: [-1.4, 2.0, 4.6], to: [-1.0, 1.9, 4.0], look: [0, 1.2, -0.6] }); L.dof(4.4, 0.002, 0.009); };
  },
  garden_final(L, dur) {
    const G = garden(L, { juneAt: [0.3, 0.3, 0.1] }); L.grade({ mono: 1, keep: { y: 1 }, vignette: 0.55 }); L.bloom(0.6, 0.6, 0.8);
    const a = L.place(L.makeChar({ ...ARLO, expr: 'smile' }), -1.2, 2.4, 2.56);                 // links vorne, 2,7 Abstand zu June
    return (t) => { const u = t / dur; L.pose(G.june, { t, nod: 0.2, armR: [-0.7, -0.1] }); L.pose(a, { t });
      L.camMove(u, { from: [4.4, 2.5, 3.6], to: [5.0, 3.1, 6.2], look: [0.3, 1.3, 0.1], lookTo: [0.3, 1.2, -0.4] }); L.dof(5.5 + 2.5 * u, 0.0018, 0.008); };
  },
};
