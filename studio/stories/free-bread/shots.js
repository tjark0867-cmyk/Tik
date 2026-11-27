// "The Free Bread" – alle Einstellungen. Kollisionsregeln: Figuren >= 0,6 von Requisiten, keine Durchdringungen.
import { town, boardScene, hand } from '/stories/sock-thief/shots.js';

const HOUSE = ['#c96f5a', '#e0b25c', '#6fa3a0', '#d98b6a', '#8fb07a', '#b5838d', '#7d9bc1'];
const CRUMB = { coat: '#f2efe6', hat: 'chef', mustache: true, mustacheColor: '#8a5a3b', expr: 'happy', buttons: '#c8312f', blush: true };
const MAN = { coat: '#4f7fa8', hat: 'flatcap', hatColor: '#4f5d7a', expr: 'surprised', mustache: true };
const WOMAN = { coat: '#c4573f', dress: true, hair: '#6b3f22', hat: 'none', expr: 'happy' };
const KID = { coat: '#55a14f', hat: 'none', hair: '#c98b3d', expr: 'happy', scale: 0.7 };
const MORNING = { top: '#f7b77a', bottom: '#fff1d6' };

// ------------------------------------------------------------ Bausteine
/** Hausfront mit echter Tueroeffnung (x -0.65..0.65, Hoehe 2.7), Front bei lokal z = 0. */
function houseFront(L, x, color, { open = 0, night = false, loaf = false, seed = 1 } = {}) {
  const T = L.THREE, g = new T.Group(); g.position.set(x, 0.12, -1.5);
  const wall = L.toon(color), trim = '#f1e6d2';
  g.add(L.box(0.95, 4.4, 0.3, wall, { pos: [-1.125, 2.2, -0.15] }));
  g.add(L.box(0.95, 4.4, 0.3, wall, { pos: [1.125, 2.2, -0.15] }));
  g.add(L.box(1.3, 1.7, 0.3, wall, { pos: [0, 3.55, -0.15] }));
  for (const sx of [-0.69, 0.69]) g.add(L.box(0.08, 2.78, 0.1, trim, { pos: [sx, 1.39, 0.02] }));
  g.add(L.box(1.46, 0.1, 0.1, trim, { pos: [0, 2.74, 0.02] }));
  g.add(L.box(3.3, 0.16, 0.5, trim, { pos: [0, 4.45, 0] }));
  g.add(L.box(1.4, 2.8, 0.05, night ? '#1d1a26' : '#4a3426', { pos: [0, 1.4, -2.3] }));       // Flur hinten
  g.add(L.box(1.3, 0.04, 2.3, '#6b4a35', { pos: [0, 0.02, -1.15] }));                          // Flurboden
  for (const sx of [-0.7, 0.7]) g.add(L.box(0.05, 2.8, 2.0, night ? '#2a2433' : '#7a5a44', { pos: [sx, 1.4, -1.3] }));
  g.add(L.box(1.45, 0.05, 2.0, night ? '#2a2433' : '#6b4a35', { pos: [0, 2.76, -1.3] }));
  const pivot = new T.Group(); pivot.position.set(-0.65, 0, -0.06); g.add(pivot);
  pivot.add(L.box(1.3, 2.7, 0.08, '#5a3424', { pos: [0.65, 1.35, 0] }));
  pivot.add(L.ball(0.05, '#e2b93b', { pos: [1.15, 1.25, 0.06] }, 10));
  pivot.rotation.y = open * 1.5;
  g.add(L.box(1.7, 0.2, 0.62, '#b8afa2', { pos: [0, 0.1, 0.31] }));                            // Stufe
  const win = L.windowFrame(0, 0, 0, { w: 0.62, h: 0.9, night }); L.scene.remove(win); win.position.set(1.12, 1.9, 0.01); g.add(win);
  g.add(L.cyl(0.16, 0.12, 0.3, '#b5673e', { pos: [-1.15, 0.15, 0.3] }, 14)); g.add(L.ball(0.2, '#55a14f', { pos: [-1.15, 0.42, 0.3] }, 12));
  let lf = null; if (loaf) { lf = L.loaf(0.8); lf.position.set(0.25, 0.2, 0.32); lf.rotation.y = 0.3; g.add(lf); }
  L.scene.add(g); return { g, pivot, loaf: lf };
}
function doorRow(L, { night = false, loaves = true, morning = true } = {}) {
  L.newScene();
  if (night) { L.sky({ night: true }); L.lights({ night: true, sun: [4, 8, 9] }); L.stars(); L.moon([8, 16, -40], 2.2); }
  else { L.sky(morning ? MORNING : {}); L.lights({ sun: [-5, 9, 9], amb: 1.1, warm: morning ? '#ffe2b8' : '#fff1dc' }); }
  L.scene.add(L.street({ len: 60, width: 60, night }));
  L.scene.add(L.sidewalkStrip(-30, 30, -0.25, 2.5, night));
  const houses = [];
  for (let i = -3; i <= 3; i++) houses.push(houseFront(L, i * 3.2, HOUSE[(i + 3) % 7], { night, loaf: loaves, seed: i + 5 }));
  if (night) L.pointLight('#ffc977', 4, [0, 3.2, 1.5], 7);
  return houses;
}
function steam(L, x, y, z) {
  const puffs = []; for (let i = 0; i < 6; i++) { const m = L.mesh(new L.THREE.SphereGeometry(0.03, 10, 8), L.noOutline(new L.THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false })), { shadow: false }); L.scene.add(m); puffs.push(m); }
  return (t) => puffs.forEach((p, i) => { const k = ((t * 0.6 + i / 6) % 1); p.position.set(x + Math.sin(k * 6 + i) * 0.08 + (i % 2 ? 0.06 : -0.06), y + k * 0.7, z); p.scale.setScalar(1 + k * 2); p.material.opacity = 0.35 * (1 - k); });
}
function kitchen(L, { night = false } = {}) {
  L.newScene({ bg: night ? '#1d2140' : '#e8d9b8' }); L.lights({ night, sun: [-3, 8, 7], amb: 1.15, shadowSize: 6 });
  L.room({ w: 9, d: 8, h: 4.4, wall: night ? '#5a4f7d' : '#e0b25c', stripe: night ? null : '#e8bf6c', floor: '#9a6a44' });
  L.windowFrame(2.6, 2.5, -0.47, { night, w: 1.3, h: 1.4 });
  L.desk(0, 1.6, { w: 2.8, color: '#7a5233', top: '#f2efe6' });
}
function bakery(L, { night = false, crumb = true, full = true } = {}) {
  L.newScene({ bg: '#e8d9b8' }); L.lights({ night, sun: [3, 8, 7], amb: 1.15, shadowSize: 6 });
  L.room({ w: 10, d: 8, h: 4.6, wall: crumb ? '#d98b6a' : '#9fb8a0', stripe: crumb ? '#e09a7a' : '#a9c2aa', floor: '#8a5a3b' });
  const r = L.rand(crumb ? 3 : 8);
  for (let row = 0; row < 3; row++) {
    L.scene.add(L.box(8, 0.1, 0.6, '#7a5233', { pos: [0, 1.6 + row * 0.9, -0.2] }));
    for (let i = 0; i < 10; i++) if (full || r() < 0.15) { const lf = L.loaf(0.7, ['#d9964a', '#c98447', '#e0a85a'][i % 3]); lf.position.set(-3.6 + i * 0.8, 1.65 + row * 0.9, -0.15); L.scene.add(lf); }
  }
  L.desk(0, 1.8, { w: 3.4, color: '#7a5233', top: '#a0764d' });
  if (crumb) { const s = L.note("CRUMB'S BAKERY", { w: 2.2, size: 70, color: '#f6efd8', ink: '#7a2f2a' }); s.position.set(0, 4.15, -0.42); L.scene.add(s); }
}
function priceBoard(L, price) { boardScene(L, [['FRESH BREAD', 60], [price, 150]], { shop: true, pickSign: "CRUMB'S BAKERY" }); }
function closedShop(L, color, name) {
  town(L, {});
  const b = L.building({ w: 4, h: 5.4, color, shop: true, sign: name, signColor: '#2f5d4f', awning: ['#7d7d7d', '#e6e0d4'], seed: 9 });
  b.position.set(0, 0.12, -1.0); L.scene.add(b);
  const sign = L.note('CLOSED', { w: 0.7, size: 120, color: '#f6efd8', ink: '#c8312f' }); sign.position.set(1.16, 1.15, 0.57); sign.rotation.z = 0.06; L.scene.add(sign);
  L.scene.add(L.cyl(0.006, 0.006, 0.5, '#2b2b2b', { pos: [1.16, 1.48, 0.56], rot: [0, 0, 0.9] }, 4));
  return sign;
}

// ------------------------------------------------------------ Shots
export const shots = {
  town_morning(L, dur) {
    town(L, { lampsAt: [-6, 6] }); L.sky(MORNING);
    return (t) => L.camMove(t / dur, { from: [1.5, 8.5, 13], to: [0.5, 3.4, 8.5], look: [0, 4.5, -3], lookTo: [0, 2.3, -2], fov: 42 });
  },
  doorstep_bread(L, dur) {
    doorRow(L);
    return (t) => L.camMove(t / dur, { from: [0.6, 2.2, 4.8], to: [0.4, 1.3, 2.4], look: [0.1, 1.0, -1.4], lookTo: [0.2, 0.45, -1.15], e: L.easeOut });
  },
  bread_steam(L, dur) {
    doorRow(L); const st = steam(L, 0.25, 0.55, -1.18);
    return (t) => { st(t); L.camMove(t / dur, { from: [0.55, 0.75, 0.2], to: [0.45, 0.7, -0.05], look: [0.25, 0.4, -1.18] }); };
  },
  man_door(L, dur) {
    const hs = doorRow(L); hs[3].pivot.rotation.y = 1.5;
    const m = L.place(L.makeChar(MAN), 0.08, -1.65, 0, 0.12);                    // in der Tuerlaibung, Tuer innen offen
    return (t) => { L.pose(m, { t, armL: [0, -0.1], armR: [0, 0.1], lean: 0.08, look: 0.05 }); L.camMove(t / dur, { from: [0.3, 1.9, 3.6], to: [0.2, 1.85, 3.1], look: [0.05, 1.5, -1.6] }); };
  },
  doorsteps_row(L, dur) {
    doorRow(L);
    return (t) => L.camMove(t / dur, { from: [-6.6, 2.0, 5.2], to: [3.0, 2.0, 5.2], look: [-6.4, 1.2, -1.4], lookTo: [3.2, 1.2, -1.4], e: (x) => x });
  },
  family_table(L, dur) {
    kitchen(L);
    const lf = L.loaf(1); lf.position.set(0.3, 1.07, 2.0); L.scene.add(lf);
    const a = L.place(L.makeChar({ ...MAN, expr: 'happy' }), -1.0, 0.5, 0.1);
    const b = L.place(L.makeChar(WOMAN), 0.0, 0.5, 0);
    const c = L.place(L.makeChar(KID), 1.0, 0.55, -0.1);
    return (t) => { L.pose(a, { t, nod: 0.3 }); L.pose(b, { t: t + 1 }); L.pose(c, { t: t + 2, armR: L.ARM.wave(t) }); L.camMove(t / dur, { from: [0, 2.3, 6.0], to: [0, 2.2, 5.2], look: [0, 1.6, 1.0] }); };
  },
  night_hand(L, dur) {
    doorRow(L, { night: true, loaves: false });
    const lf = L.loaf(0.8); L.scene.add(lf); const hd = hand(L, '#f2efe6');
    return (t) => {
      const u = t / dur, down = L.ease(u / 0.5), up = L.ease((u - 0.6) / 0.4);
      const y = 0.32 + 1.1 * (1 - down) + 1.4 * up;
      lf.position.set(0.25, u < 0.55 ? y - 0.12 : 0.32, -1.18); lf.rotation.y = 0.3;
      hd.position.set(0.35, y + 0.1, -1.05); hd.rotation.set(0.2, 0, -0.5);
      L.camMove(u, { from: [0.9, 1.3, 1.4], to: [0.8, 1.2, 1.1], look: [0.25, 0.55, -1.2] });
    };
  },
  bakery_empty(L, dur) {
    bakery(L, { crumb: false, full: false });
    const b = L.place(L.makeChar({ coat: '#f2efe6', hat: 'chef', expr: 'sad', mustache: true }), 0, 0.7, 0);
    return (t) => { L.pose(b, { t }); L.camMove(t / dur, { from: [-1.0, 2.4, 6.6], to: [-0.6, 2.3, 5.8], look: [0, 1.8, 1.0] }); };
  },
  woman_walk(L, dur) {
    town(L, {});                                                                  // keine Laternen auf dem Weg
    const w = L.place(L.makeChar(WOMAN), -2.0, -0.6, Math.PI / 2, 0.12);
    const lf = L.loaf(0.6); lf.position.set(0, -0.68, 0.12); lf.rotation.set(0, Math.PI / 2, 0); w.userData.parts.armR.add(lf);
    return (t) => { L.moveTo(w, -2.0 + t * 0.85, -0.6); L.pose(w, { t, walk: 0.9, armR: [-0.6, 0.15] }); L.camMove(t / dur, { from: [-1.4, 1.8, 4.6], to: [0.0, 1.8, 4.4], look: [-1.6, 1.6, -0.6], lookTo: [-0.2, 1.6, -0.6] }); };
  },
  closed_1(L, dur) { closedShop(L, '#9fb8a0', 'ROSE BAKERY'); return (t) => L.camMove(t / dur, { from: [0.4, 1.9, 4.2], to: [0.9, 1.4, 2.6], look: [0.4, 1.9, -0.5], lookTo: [1.1, 1.2, 0.5] }); },
  closed_2(L, dur) { closedShop(L, '#b5838d', 'BAKER BROS'); return (t) => L.camMove(t / dur, { from: [1.6, 1.5, 2.6], to: [1.35, 1.3, 2.1], look: [1.15, 1.25, 0.5] }); },
  closed_3(L, dur) { closedShop(L, '#7d9bc1', 'THE BREAD BOX'); return (t) => L.camMove(t / dur, { from: [0.7, 1.2, 2.2], to: [0.9, 1.2, 1.8], look: [1.15, 1.15, 0.5], roll: 0.05 }); },
  board_left(L, dur) { boardScene(L, [['BAKERIES LEFT', 58], ['1', 170]]); return (t) => L.camMove(t / dur, { from: [0.2, 1.7, 4.3], to: [0.1, 1.55, 3.4], look: [0, 1.45, 0.2] }); },
  crumb_shop(L, dur) {
    town(L, { shopIndex: 4, pickSign: "CRUMB'S BAKERY", lampsAt: [-2.6] });
    for (let i = 0; i < 4; i++) { const lf = L.loaf(0.55); lf.position.set(-1.25 + i * 0.36, 0.95, -2.05); L.scene.add(lf); }
    L.scene.add(L.box(1.6, 0.06, 0.3, '#7a5233', { pos: [-0.7, 0.92, -2.05] }));
    const c = L.place(L.makeChar(CRUMB), 0.9, -0.9, 0.2, 0.12);
    return (t) => { L.pose(c, { t }); L.camMove(t / dur, { from: [0, 3.6, 10.5], to: [0.2, 2.6, 7.0], look: [0, 2.6, -2.5], lookTo: [0.3, 2.0, -1.5] }); };
  },
  crumb_wave(L, dur) {
    town(L, { shopIndex: 4, pickSign: "CRUMB'S BAKERY" });
    const c = L.place(L.makeChar(CRUMB), 0.9, -0.9, 0.2, 0.12);
    return (t) => { L.pose(c, { t, armR: L.ARM.wave(t) }); L.camMove(t / dur, { from: [1.2, 2.1, 3.0], to: [1.0, 2.05, 2.4], look: [0.85, 1.95, -0.9] }); };
  },
  doorsteps_empty(L, dur) {
    doorRow(L, { loaves: false });
    return (t) => L.camMove(t / dur, { from: [-6.6, 2.0, 5.2], to: [3.0, 2.0, 5.2], look: [-6.4, 1.2, -1.4], lookTo: [3.2, 1.2, -1.4], e: (x) => x });
  },
  man_sad(L, dur) {
    const hs = doorRow(L, { loaves: false }); hs[3].pivot.rotation.y = 1.5;
    const m = L.place(L.makeChar({ ...MAN, expr: 'sad' }), 0.08, -1.65, 0, 0.12);
    return (t) => { L.pose(m, { t, armL: [0, -0.1], armR: [0, 0.1], lean: 0.12 }); L.camMove(t / dur, { from: [0.9, 1.4, 2.6], to: [0.6, 1.5, 2.2], look: [0.1, 1.3, -1.5] }); };
  },
  queue(L, dur) {
    town(L, { shopIndex: 4, pickSign: "CRUMB'S BAKERY" });
    const q = L.crowd(12, 1.3, -0.6, 1.25, 0.03, 51, { ry: -Math.PI / 2, expr: 'neutral' });
    return (t) => { q.forEach((p) => L.pose(p, { t: t + p.userData.phase })); L.camMove(t / dur, { from: [13.5, 3.2, 4.6], to: [3.5, 2.6, 4.8], look: [10.5, 1.5, -0.6], lookTo: [0.5, 1.6, -0.8] }); };
  },
  crumb_counter(L, dur) {
    bakery(L);
    const c = L.place(L.makeChar(CRUMB), 0, 0.7, 0);
    return (t) => { const u = t / dur; if (u > 0.5 && c.userData.parts.expr !== 'smug') c.userData.setExpr('smug'); L.pose(c, { t }); L.camMove(u, { from: [0.4, 2.0, 4.4], to: [0.25, 1.95, 3.6], look: [0, 1.8, 0.7] }); };
  },
  price_10(L, dur) { priceBoard(L, '10¢'); return (t) => L.camMove(t / dur, { from: [0.4, 1.7, 4.0], to: [0.2, 1.6, 3.4], look: [0, 1.45, 0.2] }); },
  price_20(L, dur) { priceBoard(L, '20¢'); return (t) => L.camMove(t / dur, { from: [-0.3, 1.6, 3.3], to: [-0.2, 1.6, 2.9], look: [0, 1.45, 0.2], roll: 0.05 }); },
  price_30(L, dur) { priceBoard(L, '30¢'); return (t) => L.camMove(t / dur, { from: [0, 1.55, 3.0], to: [0, 1.5, 2.6], look: [0, 1.45, 0.2], e: L.easeOut }); },
  bread_table(L, dur) {
    kitchen(L); const lf = L.loaf(1.2); lf.position.set(0.1, 1.07, 1.7); lf.rotation.y = -0.3; L.scene.add(lf); const st = steam(L, 0.1, 1.5, 1.7);
    return (t) => { st(t); L.camMove(t / dur, { from: [0.6, 2.4, 3.6], to: [0.4, 2.0, 2.9], look: [0.1, 1.25, 1.7], e: L.easeOut }); };
  },
  oven_night(L, dur) {
    L.newScene({ bg: '#1b1424' }); L.lights({ night: true, sun: [2, 7, 6], shadowSize: 6 });
    L.room({ w: 10, d: 8, h: 4.6, wall: '#6b3f3a', floor: '#6b4a35' });
    const oven = new L.THREE.Group(); oven.position.set(-1.2, 0, 0.3); L.scene.add(oven);
    oven.add(L.box(2.6, 2.6, 1.4, '#9a4a3a', { pos: [0, 1.3, 0] })); oven.add(L.box(2.8, 0.2, 1.5, '#7a3a2e', { pos: [0, 2.7, 0] }));
    oven.add(L.mesh(new L.THREE.PlaneGeometry(1.2, 0.8), L.noOutline(new L.THREE.MeshBasicMaterial({ color: '#ffb347' })), { pos: [0, 1.2, 0.71], shadow: false }));
    oven.add(L.box(0.6, 1.6, 0.6, '#9a4a3a', { pos: [0.8, 3.6, -0.2] }));
    L.pointLight('#ff9a3c', 10, [-1.2, 1.3, 1.6], 7);
    L.desk(1.6, 1.8, { w: 2.2, color: '#5a3a26', top: '#8a6a4a' });
    for (let i = 0; i < 8; i++) { const lf = L.loaf(0.55); lf.position.set(0.9 + (i % 4) * 0.45, 1.07, 1.6 + Math.floor(i / 4) * 0.45); L.scene.add(lf); }
    return (t) => L.camMove(t / dur, { from: [2.6, 2.4, 6.4], to: [1.4, 2.2, 5.4], look: [0, 1.4, 0.8] });
  },
  crumb_baking(L, dur) {
    shots.oven_night(L, dur);
    const c = L.place(L.makeChar({ ...CRUMB, expr: 'sneaky' }), 1.6, 0.6, -0.15);   // hinter dem Tisch (Tischkante z 1.25)
    return (t) => { L.pose(c, { t, nod: 0.2 }); L.camMove(t / dur, { from: [2.2, 2.1, 4.6], to: [1.9, 2.05, 3.8], look: [1.5, 1.8, 0.8] }); };
  },
  calendar(L, dur) {
    L.newScene({ bg: '#6fa3a0' }); L.lights({ sun: [1, 5, 8], amb: 1.2, shadowSize: 4 });
    L.room({ w: 8, d: 6, h: 5, wall: '#6fa3a0', sideWalls: false });
    const months = ['OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'];
    const pages = months.map((m, i) => {
      const tex = L.canvasTex(400, 460, (c) => { c.fillStyle = '#f6f1e3'; c.fillRect(0, 0, 400, 460); c.fillStyle = '#c8312f'; c.fillRect(0, 0, 400, 110); L.fitText(c, m, 200, 58, 360, 64, '700 $px Fredoka', '#fff');
        for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) { const n = r * 7 + k + 1; L.fitText(c, n <= 30 ? String(n) : '', 40 + k * 53, 150 + r * 62, 50, 30, '700 $px Fredoka', '#6b6457'); } });
      const pivot = new L.THREE.Group(); pivot.position.set(0, 3.2, -0.4 + 0.01 * (months.length - i));
      const p = L.mesh(new L.THREE.PlaneGeometry(1.6, 1.84), L.toon('#ffffff', { map: tex, side: L.THREE.DoubleSide }), { pos: [0, -0.92, 0] }); L.thin(p.material);
      pivot.add(p); L.scene.add(pivot); return pivot;
    });
    L.scene.add(L.box(1.7, 0.12, 0.08, '#7a5233', { pos: [0, 3.22, -0.38] }));
    return (t) => {
      const u = t / dur, per = 1 / (months.length - 1);
      pages.forEach((p, i) => { const k = L.ease((u - i * per * 0.9) / (per * 0.8)); p.rotation.x = i < months.length - 1 ? -k * 2.6 : 0; p.visible = k < 0.98 || i === months.length - 1; });
      L.camMove(u, { from: [0, 2.35, 3.2], to: [0, 2.35, 2.9], look: [0, 2.3, -0.4] });
    };
  },
  crumb_rich(L, dur) {
    bakery(L);
    const c = L.place(L.makeChar({ ...CRUMB, expr: 'laugh' }), 0, 0.7, 0);
    for (let s = 0; s < 5; s++) for (let k = 0; k < 4 + s; k++) L.scene.add(L.cyl(0.11, 0.11, 0.04, '#e2b93b', { pos: [-1.2 + s * 0.3, 1.09 + k * 0.045, 2.0] }, 16));
    L.scene.add(L.box(0.7, 0.5, 0.5, '#b8862f', { pos: [1.1, 1.32, 1.7] }));
    return (t) => { L.pose(c, { t, laugh: 0.6 }); L.camMove(t / dur, { from: [-0.6, 2.3, 5.4], to: [-0.3, 2.2, 4.6], look: [0, 1.6, 1.2] }); };
  },
  window_miss(L, dur) {
    kitchen(L);
    const w = L.place(L.makeChar({ ...WOMAN, expr: 'sad' }), 0, 0.5, 0.35);
    L.scene.add(L.cyl(0.32, 0.3, 0.04, '#ffffff', { pos: [0, 1.09, 1.6] }, 24));                 // leerer Teller
    return (t) => { L.pose(w, { t }); L.camMove(t / dur, { from: [-0.8, 2.1, 4.6], to: [-0.5, 2.05, 3.9], look: [0.2, 1.7, 0.8] }); };
  },
  final(L, dur) {
    bakery(L);
    const c = L.place(L.makeChar(CRUMB), 0, 0.7, 0);
    const cust = L.place(L.makeChar({ ...MAN, expr: 'happy' }), 1.0, 3.3, Math.PI * 0.88);
    const lf = L.loaf(0.6); lf.position.set(0, -0.7, 0.15); c.userData.parts.armR.add(lf);
    return (t) => {
      const u = t / dur; if (u > 0.55 && c.userData.parts.expr !== 'sneaky') c.userData.setExpr('sneaky');
      L.pose(c, { t, armR: [-1.75, -0.1] }); L.pose(cust, { t, armL: [-1.1, 0.2] });
      L.camMove(u, { from: [-1.6, 2.4, 6.2], to: [0.2, 2.0, 3.4], look: [0, 1.9, 1.0], lookTo: [0, 1.85, 0.7], e: L.easeOut });
    };
  },
};
