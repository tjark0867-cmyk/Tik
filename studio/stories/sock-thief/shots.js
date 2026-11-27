// "The Sock Thief" – alle Einstellungen. Jede Funktion baut die Szene und gibt update(t) zurueck.
const PAL = ['#c96f5a', '#e0b25c', '#6fa3a0', '#d98b6a', '#8fb07a', '#b5838d', '#7d9bc1'];
const SOCK = ['#d9443a', '#3f7bd1', '#55a14f', '#f0c23b', '#9b59b6', '#ff8c42', '#2f3b5c', '#e86a92'];
const THIEF = { coat: '#34304a', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'sneaky', buttons: '#1d1b28' };
const PICKETT = { coat: '#c79a4b', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'happy', buttons: '#6b4a1f' };
const INSPECTOR = { coat: '#3d5a8a', hat: 'police', hatColor: '#2c3e6b', mustache: true, expr: 'laugh', buttons: '#e2b93b' };
const OFFICER = { coat: '#3d5a8a', hat: 'police', hatColor: '#2c3e6b', expr: 'laugh', buttons: '#e2b93b' };
const WOMAN = { coat: '#c4573f', dress: true, hair: '#6b3f22', hat: 'none', expr: 'surprised' };

// ------------------------------------------------------------ Welten
export function town(L, { night = false, shopIndex = -1, n = 9, x0 = -16, lampsAt = [], pickSign = "PICKETT'S SOCKS", pickColor = '#7a2f2a' } = {}) {
  L.newScene();
  if (night) { L.sky({ night: true }); L.lights({ night: true }); L.stars(); L.moon([9, 19, -48], 2.6); }
  else { L.sky({}); L.lights({}); }
  L.scene.add(L.street({ len: 90, width: 70, night }));
  L.scene.add(L.sidewalkStrip(-35, 35, -1.0, 2.4, night));
  const shops = ['BAKERY', 'BOOKS', 'TAILOR', 'CAFE'];
  const aw = [['#d9443a', '#f3ead8'], ['#3f7bd1', '#f3ead8'], ['#55a14f', '#f3ead8']];
  for (let i = 0; i < n; i++) {
    const isPick = i === shopIndex, isShop = isPick || i % 3 === 1;
    const b = L.building({ w: 4, h: 5.2 + ((i * 7) % 3) * 0.7, color: PAL[i % PAL.length], seed: i + 3, night, lit: night ? 0.45 : 0, shop: isShop,
      sign: isPick ? pickSign : isShop ? shops[i % 4] : null, signColor: isPick ? pickColor : '#2f5d4f', awning: isShop ? (isPick ? aw[0] : aw[i % 3]) : null });
    b.position.set(x0 + i * 4, 0.12, -3.7); L.scene.add(b);
  }
  for (const x of lampsAt) L.lamp(x, -0.3, night);
  return {};
}
function bedroom(L, { night = true, wall } = {}) {
  L.newScene({ bg: night ? '#1d2140' : '#cfe3ef' });
  L.lights({ night, sun: night ? [3, 7, 6] : [-3, 8, 7], amb: 1.05, shadowSize: 6 });
  L.room({ w: 9, d: 8, h: 4.4, wall: wall || (night ? '#4e5a8a' : '#7f9fb8'), floor: '#9a6a44' });
  L.windowFrame(-2.4, 2.5, -0.47, { night });
  const dr = L.dresser(0.9, 0.2, { w: 2.4, h: 1.7, rows: 3 });
  if (night) L.pointLight('#ffcf8a', 2.5, [2.2, 2.8, 2.2], 7);
  return dr;
}
function sockFlat(L, color, { s = 1, stripe = '#f2efe6' } = {}) {
  const g = new L.THREE.Group(); const k = L.sock(color, stripe, s); k.rotation.z = Math.PI / 2; k.position.y = 0.04 * s; k.scale.set(s, s, s); g.scale.y = 0.55; g.add(k); return g;
}
function fillDrawer(L, drawer, items) { const y = drawer.userData.floorY; for (const [obj, x, z, ry = 0] of items) { obj.position.set(x, y, z); obj.rotation.y = ry; drawer.add(obj); } }
export function hand(L, sleeve = '#34304a') {
  const g = new L.THREE.Group();
  g.add(L.cyl(0.075, 0.085, 2.2, sleeve, { pos: [0, 1.15, 0] }, 14));
  g.add(L.cyl(0.13, 0.13, 0.12, '#ffffff', { pos: [0, 0.06, 0] }, 14));
  g.add(L.ball(0.17, '#ffffff', { pos: [0, -0.08, 0], scale: [1, 0.85, 1.1] }, 18));
  for (let i = 0; i < 3; i++) g.add(L.ball(0.06, '#ffffff', { pos: [-0.08 + i * 0.08, -0.22, 0.08] }, 10));
  L.scene.add(g); return g;
}
function office(L) {
  L.newScene({ bg: '#2c4a45' }); L.lights({ sun: [-2, 7, 6], amb: 1.1, shadowSize: 6 });
  L.room({ w: 10, d: 8, h: 4.4, wall: '#5f9e8f', floor: '#8a5a3b' });
  const news = L.newspaper('THE SOCK GOBLIN STRIKES AGAIN', '', { w: 1.1 }); news.position.set(-1.9, 2.6, -0.44); news.rotation.z = 0.04; L.scene.add(news);
  const wp = L.poster('THE SOCK GOBLIN\nREWARD 5¢', { w: 1.1, h: 1.45 }); wp.position.set(1.9, 2.7, -0.44); wp.rotation.z = -0.03; L.scene.add(wp);
  const map = L.note('CASE FILE:\n214 single socks', { w: 1.3, size: 58 }); map.position.set(0, 3.25, -0.44); L.scene.add(map);
  L.desk(0, 1.6, { w: 3.0 });
  L.nameplate('INSP. BOTTOMLEY', 0.6, 1.16, 2.05);
  L.mug(-0.9, 1.07, 1.5);
  L.scene.add(L.box(0.7, 0.18, 0.5, '#efe8d6', { pos: [1.0, 1.15, 1.45] }));
  const insp = L.place(L.makeChar(INSPECTOR), 0, 0.7, 0);
  const o1 = L.place(L.makeChar({ ...OFFICER, coat: '#365281' }), -2.3, 1.4, 0.35);
  const o2 = L.place(L.makeChar({ ...OFFICER, mustache: true }), 2.3, 1.3, -0.35);
  return { insp, o1, o2 };
}
export function boardScene(L, lines, { night = false, shop = false, pickSign } = {}) {
  town(L, { night, shopIndex: shop ? 4 : -1, x0: -16, lampsAt: night ? [-2.6] : [], ...(pickSign ? { pickSign } : {}) });
  const b = L.chalkboard(lines, { w: 1.7, h: 2.3 }); b.position.set(0, 0.12, 0.2); L.scene.add(b);
  const sh = L.blobShadow(1.0); sh.position.set(0, 0.13, 0.2); L.scene.add(sh);
  return b;
}
function shopInside(L) {
  L.newScene({ bg: '#e8d9b8' }); L.lights({ sun: [3, 8, 7], amb: 1.15, shadowSize: 6 });
  L.room({ w: 10, d: 8, h: 4.6, wall: '#c98f6a', stripe: '#d39d79', floor: '#8a5a3b' });
  for (let row = 0; row < 3; row++) {
    L.scene.add(L.box(8, 0.1, 0.6, '#7a5233', { pos: [0, 1.6 + row * 0.9, -0.2] }));
    for (let i = 0; i < 9; i++) {
      for (let k = 0; k < 2; k++) {
        const s = L.sock(SOCK[(i + row * 3) % SOCK.length], '#f2efe6', 0.75); s.position.set(-3.6 + i * 0.9 + k * 0.18, 1.66 + row * 0.9, -0.1); s.rotation.y = -0.4; L.scene.add(s);
      }
    }
  }
  const sign = L.note('EVERY PAIR\nGUARANTEED TO MATCH', { w: 2.2, size: 60, color: '#f6efd8', ink: '#7a2f2a' }); sign.position.set(0, 4.15, -0.42); L.scene.add(sign);
  L.desk(0, 1.8, { w: 3.4, color: '#7a5233', top: '#a0764d' });
  const reg = L.box(0.7, 0.5, 0.5, '#b8862f', { pos: [1.1, 1.32, 1.6] }); L.scene.add(reg);
  L.scene.add(L.box(0.5, 0.18, 0.3, '#e9e1cf', { pos: [1.1, 1.62, 1.55], rot: [-0.4, 0, 0] }));
}
function backroom(L, { opened = 0 } = {}) {
  L.newScene({ bg: '#1b1424' }); L.lights({ night: true, sun: [2, 7, 6], shadowSize: 6 });
  L.room({ w: 11, d: 8, h: 5, wall: '#4a3b55', floor: '#6b4a35' });
  L.pointLight('#ffbe6b', 9, [0.5, 3.2, 3.0], 12);
  const cols = 9, rows = 6, dw = 0.85, dh = 0.62;
  const drawers = [];
  const addr = ['14 ELM ST', '9 MILL LN', '3 OAK RD', '22 BAY ST', '7 PINE CT', '41 HILL ST', '5 ROSE LN', '18 KING ST', '2 LAKE RD', '30 MAIN ST'];
  L.scene.add(L.box(cols * dw + 0.3, rows * dh + 0.3, 0.9, '#5a3a26', { pos: [0, 0.3 + rows * dh / 2, 0] }));
  let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const g = new L.THREE.Group(); g.position.set(-((cols - 1) * dw) / 2 + c * dw, 0.45 + r * dh + dh / 2 - 0.15, 0.1);
    g.add(L.box(dw - 0.08, dh - 0.08, 0.7, '#7a5233'));
    g.add(L.box(dw - 0.16, 0.03, 0.66, '#4a2e1e', { pos: [0, dh / 2 - 0.08, 0] }));
    const lab = L.canvasTex(160, 64, (x) => { x.fillStyle = '#efe6cf'; x.fillRect(0, 0, 160, 64); L.fitText(x, addr[n % addr.length], 80, 34, 150, 26, '700 $px Caveat', '#3a2a1a'); });
    g.add(L.mesh(new L.THREE.PlaneGeometry(0.46, 0.18), L.noOutline(new L.THREE.MeshBasicMaterial({ map: lab })), { pos: [0, 0.08, 0.356], shadow: false }));
    g.add(L.ball(0.035, '#e2b93b', { pos: [0, -0.12, 0.38] }, 8));
    const sk = sockFlat(L, SOCK[(n * 5) % SOCK.length], { s: 0.55 }); sk.position.set(-0.12, -dh / 2 + 0.06, 0.1); sk.rotation.y = 0.3; g.add(sk);
    L.scene.add(g); drawers.push({ g, delay: ((r * 7 + c * 3) % 17) / 17 }); n++;
  }
  return drawers;
}

// ------------------------------------------------------------ Shots
export const shots = {
  town_night(L, dur) {
    town(L, { night: true, lampsAt: [-6, 2.5] });
    return (t) => L.camMove(t / dur, { from: [1.5, 9, 13], to: [0.5, 3.6, 8.5], look: [0, 4.5, -3], lookTo: [0, 2.4, -2], fov: 42 });
  },
  sneak(L, dur) {
    town(L, { night: true, lampsAt: [-1.2] });
    const th = L.place(L.makeChar(THIEF), -2.2, -0.4, Math.PI / 2, 0.12);
    return (t) => { L.moveTo(th, -2.2 + t * 0.9, -0.4); L.pose(th, { t, walk: 0.7, sneak: 1 }); L.camMove(t / dur, { from: [0.5, 1.4, 5.2], to: [0.9, 1.5, 4.6], look: [-1.5, 1.3, -0.4], lookTo: [-0.7, 1.3, -0.4] }); };
  },
  drawer_open(L, dur) {
    const dr = bedroom(L, { night: true }); const top = dr.userData.drawers[2];
    fillDrawer(L, top, [[sockFlat(L, SOCK[0]), 0.05, -0.12, 0.05], [sockFlat(L, SOCK[0]), 0.05, 0.1, 0.05], [sockFlat(L, SOCK[1]), 0.8, -0.1, -0.1], [sockFlat(L, SOCK[2]), -0.7, -0.05, 0.1]]);
    const hd = hand(L);
    return (t) => {
      const k = L.easeOut(t / dur / 0.55); top.position.z = 0.05 + k * 0.62;
      hd.position.set(1.0 + 0.4 * (1 - k), 1.75 + 0.4 * (1 - k), 1.55 - 0.1 * k); hd.rotation.set(0.3, 0, 0.5);
      L.camMove(t / dur, { from: [2.2, 3.5, 5.8], to: [1.7, 3.1, 4.8], look: [0.9, 1.25, 0.7] });
    };
  },
  take_sock(L, dur) {
    const dr = bedroom(L, { night: true }); const top = dr.userData.drawers[2]; top.position.z = 0.67;
    const keep = sockFlat(L, SOCK[0]); const grab = sockFlat(L, SOCK[0]);
    fillDrawer(L, top, [[keep, 0.05, -0.12, 0.05], [sockFlat(L, SOCK[1]), 0.75, -0.05, -0.1], [sockFlat(L, SOCK[2]), -0.7, -0.05, 0.1]]);
    L.scene.add(grab);
    const hd = hand(L);
    return (t) => {
      const u = t / dur; const base = new L.THREE.Vector3(0.9 + 0.05, 1.37, 0.05 + 0.2 + 0.67 + 0.1);
      const down = L.ease(u / 0.35), up = L.ease((u - 0.4) / 0.6);
      hd.position.set(base.x + 0.25, base.y + 0.95 - down * 0.75 + up * 1.2, base.z + up * 0.2); hd.rotation.set(0.35, 0, -0.55);
      if (u < 0.4) { grab.position.copy(base); grab.rotation.set(0, 0.1, 0); } else { grab.position.set(hd.position.x - 0.15, hd.position.y - 0.35, hd.position.z); grab.rotation.set(0, 0.1, 0.9); }
      L.camMove(u, { from: [0.95, 3.35, 1.75], to: [0.95, 3.2, 1.65], look: [0.95, 1.38, 0.92] });
    };
  },
  lonely_night(L, dur) {
    const dr = bedroom(L, { night: true }); const top = dr.userData.drawers[2]; top.position.z = 0.67;
    fillDrawer(L, top, [[sockFlat(L, SOCK[0]), 0.05, -0.02, 0.15]]);
    return (t) => L.camMove(t / dur, { from: [0.95, 3.4, 1.7], to: [0.95, 2.6, 1.4], look: [0.95, 1.38, 0.9], e: L.easeOut });
  },
  valuables(L, dur) {
    const dr = bedroom(L, { night: true }); const top = dr.userData.drawers[2]; top.position.z = 0.67;
    const items = [];
    for (let i = 0; i < 5; i++) items.push([L.cyl(0.085, 0.085, 0.025, '#e2b93b', {}, 18), -0.75 + i * 0.03, -0.05 + (i % 2) * 0.02]);
    for (let i = 0; i < 4; i++) items.push([L.cyl(0.085, 0.085, 0.025, '#d9d9d9', {}, 18), -0.45, 0.12 + 0, 0]);
    const neck = new L.THREE.Group(); for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; neck.add(L.ball(0.03, '#fbf6ee', { pos: [Math.cos(a) * 0.22, 0.03, Math.sin(a) * 0.16] }, 8)); }
    items.push([neck, 0.1, 0]);
    const watch = new L.THREE.Group(); watch.add(L.cyl(0.13, 0.13, 0.04, '#e2b93b', { pos: [0, 0.02, 0] }, 24)); watch.add(L.cyl(0.11, 0.11, 0.01, '#fbf6ee', { pos: [0, 0.045, 0] }, 24));
    items.push([watch, 0.65, -0.05]);
    for (let i = 0; i < 3; i++) items.push([L.box(0.5, 0.012, 0.24, '#7fae7a'), -0.15 + i * 0.03, 0.17 - i * 0.01, 0.1 * i]);
    for (let i = 0; i < 5; i++) { const c = L.cyl(0.085, 0.085, 0.025, '#e2b93b', {}, 18); items.push([c, -0.75, -0.05]); c.position.y = 0.03 * i; }
    fillDrawer(L, top, items);
    return (t) => L.camMove(t / dur, { from: [0.35, 3.1, 1.65], to: [1.35, 3.1, 1.65], look: [0.4, 1.38, 0.88], lookTo: [1.4, 1.38, 0.88] });
  },
  morning_woman(L, dur) {
    const dr = bedroom(L, { night: false }); dr.userData.drawers[2].position.z = 0.67;
    const w = L.place(L.makeChar(WOMAN), -0.6, 1.4, 0.35);
    const s = L.sock(SOCK[0]); s.position.set(0, -0.62, 0.08); s.rotation.set(0.2, 0, 0); w.userData.parts.armR.add(s);
    return (t) => { L.pose(w, { t, armR: [-1.6, -0.1] }); L.camMove(t / dur, { from: [0.2, 1.9, 5.2], to: [-0.1, 1.9, 4.4], look: [-0.4, 1.5, 1.2] }); };
  },
  lonely_day(L, dur) {
    const dr = bedroom(L, { night: false }); const top = dr.userData.drawers[2]; top.position.z = 0.67;
    fillDrawer(L, top, [[sockFlat(L, SOCK[1]), 0.05, 0, -0.2]]);
    return (t) => L.camMove(t / dur, { from: [1.0, 3.2, 1.65], to: [0.98, 2.9, 1.5], look: [0.95, 1.38, 0.9], roll: 0.06, rollTo: 0.02 });
  },
  newspaper(L, dur) {
    L.newScene({ bg: '#3b2a20' }); L.lights({ sun: [2, 6, 8], amb: 1.2 });
    L.scene.add(L.mesh(new L.THREE.PlaneGeometry(20, 20), L.toon('#6b4a35', { map: L.planks([5, 5], '#6b4a35') }), { rot: [-Math.PI / 2, 0, 0], shadow: false }));
    const n = L.newspaper('THE SOCK GOBLIN STRIKES AGAIN', 'Town baffled as socks vanish one at a time', { w: 1.5 }); n.rotation.x = -Math.PI / 2; n.position.y = 0.02;
    const g = new L.THREE.Group(); g.add(n); L.scene.add(g);
    return (t) => {
      const u = t / dur, k = L.easeOut(u / 0.4);
      g.rotation.y = (1 - k) * 7; g.scale.setScalar(0.25 + 0.75 * k); g.position.y = 0.01;
      L.camMove(u, { from: [0, 2.6, 0.3], to: [0, 2.15, 0.25], look: [0, 0, 0], e: L.easeOut });
    };
  },
  police_wide(L, dur) {
    const { insp, o1, o2 } = office(L);
    return (t) => {
      const u = t / dur; const l = u > 0.25 ? 1 : 0;
      for (const [c, ph] of [[insp, 0], [o1, 0.7], [o2, 1.3]]) { c.userData.setExpr && c.userData.parts.expr !== (l ? 'laugh' : 'neutral') && c.userData.setExpr(l ? 'laugh' : 'neutral'); L.pose(c, { t: t + ph, laugh: l }); }
      L.camMove(u, { from: [0, 2.3, 8.2], to: [0, 2.2, 7.4], look: [0, 1.9, 0.8] });
    };
  },
  police_close(L, dur) {
    const { insp } = office(L);
    return (t) => { L.pose(insp, { t, laugh: 1 }); L.camMove(t / dur, { from: [0.15, 1.95, 4.3], to: [0.1, 1.95, 3.7], look: [0, 1.75, 0.7] }); };
  },
  police_wide_laugh(L, dur) {
    const { insp, o1, o2 } = office(L);
    return (t) => {
      L.pose(insp, { t, laugh: 1.3, armL: [-0.5, -0.9], armR: [-0.5, 0.9] }); L.pose(o1, { t: t + 0.5, laugh: 1.2, armR: [-1.2, -0.4] }); L.pose(o2, { t: t + 1, laugh: 1.2, armL: [-0.9, 1.0] });
      L.camMove(t / dur, { from: [-2.6, 2.4, 6.6], to: [-1.8, 2.3, 6.0], look: [0, 1.8, 0.8], roll: -0.05 });
    };
  },
  calendar(L, dur) {
    L.newScene({ bg: '#5f9e8f' }); L.lights({ sun: [1, 5, 8], amb: 1.2, shadowSize: 4 });
    L.room({ w: 8, d: 6, h: 5, wall: '#5f9e8f', sideWalls: false });
    const months = ['MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY'];
    const pages = months.map((m, i) => {
      const tex = L.canvasTex(400, 460, (c) => { c.fillStyle = '#f6f1e3'; c.fillRect(0, 0, 400, 460); c.fillStyle = '#c8312f'; c.fillRect(0, 0, 400, 110); L.fitText(c, m, 200, 58, 360, 70, '700 $px Fredoka', '#fff');
        c.fillStyle = '#6b6457'; for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) { L.fitText(c, String(r * 7 + k + 1 <= 31 ? r * 7 + k + 1 : ''), 40 + k * 53, 150 + r * 62, 50, 30, '700 $px Fredoka', '#6b6457'); } });
      const pivot = new L.THREE.Group(); pivot.position.set(0, 3.2, -0.4 + 0.01 * (months.length - i));
      const p = L.mesh(new L.THREE.PlaneGeometry(1.6, 1.84), L.toon('#ffffff', { map: tex, side: L.THREE.DoubleSide }), { pos: [0, -0.92, 0] }); L.thin(p.material);
      pivot.add(p); L.scene.add(pivot); return pivot;
    });
    L.scene.add(L.box(1.7, 0.12, 0.08, '#7a5233', { pos: [0, 3.22, -0.38] }));
    return (t) => {
      const u = t / dur; const per = 1 / (months.length - 1);
      pages.forEach((p, i) => { const k = L.ease((u - i * per * 0.9) / (per * 0.8)); p.rotation.x = i < months.length - 1 ? -k * 2.6 : 0; p.visible = k < 0.98 || i === months.length - 1; });
      L.camMove(u, { from: [0, 2.35, 3.2], to: [0, 2.35, 2.9], look: [0, 2.3, -0.4] });
    };
  },
  board_10(L, dur) { boardScene(L, [['HOUSES HIT', 64], ['10', 150]]); return (t) => L.camMove(t / dur, { from: [0.2, 1.7, 4.2], to: [0.1, 1.6, 3.6], look: [0, 1.45, 0.2] }); },
  board_50(L, dur) { boardScene(L, [['HOUSES HIT', 64], ['50', 150]]); return (t) => L.camMove(t / dur, { from: [-0.3, 1.6, 3.4], to: [-0.2, 1.6, 3.0], look: [0, 1.45, 0.2], roll: 0.05 }); },
  board_200(L, dur) { boardScene(L, [['HOUSES HIT', 64], ['200', 150]]); return (t) => L.camMove(t / dur, { from: [0, 1.55, 3.0], to: [0, 1.5, 2.55], look: [0, 1.45, 0.2], e: L.easeOut }); },
  sleep_socks(L, dur) {
    bedroom(L, { night: true, wall: '#5a4f7d' });
    const bed = new L.THREE.Group(); bed.position.set(-0.6, 0, 1.2); L.scene.add(bed);
    bed.add(L.box(2.0, 0.5, 2.6, '#7a5233', { pos: [0, 0.35, 0.2] })); bed.add(L.box(1.9, 0.25, 2.5, '#f2efe6', { pos: [0, 0.72, 0.2] }));
    bed.add(L.box(2.0, 1.3, 0.15, '#7a5233', { pos: [0, 0.9, -1.1] })); bed.add(L.box(1.2, 0.22, 0.55, '#ffffff', { pos: [0, 0.95, -0.6] }));
    const sleeper = L.makeChar({ coat: '#7d9bc1', hat: 'none', expr: 'sleep', mustache: true, shoes: null, socks: [SOCK[2], SOCK[4]] });
    sleeper.rotation.set(-Math.PI / 2, 0, 0); sleeper.position.set(0, 1.32, 1.45); bed.add(sleeper);
    bed.add(L.box(1.95, 0.85, 1.25, '#d9443a', { pos: [0, 1.28, 0.42] }));
    return (t) => { L.pose(sleeper, { t, bob: 2 }); L.camMove(t / dur, { from: [0.4, 3.9, 4.4], to: [0.2, 3.6, 3.9], look: [-0.6, 1.2, 1.2] }); };
  },
  street_mismatch(L, dur) {
    town(L, { lampsAt: [3] });
    const people = L.crowd(6, -3.5, -0.4, 1.5, 0.15, 21, { mismatched: true, ry: Math.PI / 2, expr: 'neutral' });
    return (t) => { people.forEach((p, i) => { L.moveTo(p, -3.5 + i * 1.5 + t * 0.8, -0.4 + (i % 2) * 0.7); L.pose(p, { t: t + p.userData.phase, walk: 1 }); }); L.camMove(t / dur, { from: [0.5, 0.9, 5.2], to: [1.5, 0.9, 5.0], look: [0.5, 0.9, 0], lookTo: [1.5, 0.9, 0] }); };
  },
  legs(L, dur) {
    town(L, {});
    const a = L.place(L.makeChar({ coat: '#4f7fa8', socks: [SOCK[0], SOCK[2]], hat: 'none' }), -0.6, -0.2, Math.PI / 2, 0.12);
    const b = L.place(L.makeChar({ coat: '#c4573f', dress: true, hair: '#2e2420', hat: 'none', socks: [SOCK[3], SOCK[4]] }), 0.6, 0.6, Math.PI / 2, 0.12);
    return (t) => { L.moveTo(a, -0.9 + t * 0.7, -0.2); L.moveTo(b, 0.1 + t * 0.7, 0.6); L.pose(a, { t, walk: 1 }); L.pose(b, { t: t + 0.3, walk: 1 }); L.camMove(t / dur, { from: [0, 0.45, 3.0], to: [0.9, 0.45, 2.8], look: [0, 0.4, 0], lookTo: [0.9, 0.4, 0] }); };
  },
  kids_school(L, dur) {
    town(L, {});
    const sch = L.building({ w: 6, h: 5, color: '#d9b26a', sign: 'SCHOOL', signColor: '#7a2f2a', seed: 4, shop: false, floors: 2, cols: 3 }); sch.position.set(-1, 0.12, -3.4); L.scene.add(sch);
    const kids = [];
    for (let i = 0; i < 4; i++) {
      const k = L.place(L.makeChar({ coat: PAL[(i * 2) % 7], hat: i % 2 ? 'flatcap' : 'none', hair: i % 2 ? null : '#6b3f22', expr: 'happy', socks: [SOCK[0], SOCK[2]].map((c, j) => (i + j) % 2 ? SOCK[(i * 3 + 2) % 8] : c), scale: 0.68 }), -2.4 + i * 1.1, 0.3 + (i % 2) * 0.5, Math.PI / 2, 0.12);
      k.userData.parts.body.add(L.box(0.5, 0.5, 0.25, ['#c8312f', '#3f7bd1', '#55a14f', '#f0c23b'][i], { pos: [0, 0.55, -0.42] }));
      kids.push(k);
    }
    return (t) => { kids.forEach((k, i) => { L.moveTo(k, -2.4 + i * 1.1 + t * 0.6, 0.3 + (i % 2) * 0.5); L.pose(k, { t: t + i, walk: 1.2 }); }); L.camMove(t / dur, { from: [0.2, 0.9, 4.6], to: [0.8, 1.1, 4.2], look: [0, 0.8, 0], lookTo: [0.6, 1.0, 0] }); };
  },
  shop_open(L, dur) {
    town(L, { shopIndex: 4, lampsAt: [-2.4] });
    for (let i = 0; i < 4; i++) { const s = L.sock(SOCK[i * 2], '#f2efe6', 0.6); s.position.set(-1.15 + i * 0.32, 1.35, -2.0); L.scene.add(s); }
    L.scene.add(L.cyl(0.01, 0.01, 1.6, '#3b2b1b', { pos: [-0.65, 1.9, -2.0], rot: [0, 0, Math.PI / 2] }, 6));
    const p = L.place(L.makeChar(PICKETT), 0.9, -0.9, 0.2, 0.12);
    return (t) => { L.pose(p, { t, armR: L.ARM.wave(t) }); L.camMove(t / dur, { from: [0, 3.6, 10.5], to: [0.2, 2.6, 7.2], look: [0, 2.6, -2.5], lookTo: [0.2, 2.0, -1.5] }); };
  },
  shop_sign(L, dur) {
    town(L, { shopIndex: 4 });
    const sign = new L.THREE.Group(); sign.position.set(1.3, 3.2, -1.6); L.scene.add(sign);
    sign.add(L.box(1.6, 0.06, 0.06, '#2b2b2b', { pos: [-0.2, 0.55, 0] }));
    const board = L.note('FRESH SOCKS!\nEvery pair guaranteed\nto match', { w: 1.6, color: '#f6efd8', ink: '#7a2f2a', size: 64 });
    const swing = new L.THREE.Group(); swing.position.set(-0.2, 0.55, 0); swing.add(board); board.position.set(0, -0.62, 0); sign.add(swing);
    for (const sx of [-0.6, 0.6]) swing.add(L.cyl(0.008, 0.008, 0.2, '#2b2b2b', { pos: [sx, -0.1, 0] }, 4));
    return (t) => { swing.rotation.x = Math.sin(t * 2.2) * 0.08; L.camMove(t / dur, { from: [1.6, 2.6, 1.5], to: [1.3, 2.75, 1.0], look: [1.1, 2.65, -1.6] }); };
  },
  queue(L, dur) {
    town(L, { shopIndex: 4 });
    const q = L.crowd(13, 1.2, -0.6, 0.95, 0.04, 31, { ry: -Math.PI / 2, expr: 'happy', mismatched: true });
    return (t) => { q.forEach((p, i) => L.pose(p, { t: t + p.userData.phase, nod: 0.2 })); L.camMove(t / dur, { from: [12.5, 3.2, 4.5], to: [3.5, 2.6, 4.8], look: [9.5, 1.5, -0.6], lookTo: [0.5, 1.6, -0.8] }); };
  },
  pickett_counter(L, dur) {
    shopInside(L);
    const p = L.place(L.makeChar(PICKETT), 0, 1.0, 0);
    const c = L.place(L.makeChar({ coat: '#4f7fa8', hat: 'flatcap', hatColor: '#4f5d7a', expr: 'happy', socks: [SOCK[0], SOCK[2]] }), 0.9, 3.4, Math.PI * 0.85);
    const pair = new L.THREE.Group(); pair.add(L.sock(SOCK[6], '#f2efe6', 0.7)); const s2 = L.sock(SOCK[6], '#f2efe6', 0.7); s2.position.x = 0.15; pair.add(s2);
    pair.position.set(0, -0.62, 0.1); p.userData.parts.armR.add(pair);
    return (t) => { L.pose(p, { t, armR: [-1.4, -0.2] }); L.pose(c, { t, armL: [-1.2, 0.2] }); L.camMove(t / dur, { from: [-1.8, 2.5, 6.4], to: [-1.2, 2.4, 5.6], look: [0, 1.9, 1.2] }); };
  },
  board_sold(L, dur) { boardScene(L, [['PAIRS SOLD', 64], ['1000', 140]], { shop: true }); return (t) => L.camMove(t / dur, { from: [0.6, 1.7, 3.8], to: [0.2, 1.6, 3.2], look: [0, 1.45, 0.2] }); },
  board_sold_2(L, dur) { boardScene(L, [['PAIRS SOLD', 64], ['1000', 140]], { shop: true, night: true }); return (t) => L.camMove(t / dur, { from: [-0.4, 1.5, 4.0], to: [-0.2, 1.5, 3.5], look: [0, 1.45, 0.2], roll: -0.04 }); },
  lonely_table(L, dur) {
    L.newScene({ bg: '#cfe3ef' }); L.lights({ sun: [-3, 6, 5], amb: 1.2, shadowSize: 4 });
    L.room({ w: 8, d: 6, h: 4, wall: '#9fb8a0', sideWalls: false });
    L.desk(0, 1.0, { w: 3, color: '#7a5233', top: '#e9dcc0' });
    const s = sockFlat(L, SOCK[3], { s: 1.1 }); s.position.set(0.1, 1.07, 1.0); s.rotation.y = -0.4; L.scene.add(s);
    return (t) => L.camMove(t / dur, { from: [0.6, 2.9, 2.6], to: [0.4, 2.5, 2.0], look: [0.1, 1.05, 1.0], e: L.easeOut });
  },
  queue_bags(L, dur) {
    town(L, { shopIndex: 4 });
    const q = L.crowd(6, -0.5, 0.5, 1.4, 0.2, 44, { ry: Math.PI / 2, expr: 'happy', mismatched: true });
    q.forEach((p) => p.userData.parts.armR.add(L.box(0.32, 0.42, 0.2, '#d8b98a', { pos: [0, -0.75, 0.05] })));
    return (t) => { q.forEach((p, i) => { L.moveTo(p, -0.5 + i * 1.4 + t * 0.9, 0.5 + (i % 2) * 0.6); L.pose(p, { t: t + p.userData.phase, walk: 1 }); }); L.camMove(t / dur, { from: [1.5, 1.8, 7.0], to: [3.0, 1.9, 6.6], look: [1.5, 1.3, 0], lookTo: [3.0, 1.3, 0] }); };
  },
  pickett_close(L, dur) {
    shopInside(L);
    const p = L.place(L.makeChar({ ...PICKETT, expr: 'happy' }), 0, 1.0, 0);
    return (t) => { const u = t / dur; if (u > 0.45 && p.userData.parts.expr !== 'smug') p.userData.setExpr('smug'); L.pose(p, { t }); L.camMove(u, { from: [0.4, 1.95, 4.2], to: [0.2, 1.9, 3.1], look: [0, 1.8, 1.0] }); };
  },
  backroom_wall(L, dur) {
    const drawers = backroom(L);
    return (t) => { const u = t / dur; drawers.forEach(({ g, delay }) => { g.position.z = 0.1 + 0.45 * L.easeOut((u * 1.6 - delay * 0.9) / 0.4); }); L.camMove(u, { from: [-1.5, 2.6, 6.8], to: [0.8, 2.3, 5.2], look: [-0.5, 2.1, 0], lookTo: [0.4, 2.0, 0] }); };
  },
  pairing(L, dur) {
    L.newScene({ bg: '#1b1424' }); L.lights({ night: true, sun: [2, 6, 5], shadowSize: 4 }); L.pointLight('#ffbe6b', 6, [0.5, 2.5, 2.0], 8);
    L.room({ w: 8, d: 6, h: 4, wall: '#4a3b55', floor: '#6b4a35', sideWalls: false });
    L.desk(0, 1.0, { w: 3.2, color: '#5a3a26', top: '#8a6a4a' });
    const a = sockFlat(L, '#3f7bd1'), b = sockFlat(L, '#3f7bd1'); L.scene.add(a); L.scene.add(b); L.pointLight('#fff1d6', 5, [0, 2.6, 1.6], 5);
    const tagA = L.note('14 Elm St', { w: 0.6, size: 80 }), tagB = L.note('9 Mill Ln', { w: 0.6, size: 80 });
    tagA.rotation.x = -Math.PI / 2; tagB.rotation.x = -Math.PI / 2; L.scene.add(tagA); L.scene.add(tagB);
    const band = L.note('NEW PAIR!', { w: 0.42, size: 90, color: '#f6efd8', ink: '#c8312f' }); band.rotation.set(-Math.PI / 2.6, 0, 0); L.scene.add(band);
    return (t) => {
      const u = t / dur, k = L.ease(u / 0.6);
      a.position.set(-0.6 + k * 0.42, 1.07, 1.0); b.position.set(0.6 - k * 0.42 + 0.12, 1.07, 1.12);
      tagA.position.set(-0.55 + k * 0.2, 1.08, 1.6); tagB.position.set(0.55 - k * 0.2, 1.08, 1.6);
      const pop = L.easeOut((u - 0.62) / 0.2); band.scale.setScalar(Math.max(0.001, pop)); band.position.set(0.1, 1.35, 1.3);
      L.camMove(u, { from: [0, 3.3, 2.9], to: [0, 3.0, 2.5], look: [0, 1.05, 1.15] });
    };
  },
  final(L, dur) {
    backroom(L);
    const p = L.place(L.makeChar({ ...PICKETT, expr: 'smug' }), 0.2, 2.4, -0.15);
    const s = L.sock(SOCK[0]); s.position.set(0, -0.62, 0.08); p.userData.parts.armR.add(s);
    return (t) => { const u = t / dur; if (u > 0.5 && p.userData.parts.expr !== 'sneaky') p.userData.setExpr('sneaky'); L.pose(p, { t, armR: [-1.5, -0.1] }); L.camMove(u, { from: [0.6, 2.2, 7.4], to: [0.3, 2.15, 5.0], look: [0.2, 1.85, 2.4], e: L.easeOut }); };
  },
};
