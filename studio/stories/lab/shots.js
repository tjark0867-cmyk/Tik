const ARLO = { eyes: 'round', coat: '#6b7fa8', hat: 'beret', hatColor: '#8a2f3a', beard: '#d6d2cb', mustache: true, mustacheColor: '#e8e4dc', head: '#f6ead8', glasses: '#3b3026', bushy: true, browColor: '#d9d4ca', wrinkles: true, expr: 'worried', buttons: '#3b3026' };
const KEEPER = { eyes: 'round', coat: '#4a3355', dress: true, hair: '#b9b4ad', hat: 'none', glasses: '#c9a24a', wrinkles: true, expr: 'stern' };
const JAR_COLS = ['#ff4b4b', '#ffd21f', '#3fd16a', '#3f8bff', '#ff8c42', '#b06bff', '#41e0d0', '#ff6fb5'];
function shop(L) {
  L.post.on = true; L.newScene({ bg: '#0d0f1f' }); L.lights({ night: true, sun: [3, 7, 6], shadowSize: 7 }); L.fog('#141832', 0.05);
  L.room({ w: 11, d: 9, h: 5, wall: '#2c3554', floor: '#5a3a26' });
  const r = L.rand(4);
  for (let row = 0; row < 5; row++) {
    L.scene.add(L.box(9, 0.08, 0.55, '#3a2618', { pos: [0, 0.9 + row * 0.8, -0.2] }));
    for (let i = 0; i < 14; i++) { const j = L.jar(JAR_COLS[Math.floor(r() * 8)], { fill: 0.3 + r() * 0.65, s: 0.75, glow: 0.9 + r() * 0.4 }); j.position.set(-4.2 + i * 0.64, 0.95 + row * 0.8, -0.15); L.scene.add(j); }
  }
  L.desk(0, 2.0, { w: 3.6, color: '#4a2e1e', top: '#6b4a35' });
  L.hangLamp(0.2, 3.4, 2.0, { power: 5 });
  const j = L.jar('#3f8bff', { fill: 0.6, s: 1.2, glow: 1.3 }); j.position.set(-0.8, 1.07, 2.0); L.scene.add(j);
  const keeper = L.place(L.makeChar(KEEPER), 0.3, 0.9, 0);
  const arlo = L.place(L.makeChar(ARLO), -0.6, 3.4, Math.PI * 0.9);
  return { keeper, arlo, j };
}
export const shots = {
  shop(L, dur) {
    const { keeper, arlo } = shop(L); L.grade({ tint: [0.95, 0.97, 1.08], vignette: 0.55 }); L.bloom(0.6, 0.5, 0.85);
    return (t) => { L.pose(keeper, { t }); L.pose(arlo, { t }); L.camMove(t / dur, { from: [1.8, 2.3, 6.4], to: [1.5, 2.2, 5.8], look: [0, 1.7, 1.4] }); L.dof(L.camera.position.distanceTo(new L.THREE.Vector3(0.3, 1.9, 0.9)), 0.003, 0.012); };
  },
  face(L, dur) {
    const { arlo } = shop(L); L.grade({ tint: [0.95, 0.97, 1.08], vignette: 0.55 }); L.bloom(0.7, 0.6, 0.75);
    arlo.rotation.y = Math.PI * 0.1; L.bloom(0.6, 0.5, 0.85);
    return (t) => { L.pose(arlo, { t }); L.camMove(t / dur, { from: [-0.2, 2.0, 5.6], to: [-0.3, 1.95, 5.2], look: [-0.6, 1.85, 3.4] }); L.dof(1.9, 0.004, 0.012); };
  },
  street(L, dur) {
    L.post.on = true; L.newScene(); L.sky({ night: true }); L.lights({ night: true }); L.fog('#1a2148', 0.045);
    L.scene.add(L.street({ len: 90, width: 70, night: true })); L.scene.add(L.sidewalkStrip(-35, 35, -1.0, 2.4, true));
    const PAL = ['#c96f5a', '#e0b25c', '#6fa3a0', '#d98b6a', '#8fb07a', '#b5838d', '#7d9bc1'];
    for (let i = 0; i < 9; i++) { const b = L.building({ w: 4, h: 5.2 + ((i * 7) % 3) * 0.7, color: PAL[i % 7], seed: i + 3, night: true, lit: 0.6, shop: i === 4, sign: i === 4 ? 'COLORS · BOUGHT & SOLD' : null, signColor: '#2a1f3a', signText: '#ffd98a' }); b.position.set(-16 + i * 4, 0.12, -3.7); L.scene.add(b); }
    for (let i = 0; i < 5; i++) { const j = L.jar(JAR_COLS[i], { s: 0.7, glow: 3 }); j.position.set(-1.0 + i * 0.42, 0.95, -2.1); L.scene.add(j); }
    L.lamp(-3.2, -0.3, true); L.lamp(3.6, -0.3, true);
    const rn = L.rain({ cx: 0, cz: 1, x: 6, z: 4, y: 7 });
    const a = L.place(L.makeChar({ ...ARLO, expr: 'sad' }), 1.2, 0.6, -0.4, 0.12);
    L.grade({ tint: [0.9, 0.95, 1.12], vignette: 0.6, contrast: 1.08 }); L.bloom(0.9, 0.7, 0.7);
    return (t) => { rn(t); L.pose(a, { t }); L.camMove(t / dur, { from: [0, 1.7, 6.5], to: [0.3, 1.6, 5.8], look: [0.4, 1.8, -1] }); L.dof(5.5, 0.0025, 0.01); };
  },
  park(L, dur) {
    L.post.on = true; L.newScene(); L.sky({ top: '#79b4dc', bottom: '#f6dcb8' }); L.lights({ sun: [-5, 9, 8], amb: 1.15, shadowSize: 12 });
    L.scene.add(L.mesh(new L.THREE.PlaneGeometry(200, 200), L.toon('#6fbf4e'), { rot: [-Math.PI / 2, 0, 0], shadow: false }));
    for (const [x, z, s] of [[-3, -3, 1.4], [2.5, -4, 1.6], [-6, -8, 1.8], [6, -9, 2], [0, -12, 2.2], [-2, 1, 1.1]]) L.tree(x, z, s, '#3f9f3a');
    for (let i = 0; i < 7; i++) { const f = L.sunflower(1.3 + (i % 3) * 0.15, 0.9); f.position.set(1.2 + i * 0.45, 0, 1.6 + (i % 2) * 0.3); L.scene.add(f); }
    for (let i = 0; i < 6; i++) L.scene.add(L.ball(0.12, '#e8343a', { pos: [-1.6 + (i % 3) * 0.3, 0.55 + Math.floor(i / 3) * 0.25, 2.0] }, 12));
    L.scene.add(L.ball(0.55, '#3f9f3a', { pos: [-1.3, 0.45, 1.8], scale: [1.2, 0.8, 0.8] }, 16));
    return (t) => { const u = t / dur; L.grade({ remove: { g: L.ease(u) }, vignette: 0.4 }); L.camMove(u, { from: [0.4, 1.6, 7], to: [0.3, 1.6, 6.4], look: [0, 1.4, 0] }); };
  },
};
