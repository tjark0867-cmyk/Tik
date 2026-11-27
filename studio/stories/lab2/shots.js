const C = {
  arlo: { style: 'ch', coat: '#5d77a8', hat: 'beret', hatColor: '#9a2f3a', skin: '#fbf1e1', beard: '#ffffff', mustache: true, mustacheColor: '#ffffff', glasses: '#141212', hairStyle: 'tufts', hair: '#e9e4da', wrinkles: true, expr: 'smile' },
  june: { style: 'ch', coat: '#f2c12e', dress: true, hairStyle: 'bun', hair: '#cfc9c1', wrinkles: true, blush: true, expr: 'happy' },
  keeper: { style: 'ch', coat: '#3d2b4a', dress: true, hairStyle: 'bun', hair: '#a9a39b', glasses: '#141212', wrinkles: true, expr: 'stern' },
  rich: { style: 'ch', coat: '#9b2f7a', vest: '#e8dcc4', hat: 'tophat', hatColor: '#1d1b22', mustache: true, mustacheColor: '#3b2a1a', glasses: '#141212', expr: 'sneer' },
  kid: { style: 'ch', coat: '#d9443a', vest: '#e8a23a', hairStyle: 'spiky', hair: '#e86a2a', pin: '#55c16a', expr: 'smile' },
};
export const shots = {
  lineup(L, dur) {
    L.post.on = true; L.newScene(); L.sky({ night: true }); L.lights({ night: true }); L.fog('#1a2148', 0.035);
    L.scene.add(L.street({ len: 60, width: 60, night: true })); L.scene.add(L.sidewalkStrip(-30, 30, -1.0, 2.4, true));
    const PAL = ['#c96f5a', '#6fa3a0', '#d98b6a', '#7d9bc1', '#b5838d'];
    for (let i = 0; i < 6; i++) { const b = L.building({ w: 4, h: 6.4, color: PAL[i % 5], seed: i + 3, night: true, lit: 0.6, floors: 3 }); b.position.set(-10 + i * 4, 0.12, -3.7); L.scene.add(b); L.fireEscape(-10 + i * 4, 0.12, -2.2, 2); }
    L.bunting(-6, 6, 5.6, -1.2); L.lamp(-3.6, -0.3, true); L.lamp(3.8, -0.3, true);
    L.bloom(0.8, 0.6, 0.75); L.grade({ tint: [0.92, 0.96, 1.1], vignette: 0.5, contrast: 1.08 });
    const ch = Object.values(C).map((c, i) => L.place(L.makeChar(c), -2.4 + i * 1.2, 0.3, 0, 0.12));
    return (t) => { ch.forEach((c, i) => L.pose(c, { t: t + i })); L.camMove(0, { from: [0, 1.6, 6.8], look: [0, 1.5, 0] }); L.dof(6.6, 0.0015, 0.008); };
  },
  closeup(L, dur) {
    shots.lineup(L, dur); const kid = L.scene.children.filter((c) => c.userData && c.userData.parts).at(-1);
    return (t) => { L.pose(kid, { t }); L.camMove(0, { from: [2.6, 2.0, 2.6], look: [2.4, 1.85, 0.3] }); L.dof(2.3, 0.004, 0.012); };
  },
};
