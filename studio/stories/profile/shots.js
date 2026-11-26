// Kanal-Profilbild: Maskottchen-Portraet im Stil der Videos (quadratisch rendern)
function portrait(L, { bg, bg2, char, night = false, look = 0.25 }) {
  L.newScene();
  L.scene.background = L.canvasTex(512, 512, (c) => {
    const g = c.createRadialGradient(256, 230, 40, 256, 256, 360); g.addColorStop(0, bg2); g.addColorStop(1, bg);
    c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    if (night) { c.fillStyle = '#fff7da'; const r = L.rand(9); for (let i = 0; i < 70; i++) c.fillRect(r() * 512, r() * 330, 2, 2); c.fillStyle = '#f6f0d4'; c.beginPath(); c.arc(410, 95, 38, 0, 7); c.fill(); }
  });
  L.lights({ sun: [-3, 4, 9], amb: 1.35, shadowSize: 4, night: false });
  const ch = L.makeChar(char); ch.rotation.y = look; L.scene.add(ch);
  L.pose(ch, { t: 0 });
  L.camera.fov = 30; L.camera.updateProjectionMatrix();
  return () => { L.camera.position.set(0.45, 2.1, 3.35); L.camera.lookAt(0.04, 2.0, 0); };
}
export const shots = {
  teal(L) { return portrait(L, { bg: '#2f6f62', bg2: '#7fc2b0', char: { coat: '#c79a4b', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'smug', buttons: '#6b4a1f' } }); },
  mustard(L) { return portrait(L, { bg: '#b9772a', bg2: '#f3cf7a', char: { coat: '#c9a56a', hat: 'fedora', hatColor: '#5c6b85', mustache: true, expr: 'smug' } }); },
  night(L) { return portrait(L, { bg: '#151a3d', bg2: '#4a4f86', night: true, char: { coat: '#34304a', hat: 'bowler', hatColor: '#2f3b33', mustache: true, mustacheColor: '#bdbdbd', expr: 'sneaky', buttons: '#1d1b28' } }); },
};
