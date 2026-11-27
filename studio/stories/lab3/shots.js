const ARLO = { style: '2d', coat: '#5d77a8', hat: 'beret', hatColor: '#9a2f3a', beard: '#ffffff', mustache: true, mustacheColor: '#ffffff', glasses: '#141212', hairStyle: 'tufts', hair: '#ece8e0', wrinkles: true, expr: 'worried', rim: '#ffd9a0', tint: '#d8d6ee' };
const KEEPER = { style: '2d', coat: '#4a3355', dress: true, hairStyle: 'bun', hair: '#a9a39b', glasses: '#141212', wrinkles: true, expr: 'stern', rim: '#ffd9a0', tint: '#ece6ff' };
const KID = { style: '2d', coat: '#d9443a', vest: '#e8a23a', hairStyle: 'spiky', hair: '#e86a2a', pin: '#55c16a', expr: 'smile', rim: '#ffc27a', tint: '#dfe4ff' };
const JUNE = { style: '2d', coat: '#f2c12e', dress: true, hairStyle: 'bun', hair: '#cfc9c1', wrinkles: true, blush: true, expr: 'happy', tint: '#ffffff' };
export const shots = {
  street(L, dur) {
    L.post.on = true; L.newScene(); L.sky({ night: true }); L.lights({ night: true }); L.fog('#1a2148', 0.035);
    L.scene.add(L.street({ len: 60, width: 60, night: true })); L.scene.add(L.sidewalkStrip(-30, 30, -1.0, 2.4, true));
    const PAL = ['#c96f5a', '#6fa3a0', '#d98b6a', '#7d9bc1', '#b5838d'];
    for (let i = 0; i < 6; i++) { const b = L.building({ w: 4, h: 6.4, color: PAL[i % 5], seed: i + 3, night: true, lit: 0.6, floors: 3 }); b.position.set(-10 + i * 4, 0.12, -3.7); L.scene.add(b); L.fireEscape(-10 + i * 4, 0.12, -2.2, 2); }
    L.bunting(-6, 6, 5.6, -1.2); L.lamp(-3.0, -0.3, true); L.lamp(3.4, -0.3, true);
    L.bloom(0.8, 0.6, 1.0); L.grade({ tint: [0.92, 0.96, 1.1], vignette: 0.5, contrast: 1.08 });
    const a = L.place(L.makeChar(KID), -0.7, 0.4, 0, 0.12); const b = L.place(L.makeChar({ ...ARLO, expr: 'smile' }), 0.8, -0.2, 0, 0.12);
    return (t) => { L.pose(a, { t, face: 0.5 }); L.pose(b, { t, face: -0.5 }); L.camMove(0, { from: [0.2, 1.7, 5.4], look: [0.1, 1.6, 0] }); L.dof(5.3, 0.002, 0.008); };
  },
  shop(L, dur) {
    L.post.on = true; L.newScene({ bg: '#0d0f1f' }); L.lights({ night: true, sun: [3, 7, 6], shadowSize: 7 }); L.fog('#141832', 0.05);
    L.room({ w: 11, d: 9, h: 5, wall: '#2c3554', floor: '#5a3a26' });
    const JC = ['#ff4b4b', '#ffd21f', '#3fd16a', '#3f8bff', '#ff8c42', '#b06bff', '#41e0d0', '#ff6fb5']; const r = L.rand(4);
    for (let row = 0; row < 5; row++) { L.scene.add(L.box(9, 0.08, 0.55, '#3a2618', { pos: [0, 0.9 + row * 0.8, -0.2] })); for (let i = 0; i < 14; i++) { const j = L.jar(JC[Math.floor(r() * 8)], { fill: 0.3 + r() * 0.65, s: 0.75, glow: 0.9 + r() * 0.4 }); j.position.set(-4.2 + i * 0.64, 0.95 + row * 0.8, -0.15); L.scene.add(j); } }
    L.desk(0, 2.0, { w: 3.6, color: '#4a2e1e', top: '#6b4a35' }); L.hangLamp(0.4, 3.5, 2.0, { power: 5 });
    L.bloom(0.6, 0.5, 1.0); L.grade({ tint: [0.92, 0.96, 1.1], vignette: 0.6, contrast: 1.08 });
    const k = L.place(L.makeChar(KEEPER), 0.4, 0.9, 0);
    const jar = (g, [x, y]) => { g.save(); g.translate(x - 30, y - 70); g.fillStyle = 'rgba(255,220,90,0.95)'; g.shadowColor = '#ffd21f'; g.shadowBlur = 30; g.fillRect(-28, 10, 56, 70); g.shadowBlur = 0; g.strokeStyle = '#1a1414'; g.lineWidth = 6; g.strokeRect(-30, 0, 60, 82); g.fillStyle = '#a8784a'; g.fillRect(-24, -14, 48, 16); g.strokeRect(-24, -14, 48, 16); g.restore(); };
    const j = L.place(L.makeChar({ ...JUNE, expr: 'smile' }), -1.2, 3.2, 0);
    return (t) => { L.pose(k, { t, face: 0.2 }); L.spritePose(j, { t, face: 0.4, arms: [[0.14, 0], [0.25, -1.9]], hold: jar }); L.camMove(0, { from: [-0.4, 2.0, 6.6], look: [-0.3, 1.7, 1.6] }); L.dof(3.6, 0.0025, 0.01); };
  },
};
