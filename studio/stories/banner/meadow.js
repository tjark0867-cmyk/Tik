// Cartoon-Wiesen-Banner "Tiny Town Tales" – 2560x1440. Sicherer Bereich (Handy): mittig 1546x423 px.
export function meadow(L) {
  const T = L.THREE;
  L.newScene();
  L.sky({ top: '#5fb4ff', bottom: '#d9f1ff' });
  L.lights({ sun: [-6, 12, 10], amb: 1.3, shadowSize: 14 });
  // Boden + Huegel
  L.scene.add(L.mesh(new T.PlaneGeometry(400, 400), L.toon('#7cc85a'), { rot: [-Math.PI / 2, 0, 0], shadow: false }));
  L.scene.add(L.mesh(new T.SphereGeometry(9, 40, 20), L.toon('#8fd46a'), { pos: [0, 0.6 - 9 * 0.55, -27.5], scale: [1, 0.55, 1], shadow: false }));
  const hills = [[-30, -45, 26, '#6bbf4e'], [12, -55, 34, '#8fd46a'], [40, -42, 24, '#5fae45'], [-6, -38, 18, '#79c95a'], [22, -30, 14, '#6bbf4e']];
  for (const [x, z, r, c] of hills) L.scene.add(L.mesh(new T.SphereGeometry(r, 40, 20), L.toon(c), { pos: [x, -r * 0.42, z], scale: [1, 0.55, 1], shadow: false }));
  // Kleine Stadt in der Ferne
  const houseCols = ['#e86a5a', '#f2c14e', '#7fb3d5', '#f0a06a', '#b5838d', '#8fd46a'];
  for (let i = 0; i < 7; i++) {
    const g = new T.Group(); const x = -3.9 + i * 1.3, z = -25.6 - (i % 2) * 0.8;
    g.add(L.box(1.2, 1.1, 1.0, houseCols[i % 6], { pos: [0, 0.55, 0] }));
    const roof = L.mesh(new T.CylinderGeometry(0.75, 0.75, 1.1, 3), L.toon(['#a8443a', '#5b4a7a', '#3f6f9a'][i % 3]), { rot: [Math.PI / 2, 0, Math.PI / 2], pos: [0, 1.45, 0] });
    roof.rotation.set(0, 0, 0); roof.rotation.x = Math.PI / 2; roof.rotation.z = Math.PI / 2; g.add(roof);
    g.add(L.box(0.25, 0.3, 0.02, '#ffe9a6', { pos: [-0.25, 0.65, 0.51] })); g.add(L.box(0.25, 0.3, 0.02, '#ffe9a6', { pos: [0.25, 0.65, 0.51] }));
    const hy = 0.6 - 9 * 0.55 + 0.55 * Math.sqrt(Math.max(0, 81 - x * x - (z + 27.5) ** 2)); g.position.set(x, hy - 0.08, z); g.scale.setScalar(0.65); L.scene.add(g);
  }
  const tower = new T.Group(); tower.position.set(0.9, 3.0, -29); tower.add(L.box(1.1, 3.6, 1.1, '#e9d8b4', { pos: [0, 1.8, 0] }));
  tower.add(L.mesh(new T.ConeGeometry(0.95, 1.4, 4), L.toon('#a8443a'), { pos: [0, 4.3, 0], rot: [0, Math.PI / 4, 0] }));
  tower.add(L.cyl(0.3, 0.3, 0.05, '#ffffff', { pos: [0, 2.9, 0.56], rot: [Math.PI / 2, 0, 0] }, 20)); tower.scale.setScalar(1.25);
  // Sonne + Wolken
  const sun = new T.Group(); sun.position.set(-17, 15, -40); L.scene.add(sun);
  sun.add(L.mesh(new T.SphereGeometry(2.6, 32, 24), L.noOutline(new T.MeshBasicMaterial({ color: '#ffd84a' })), { shadow: false }));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; sun.add(L.mesh(new T.BoxGeometry(0.5, 1.4, 0.2), L.noOutline(new T.MeshBasicMaterial({ color: '#ffe68a' })), { pos: [Math.cos(a) * 4, Math.sin(a) * 4, 0], rot: [0, 0, a - Math.PI / 2], shadow: false })); }
  const cloud = (x, y, z, s) => { const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); for (const [cx, cy, r] of [[0, 0, 1.2], [1.3, -0.2, 0.95], [-1.3, -0.25, 0.9], [0.6, 0.6, 0.9], [-0.6, 0.5, 0.85]]) g.add(L.mesh(new T.SphereGeometry(r, 24, 16), L.thin(L.toon('#ffffff')), { pos: [cx, cy, 0], scale: [1, 0.85, 0.8], shadow: false })); L.scene.add(g); };
  cloud(-8, 11, -30, 1.6); cloud(9, 13, -36, 2.0); cloud(19, 9.5, -30, 1.3); cloud(-22, 8, -34, 1.4);
  // Baeume
  L.tree(4.9, 0.9, 1.25, '#4fae45'); L.tree(-7.5, -2.5, 1.4, '#5fbf4e'); L.tree(8.5, -4, 1.5, '#4fae45'); L.tree(-10.5, -6, 1.6, '#6bbf4e');
  // Picknick (links)
  const blanket = L.canvasTex(256, 256, (c) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#e84a4a' : '#ffffff'; c.fillRect(x * 32, y * 32, 32, 32); } });
  L.scene.add(L.mesh(new T.PlaneGeometry(2.4, 1.8), L.noOutline(new T.MeshToonMaterial({ map: blanket })), { rot: [-Math.PI / 2, 0, 0.05], pos: [-3.8, 0.02, 3.3], shadow: false }));
  const basket = new T.Group(); basket.position.set(-3.8, 0.02, 3.75);
  basket.add(L.box(0.55, 0.32, 0.38, '#c98b4a', { pos: [0, 0.16, 0] })); basket.add(L.mesh(new T.TorusGeometry(0.22, 0.03, 8, 20, Math.PI), L.toon('#a0672e'), { pos: [0, 0.32, 0] }));
  basket.add(L.ball(0.1, '#e84a4a', { pos: [0.1, 0.36, 0.05] }, 12)); L.scene.add(basket);
  const sit = (cfg, x, z, ry) => { const c = L.place(L.makeChar(cfg), x, z, ry, -0.5); c.userData.sit = true; return c; };
  const pickett = sit({ coat: '#c79a4b', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'happy', buttons: '#6b4a1f' }, -4.45, 2.95, 0.12);
  const woman = sit({ coat: '#c4573f', dress: true, hair: '#6b3f22', hat: 'none', expr: 'happy', socks: ['#3f7bd1', '#f0c23b'], shoes: null }, -3.15, 2.95, -0.12);
  // Drachen-Kind + Dieb hinter dem Baum (rechts)
  const kid = L.place(L.makeChar({ coat: '#3f7bd1', hat: 'flatcap', hatColor: '#d9443a', expr: 'laugh', socks: ['#d9443a', '#55a14f'], scale: 0.75 }), 3.35, 3.1, -0.35);
  const thief = L.place(L.makeChar({ coat: '#34304a', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'sneaky', buttons: '#1d1b28' }), 6.25, 0.1, -0.7);
  const kite = new T.Group(); kite.position.set(5.6, 6.1, -1); kite.rotation.z = -0.35; L.scene.add(kite);
  const kshape = new T.Shape(); kshape.moveTo(0, 0.9); kshape.lineTo(0.6, 0); kshape.lineTo(0, -1.1); kshape.lineTo(-0.6, 0); kshape.closePath();
  const ktex = L.canvasTex(128, 128, (c) => { c.fillStyle = '#f0c23b'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#e84a4a'; c.fillRect(0, 0, 64, 64); c.fillRect(64, 64, 64, 64); });
  const kgeo = new T.ShapeGeometry(kshape); const pos = kgeo.attributes.position; const uv = [];
  for (let i = 0; i < pos.count; i++) uv.push((pos.getX(i) + 0.6) / 1.2, (pos.getY(i) + 1.1) / 2.0);
  kgeo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  kite.add(L.mesh(kgeo, new T.MeshToonMaterial({ map: ktex, side: T.DoubleSide }), { shadow: false }));
  for (let i = 0; i < 4; i++) kite.add(L.mesh(new T.BoxGeometry(0.22, 0.12, 0.02), L.toon(['#e84a4a', '#3f7bd1', '#55a14f', '#f0c23b'][i]), { pos: [0.05 * i, -1.3 - i * 0.38, 0], rot: [0, 0, 0.6 * (i % 2 ? 1 : -1)], shadow: false }));
  const stringGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
  const string = new T.Line(stringGeo, new T.LineBasicMaterial({ color: '#4a3a2a' })); L.scene.add(string);
  // Blumen (mit Abstand zu Figuren, Decke, Baum)
  const r = L.rand(17); const flowerCols = ['#ff5a5a', '#ffd84a', '#ffffff', '#ff8fc7', '#b48cff'];
  const keepOut = [[-3.8, 3.3, 1.6], [3.35, 3.1, 0.7], [4.9, 0.9, 1.0], [6.25, 0.1, 0.8]];
  for (let i = 0; i < 160; i++) {
    const x = (r() - 0.5) * 18, z = -3 + r() * 9;
    if (keepOut.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) continue;
    const f = new T.Group(); f.position.set(x, 0, z);
    f.add(L.mesh(new T.CylinderGeometry(0.015, 0.015, 0.3, 5), L.noOutline(L.toon('#3f8f3a')), { pos: [0, 0.15, 0], shadow: false }));
    f.add(L.mesh(new T.SphereGeometry(0.075, 10, 8), L.thin(L.toon(flowerCols[Math.floor(r() * 5)])), { pos: [0, 0.32, 0], shadow: false }));
    L.scene.add(f);
  }
  // Schriftzug
  const tex = L.canvasTex(2048, 560, (c) => {
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 250px Fredoka'; c.lineJoin = 'round';
    c.lineWidth = 50; c.strokeStyle = '#2d4a8a'; c.strokeText('Tiny Town Tales', 1024, 220);
    c.fillStyle = 'rgba(0,0,40,0.25)'; c.fillText('Tiny Town Tales', 1024, 238);
    const g = c.createLinearGradient(0, 110, 0, 330); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffe27a'); c.fillStyle = g; c.fillText('Tiny Town Tales', 1024, 220);
    c.font = '700 78px Fredoka'; const sub = 'Little stories. Big twists.'; const w = c.measureText(sub).width + 110;
    c.fillStyle = '#e84a4a'; c.beginPath(); c.roundRect(1024 - w / 2, 395, w, 120, 60); c.fill();
    c.lineWidth = 8; c.strokeStyle = '#ffffff'; c.stroke(); c.fillStyle = '#ffffff'; c.fillText(sub, 1024, 457);
  });
  const plane = new T.Mesh(new T.PlaneGeometry(1.86, 1.86 * 560 / 2048), L.noOutline(new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 })));
  plane.renderOrder = 10; plane.position.set(0, 0.03, -3); L.camera.add(plane); L.scene.add(L.camera);
  return () => {
    for (const c of [pickett, woman]) { L.pose(c, { t: 0.3 }); const P = c.userData.parts; P.legL.rotation.x = -1.5; P.legR.rotation.x = -1.5; P.body.position.y = 0.5; }
    L.pose(pickett, { t: 0.3, armR: [-1.0, -0.3] }); pickett.userData.parts.legL.rotation.x = -1.5; pickett.userData.parts.legR.rotation.x = -1.5;
    L.pose(woman, { t: 0.3, armL: [-2.6, -0.5] }); woman.userData.parts.legL.rotation.x = -1.5; woman.userData.parts.legR.rotation.x = -1.5;
    L.pose(kid, { t: 0.2, armR: [-2.7, 0.35] }); L.pose(thief, { t: 0.5, lean: -0.05 });
    L.camera.fov = 30; L.camera.updateProjectionMatrix(); L.camera.position.set(0, 1.7, 14); L.camera.lookAt(0, 2.7, 0);
    L.scene.updateMatrixWorld(true);
    const hand = new T.Vector3(0, -0.58, 0); kid.userData.parts.armR.children[0].localToWorld(hand);
    const k = new T.Vector3(0, -0.1, 0); kite.localToWorld(k);
    string.geometry.setFromPoints([hand, k]);
    for (const c of [pickett, woman]) if (c.userData.shadow) c.userData.shadow.position.y = 0.015;
  };
}
