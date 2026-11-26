// Toon-Story-Engine: cel-shaded 3D-Figuren, Kulissen und Requisiten im Stil
// "gemuetliche Diorama-Stadt, runde weisse Meme-Gesichter, schwarze Umrisse".
import * as THREE from 'three';
import { OutlineEffect } from './OutlineEffect.js';

export { THREE };

// ---------------------------------------------------------------- Renderer
export const W = 720, H = 1280;
export let renderer, effect, scene, camera;
const disposables = [];

export function init(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  effect = new OutlineEffect(renderer, { defaultThickness: 0.0055, defaultColor: [0.06, 0.05, 0.05], defaultAlpha: 1 });
}

export function newScene({ bg = '#87b5d8', fog = null } = {}) {
  for (const d of disposables.splice(0)) d.dispose?.();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
  camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 400);
  return scene;
}

export function render() { effect.render(scene, camera); }

export function snapshot(quality = 0.92) {
  return renderer.domElement.toDataURL('image/jpeg', quality);
}

// ---------------------------------------------------------------- Helpers
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const v3 = (a) => new THREE.Vector3(...a);
// deterministisches Rauschen
export function rand(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Kamera zwischen zwei Positionen/Zielen bewegen. t = 0..1 */
export function camMove(t, { from, to, look, lookTo, fov, fovTo, roll = 0, rollTo, e = ease }) {
  const k = e(t);
  camera.position.lerpVectors(v3(from), v3(to || from), k);
  const target = v3(look).lerp(v3(lookTo || look), k);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  const r = lerp(roll, rollTo ?? roll, k);
  if (r) camera.rotateZ(r);
  if (fov) { camera.fov = lerp(fov, fovTo ?? fov, k); camera.updateProjectionMatrix(); }
  // leichtes "Handkamera"-Atmen
  camera.position.y += Math.sin(t * 6.1) * 0.004;
}

// ---------------------------------------------------------------- Materialien
let gradient;
function gradientMap() {
  if (gradient) return gradient;
  const data = new Uint8Array([135, 135, 135, 255, 190, 190, 190, 255, 238, 238, 238, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}
const matCache = new Map();
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.map && !opts.emissiveMap && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...opts });
  if (opts.noOutline) { delete m.noOutline; m.userData.outlineParameters = { visible: false }; }
  if (!opts.map && !opts.emissiveMap) matCache.set(key, m);
  return m;
}
export function noOutline(m) { m.userData.outlineParameters = { visible: false }; return m; }
export function thin(m, t = 0.0025) { m.userData.outlineParameters = { thickness: t }; return m; }

export function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  disposables.push(t);
  return t;
}

export function mesh(geo, mat, { pos = [0, 0, 0], rot = [0, 0, 0], scale = null, shadow = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if (scale) Array.isArray(scale) ? m.scale.set(...scale) : m.scale.setScalar(scale);
  m.castShadow = shadow; m.receiveShadow = receive;
  return m;
}
export const box = (w, h, d, color, o = {}) => mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? toon(color) : color, o);
export const cyl = (rt, rb, h, color, o = {}, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === 'string' ? toon(color) : color, o);
export const ball = (r, color, o = {}, seg = 24) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), typeof color === 'string' ? toon(color) : color, o);

// ---------------------------------------------------------------- Licht
export function lights({ night = false, sun = [6, 12, 8], warm = '#fff1dc', amb = 0.9, shadowSize = 14 } = {}) {
  const hemi = new THREE.HemisphereLight(night ? '#6d7fc9' : '#dfeeff', night ? '#1c1a33' : '#8a7a63', night ? 0.75 : amb);
  scene.add(hemi);
  const d = new THREE.DirectionalLight(night ? '#8fa2ff' : warm, night ? 0.9 : 2.1);
  d.position.set(...sun); d.castShadow = true;
  d.shadow.mapSize.set(1024, 1024);
  const s = shadowSize; Object.assign(d.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.5, far: 60 });
  d.shadow.bias = -0.0008; d.shadow.radius = 4;
  scene.add(d);
  return { hemi, sun: d };
}
export function pointLight(color, intensity, pos, dist = 8) {
  const l = new THREE.PointLight(color, intensity, dist, 1.6); l.position.set(...pos); scene.add(l); return l;
}

// ---------------------------------------------------------------- Gesichter
const FEATURE = '#7d7d7d', DARK = '#3b3b3b';
function drawFace(g, w, h, expr, o) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2, ey = h * 0.47, dx = w * 0.17;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const brow = (x, y, ang, lift = 0) => {
    g.save(); g.translate(x, y - lift); g.rotate(ang);
    g.fillStyle = FEATURE; g.beginPath(); g.ellipse(0, 0, w * 0.085, h * 0.022, 0, 0, Math.PI * 2); g.fill(); g.restore();
  };
  const lidEye = (x, open = 0.55) => { // halb geschlossenes "smug" Auge
    g.save(); g.beginPath(); g.rect(x - w * 0.09, ey - h * 0.06 + h * 0.12 * (1 - open), w * 0.18, h * 0.2); g.clip();
    g.fillStyle = FEATURE; g.beginPath(); g.ellipse(x, ey, w * 0.075, h * 0.06, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.strokeStyle = DARK; g.lineWidth = w * 0.012; g.beginPath();
    g.moveTo(x - w * 0.08, ey - h * 0.06 + h * 0.12 * (1 - open)); g.lineTo(x + w * 0.08, ey - h * 0.06 + h * 0.12 * (1 - open)); g.stroke();
  };
  const roundEye = (x, s = 1) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = DARK; g.lineWidth = w * 0.01;
    g.beginPath(); g.ellipse(x, ey, w * 0.07 * s, h * 0.08 * s, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(x, ey + h * 0.01, w * 0.028, h * 0.034, 0, 0, Math.PI * 2); g.fill();
  };
  const arcEye = (x, up = true) => {
    g.strokeStyle = FEATURE; g.lineWidth = w * 0.03; g.beginPath();
    if (up) g.arc(x, ey + h * 0.03, w * 0.06, Math.PI * 1.1, Math.PI * 1.9); else g.arc(x, ey - h * 0.03, w * 0.06, Math.PI * 0.1, Math.PI * 0.9);
    g.stroke();
  };
  const mustache = () => {
    if (!o.mustache) return;
    g.fillStyle = o.mustacheColor || '#8c8c8c';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(cx, h * 0.7);
      g.bezierCurveTo(cx + s * w * 0.06, h * 0.66, cx + s * w * 0.16, h * 0.67, cx + s * w * 0.2, h * 0.72);
      g.bezierCurveTo(cx + s * w * 0.14, h * 0.74, cx + s * w * 0.06, h * 0.75, cx, h * 0.73); g.fill();
    }
  };
  const mouthY = h * (o.mustache ? 0.79 : 0.74);
  switch (expr) {
    case 'happy': case 'laugh': {
      brow(cx - dx, ey - h * 0.13, -0.15, h * 0.02); brow(cx + dx, ey - h * 0.13, 0.15, h * 0.02);
      arcEye(cx - dx); arcEye(cx + dx);
      g.fillStyle = '#3a2323'; g.beginPath();
      const mw = expr === 'laugh' ? 0.17 : 0.12, mh = expr === 'laugh' ? 0.16 : 0.09;
      g.moveTo(cx - w * mw, mouthY - h * 0.03); g.quadraticCurveTo(cx, mouthY - h * 0.05, cx + w * mw, mouthY - h * 0.03);
      g.quadraticCurveTo(cx + w * mw * 0.8, mouthY + h * mh, cx, mouthY + h * mh); g.quadraticCurveTo(cx - w * mw * 0.8, mouthY + h * mh, cx - w * mw, mouthY - h * 0.03); g.fill();
      g.fillStyle = '#e46a6a'; g.beginPath(); g.ellipse(cx, mouthY + h * mh * 0.72, w * mw * 0.55, h * mh * 0.32, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.fillRect(cx - w * mw * 0.7, mouthY - h * 0.035, w * mw * 1.4, h * 0.03);
      mustache(); break;
    }
    case 'surprised': {
      brow(cx - dx, ey - h * 0.17, -0.1); brow(cx + dx, ey - h * 0.17, 0.1);
      roundEye(cx - dx, 1.05); roundEye(cx + dx, 1.05);
      g.fillStyle = '#3a2323'; g.beginPath(); g.ellipse(cx, mouthY + h * 0.02, w * 0.045, h * 0.055, 0, 0, Math.PI * 2); g.fill();
      mustache(); break;
    }
    case 'worried': case 'sad': {
      brow(cx - dx, ey - h * 0.13, 0.35); brow(cx + dx, ey - h * 0.13, -0.35);
      roundEye(cx - dx, 0.85); roundEye(cx + dx, 0.85);
      g.strokeStyle = DARK; g.lineWidth = w * 0.022; g.beginPath(); g.arc(cx, mouthY + h * 0.07, w * 0.07, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
      mustache(); break;
    }
    case 'angry': {
      brow(cx - dx, ey - h * 0.1, 0.4); brow(cx + dx, ey - h * 0.1, -0.4);
      lidEye(cx - dx, 0.6); lidEye(cx + dx, 0.6);
      g.strokeStyle = DARK; g.lineWidth = w * 0.022; g.beginPath(); g.arc(cx, mouthY + h * 0.08, w * 0.08, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
      mustache(); break;
    }
    case 'sneaky': {
      brow(cx - dx, ey - h * 0.1, 0.25); brow(cx + dx, ey - h * 0.12, -0.05);
      lidEye(cx - dx, 0.45); lidEye(cx + dx, 0.45);
      // Pupillen zur Seite
      g.strokeStyle = DARK; g.lineWidth = w * 0.02; g.beginPath();
      g.moveTo(cx - w * 0.07, mouthY); g.quadraticCurveTo(cx + w * 0.03, mouthY + h * 0.025, cx + w * 0.1, mouthY - h * 0.03); g.stroke();
      mustache(); break;
    }
    case 'sleep': {
      brow(cx - dx, ey - h * 0.1, -0.05); brow(cx + dx, ey - h * 0.1, 0.05);
      arcEye(cx - dx, false); arcEye(cx + dx, false);
      g.fillStyle = '#3a2323'; g.beginPath(); g.ellipse(cx, mouthY + h * 0.01, w * 0.03, h * 0.025, 0, 0, Math.PI * 2); g.fill();
      mustache(); break;
    }
    case 'neutral': {
      brow(cx - dx, ey - h * 0.12, -0.02); brow(cx + dx, ey - h * 0.12, 0.02);
      lidEye(cx - dx, 0.8); lidEye(cx + dx, 0.8);
      g.strokeStyle = DARK; g.lineWidth = w * 0.02; g.beginPath(); g.moveTo(cx - w * 0.06, mouthY); g.lineTo(cx + w * 0.06, mouthY); g.stroke();
      mustache(); break;
    }
    default: { // 'smug' – das typische Meme-Gesicht
      brow(cx - dx, ey - h * 0.11, -0.08); brow(cx + dx, ey - h * 0.12, 0.12);
      lidEye(cx - dx, 0.5); lidEye(cx + dx, 0.5);
      g.strokeStyle = DARK; g.lineWidth = w * 0.022; g.beginPath();
      g.moveTo(cx - w * 0.09, mouthY - h * 0.005); g.quadraticCurveTo(cx + w * 0.01, mouthY + h * 0.035, cx + w * 0.1, mouthY - h * 0.03); g.stroke();
      mustache();
    }
  }
  if (o.blush) { g.fillStyle = 'rgba(240,120,120,0.35)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * w * 0.26, h * 0.62, w * 0.06, h * 0.03, 0, 0, Math.PI * 2); g.fill(); } }
}

// ---------------------------------------------------------------- Figuren
/**
 * makeChar({ coat, hat, hatColor, mustache, expr, socks:[l,r], dress, hair, glove, legs })
 * hat: 'fedora' | 'police' | 'flatcap' | 'bowler' | 'beret' | 'none'
 */
export function makeChar(o = {}) {
  const C = Object.assign({ coat: '#c9a56a', hat: 'fedora', hatColor: '#6f7f9a', expr: 'smug', mustache: false, socks: null,
    dress: false, hair: null, glove: '#ffffff', legs: '#1b1b1b', shoes: '#4a2d1c', buttons: '#5a3b22', head: '#f2f1ec', scale: 1 }, o);
  const root = new THREE.Group();
  const parts = {};
  // Beine
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.62, 0); root.add(hip);
    hip.add(cyl(0.045, 0.045, 0.56, C.legs, { pos: [0, -0.3, 0] }, 10));
    const sc = C.socks ? C.socks[s < 0 ? 0 : 1] : null;
    if (C.shoes) hip.add(ball(0.1, C.shoes, { pos: [0, -0.56, 0.05], scale: [1.25, 0.8, 1.7] }, 16));
    else if (sc) hip.add(ball(0.085, sc, { pos: [0, -0.57, 0.04], scale: [1.1, 0.9, 1.5] }, 14));
    if (sc) hip.add(cyl(0.064, 0.064, C.shoes ? 0.16 : 0.3, sc, { pos: [0, C.shoes ? -0.46 : -0.43, 0] }, 14));
    parts[s < 0 ? 'legL' : 'legR'] = hip;
  }
  // Koerper / Mantel
  const body = new THREE.Group(); body.position.y = 0.5; root.add(body); parts.body = body;
  const prof = C.dress
    ? [[0, 0.0], [0.5, 0.0], [0.46, 0.18], [0.36, 0.5], [0.3, 0.78], [0.22, 0.9], [0, 0.92]]
    : [[0, 0.0], [0.4, 0.0], [0.385, 0.12], [0.35, 0.4], [0.32, 0.66], [0.3, 0.76], [0.25, 0.85], [0.14, 0.9], [0, 0.91]];
  const coat = mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 28), toon(C.coat));
  body.add(coat);
  if (!C.dress) {
    for (const y of [0.2, 0.42, 0.62]) body.add(ball(0.03, C.buttons, { pos: [0.08, y, 0.37 - y * 0.075] }, 8));
    body.add(cyl(0.335, 0.35, 0.06, C.belt || shade(C.coat, -0.18), { pos: [0, 0.4, 0] }, 28));
    // Kragen
    const collar = mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 24), toon(shade(C.coat, 0.08)), { pos: [0, 0.86, 0.03], rot: [Math.PI / 2.2, 0, 0] });
    body.add(collar);
  } else {
    body.add(cyl(0.31, 0.33, 0.05, shade(C.coat, 0.25), { pos: [0, 0.55, 0] }, 28));
  }
  // Arme
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.29, 0.74, 0); body.add(sh);
    const arm = new THREE.Group(); sh.add(arm);
    arm.add(cyl(0.037, 0.037, 0.55, C.legs, { pos: [0, -0.28, 0] }, 8));
    arm.add(ball(0.095, C.glove, { pos: [0, -0.58, 0], scale: [1, 1.05, 0.9] }, 14));
    arm.add(cyl(0.06, 0.06, 0.06, C.glove, { pos: [0, -0.5, 0] }, 12));
    sh.rotation.z = s * 0.28;
    parts[s < 0 ? 'armL' : 'armR'] = sh;
  }
  // Kopf
  const headG = new THREE.Group(); headG.position.y = 1.3; body.add(headG); parts.head = headG; parts.headY = 1.3;
  const head = ball(0.5, C.head, { scale: [1, 0.93, 0.95] }, 40); headG.add(head);
  const faceCanvas = document.createElement('canvas'); faceCanvas.width = faceCanvas.height = 512;
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; disposables.push(faceTex);
  const faceMat = new THREE.MeshToonMaterial({ map: faceTex, transparent: true, gradientMap: gradientMap(), depthWrite: false });
  noOutline(faceMat);
  const fl = 1.9;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.503, 48, 32, Math.PI / 2 - fl / 2, fl, Math.PI / 2 - fl / 2, fl), faceMat);
  face.scale.set(1, 0.93, 0.95); face.renderOrder = 2; headG.add(face);
  const setExpr = (e) => { drawFace(faceCanvas.getContext('2d'), 512, 512, e, C); faceTex.needsUpdate = true; parts.expr = e; };
  setExpr(C.expr);
  // Haare / Huete
  const top = 0.46;
  if (C.hair) {
    headG.add(ball(0.52, C.hair, { pos: [0, 0.06, -0.06], scale: [1.02, 0.9, 0.95] }, 32));
    headG.children.at(-1).geometry = new THREE.SphereGeometry(0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
    headG.add(ball(0.2, C.hair, { pos: [0, 0.46, -0.18] }, 18));
  }
  const hc = C.hatColor;
  if (C.hat === 'fedora') {
    const hat = new THREE.Group(); hat.position.set(0, top - 0.02, 0); hat.rotation.set(-0.05, 0, 0.06);
    hat.add(cyl(0.62, 0.62, 0.035, hc, {}, 36));
    hat.add(cyl(0.33, 0.39, 0.3, hc, { pos: [0, 0.16, 0] }, 32));
    hat.add(cyl(0.395, 0.395, 0.07, shade(hc, -0.35), { pos: [0, 0.05, 0] }, 32));
    headG.add(hat); parts.hat = hat;
  } else if (C.hat === 'police') {
    const hat = new THREE.Group(); hat.position.set(0, top - 0.04, 0);
    hat.add(cyl(0.44, 0.4, 0.26, hc, { pos: [0, 0.13, 0] }, 32));
    hat.add(cyl(0.45, 0.45, 0.04, shade(hc, -0.3), { pos: [0, 0.27, 0] }, 32));
    hat.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 24, 1, false, -Math.PI / 2.6, Math.PI / 1.3), toon('#1d1d24'), { pos: [0, 0.0, 0.12] }));
    hat.add(ball(0.06, '#e2b93b', { pos: [0, 0.15, 0.41], scale: [1, 1, 0.5] }, 12));
    headG.add(hat); parts.hat = hat;
  } else if (C.hat === 'flatcap') {
    const hat = new THREE.Group(); hat.position.set(0, top - 0.05, 0.02); hat.rotation.x = 0.12;
    hat.add(ball(0.5, hc, { scale: [1.02, 0.42, 1.08] }, 28));
    hat.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 24, 1, false, -Math.PI / 2.4, Math.PI / 1.2), toon(shade(hc, -0.1)), { pos: [0, -0.02, 0.2] }));
    headG.add(hat); parts.hat = hat;
  } else if (C.hat === 'bowler') {
    const hat = new THREE.Group(); hat.position.set(0, top - 0.02, 0);
    hat.add(cyl(0.55, 0.55, 0.03, hc, {}, 32));
    const dome = ball(0.36, hc, { pos: [0, 0.02, 0] }, 28); dome.geometry = new THREE.SphereGeometry(0.36, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2); hat.add(dome);
    headG.add(hat); parts.hat = hat;
  } else if (C.hat === 'beret') {
    headG.add(ball(0.48, hc, { pos: [0.06, top - 0.04, 0], scale: [1.05, 0.28, 1.05] }, 24));
  }
  root.userData = { parts, setExpr, cfg: C };
  root.scale.setScalar(C.scale);
  return root;
}

export function shade(hex, amt) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl, THREE.SRGBColorSpace);
  c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt, 0, 1), THREE.SRGBColorSpace); return '#' + c.getHexString();
}

// ---- Animationen (alle deterministisch ueber t in Sekunden)
export function pose(ch, { t = 0, walk = 0, sneak = 0, bob = 1, armL = null, armR = null, look = 0, nod = 0, laugh = 0, lean = 0 } = {}) {
  const P = ch.userData.parts;
  const ph = t * 7.5 * (walk || 1);
  const sw = walk ? Math.sin(ph) * 0.55 * Math.min(1, walk) : 0;
  P.legL.rotation.x = sw; P.legR.rotation.x = -sw;
  P.armL.rotation.x = walk ? -sw * 0.8 : Math.sin(t * 1.3) * 0.03;
  P.armR.rotation.x = walk ? sw * 0.8 : -Math.sin(t * 1.3) * 0.03;
  P.armL.rotation.z = -0.28; P.armR.rotation.z = 0.28;
  const breathe = Math.sin(t * 2.2) * 0.012 * bob;
  P.body.position.y = 0.5 + breathe + (walk ? Math.abs(Math.cos(ph)) * 0.05 : 0) - sneak * 0.12;
  P.body.rotation.x = sneak * 0.25 + lean;
  P.body.rotation.z = laugh ? Math.sin(t * 22) * 0.05 * laugh : 0;
  P.head.rotation.set(nod ? Math.sin(t * 6) * 0.12 * nod : 0, look, laugh ? Math.sin(t * 18) * 0.06 * laugh : 0);
  P.head.position.y = P.headY + (laugh ? Math.abs(Math.sin(t * 18)) * 0.04 * laugh : 0);
  if (armL) { P.armL.rotation.x = armL[0]; P.armL.rotation.z = armL[1]; }
  if (armR) { P.armR.rotation.x = armR[0]; P.armR.rotation.z = armR[1]; }
  if (sneak) { P.armL.rotation.x = -0.9; P.armR.rotation.x = -0.9; }
}
export const ARM = { up: [-2.9, 0.15], forward: [-1.45, 0.1], hold: [-1.1, 0.05], wave: (t) => [-2.6, 0.5 + Math.sin(t * 10) * 0.35], hip: [0.2, 0.75], chin: [-2.2, -0.65] };

export function blobShadow(r = 0.55) {
  const tex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), noOutline(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; return m;
}
export function place(ch, x, z, ry = 0, y = 0) {
  ch.position.set(x, y, z); ch.rotation.y = ry; scene.add(ch);
  const s = blobShadow(0.5 * ch.userData.cfg.scale); s.position.set(x, y + 0.012, z); scene.add(s); ch.userData.shadow = s;
  return ch;
}
export function moveTo(ch, x, z) { ch.position.x = x; ch.position.z = z; if (ch.userData.shadow) { ch.userData.shadow.position.x = x; ch.userData.shadow.position.z = z; } }

// ---------------------------------------------------------------- Texturen
export function cobble(repeat = [10, 10], base = '#9c9690') {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = shade(base, -0.12); g.fillRect(0, 0, w, h);
    const r = rand(7);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const ox = (y % 2) * 16;
      g.fillStyle = shade(base, (r() - 0.5) * 0.12);
      g.beginPath(); g.roundRect(x * 32 + ox - 16 + 2, y * 32 + 2, 28, 28, 8); g.fill();
    }
  }, { repeat });
}
export function planks(repeat = [3, 3], base = '#a8754a') {
  return canvasTex(256, 256, (g, w, h) => {
    const r = rand(3);
    for (let i = 0; i < 8; i++) { g.fillStyle = shade(base, (r() - 0.5) * 0.1); g.fillRect(0, i * 32, w, 32); g.fillStyle = shade(base, -0.2); g.fillRect(0, i * 32, w, 2); g.fillRect(((i * 97) % 256), i * 32, 2, 32); }
  }, { repeat });
}
export function wallpaper(base = '#5f8f7e', stripe = null, repeat = [4, 2]) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = stripe || shade(base, 0.06);
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
  }, { repeat });
}
export function tiles(repeat = [8, 2], base = '#d9d3c7') {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = shade(base, -0.15); g.fillRect(0, 0, w, h);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = shade(base, ((x + y) % 2) * 0.03); g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
  }, { repeat });
}

/** Text auf Canvas mit automatischer Groessenanpassung */
export function fitText(g, text, x, y, maxW, size, font, color, align = 'center') {
  let s = size; g.font = `${font.replace('$', s)}`;
  while (g.measureText(text).width > maxW && s > 8) { s -= 2; g.font = font.replace('$', s); }
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y);
}

// ---------------------------------------------------------------- Kulissen
/**
 * Hausfassade (Front zeigt nach +z). opts: color, floors, sign, awning, door, lit, roof, trim
 */
export function building({ w = 4, h = 6, d = 3, color = '#c96f5a', floors = 2, cols = 2, sign = null, signColor = '#2f5d4f', signText = '#f3e7c8',
  awning = null, door = 'center', lit = 0, shop = false, roof = '#5b4a4a', trim = '#f1e6d2', winColor = '#7fb3d5', seed = 1, night = false } = {}) {
  const g = new THREE.Group();
  const r = rand(seed);
  const tw = 512, th = Math.round(512 * h / w);
  const litWins = [];
  const front = canvasTex(tw, th, (c) => {
    c.fillStyle = color; c.fillRect(0, 0, tw, th);
    // Ziegel-/Putzstruktur
    c.fillStyle = shade(color, -0.05);
    for (let y = 0; y < th; y += 22) for (let x = (y / 22) % 2 * 24; x < tw; x += 48) c.fillRect(x, y, 44, 2);
    c.fillStyle = trim; c.fillRect(0, 0, tw, 18); c.fillRect(0, th - 10, tw, 10);
    const groundH = shop ? th * 0.36 : th / (floors + 1);
    const upper = th - groundH;
    for (let f = 0; f < floors; f++) {
      const fy = 30 + f * ((upper - 40) / floors);
      const fh = (upper - 40) / floors;
      for (let i = 0; i < cols; i++) {
        const ww = tw / cols * 0.5, wh = fh * 0.62;
        const wx = tw / cols * (i + 0.25), wy = fy + fh * 0.15;
        const on = r() < lit;
        c.fillStyle = trim; c.fillRect(wx - 8, wy - 8, ww + 16, wh + 22);
        c.fillStyle = on ? '#ffd27a' : (night ? '#25304f' : winColor); c.fillRect(wx, wy, ww, wh);
        if (on) litWins.push([wx, wy, ww, wh]);
        c.fillStyle = trim; c.fillRect(wx + ww / 2 - 3, wy, 6, wh); c.fillRect(wx, wy + wh / 2 - 3, ww, 6);
        if (!on) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(wx + 6, wy + wh * 0.4); c.lineTo(wx + ww * 0.35, wy + 6); c.lineTo(wx + ww * 0.45, wy + 6); c.lineTo(wx + 6, wy + wh * 0.5); c.fill(); }
        c.fillStyle = shade(color, -0.25); c.fillRect(wx - 12, wy + wh + 10, ww + 24, 10); // Fensterbank
      }
    }
    // Erdgeschoss
    const gy = th - groundH;
    c.fillStyle = shop ? shade(color, -0.1) : color; c.fillRect(0, gy, tw, groundH);
    if (shop) {
      c.fillStyle = trim; c.fillRect(20, gy + 30, tw - 40, groundH - 40);
      c.fillStyle = night ? '#ffcf7a' : '#9ccbe0'; c.fillRect(36, gy + 46, tw * 0.55, groundH - 70);
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(50, gy + 56, 30, groundH - 100);
      c.fillStyle = shade(color, -0.35); c.fillRect(tw * 0.68, gy + 46, tw * 0.22, groundH - 56);
      c.fillStyle = '#e2b93b'; c.beginPath(); c.arc(tw * 0.7 + 12, gy + groundH * 0.6, 6, 0, 7); c.fill();
    } else if (door) {
      const dx = door === 'left' ? tw * 0.15 : door === 'right' ? tw * 0.65 : tw * 0.4;
      c.fillStyle = trim; c.fillRect(dx - 10, gy + groundH * 0.25 - 10, tw * 0.2 + 20, groundH * 0.75 + 10);
      c.fillStyle = '#5a3424'; c.fillRect(dx, gy + groundH * 0.25, tw * 0.2, groundH * 0.75);
      c.fillStyle = '#e2b93b'; c.beginPath(); c.arc(dx + tw * 0.16, gy + groundH * 0.65, 6, 0, 7); c.fill();
      for (const sx of [0.08, 0.72]) { c.fillStyle = trim; c.fillRect(tw * sx - 6, gy + groundH * 0.2 - 6, tw * 0.2 + 12, groundH * 0.45 + 12); c.fillStyle = night ? (r() < lit ? '#ffd27a' : '#25304f') : winColor; c.fillRect(tw * sx, gy + groundH * 0.2, tw * 0.2, groundH * 0.45); }
    }
  });
  const emis = lit > 0 && night ? canvasTex(tw, th, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, tw, th); c.fillStyle = '#ffb347'; for (const [x, y, w2, h2] of litWins) c.fillRect(x, y, w2, h2); if (shop) { c.fillRect(36, th - th * 0.36 + 46, tw * 0.55, th * 0.36 - 70); } }) : null;
  const side = toon(shade(color, -0.08));
  const frontMat = new THREE.MeshToonMaterial({ map: front, gradientMap: gradientMap(), ...(emis ? { emissiveMap: emis, emissive: new THREE.Color('#ffb347'), emissiveIntensity: 1.2 } : {}) });
  const b = mesh(new THREE.BoxGeometry(w, h, d), [side, side, toon(roof), side, frontMat, side], { pos: [0, h / 2, 0] });
  g.add(b);
  // Dachgesims + Dach
  g.add(box(w + 0.2, 0.18, d + 0.2, trim, { pos: [0, h + 0.09, 0] }));
  if (sign) {
    const st = canvasTex(512, 96, (c) => { c.fillStyle = signColor; c.fillRect(0, 0, 512, 96); c.strokeStyle = '#e2b93b'; c.lineWidth = 6; c.strokeRect(8, 8, 496, 80); fitText(c, sign, 256, 50, 470, 56, '700 $px Fredoka', signText); });
    const sm = new THREE.MeshToonMaterial({ map: st, gradientMap: gradientMap() });
    g.add(mesh(new THREE.BoxGeometry(w * 0.86, w * 0.86 * 96 / 512, 0.12), [toon(signColor), toon(signColor), toon(signColor), toon(signColor), sm, toon(signColor)], { pos: [0, (shop ? h * 0.36 : h / (floors + 1)) + 0.35, d / 2 + 0.08] }));
  }
  if (awning) g.add(makeAwning(w * 0.8, awning, [0, (shop ? h * 0.36 : 2.2) - 0.05, d / 2]));
  return g;
}
export function makeAwning(w, colors, pos) {
  const t = canvasTex(256, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = colors[i % 2]; c.fillRect(i * 32, 0, 32, 64); } c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 50, 256, 14); });
  const m = new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap(), side: THREE.DoubleSide });
  const a = mesh(new THREE.PlaneGeometry(w, 0.9), m, { pos: [pos[0], pos[1], pos[2] + 0.38], rot: [-1.0, 0, 0] });
  return a;
}

export function street({ len = 40, width = 10, night = false, sidewalk = '#cfc6b8' } = {}) {
  const g = new THREE.Group();
  const road = mesh(new THREE.PlaneGeometry(width, len), new THREE.MeshToonMaterial({ map: cobble([width / 1.5, len / 1.5], night ? '#5d5a6e' : '#9c9690'), gradientMap: gradientMap() }), { rot: [-Math.PI / 2, 0, 0], shadow: false });
  g.add(road);
  return g;
}
export function sidewalkStrip(x0, x1, z, depth = 2.2, night = false) {
  const w = x1 - x0;
  return mesh(new THREE.BoxGeometry(w, 0.12, depth), new THREE.MeshToonMaterial({ map: tiles([w / 1.2, depth / 1.2], night ? '#8f8aa3' : '#d9d3c7'), gradientMap: gradientMap() }), { pos: [(x0 + x1) / 2, 0.06, z], shadow: false });
}
export function lamp(x, z, night = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  g.add(cyl(0.07, 0.1, 3.4, '#2f4a3f', { pos: [0, 1.7, 0] }, 12));
  g.add(cyl(0.16, 0.16, 0.2, '#2f4a3f', { pos: [0, 0.1, 0] }, 12));
  const head = cyl(0.26, 0.16, 0.45, night ? toon('#ffd98a', { emissive: '#ffcf6a', emissiveIntensity: 1.4 }) : '#f6efd5', { pos: [0, 3.55, 0] }, 8);
  g.add(head); g.add(cyl(0.05, 0.32, 0.18, '#2f4a3f', { pos: [0, 3.86, 0] }, 8));
  scene.add(g);
  if (night) pointLight('#ffc977', 6, [x, 3.4, z + 0.3], 7);
  return g;
}
export function mailbox(x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  g.add(cyl(0.32, 0.32, 1.3, '#c8312f', { pos: [0, 0.65, 0] }, 24));
  g.add(cyl(0.36, 0.36, 0.1, '#a42523', { pos: [0, 1.32, 0] }, 24));
  g.add(ball(0.32, '#c8312f', { pos: [0, 1.36, 0], scale: [1, 0.45, 1] }, 20));
  g.add(box(0.36, 0.06, 0.06, '#2b1b1b', { pos: [0, 1.05, 0.31] }));
  scene.add(g); return g;
}
export function tree(x, z, s = 1, color = '#5f8f4e') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  g.add(cyl(0.12, 0.16, 1.4, '#6b4a2f', { pos: [0, 0.7, 0] }, 10));
  g.add(ball(0.75, color, { pos: [0, 1.9, 0] }, 16)); g.add(ball(0.55, shade(color, 0.05), { pos: [0.35, 2.3, 0.1] }, 14));
  scene.add(g); return g;
}

/** Innenraum: Boden + Rueckwand + linke/rechte Wand. Gibt Gruppe zurueck. */
export function room({ w = 8, d = 6, h = 4, wall = '#5f8f7e', floor = '#a8754a', stripe = null, sideWalls = true } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshToonMaterial({ map: planks([w / 2, d / 2], floor), gradientMap: gradientMap() }), { rot: [-Math.PI / 2, 0, 0], pos: [0, 0, d / 2 - 0.5], shadow: false }));
  const wm = new THREE.MeshToonMaterial({ map: wallpaper(wall, stripe, [w / 1.2, h / 2]), gradientMap: gradientMap() });
  g.add(mesh(new THREE.PlaneGeometry(w, h), wm, { pos: [0, h / 2, -0.5], shadow: false }));
  g.add(box(w, 0.25, 0.08, shade(wall, -0.25), { pos: [0, 0.12, -0.46], shadow: false }));
  g.add(box(w, 0.1, 0.1, shade(wall, 0.15), { pos: [0, h * 0.55, -0.45], shadow: false }));
  if (sideWalls) for (const s of [-1, 1]) {
    const sm = new THREE.MeshToonMaterial({ map: wallpaper(shade(wall, -0.04), stripe, [d / 1.2, h / 2]), gradientMap: gradientMap() });
    g.add(mesh(new THREE.PlaneGeometry(d, h), sm, { pos: [s * w / 2, h / 2, d / 2 - 0.5], rot: [0, -s * Math.PI / 2, 0], shadow: false }));
  }
  scene.add(g); return g;
}
export function desk(x, z, { w = 2.6, d = 1.1, color = '#6b4a35', top = '#4f7e6c' } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  g.add(box(w, 0.1, d, color, { pos: [0, 1.0, 0] }));
  g.add(box(w - 0.06, 0.02, d - 0.1, top, { pos: [0, 1.06, 0] }));
  g.add(box(w, 0.9, 0.08, shade(color, -0.1), { pos: [0, 0.5, d / 2 - 0.08] }));
  for (const s of [-1, 1]) g.add(box(0.1, 1.0, d, color, { pos: [s * (w / 2 - 0.05), 0.5, 0] }));
  scene.add(g); return g;
}
export function dresser(x, z, { w = 2.2, h = 1.6, d = 0.8, color = '#8a5a3b', rows = 3, ry = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  g.add(box(w, h, d, color, { pos: [0, h / 2 + 0.1, 0] }));
  g.add(box(w + 0.1, 0.06, d + 0.08, shade(color, -0.15), { pos: [0, h + 0.13, 0] }));
  const drawers = [];
  for (let i = 0; i < rows; i++) {
    const dr = new THREE.Group();
    const dh = (h - 0.2) / rows - 0.06;
    dr.position.set(0, 0.2 + (h - 0.2) * (i + 0.5) / rows + 0.1, d / 2 - 0.35);
    const inner = shade(color, -0.04);
    dr.add(box(w - 0.2, 0.03, 0.68, inner, { pos: [0, -dh / 2 + 0.02, 0] }));
    dr.add(box(w - 0.2, dh * 0.8, 0.03, inner, { pos: [0, -dh * 0.1, -0.33] }));
    for (const sx of [-1, 1]) dr.add(box(0.03, dh * 0.8, 0.68, shade(color, -0.1), { pos: [sx * (w / 2 - 0.1), -dh * 0.1, 0] }));
    dr.add(box(w - 0.16, dh, 0.05, shade(color, 0.1), { pos: [0, 0, 0.36] }));
    dr.userData.floorY = -dh / 2 + 0.035;
    dr.add(ball(0.05, '#e2b93b', { pos: [0, 0, 0.42] }, 10));
    g.add(dr); drawers.push(dr);
  }
  g.userData.drawers = drawers; scene.add(g); return g;
}

// ---------------------------------------------------------------- Requisiten
export function sock(color = '#d9443a', stripe = '#f2efe6', s = 1) {
  const path = new THREE.CatmullRomCurve3([v3([0, 0.55, 0]), v3([0, 0.2, 0]), v3([0.03, 0.04, 0.06]), v3([0.1, 0, 0.22]), v3([0.12, 0, 0.32])]);
  const t = canvasTex(256, 64, (c) => {
    c.fillStyle = color; c.fillRect(0, 0, 256, 64);
    c.fillStyle = stripe; c.fillRect(0, 0, 14, 64); c.fillRect(24, 0, 12, 64); c.fillRect(46, 0, 12, 64);  // Buendchen
    c.fillRect(150, 0, 34, 64);                                                                               // Ferse
    c.fillRect(226, 0, 30, 64);                                                                               // Spitze
    c.fillStyle = shade(color, -0.12); for (let x = 64; x < 140; x += 10) c.fillRect(x, 0, 3, 64);           // Rippen
  });
  const m = mesh(new THREE.TubeGeometry(path, 32, 0.075, 12, false), new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap() }), { scale: s });
  const g = new THREE.Group(); g.add(m);
  g.add(ball(0.075, stripe, { pos: [0.12 * s, 0, 0.32 * s], scale: s }, 10));
  g.add(cyl(0.08, 0.08, 0.04, stripe, { pos: [0, 0.55 * s, 0] }, 12)).scale.setScalar(1);
  return g;
}
export function newspaper(headline, sub = '', { masthead = 'THE DAILY COURIER', w = 1.4 } = {}) {
  const t = canvasTex(512, 720, (c) => {
    c.fillStyle = '#f2ecdc'; c.fillRect(0, 0, 512, 720);
    fitText(c, masthead, 256, 52, 470, 48, '700 $px "Playfair Display"', '#2a2a2a');
    c.fillStyle = '#2a2a2a'; c.fillRect(24, 86, 464, 4); c.fillRect(24, 96, 464, 1.5);
    const words = headline.split(' '); const lines = []; let cur = '';
    c.font = '900 64px "Playfair Display"';
    for (const wd of words) { const tt = cur ? cur + ' ' + wd : wd; if (c.measureText(tt).width > 460) { lines.push(cur); cur = wd; } else cur = tt; }
    lines.push(cur);
    lines.forEach((l, i) => fitText(c, l, 256, 150 + i * 70, 470, 64, '900 $px "Playfair Display"', '#1d1d1d'));
    const y0 = 150 + lines.length * 70;
    if (sub) fitText(c, sub, 256, y0, 460, 26, 'italic 400 $px "Playfair Display"', '#3d3d3d');
    c.fillStyle = '#cfc6b2'; c.fillRect(40, y0 + 30, 200, 230);
    c.fillStyle = '#9b927f'; c.beginPath(); c.arc(140, y0 + 120, 46, 0, 7); c.fill(); c.fillRect(90, y0 + 170, 100, 90);
    c.fillStyle = '#6e6a60'; for (let i = 0; i < 16; i++) c.fillRect(262, y0 + 34 + i * 15, 210 - (i % 5) * 12, 5);
    for (let i = 0; i < 10; i++) c.fillRect(40, y0 + 280 + i * 15, 430 - (i % 4) * 30, 5);
  });
  const m = mesh(new THREE.PlaneGeometry(w, w * 720 / 512), new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap(), side: THREE.DoubleSide }));
  thin(m.material); return m;
}
export function chalkboard(lines, { w = 1.6, h = 2.1 } = {}) {
  const g = new THREE.Group();
  const t = canvasTex(400, 460, (c) => {
    c.fillStyle = '#2f4a3c'; c.fillRect(0, 0, 400, 460);
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 40; i++) c.fillRect((i * 97) % 400, (i * 53) % 460, 60, 3);
    let y = 70;
    for (const [txt, size] of lines) { fitText(c, txt, 200, y + size * 0.1, 350, size, '400 $px "Permanent Marker"', '#f3f1e7'); y += size * 1.15; }
  });
  const face = mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.62), new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap() }), { pos: [0, h * 0.62, 0.07] });
  noOutline(face.material);
  g.add(box(w, h * 0.72, 0.1, '#7a5233', { pos: [0, h * 0.62, 0], rot: [0, 0, 0] }));
  g.add(face);
  for (const s of [-1, 1]) g.add(box(0.1, h * 0.6, 0.1, '#7a5233', { pos: [s * w * 0.45, h * 0.18, -0.15], rot: [0.12, 0, 0] }));
  g.rotation.x = -0.08;
  return g;
}
export function note(text, { w = 1, color = '#fbf6e4', ink = '#3a4a8a', size = 64 } = {}) {
  const t = canvasTex(512, 340, (c) => { c.fillStyle = color; c.fillRect(0, 0, 512, 340); c.strokeStyle = 'rgba(80,110,170,0.25)'; c.lineWidth = 2; for (let y = 90; y < 340; y += 56) { c.beginPath(); c.moveTo(20, y); c.lineTo(492, y); c.stroke(); }
    const ls = text.split('\n'); ls.forEach((l, i) => fitText(c, l, 256, 120 + i * 80 - (ls.length - 1) * 30, 450, size, '700 $px Caveat', ink)); });
  const m = mesh(new THREE.PlaneGeometry(w, w * 340 / 512), new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap(), side: THREE.DoubleSide }));
  thin(m.material); return m;
}
export function poster(text, { w = 1.2, h = 1.6, bg = '#efe6cf', ink = '#3a2a1a', title = 'WANTED' } = {}) {
  const t = canvasTex(360, 480, (c) => { c.fillStyle = bg; c.fillRect(0, 0, 360, 480); fitText(c, title, 180, 60, 320, 56, '900 $px "Playfair Display"', ink);
    c.fillStyle = '#d8ccb0'; c.fillRect(70, 110, 220, 200); c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(180, 190, 55, Math.PI, 0); c.fill(); c.fillRect(120, 186, 120, 12);
    c.fillStyle = '#f2f1ec'; c.beginPath(); c.arc(180, 230, 52, 0, 7); c.fill();
    text.split('\n').forEach((l, i) => fitText(c, l, 180, 350 + i * 44, 320, 34, '700 $px "Playfair Display"', ink)); });
  const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap() })); thin(m.material); return m;
}
export function sky({ night = false, top = '#7fb0d8', bottom = '#f3dcc0' } = {}) {
  scene.background = canvasTex(16, 512, (c) => { const gr = c.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, night ? '#151a3d' : top); gr.addColorStop(1, night ? '#4a4f86' : bottom); c.fillStyle = gr; c.fillRect(0, 0, 16, 512); });
}
export function moon(pos, r = 1.6) {
  const g = new THREE.Group(); g.position.set(...pos);
  g.add(mesh(new THREE.SphereGeometry(r, 32, 24), noOutline(new THREE.MeshBasicMaterial({ color: '#f6f0d4' })), { shadow: false }));
  const halo = canvasTex(256, 256, (c) => { const gr = c.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, 'rgba(255,248,214,0.55)'); gr.addColorStop(1, 'rgba(255,248,214,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false })); sp.scale.setScalar(r * 6); g.add(sp);
  scene.add(g); return g;
}
export function stars(n = 200, seed = 5) {
  const r = rand(seed); const pos = [];
  for (let i = 0; i < n; i++) pos.push((r() - 0.5) * 200, 20 + r() * 60, -60 - r() * 40);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#fff7da', size: 0.35, sizeAttenuation: true })); scene.add(p); return p;
}
export function groundPlane(color = '#7da35a', size = 200) {
  const m = mesh(new THREE.PlaneGeometry(size, size), toon(color), { rot: [-Math.PI / 2, 0, 0], pos: [0, -0.01, 0], shadow: false }); scene.add(m); return m;
}
export function windowFrame(x, y, z, { w = 1.6, h = 1.8, night = true, ry = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry;
  const glass = canvasTex(256, 288, (c) => { const gr = c.createLinearGradient(0, 0, 0, 288); gr.addColorStop(0, night ? '#1a2150' : '#8ec5e8'); gr.addColorStop(1, night ? '#3c4383' : '#d9eef7'); c.fillStyle = gr; c.fillRect(0, 0, 256, 288);
    if (night) { c.fillStyle = '#f6f0d4'; c.beginPath(); c.arc(180, 70, 26, 0, 7); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 25; i++) c.fillRect((i * 71) % 256, (i * 37) % 200, 2, 2); } });
  g.add(mesh(new THREE.PlaneGeometry(w, h), noOutline(new THREE.MeshBasicMaterial({ map: glass })), { shadow: false }));
  const fc = '#efe6d2';
  g.add(box(w + 0.2, 0.12, 0.12, fc, { pos: [0, h / 2, 0.04] })); g.add(box(w + 0.3, 0.14, 0.25, fc, { pos: [0, -h / 2, 0.08] }));
  g.add(box(0.12, h, 0.12, fc, { pos: [-w / 2, 0, 0.04] })); g.add(box(0.12, h, 0.12, fc, { pos: [w / 2, 0, 0.04] }));
  g.add(box(0.07, h, 0.07, fc, { pos: [0, 0, 0.04] })); g.add(box(w, 0.07, 0.07, fc, { pos: [0, 0, 0.04] }));
  scene.add(g); return g;
}
export function mug(x, y, z, color = '#e9e1cf') { const g = new THREE.Group(); g.position.set(x, y, z); g.add(cyl(0.12, 0.11, 0.24, color, { pos: [0, 0.12, 0] }, 16)); g.add(mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 12), toon(color), { pos: [0.13, 0.12, 0] })); g.add(cyl(0.1, 0.1, 0.01, '#4a2c1c', { pos: [0, 0.22, 0] }, 16)); scene.add(g); return g; }
export function nameplate(text, x, y, z) {
  const t = canvasTex(256, 64, (c) => { c.fillStyle = '#5a3a26'; c.fillRect(0, 0, 256, 64); fitText(c, text, 128, 34, 230, 34, '700 $px Fredoka', '#e9cf8a'); });
  const m = mesh(new THREE.BoxGeometry(0.9, 0.22, 0.14), [toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap() }), toon('#5a3a26')], { pos: [x, y, z], rot: [-0.25, 0, 0] });
  scene.add(m); return m;
}
export function crowd(n, x0, z0, dx, dz, seed = 11, opts = {}) {
  const r = rand(seed); const coats = ['#c4573f', '#4f7fa8', '#7a9a52', '#d6a64a', '#8a5c9e', '#3f6f6a', '#b4674e'];
  const hats = ['bowler', 'flatcap', 'fedora', 'beret', 'none'];
  const sockCols = ['#d9443a', '#3f7bd1', '#55a14f', '#f0c23b', '#9b59b6', '#ff8c42'];
  const out = [];
  for (let i = 0; i < n; i++) {
    const female = r() < 0.4;
    const ch = makeChar({ coat: coats[Math.floor(r() * coats.length)], hat: female ? 'none' : hats[Math.floor(r() * hats.length)], hatColor: ['#3d3d46', '#6b4a35', '#4f5d7a'][Math.floor(r() * 3)],
      dress: female, hair: female ? ['#6b3f22', '#2e2420', '#c98b3d'][Math.floor(r() * 3)] : null, mustache: !female && r() < 0.4,
      expr: opts.expr || ['neutral', 'smug', 'happy'][Math.floor(r() * 3)],
      socks: opts.mismatched ? [sockCols[Math.floor(r() * 6)], sockCols[Math.floor(r() * 6)]] : null, scale: 0.92 + r() * 0.16 });
    place(ch, x0 + dx * i + (r() - 0.5) * 0.3, z0 + dz * i + (r() - 0.5) * 0.3, opts.ry ?? 0);
    ch.userData.phase = r() * 10; out.push(ch);
  }
  return out;
}

// ---------------------------------------------------------------- Fonts laden
export async function loadFonts() {
  const F = [['Caveat', 'caveat/files/caveat-latin-700-normal.woff2', '700'], ['Playfair Display', 'playfair-display/files/playfair-display-latin-900-normal.woff2', '900'],
    ['Playfair Display', 'playfair-display/files/playfair-display-latin-700-normal.woff2', '700'], ['Playfair Display', 'playfair-display/files/playfair-display-latin-400-normal.woff2', '400'],
    ['Fredoka', 'fredoka/files/fredoka-latin-700-normal.woff2', '700'], ['Permanent Marker', 'permanent-marker/files/permanent-marker-latin-400-normal.woff2', '400']];
  for (const [fam, path, wt] of F) { const f = new FontFace(fam, `url(/node_modules/@fontsource/${path})`, { weight: wt }); await f.load(); document.fonts.add(f); }
  // kursiver Playfair-Ersatz
  const it = new FontFace('Playfair Display', 'url(/node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2)', { weight: '400', style: 'italic' }); await it.load(); document.fonts.add(it);
}
