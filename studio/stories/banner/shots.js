import { meadow } from './meadow.js';
// YouTube-Kanalbanner "Tiny Town Tales" – 2560x1440 rendern. Sicherer Bereich (alle Geraete): mittig 1546x423 px.
const PAL = ['#c96f5a', '#e0b25c', '#6fa3a0', '#d98b6a', '#8fb07a', '#b5838d', '#7d9bc1'];
export const shots = {
  meadow(L) { return meadow(L); },
  meadow_notext(L) { const u = meadow(L); L.camera.children.forEach((c) => (c.visible = false)); return u; },
  banner(L) {
    L.newScene(); L.sky({ top: '#79b4dc', bottom: '#f6dcb8' }); L.lights({ sun: [5, 10, 9], amb: 1.15, shadowSize: 22 });
    L.scene.add(L.street({ len: 90, width: 90 }));
    L.scene.add(L.sidewalkStrip(-40, 40, -1.0, 2.4));
    const names = { 1: 'BAKERY', 4: "PICKETT'S SOCKS", 7: 'BOOKS', 10: 'CAFE' };
    for (let i = 0; i < 13; i++) {
      const shop = names[i] !== undefined;
      const b = L.building({ w: 4, h: 5.4 + ((i * 7) % 3) * 0.8, color: PAL[i % PAL.length], seed: i + 3, shop, sign: names[i] || null,
        signColor: i === 4 ? '#7a2f2a' : '#2f5d4f', awning: shop ? [['#d9443a', '#f3ead8'], ['#3f7bd1', '#f3ead8'], ['#55a14f', '#f3ead8']][i % 3] : null });
      b.position.set(-26 + i * 4, 0.12, -3.7); L.scene.add(b);
    }
    L.tree(-13.5, -1.6, 1.1); L.tree(13.5, -1.6, 1.1);
    L.lamp(-8.5, -0.3); L.lamp(8.5, -0.3); L.mailbox(-4.4, -0.6);
    // Figuren links und rechts des Schriftzugs – mit Abstand zu allen Requisiten (keine Ueberschneidung)
    const cast = [
      [{ coat: '#c79a4b', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'happy', buttons: '#6b4a1f' }, -7.2, 0.5, 0.45, 'wave'],
      [{ coat: '#3d5a8a', hat: 'police', hatColor: '#2c3e6b', mustache: true, expr: 'laugh', buttons: '#e2b93b' }, -5.7, 1.3, 0.3, null],
      [{ coat: '#c4573f', dress: true, hair: '#6b3f22', hat: 'none', expr: 'surprised' }, 5.8, 1.2, -0.3, 'sock'],
      [{ coat: '#34304a', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'sneaky', buttons: '#1d1b28' }, 7.3, 0.6, -0.5, null],
    ];
    const chars = cast.map(([cfg, x, z, ry, act]) => {
      const c = L.place(L.makeChar(cfg), x, z, ry, 0.12);
      if (act === 'sock') { const s = L.sock('#d9443a'); s.position.set(0, -0.62, 0.08); c.userData.parts.armR.add(s); }
      c.userData.act = act; return c;
    });
    // Schriftzug als Ebene vor der Kamera
    const tex = L.canvasTex(2048, 560, (c) => {
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '700 250px Fredoka';
      c.lineJoin = 'round'; c.lineWidth = 46; c.strokeStyle = '#3b2a20'; c.strokeText('Tiny Town Tales', 1024, 220);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillText('Tiny Town Tales', 1024, 236);
      const g = c.createLinearGradient(0, 110, 0, 330); g.addColorStop(0, '#fff8e6'); g.addColorStop(1, '#f3d38a');
      c.fillStyle = g; c.fillText('Tiny Town Tales', 1024, 220);
      c.font = '700 78px Fredoka'; const sub = 'Little stories. Big twists.';
      const w = c.measureText(sub).width + 110;
      c.fillStyle = '#3b2a20'; c.beginPath(); c.roundRect(1024 - w / 2, 395, w, 120, 60); c.fill();
      c.fillStyle = '#fff8e6'; c.fillText(sub, 1024, 457);
    });
    const plane = new L.THREE.Mesh(new L.THREE.PlaneGeometry(1.86, 1.86 * 560 / 2048), L.noOutline(new L.THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 })));
    plane.renderOrder = 10; plane.position.set(0, 0.03, -3); L.camera.add(plane); L.scene.add(L.camera);
    return (t) => {
      chars.forEach((c) => L.pose(c, { t: 0.4, armR: c.userData.act === 'wave' ? [-2.6, 0.6] : c.userData.act === 'sock' ? [-1.6, -0.1] : null, laugh: 0 }));
      L.camera.fov = 30; L.camera.updateProjectionMatrix();
      L.camera.position.set(0, 2.25, 18.5); L.camera.lookAt(0, 2.9, -1.5);
    };
  },
};
