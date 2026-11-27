// Toon-Story-Engine: cel-shaded 3D-Figuren, Kulissen und Requisiten im Stil
// "gemuetliche Diorama-Stadt, runde weisse Meme-Gesichter, schwarze Umrisse".
import * as THREE from 'three';
import { OutlineEffect } from './OutlineEffect.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };

// ---------------------------------------------------------------- Renderer
export let W = 720, H = 1280;
export let renderer, effect, scene, camera;
const disposables = [];

export function init(canvas, w = 720, h = 1280) {
  W = w; H = h;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  effect = new OutlineEffect(renderer, { defaultThickness: 0.0055, defaultColor: [0.06, 0.05, 0.05], defaultAlpha: 1 });
  setupPost();
}

export function newScene({ bg = '#87b5d8', fog = null } = {}) {
  for (const d of disposables.splice(0)) d.dispose?.();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
  camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 400);
  if (composer) { toonPass.scene = scene; toonPass.camera = camera; bokehPass.scene = scene; bokehPass.camera = camera; }
  grade(); bloom(); dof(0); sprites.length = 0; spriteLook.tint = '#ffffff'; spriteLook.rim = null;
  return scene;
}

export function render(t = 0) {
  faceSpritesToCamera();
  if (!post.on) { effect.render(scene, camera); return; }
  gradePass.uniforms.time.value = t;
  bokehPass.enabled = post.dof > 0;
  composer.render();
}

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
  if (o.style === '2d') return makeSprite(o);
  if (o.style === 'ch') return makeChar2(o);
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
  const setExpr = (e) => { (C.eyes === 'round' ? drawFaceRound : drawFace)(faceCanvas.getContext('2d'), 512, 512, e, { ...C, skin: C.head }); faceTex.needsUpdate = true; parts.expr = e; };
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
  } else if (C.hat === 'chef') {
    const hat = new THREE.Group(); hat.position.set(0, top - 0.06, 0);
    hat.add(cyl(0.37, 0.37, 0.2, '#ffffff', { pos: [0, 0.1, 0] }, 28));
    for (const [x, y, z, r] of [[0, 0.36, 0, 0.27], [0.2, 0.32, 0.08, 0.2], [-0.2, 0.32, 0.06, 0.2], [0.05, 0.33, -0.2, 0.2]]) hat.add(ball(r, '#ffffff', { pos: [x, y, z] }, 18));
    headG.add(hat); parts.hat = hat;
  } else if (C.hat === 'tophat') {
    const hat = topHat(hc); hat.position.set(0, top - 0.03, 0); hat.rotation.z = 0.05; headG.add(hat); parts.hat = hat;
  } else if (C.hat === 'hood') {
    headG.add(hood(C.coat));
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
  if (ch.userData.sprite) {                       // alte 3D-Armwinkel grob auf 2D-Arme abbilden
    const o = arguments[1] || {}; const conv = (a) => !a ? [0.14, 0] : a[0] < -2.0 ? [2.6, 0] : a[0] < -0.8 ? [0.3, -1.9] : a[0] > 0.3 ? [0.35, 0] : [0.2, -0.6];
    return spritePose(ch, { ...o, arms: o.arms || (armL || armR ? [conv(armL), conv(armR)] : null) }); }
  const P = ch.userData.parts;
  const ph = t * 7.5 * (walk || 1);
  const sw = walk ? Math.sin(ph) * 0.55 * Math.min(1, walk) : 0;
  P.legL.rotation.x = sw; P.legR.rotation.x = -sw;
  P.armL.rotation.x = walk ? -sw * 0.8 : Math.sin(t * 1.3) * 0.03;
  P.armR.rotation.x = walk ? sw * 0.8 : -Math.sin(t * 1.3) * 0.03;
  P.armL.rotation.z = -(P.armZ ?? 0.28); P.armR.rotation.z = P.armZ ?? 0.28;
  const breathe = Math.sin(t * 2.2) * 0.012 * bob;
  P.body.position.y = (P.bodyY ?? 0.5) + breathe + (walk ? Math.abs(Math.cos(ph)) * 0.05 : 0) - sneak * 0.12;
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
      socks: opts.mismatched ? [sockCols[Math.floor(r() * 6)], sockCols[Math.floor(r() * 6)]] : null, scale: 0.92 + r() * 0.16, ...(opts.cfg || {}) });
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

/** Brotlaib, Unterseite bei y = 0 */
export function loaf(s = 1, color = '#d9964a') {
  const g = new THREE.Group();
  g.add(ball(0.34, color, { pos: [0, 0.187, 0], scale: [1, 0.55, 0.58] }, 24));
  for (const x of [-0.15, 0, 0.15]) g.add(box(0.035, 0.02, 0.2, '#f3d29a', { pos: [x, 0.37, 0], rot: [0, 0.5, 0], shadow: false }));
  g.scale.setScalar(s); return g;
}

// ================================================================ Filmische Nachbearbeitung (v2)
export const post = { on: false, dof: 0 };
let composer, toonPass, bloomPass, bokehPass, gradePass;
class ToonRenderPass extends Pass {
  constructor() { super(); this.needsSwap = false; this.scene = null; this.camera = null; }
  render(r, writeBuffer, readBuffer) { r.setRenderTarget(this.renderToScreen ? null : readBuffer); r.clear(); effect.render(this.scene, this.camera); }
}
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, sat: { value: 1 }, contrast: { value: 1 }, bright: { value: 1 }, tint: { value: new THREE.Vector3(1, 1, 1) },
    vignette: { value: 0.45 }, grain: { value: 0.03 }, time: { value: 0 }, sepia: { value: 0 }, mono: { value: 0 },
    remove: { value: new THREE.Vector4(0, 0, 0, 0) }, keep: { value: new THREE.Vector4(0, 0, 0, 0) }, lift: { value: new THREE.Vector3(0, 0, 0) }, halftone: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float sat, contrast, bright, vignette, grain, time, sepia, mono, halftone; uniform vec3 tint, lift; uniform vec4 remove, keep;
    varying vec2 vUv;
    vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g)); vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r)); float d=q.x-min(q.w,q.y); return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)),d/(q.x+1e-10),q.x); }
    float band(float h, float c, float w){ float d=abs(h-c); d=min(d,1.-d); return 1.-smoothstep(w*0.6, w, d); }
    void main(){
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      vec3 srgb = pow(clamp(col, 0., 1.), vec3(1./2.2));
      vec3 hsv = rgb2hsv(srgb);
      vec4 b = vec4(band(hsv.x, 0.0, 0.06), band(hsv.x, 0.135, 0.055), band(hsv.x, 0.33, 0.11), band(hsv.x, 0.6, 0.12));
      float chroma = smoothstep(0.12, 0.3, hsv.y);
      float yellowOk = smoothstep(0.45, 0.65, hsv.z);
      b.y *= yellowOk;
      float kept = max(max(keep.x*b.x, keep.y*b.y), max(keep.z*b.z, keep.w*b.w)) * chroma;
      float m = max(max(remove.x*b.x, remove.y*b.y), max(remove.z*b.z, remove.w*b.w)) * chroma;
      m = max(m, mono * (1. - kept));
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col, vec3(lum), clamp(m, 0., 1.));
      lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, sat);
      col = mix(col, vec3(lum) * vec3(1.08, 0.98, 0.82), sepia);
      col = col + lift * (1. - col);
      col = (col - 0.5) * contrast + 0.5; col *= bright * tint;
      float v = smoothstep(0.95, 0.25, length((vUv - 0.5) * vec2(1.0, 1.25)));
      col *= mix(1., v, vignette);
      vec2 hp = gl_FragCoord.xy / 7.0; vec2 cell = fract(hp) - 0.5; float dotv = 1.0 - smoothstep(0.18, 0.3, length(cell));
      float dark = 1.0 - smoothstep(0.08, 0.35, dot(col, vec3(0.2126, 0.7152, 0.0722)));
      col *= 1.0 - halftone * dark * dotv;
      float n = fract(sin(dot(vUv * vec2(1280., 720.) + fract(time * 7.13) * 91.7, vec2(12.9898, 78.233))) * 43758.5453);
      col += (n - 0.5) * grain;
      gl_FragColor = vec4(max(col, 0.), 1.);
    }`,
};
function setupPost() {
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
  composer.setPixelRatio(1); composer.setSize(W, H);
  toonPass = new ToonRenderPass(); composer.addPass(toonPass);
  bokehPass = new BokehPass(new THREE.Scene(), new THREE.PerspectiveCamera(), { focus: 5, aperture: 0.002, maxblur: 0.008 }); composer.addPass(bokehPass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.55, 0.6, 0.82); composer.addPass(bloomPass);
  gradePass = new ShaderPass(GradeShader); composer.addPass(gradePass);
  composer.addPass(new OutputPass());
}
/** Farb-Grading. remove/keep: {r,y,g,b} 0..1; mono: alles ausser keep entsaettigen. */
export function grade({ sat = 1, contrast = 1.05, bright = 1, tint = [1, 1, 1], vignette = 0.45, grain = 0.035, sepia = 0, mono = 0, remove = {}, keep = {}, lift = [0, 0, 0], halftone = post.halftone ?? 0 } = {}) {
  if (!gradePass) return;
  const U = gradePass.uniforms;
  U.sat.value = sat; U.contrast.value = contrast; U.bright.value = bright; U.tint.value.set(...tint); U.vignette.value = vignette; U.grain.value = grain;
  U.sepia.value = sepia; U.mono.value = mono; U.lift.value.set(...lift); U.halftone.value = halftone;
  U.remove.value.set(remove.r || 0, remove.y || 0, remove.g || 0, remove.b || 0);
  U.keep.value.set(keep.r || 0, keep.y || 0, keep.g || 0, keep.b || 0);
}
export function bloom(strength = 0.55, radius = 0.6, threshold = 0.82) { if (bloomPass) { bloomPass.strength = strength; bloomPass.radius = radius; bloomPass.threshold = threshold; } }
/** Tiefenunschaerfe: focus = Abstand Kamera→Motiv (Welt-Einheiten), aperture 0 = aus. */
export function dof(focus = 5, aperture = 0.0025, maxblur = 0.01) {
  post.dof = aperture; if (!bokehPass) return;
  bokehPass.uniforms.focus.value = focus; bokehPass.uniforms.aperture.value = aperture; bokehPass.uniforms.maxblur.value = maxblur;
}
export function fog(color = '#1b2140', density = 0.035) { scene.fog = new THREE.FogExp2(color, density); }

// ================================================================ Cartoon-Gesichter mit runden Augen (v2)
export function drawFaceRound(g, w, h, expr, o = {}) {
  g.clearRect(0, 0, w, h);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const cx = w / 2, ey = h * 0.45, dx = w * (o.eyeGap || 0.155), INK = o.bold ? '#141212' : '#2b2622';
  const LW = o.bold ? 1.45 : 1;
  const look = o.look || [0, 0];
  if (o.beard) { // Bart unter allem anderen
    g.fillStyle = o.beard; g.beginPath(); g.moveTo(cx - w * 0.3, h * 0.6);
    g.quadraticCurveTo(cx - w * 0.32, h * 0.98, cx, h * 1.0); g.quadraticCurveTo(cx + w * 0.32, h * 0.98, cx + w * 0.3, h * 0.6);
    g.quadraticCurveTo(cx + w * 0.15, h * 0.72, cx, h * 0.7); g.quadraticCurveTo(cx - w * 0.15, h * 0.72, cx - w * 0.3, h * 0.6); g.fill();
  }
  const eye = (x, { open = 1, s = 1, pup = 1 } = {}) => {
    s *= o.eyeScale || 1; pup *= o.eyeScale || 1;
    const rx = w * 0.085 * s, ry = h * 0.1 * s;
    g.save(); g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#ffffff'; g.fillRect(x - rx, ey - ry, rx * 2, ry * 2);
    g.fillStyle = '#1a1716'; g.beginPath(); g.arc(x + look[0] * rx * 0.45, ey + ry * 0.15 + look[1] * ry * 0.4, w * 0.036 * pup, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + look[0] * rx * 0.45 - w * 0.012, ey + ry * 0.05 + look[1] * ry * 0.4, w * 0.011 * pup, 0, 7); g.fill();
    if (open < 1) { g.fillStyle = o.skin || '#f2f1ec'; g.fillRect(x - rx, ey - ry, rx * 2, ry * 2 * (1 - open)); g.strokeStyle = INK; g.lineWidth = w * 0.012; g.beginPath(); g.moveTo(x - rx, ey - ry + ry * 2 * (1 - open)); g.lineTo(x + rx, ey - ry + ry * 2 * (1 - open)); g.stroke(); }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = w * 0.012 * LW; g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  };
  const closed = (x, up = true) => { g.strokeStyle = INK; g.lineWidth = w * 0.016; g.beginPath(); if (up) g.arc(x, ey + h * 0.035, w * 0.06, Math.PI * 1.15, Math.PI * 1.85); else g.arc(x, ey - h * 0.02, w * 0.06, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); };
  const brow = (x, y, ang, side) => { g.strokeStyle = o.browColor || INK; g.lineWidth = w * (o.bushy ? 0.034 : 0.018) * LW; g.beginPath(); g.moveTo(x - w * 0.07, y + side * ang * w * 0.06); g.lineTo(x + w * 0.07, y - side * ang * w * 0.06); g.stroke(); };
  const mouth = (kind) => {
    const my = h * 0.72; g.strokeStyle = INK; g.lineWidth = w * 0.016 * LW; g.fillStyle = '#3a1f1f';
    g.beginPath();
    if (kind === 'smile') { g.arc(cx, my - h * 0.05, w * 0.08, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
    else if (kind === 'grin') { g.moveTo(cx - w * 0.1, my - h * 0.02); g.quadraticCurveTo(cx, my + h * 0.1, cx + w * 0.1, my - h * 0.02); g.closePath(); g.fill(); g.stroke(); }
    else if (kind === 'frown') { g.arc(cx, my + h * 0.05, w * 0.06, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    else if (kind === 'wavy') { g.moveTo(cx - w * 0.07, my); g.bezierCurveTo(cx - w * 0.035, my - h * 0.03, cx - w * 0.01, my + h * 0.03, cx + w * 0.02, my); g.bezierCurveTo(cx + w * 0.04, my - h * 0.02, cx + w * 0.06, my + h * 0.01, cx + w * 0.07, my); g.stroke(); }
    else if (kind === 'o') { g.ellipse(cx, my, w * 0.035, h * 0.045, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    else if (kind === 'talk') { g.ellipse(cx, my, w * 0.05, h * 0.03, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    else { g.moveTo(cx - w * 0.05, my); g.lineTo(cx + w * 0.05, my); g.stroke(); }
  };
  const by = ey - h * 0.15;
  switch (expr) {
    case 'smile': brow(cx - dx, by, 0.1, -1); brow(cx + dx, by, 0.1, 1); eye(cx - dx); eye(cx + dx); mouth('smile'); break;
    case 'happy': brow(cx - dx, by - h * 0.02, 0.15, -1); brow(cx + dx, by - h * 0.02, 0.15, 1); closed(cx - dx); closed(cx + dx); mouth('grin'); break;
    case 'sad': brow(cx - dx, by, -0.35, -1); brow(cx + dx, by, -0.35, 1); eye(cx - dx, { open: 0.8 }); eye(cx + dx, { open: 0.8 }); mouth('frown'); break;
    case 'cry': brow(cx - dx, by, -0.4, -1); brow(cx + dx, by, -0.4, 1); eye(cx - dx, { open: 0.85 }); eye(cx + dx, { open: 0.85 }); mouth('wavy');
      g.fillStyle = 'rgba(120,190,255,0.9)'; for (const x of [cx - dx + w * 0.05, cx + dx + w * 0.05]) { g.beginPath(); g.moveTo(x, ey + h * 0.08); g.quadraticCurveTo(x + w * 0.03, ey + h * 0.2, x, ey + h * 0.24); g.quadraticCurveTo(x - w * 0.025, ey + h * 0.2, x, ey + h * 0.08); g.fill(); } break;
    case 'worried': brow(cx - dx, by - h * 0.02, -0.3, -1); brow(cx + dx, by - h * 0.02, -0.3, 1); eye(cx - dx, { s: 1.05 }); eye(cx + dx, { s: 1.05 }); mouth('wavy'); break;
    case 'surprised': brow(cx - dx, by - h * 0.05, 0.05, -1); brow(cx + dx, by - h * 0.05, 0.05, 1); eye(cx - dx, { s: 1.12, pup: 0.75 }); eye(cx + dx, { s: 1.12, pup: 0.75 }); mouth('o'); break;
    case 'talk': brow(cx - dx, by, 0, -1); brow(cx + dx, by, 0, 1); eye(cx - dx, { open: 0.75 }); eye(cx + dx, { open: 0.75 }); mouth('talk'); break;
    case 'stern': brow(cx - dx, by + h * 0.02, 0.3, -1); brow(cx + dx, by + h * 0.02, 0.3, 1); eye(cx - dx, { open: 0.6 }); eye(cx + dx, { open: 0.6 }); mouth('line'); break;
    case 'squint': brow(cx - dx, by + h * 0.02, 0.25, -1); brow(cx + dx, by + h * 0.02, -0.1, 1); eye(cx - dx, { open: 0.35 }); eye(cx + dx, { open: 0.45 }); mouth('wavy'); break;
    case 'sleep': brow(cx - dx, by, 0, -1); brow(cx + dx, by, 0, 1); closed(cx - dx, false); closed(cx + dx, false); mouth('line'); break;
    case 'sneer': brow(cx - dx, by + h * 0.02, 0.35, -1); brow(cx + dx, by, -0.1, 1); eye(cx - dx, { open: 0.5 }); eye(cx + dx, { open: 0.55 }); mouth('grin'); break;
    default: brow(cx - dx, by, 0, -1); brow(cx + dx, by, 0, 1); eye(cx - dx); eye(cx + dx); mouth('line');
  }
  if (o.mustache) { g.fillStyle = o.mustacheColor || '#d9d9d9'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * w * 0.06, h * 0.655, w * 0.075, h * 0.03, sd * 0.2, 0, Math.PI * 2); g.fill(); } }
  if (o.glasses) { g.strokeStyle = o.glasses; g.lineWidth = w * 0.014 * (o.bold ? 1.8 : 1); for (const x of [cx - dx, cx + dx]) { g.beginPath(); g.arc(x, ey, w * 0.115, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(cx - dx + w * 0.115, ey); g.quadraticCurveTo(cx, ey - h * 0.03, cx + dx - w * 0.115, ey); g.stroke(); }
  if (o.wrinkles) { g.strokeStyle = 'rgba(60,50,45,0.45)'; g.lineWidth = w * 0.008; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(cx + sd * (dx + w * 0.12), ey - h * 0.02); g.lineTo(cx + sd * (dx + w * 0.16), ey - h * 0.04); g.moveTo(cx + sd * (dx + w * 0.12), ey + h * 0.02); g.lineTo(cx + sd * (dx + w * 0.16), ey + h * 0.04); g.stroke(); } }
  if (o.blush) { g.fillStyle = 'rgba(240,120,120,0.35)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * w * 0.27, h * 0.6, w * 0.06, h * 0.03, 0, 0, Math.PI * 2); g.fill(); } }
}

// ================================================================ Requisiten (v2)
export function topHat(color = '#1d1b22') {
  const g = new THREE.Group(); g.add(cyl(0.58, 0.58, 0.04, color, {}, 32)); g.add(cyl(0.34, 0.34, 0.6, color, { pos: [0, 0.32, 0] }, 28));
  g.add(cyl(0.345, 0.345, 0.1, '#8a1f2a', { pos: [0, 0.1, 0] }, 28)); return g;
}
export function hood(color) { // Kapuze hinter dem Kopf
  return mesh(new THREE.SphereGeometry(0.58, 32, 16, Math.PI * 1.5 - 1.7, 3.4, 0, 1.95), toon(color, { side: THREE.DoubleSide }), { pos: [0, 0.02, -0.02] });
}
/** Leuchtendes Farbglas. fill 0..1 */
export function jar(color, { fill = 0.8, s = 1, glow = 1.6 } = {}) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  const glass = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.5, 24, 1, true), noOutline(new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })), { pos: [0, 0.27, 0], shadow: false });
  const liquid = mesh(new THREE.CylinderGeometry(0.165, 0.165, 1, 24), noOutline(new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(glow) })), { shadow: false });
  g.add(liquid); g.add(glass);
  g.add(cyl(0.19, 0.19, 0.04, '#c9a24a', { pos: [0, 0.03, 0] }, 24));
  g.add(cyl(0.15, 0.13, 0.08, '#a8784a', { pos: [0, 0.56, 0] }, 16));
  const set = (f) => { liquid.scale.y = Math.max(0.001, f * 0.46); liquid.position.y = 0.05 + f * 0.23; liquid.visible = f > 0.01; };
  set(fill); g.userData.setFill = set; g.userData.liquid = liquid; return g;
}
export function sunflower(h = 1.6, s = 1) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  g.add(cyl(0.035, 0.045, h, '#4f8f3a', { pos: [0, h / 2, 0] }, 8));
  for (const [y, sd] of [[h * 0.4, 1], [h * 0.6, -1]]) g.add(ball(0.16, '#5fae45', { pos: [sd * 0.14, y, 0], scale: [1.4, 0.25, 0.7], rot: [0, 0, sd * 0.4] }, 12));
  const head = new THREE.Group(); head.position.set(0, h + 0.05, 0.05); head.rotation.x = 0.25; g.add(head);
  head.add(cyl(0.16, 0.16, 0.08, '#5a3a1e', { rot: [Math.PI / 2, 0, 0] }, 24));
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; head.add(ball(0.11, '#ffd21f', { pos: [Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0], scale: [0.55, 1, 0.25], rot: [0, 0, a - Math.PI / 2] }, 10)); }
  return g;
}
/** Regen: gibt update(t) zurueck */
export function rain({ n = 700, x = 8, y = 8, z = 6, cx = 0, cz = 0, color = '#a9c4ff' } = {}) {
  const r = rand(3), pos = new Float32Array(n * 6), base = [];
  for (let i = 0; i < n; i++) base.push([cx + (r() - 0.5) * x * 2, r() * y, cz + (r() - 0.5) * z * 2, 0.8 + r() * 0.4]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })); lines.frustumCulled = false; scene.add(lines);
  return (t) => { for (let i = 0; i < n; i++) { const [bx, by, bz, sp] = base[i]; const yy = ((by - t * 9 * sp) % y + y) % y; pos.set([bx, yy, bz, bx - 0.02, yy + 0.28, bz], i * 6); } geo.attributes.position.needsUpdate = true; };
}
export function easel(painting, { w = 1.1, h = 0.85 } = {}) {
  const g = new THREE.Group();
  for (const [x, rz] of [[-0.35, -0.08], [0.35, 0.08]]) g.add(box(0.06, 2.0, 0.06, '#8a5a3b', { pos: [x, 1.0, 0], rot: [0, 0, rz] }));
  g.add(box(0.06, 1.9, 0.06, '#8a5a3b', { pos: [0, 0.95, -0.35], rot: [-0.35, 0, 0] }));
  g.add(box(w + 0.1, 0.05, 0.12, '#8a5a3b', { pos: [0, 0.95, 0.05] }));
  const cv = mesh(new THREE.BoxGeometry(w, h, 0.04), [toon('#efe8d6'), toon('#efe8d6'), toon('#efe8d6'), toon('#efe8d6'), new THREE.MeshToonMaterial({ map: painting, gradientMap: gradientMap() }), toon('#efe8d6')], { pos: [0, 0.98 + h / 2, 0.08], rot: [-0.06, 0, 0] });
  g.add(cv); return g;
}
export function sit(ch, seatY = 0.62) { const P = ch.userData.parts; P.legL.rotation.x = -1.5; P.legR.rotation.x = -1.5; ch.position.y = seatY - 0.62; }
/** Sichtbarer Lichtkegel (additiv), Spitze bei pos */
export function lightCone(pos, { r = 1.2, h = 2.6, color = '#ffd9a0', opacity = 0.16 } = {}) {
  const tex = canvasTex(8, 128, (c) => { const g = c.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 8, 128); });
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 32, 1, true), noOutline(new THREE.MeshBasicMaterial({ color, map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
  m.position.set(pos[0], pos[1] - h / 2, pos[2]); scene.add(m); return m;
}
/** Haengelampe mit Schirm, Gluehbirne, Licht und Lichtkegel */
export function hangLamp(x, y, z, { color = '#ffc98a', power = 4, cone = true, shade = '#2f4a3f' } = {}) {
  scene.add(cyl(0.01, 0.01, 2, '#222', { pos: [x, y + 1.15, z] }, 4));
  scene.add(mesh(new THREE.CylinderGeometry(0.08, 0.42, 0.32, 24, 1, true), toon(shade, { side: THREE.DoubleSide }), { pos: [x, y, z] }));
  scene.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), noOutline(new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.6) })), { pos: [x, y - 0.1, z], shadow: false }));
  const l = pointLight(color, power, [x, y - 0.25, z], 8);
  if (cone) lightCone([x, y - 0.12, z], { r: 1.1, h: y - 0.2, color });
  return l;
}

// ================================================================ Figuren im Cartoon-Stil der Vorlage 2 (v3)
// Flacher heller Kopf mit dicker Kontur, schmaler Pillen-Oberkoerper, lange duenne Strich-Arme/-Beine, Frisuren.
let flatGrad;
function flatGradient() {
  if (flatGrad) return flatGrad;
  const d = new Uint8Array([205, 205, 205, 255, 236, 236, 236, 255, 255, 255, 255, 255]);
  flatGrad = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); flatGrad.minFilter = flatGrad.magFilter = THREE.NearestFilter; flatGrad.needsUpdate = true; return flatGrad;
}
export function flat(color, opts = {}) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: flatGradient(), ...opts });
  m.userData.outlineParameters = { thickness: opts.thick ?? 0.0085, color: [0.02, 0.02, 0.025] }; delete m.thick; return m;
}
const HIP = 0.86, TORSO = 0.72, HR = 0.42;
export function makeChar2(o = {}) {
  const C = Object.assign({ coat: '#c8443a', vest: null, skin: '#fbf1e1', limb: '#1b1a1d', hairStyle: null, hair: null, hat: 'none', hatColor: '#555', expr: 'smile', eyes: 'round', bold: true, scale: 1, dress: false }, o);
  if (o.head) C.skin = o.head;
  const root = new THREE.Group(); const parts = {};
  const limbMat = flat(C.limb, { thick: 0.004 });
  for (const s of [-1, 1]) {                                                // Beine
    const hip = new THREE.Group(); hip.position.set(s * 0.1, HIP, 0); root.add(hip);
    hip.add(mesh(new THREE.CylinderGeometry(0.027, 0.027, HIP - 0.05, 8), limbMat, { pos: [0, -(HIP - 0.05) / 2, 0] }));
    hip.add(mesh(new THREE.SphereGeometry(0.06, 12, 8), limbMat, { pos: [0, -HIP + 0.04, 0.05], scale: [1, 0.7, 1.9] }));
    parts[s < 0 ? 'legL' : 'legR'] = hip;
  }
  const body = new THREE.Group(); body.position.y = HIP; root.add(body); parts.body = body; parts.bodyY = HIP;
  let torsoMat;
  if (C.vest) {
    const tex = canvasTex(256, 64, (c) => { c.fillStyle = C.vest; c.fillRect(0, 0, 256, 64); c.fillStyle = C.coat; c.fillRect(0, 0, 22, 64); c.fillRect(234, 0, 22, 64); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(22, 0, 3, 64); c.fillRect(231, 0, 3, 64); });
    torsoMat = flat('#ffffff', { map: tex });
  } else torsoMat = flat(C.coat);
  if (C.dress) {
    const prof = [[0, 0], [0.34, 0], [0.3, 0.18], [0.24, 0.42], [0.23, 0.56], [0.19, 0.66], [0.1, 0.71], [0, 0.72]];
    body.add(mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 28), torsoMat, { scale: [1, 1, 0.85] }));
  } else {
    body.add(mesh(new THREE.CapsuleGeometry(0.23, TORSO - 0.46, 8, 24), torsoMat, { pos: [0, TORSO / 2, 0], scale: [1, 1, 0.85] }));
  }
  if (C.pin) body.add(mesh(new THREE.SphereGeometry(0.045, 12, 8), flat(C.pin, { thick: 0.004 }), { pos: [0.09, TORSO * 0.62, 0.19], scale: [1, 1, 0.4] }));
  for (const s of [-1, 1]) {                                                // Arme (Schulterdrehpunkt, Hand bei y -0.62)
    const sh = new THREE.Group(); sh.position.set(s * 0.21, TORSO - 0.11, 0); body.add(sh);
    sh.add(mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.6, 8), limbMat, { pos: [0, -0.3, 0] }));
    sh.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), limbMat, { pos: [0, -0.62, 0] }));
    sh.rotation.z = s * 0.16; parts[s < 0 ? 'armL' : 'armR'] = sh;
  }
  parts.armZ = 0.16;
  const headG = new THREE.Group(); headG.position.y = TORSO + HR * 0.86; body.add(headG); parts.head = headG; parts.headY = TORSO + HR * 0.86;
  headG.add(mesh(new THREE.SphereGeometry(HR, 40, 28), flat(C.skin), { scale: [1, 1, 0.96] }));
  const faceCanvas = document.createElement('canvas'); faceCanvas.width = faceCanvas.height = 512;
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; disposables.push(faceTex);
  const faceMat = new THREE.MeshToonMaterial({ map: faceTex, transparent: true, gradientMap: flatGradient(), depthWrite: false }); noOutline(faceMat);
  const fl = 1.9;
  const face = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.006, 48, 32, Math.PI / 2 - fl / 2, fl, Math.PI / 2 - fl / 2, fl), faceMat);
  face.scale.set(1, 1, 0.96); face.renderOrder = 2; headG.add(face);
  const setExpr = (e) => { drawFaceRound(faceCanvas.getContext('2d'), 512, 512, e, { ...C, skin: C.skin }); faceTex.needsUpdate = true; parts.expr = e; };
  setExpr(C.expr);
  // Frisuren
  const hc = C.hair || '#c9c3bb';
  if (C.hairStyle === 'spiky') {                                            // geschwungene Straehnen nach oben/hinten
    const hm = flat(hc, { thick: 0.006 });
    headG.add(mesh(new THREE.SphereGeometry(HR * 1.03, 28, 14, 0, Math.PI * 2, 0, 1.05), hm, { pos: [0, 0.01, -0.02] }));
    const strands = [[-0.24, 0.3, 0.12, 0.5, 0.45], [-0.08, 0.36, 0.16, 0.62, 0.15], [0.1, 0.36, 0.14, 0.6, -0.15], [0.25, 0.3, 0.1, 0.5, -0.45],
      [-0.16, 0.38, -0.08, 0.55, 0.3], [0.04, 0.42, -0.06, 0.66, 0], [0.2, 0.37, -0.1, 0.52, -0.3], [-0.02, 0.36, -0.24, 0.5, 0.05]];
    for (const [x, y, z, len, rz] of strands) {
      const c = mesh(new THREE.ConeGeometry(0.1, len, 5), hm, { pos: [x, y + len * 0.28, z - 0.06], rot: [-0.75, 0, rz], scale: [1, 1, 0.45] }); headG.add(c);
    }
  } else if (C.hairStyle === 'tufts') {
    const hm = flat(hc, { thick: 0.005 });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) headG.add(mesh(new THREE.SphereGeometry(0.09, 12, 8), hm, { pos: [s * (HR - 0.02), 0.02 + i * 0.09, -0.05 - i * 0.04] }));
  } else if (C.hairStyle === 'bun') {
    const hm = flat(hc, { thick: 0.006 });
    headG.add(mesh(new THREE.SphereGeometry(HR * 1.03, 28, 14, 0, Math.PI * 2, 0, 1.15), hm, { pos: [0, 0.0, -0.03] }));
    headG.add(mesh(new THREE.SphereGeometry(0.15, 16, 12), hm, { pos: [0, HR + 0.08, -0.12] }));
  }
  if (C.hat && C.hat !== 'none') {                                          // vorhandene Huete auf Kopfgroesse skalieren
    const tmp = makeChar({ hat: C.hat, hatColor: C.hatColor, coat: C.coat, expr: 'neutral' });
    const h = tmp.userData.parts.hat || tmp.userData.parts.head.children.find((c, i) => i > 1 && c.geometry && c.geometry.type === 'SphereGeometry' && c.scale.y < 0.5);
    if (C.hat === 'hood') { const hd = hood(C.coat); hd.scale.setScalar(HR / 0.5 * 1.02); headG.add(hd); }
    else if (h) { h.parent.remove(h); h.position.multiplyScalar(HR / 0.5); h.scale.multiplyScalar(HR / 0.5); h.traverse((m) => { if (m.material) m.material = flat(m.material.color, { thick: 0.006 }); }); headG.add(h); parts.hat = h; }
  }
  root.userData = { parts, setExpr, cfg: C };
  root.scale.setScalar(C.scale);
  return root;
}
/** Haeuser-Details: Feuerleiter */
export function fireEscape(x, y0, z, floors = 2, w = 1.6) {
  const g = new THREE.Group(); g.position.set(x, y0, z); const m = toon('#1d1b22');
  for (let f = 0; f < floors; f++) {
    const y = 1.6 + f * 1.55;
    g.add(box(w, 0.05, 0.6, m, { pos: [0, y, 0.3] }));
    g.add(box(w, 0.04, 0.04, m, { pos: [0, y + 0.55, 0.6] }));
    for (let i = 0; i <= 6; i++) g.add(box(0.025, 0.55, 0.025, m, { pos: [-w / 2 + i * w / 6, y + 0.28, 0.6] }));
    g.add(box(0.05, 1.6, 0.05, m, { pos: [w / 2 - 0.15, y - 0.7, 0.35], rot: [0, 0, 0.5] }));
  }
  scene.add(g); return g;
}
/** Wimpelkette quer ueber die Strasse */
export function bunting(x0, x1, y, z, colors = ['#e8343a', '#ffd21f', '#3f8bff', '#55c16a', '#ff8c42']) {
  const g = new THREE.Group(); const n = Math.floor((x1 - x0) / 0.45);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 0.45, sag = Math.sin((i / n) * Math.PI) * 0.5;
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 3), flat(colors[i % colors.length], { thick: 0.003 }));
    tri.rotation.x = Math.PI; tri.position.set(x, y - sag - 0.16, z); g.add(tri);
  }
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(x0 + t * (x1 - x0), y - Math.sin(t * Math.PI) * 0.5, z)); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#222' })));
  scene.add(g); return g;
}

// ================================================================ 2.5D: gezeichnete 2D-Figuren in 3D-Kulissen (v4)
// Figur wird per Canvas-2D gezeichnet (Konturen, gemalte Schattierung) und als Billboard-Ebene in die Szene gestellt.
const SPR_W = 640, SPR_H = 1280;            // Zeichenflaeche; 1 Welt-Einheit = 500 px
const PX = 500;
function shadeHex(hex, amt) { return shade(hex, amt); }
export function drawFigure(g, C, P) {
  const W = SPR_W, Hh = SPR_H, ink = '#1a1414', LW = 10;
  g.clearRect(0, 0, W, Hh);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const fx = W / 2, fy = Hh - 40;                    // Fusspunkt
  const legLen = 0.62 * PX, torsoH = 0.64 * PX, headR = 0.46 * PX, torsoW = 0.58 * PX;   // Proportionen wie Vorlage 2: grosser Kopf, rundlicher kurzer Koerper
  const bob = P.bob || 0, face = P.face || 0;      // face: -1 links … 0 vorne … 1 rechts
  const hipY = fy - legLen + bob, shY = hipY - torsoH + 0.11 * PX;
  const light = C.light || [-0.6, -0.8];             // Lichtrichtung (gemalte Schattierung)
  const limb = (x1, y1, ang, len, w = LW * 1.15) => { const x2 = x1 + Math.sin(ang) * len, y2 = y1 + Math.cos(ang) * len; g.strokeStyle = C.limb || ink; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); return [x2, y2]; };
  const hand = (x, y) => { g.fillStyle = C.limb || ink; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); };
  const foot = (x, y, dir) => { g.fillStyle = C.limb || ink; g.beginPath(); g.ellipse(x + dir * 12, y, 24, 12, 0, 0, 7); g.fill(); };
  const shadeFill = (path, base, x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, shadeHex(base, 0.07)); gr.addColorStop(0.55, base); gr.addColorStop(1, shadeHex(base, -0.13)); g.fillStyle = gr; path(); g.fill(); };
  // Beine
  const legA = P.legs || [0, 0];
  for (const [i, s] of [[0, -1], [1, 1]]) { const [x, y] = limb(fx + s * 0.08 * PX, hipY, legA[i], legLen - 20); foot(x, y + 4, face || s * 0.4); }
  // hinterer Arm
  const armA = P.arms || [[0.14, 0], [0.14, 0]];
  const shL = [fx - torsoW / 2 + 10, shY], shR = [fx + torsoW / 2 - 10, shY];
  const backFirst = face >= 0 ? 0 : 1;
  const drawArm = (i) => {                          // arms[i] = [Schulter, Ellbogen]; + = nach aussen/oben, Ellbogen - = nach innen
    const sh = i === 0 ? shL : shR, sg = i === 0 ? -1 : 1, [sa, ea] = armA[i];
    const [x1, y1] = limb(sh[0], sh[1], sg * sa, 0.27 * PX); const [x2, y2] = limb(x1, y1, sg * (sa + ea), 0.26 * PX); hand(x2, y2); return [x2, y2]; };
  // Torso
  const tx = fx - torsoW / 2, ty = hipY - torsoH, r = torsoW / 2;
  const torsoPath = () => { g.beginPath(); if (C.dress) { g.moveTo(fx - torsoW * 0.36, ty + r * 0.6); g.quadraticCurveTo(fx, ty - r * 0.3, fx + torsoW * 0.36, ty + r * 0.6); g.lineTo(fx + torsoW * 0.78, hipY + 18); g.quadraticCurveTo(fx, hipY + 40, fx - torsoW * 0.78, hipY + 18); g.closePath(); } else g.roundRect(tx, ty, torsoW, torsoH + 12, r); };
  const handsBack = P.handsBack;
  let handPos = [null, null];
  if (handsBack) { /* Arme hinter dem Ruecken: nur Ansatz sichtbar */ }
  else handPos[backFirst] = drawArm(backFirst);
  shadeFill(torsoPath, C.coat, tx, ty, tx + torsoW, ty + torsoH);
  if (C.vest && !C.dress) { g.save(); torsoPath(); g.clip(); g.fillStyle = C.vest; g.fillRect(tx, ty, torsoW * 0.36, torsoH + 20); g.fillRect(tx + torsoW * 0.64, ty, torsoW * 0.36, torsoH + 20); g.restore(); }
  g.strokeStyle = ink; g.lineWidth = LW; torsoPath(); g.stroke();
  if (C.vest && !C.dress) { g.lineWidth = LW * 0.6; g.beginPath(); g.moveTo(tx + torsoW * 0.36, ty + 18); g.lineTo(tx + torsoW * 0.36, ty + torsoH); g.moveTo(tx + torsoW * 0.64, ty + 18); g.lineTo(tx + torsoW * 0.64, ty + torsoH); g.stroke(); }
  if (C.pin) { g.fillStyle = C.pin; g.beginPath(); g.arc(fx + torsoW * 0.22, ty + torsoH * 0.35, 18, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); }
  if (C.buttons && !C.vest && !C.dress) { g.fillStyle = C.buttons; for (const k of [0.3, 0.55, 0.8]) { g.beginPath(); g.arc(fx, ty + torsoH * k, 8, 0, 7); g.fill(); } }
  if (!handsBack) handPos[1 - backFirst] = drawArm(1 - backFirst);
  else { for (const s of [-1, 1]) { g.strokeStyle = C.limb || ink; g.lineWidth = LW * 1.15; g.beginPath(); g.moveTo(fx + s * (torsoW / 2 - 12), shY); g.lineTo(fx + s * (torsoW / 2 + 6), shY + 0.32 * PX); g.stroke(); } }
  // Gehaltener Gegenstand
  if (P.hold && handPos[P.holdHand ?? 1]) P.hold(g, handPos[P.holdHand ?? 1]);
  // Kopf
  const hx = fx + face * 18, hy = ty - headR * 0.7 + (P.headDy || 0);
  g.save(); g.translate(hx, hy); g.rotate(P.tilt || 0);
  if (C.hairStyle === 'bun') { g.fillStyle = C.hair; g.beginPath(); g.arc(-face * 20, -headR - 30, headR * 0.36, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = LW * 0.8; g.stroke(); }
  if (C.hat === 'hood') { g.fillStyle = shadeHex(C.coat, -0.05); g.beginPath(); g.arc(0, 0, headR * 1.22, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = LW; g.stroke(); }
  const hg = g.createRadialGradient(light[0] * headR * 0.5, light[1] * headR * 0.5, headR * 0.2, 0, 0, headR * 1.05);
  hg.addColorStop(0, shadeHex(C.skin || '#fbf1e1', 0.04)); hg.addColorStop(0.7, C.skin || '#fbf1e1'); hg.addColorStop(1, shadeHex(C.skin || '#fbf1e1', -0.12));
  g.fillStyle = hg; g.beginPath(); g.arc(0, 0, headR, 0, 7); g.fill();
  if (C.rim) { g.save(); g.beginPath(); g.arc(0, 0, headR, 0, 7); g.clip(); g.strokeStyle = C.rim; g.globalAlpha = 0.55; g.lineWidth = 26; g.beginPath(); g.arc(-light[0] * 8, -light[1] * 8, headR, Math.atan2(-light[1], -light[0]) - 0.9, Math.atan2(-light[1], -light[0]) + 0.9); g.stroke(); g.restore(); }
  g.strokeStyle = ink; g.lineWidth = LW * 1.1; g.beginPath(); g.arc(0, 0, headR, 0, 7); g.stroke();
  // Gesicht (Gesichtszeichner der Engine, auf den Kopf projiziert)
  const fc = document.createElement('canvas'); fc.width = fc.height = 512;
  drawFaceRound(fc.getContext('2d'), 512, 512, P.expr || C.expr, { ...C, bold: true, eyeScale: C.eyeScale ?? (C.glasses ? 0.85 : 0.72), skin: C.skin, look: [face * 0.6, 0] });
  g.drawImage(fc, -headR * 1.0 + face * headR * 0.28, -headR * 1.02, headR * 2.0, headR * 2.0);
  // Haare / Huete
  if (C.hairStyle === 'spiky') {
    g.fillStyle = C.hair; g.strokeStyle = ink; g.lineWidth = LW * 0.9;
    g.beginPath(); g.moveTo(-headR * 0.98, -headR * 0.15);
    const spikes = [[-0.95, -0.75], [-0.7, -0.6], [-0.62, -1.15], [-0.35, -0.75], [-0.18, -1.35], [0.05, -0.85], [0.3, -1.3], [0.42, -0.8], [0.75, -1.05], [0.8, -0.6], [1.02, -0.5]];
    for (const [x, y] of spikes) g.lineTo((x + face * 0.15) * headR, y * headR);
    g.lineTo(headR * 0.98, -headR * 0.15); g.quadraticCurveTo(0, -headR * 0.55, -headR * 0.98, -headR * 0.15); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = shadeHex(C.hair, -0.2); g.lineWidth = 5; for (const [x, y] of spikes.slice(1, -1)) { g.beginPath(); g.moveTo(x * headR * 0.6, -headR * 0.55); g.lineTo((x + face * 0.15) * headR * 0.92, y * headR * 0.92); g.stroke(); }
  } else if (C.hairStyle === 'bun') {
    g.fillStyle = C.hair; g.strokeStyle = ink; g.lineWidth = LW * 0.9;
    g.beginPath(); g.arc(0, 0, headR, Math.PI * 1.08, Math.PI * 1.92); g.quadraticCurveTo(0, -headR * 0.45, -headR * Math.cos(0.25), -headR * Math.sin(0.25)); g.fill(); g.stroke();
    g.strokeStyle = shadeHex(C.hair, -0.2); g.lineWidth = 4; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * headR * 0.18, -headR * 0.62); g.quadraticCurveTo(i * headR * 0.2, -headR * 0.85, i * headR * 0.12, -headR * 0.95); g.stroke(); }
  } else if (C.hairStyle === 'tufts') {
    g.fillStyle = C.hair; g.strokeStyle = ink; g.lineWidth = LW * 0.8;
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * headR * 0.92, -headR * 0.15, headR * 0.2, headR * 0.3, s * 0.3, 0, 7); g.fill(); g.stroke(); }
  }
  if (C.hat === 'beret') { g.fillStyle = C.hatColor; g.strokeStyle = ink; g.lineWidth = LW; g.beginPath(); g.ellipse(face * 14, -headR * 0.82, headR * 1.05, headR * 0.36, -0.12, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(face * 14, -headR * 1.15, 10, 0, 7); g.fillStyle = ink; g.fill(); }
  if (C.hat === 'tophat') { g.fillStyle = C.hatColor; g.strokeStyle = ink; g.lineWidth = LW; g.beginPath(); g.ellipse(0, -headR * 0.85, headR * 1.15, headR * 0.16, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-headR * 0.62, -headR * 2.05, headR * 1.24, headR * 1.2, 10); g.fill(); g.stroke(); g.fillStyle = '#8a1f2a'; g.fillRect(-headR * 0.6, -headR * 1.12, headR * 1.2, headR * 0.18); }
  g.restore();
  return { head: [hx, hy], hands: handPos };
}
/** 2.5D-Figur: gezeichnete Figur als Billboard. Gleiche API wie makeChar (userData.setExpr, pose via L.pose). */
export function makeSprite(o = {}) {
  const C = Object.assign({ coat: '#c8443a', skin: '#f6e0c4', expr: 'smile', hair: '#c9c3bb', tint: spriteLook.tint, rim: spriteLook.rim, scale: 1.15, billboard: true }, o);
  const cv = document.createElement('canvas'); cv.width = SPR_W; cv.height = SPR_H;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; disposables.push(tex);
  const mat = noOutline(new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, color: C.tint, side: THREE.DoubleSide }));
  const w = SPR_W / PX, h = SPR_H / PX;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); plane.position.y = h / 2 - 40 / PX; plane.castShadow = false;
  const root = new THREE.Group(); root.add(plane);
  const state = { expr: C.expr, P: {} };
  const redraw = () => { const r = drawFigure(cv.getContext('2d'), C, { ...state.P, expr: state.expr }); state.hands = r.hands; tex.needsUpdate = true; };
  const handWorld = (i = 1, dy = -55) => { const h = state.hands && state.hands[i]; if (!h) return null; root.updateMatrixWorld(true);
    return plane.localToWorld(new THREE.Vector3((h[0] - SPR_W / 2) / PX, (SPR_H / 2 - (h[1] + dy)) / PX, 0.05)); };
  root.userData = { sprite: true, cfg: C, plane, state, redraw, handWorld, parts: {}, setExpr: (e) => { state.expr = e; redraw(); } };
  root.userData.parts.expr = C.expr;
  root.scale.setScalar(C.scale);
  redraw(); if (C.billboard) sprites.push(root);
  return root;
}
/** Pose fuer 2D-Figur: walk, arms [links, rechts] (Radiant, 0 = haengend, + = nach vorn/aussen), face -1..1, hold(g,[x,y]) */
export function spritePose(ch, { t = 0, walk = 0, arms = null, face = null, hold = null, holdHand = 1, handsBack = false, tilt = 0, laugh = 0, bob = 1 } = {}) {
  if (face === null) face = ch.userData.state.P.face || 0;
  const st = ch.userData.state;
  const sw = walk ? Math.sin(t * 7.5) * 0.35 : 0;
  st.P = { legs: [sw, -sw], arms: arms || [[0.14 + (walk ? sw * 0.6 : Math.sin(t * 1.3) * 0.02), 0], [0.14 - (walk ? sw * 0.6 : 0), 0]], face, hold, holdHand, handsBack,
    bob: (walk ? -Math.abs(Math.cos(t * 7.5)) * 14 : Math.sin(t * 2.2) * 3 * bob), tilt: tilt + (laugh ? Math.sin(t * 18) * 0.05 : 0), headDy: laugh ? -Math.abs(Math.sin(t * 18)) * 8 : 0 };
  ch.userData.redraw();
}
export const sprites = [];
const spriteLook = { tint: '#ffffff', rim: null };
export function spriteTint(tint = '#ffffff', rim = null) { spriteLook.tint = tint; spriteLook.rim = rim; }
function faceSpritesToCamera() {                   // Billboard: kurz vor dem Rendern zur Kamera drehen (nur Hochachse)
  const p = new THREE.Vector3();
  for (const ch of sprites) { if (!ch.parent) continue; ch.parent.updateMatrixWorld(); const par = new THREE.Vector3(); ch.parent.getWorldPosition(par);
    ch.getWorldPosition(p); const a = Math.atan2(camera.position.x - p.x, camera.position.z - p.z); const pr = new THREE.Euler().setFromQuaternion(ch.parent.getWorldQuaternion(new THREE.Quaternion())).y; ch.rotation.y = a - pr;
    const tgt = ch.userData.lookAt; if (tgt) {                           // Blickrichtung zum Ziel (im Bild links/rechts)
      const right = new THREE.Vector3(); camera.getWorldDirection(right); right.cross(camera.up).normalize();
      const d = new THREE.Vector3(...tgt).sub(p); const f = Math.max(-1, Math.min(1, d.dot(right) / Math.max(0.3, d.length()) * 1.6));
      if (Math.abs((ch.userData.state.P.face || 0) - f) > 0.02) { ch.userData.state.P.face = f; ch.userData.redraw(); } } }
}

// ---------------------------------------------------------------- 2D-Requisiten zum Halten (zeichnen an der Hand)
export const hold = {
  jar: (color = '#ffd21f', tiltT = 0) => (g, [x, y]) => { g.save(); g.translate(x, y - 55); g.rotate(Math.sin(tiltT) * 0.3);
    g.shadowColor = color; g.shadowBlur = 60; g.fillStyle = color; g.beginPath(); g.roundRect(-46, -30, 92, 105, 18); g.fill(); g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-34, -20, 14, 80); g.strokeStyle = '#1a1414'; g.lineWidth = 8; g.beginPath(); g.roundRect(-50, -58, 100, 136, 20); g.stroke();
    g.fillStyle = '#a8784a'; g.beginPath(); g.roundRect(-38, -82, 76, 28, 6); g.fill(); g.stroke(); g.restore(); },
  glasses: () => (g, [x, y]) => { g.strokeStyle = '#1a1414'; g.lineWidth = 7; for (const dx of [-26, 26]) { g.beginPath(); g.arc(x + dx, y - 22, 22, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(x - 4, y - 24); g.lineTo(x + 4, y - 24); g.stroke(); },
  brush: (tip = '#ffd21f') => (g, [x, y]) => { g.strokeStyle = '#8a5a3b'; g.lineWidth = 10; g.beginPath(); g.moveTo(x - 10, y + 20); g.lineTo(x + 30, y - 70); g.stroke(); g.strokeStyle = '#1a1414'; g.lineWidth = 3; g.stroke();
    g.fillStyle = tip; g.beginPath(); g.ellipse(x + 34, y - 80, 9, 16, 0.4, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); },
  can: () => (g, [x, y]) => { g.fillStyle = '#5fae9a'; g.strokeStyle = '#1a1414'; g.lineWidth = 7; g.beginPath(); g.roundRect(x - 40, y - 10, 80, 70, 12); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + 38, y + 20); g.lineTo(x + 95, y - 25); g.stroke(); g.beginPath(); g.arc(x, y - 10, 26, Math.PI, 0); g.stroke(); },
};
/** Weicher additiver Lichtschein (z. B. leuchtendes Glas in der Hand). Gibt das Sprite zurueck (position setzen). */
export function glow(color = '#ffd21f', size = 0.9, strength = 1.6) {
  const tex = canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 2, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(color).multiplyScalar(strength), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sp.scale.setScalar(size); sp.renderOrder = 5; scene.add(sp); return sp;
}
// ---------------------------------------------------------------- Gemalte Hintergruende (2.5D-Ebenen)
export function backdrop(type = 'day', { z = -45, w = 130, h = 40, y = 18 } = {}) {
  const tex = canvasTex(2048, 900, (c) => {
    const r = rand(type.length * 7 + 3);
    const sky = { day: ['#5fb4ff', '#d9f1ff'], sunset: ['#3f5fbf', '#ffc08a'], night: ['#0f1540', '#3c4383'], gray: ['#8e9ab3', '#c7cdd8'] }[type] || ['#5fb4ff', '#d9f1ff'];
    const gr = c.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); c.fillStyle = gr; c.fillRect(0, 0, 2048, 900);
    if (type === 'night') { for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(255,250,220,${0.3 + r() * 0.7})`; c.fillRect(r() * 2048, r() * 500, 2, 2); }
      c.fillStyle = '#f6f0d4'; c.shadowColor = '#fff6d0'; c.shadowBlur = 60; c.beginPath(); c.arc(1500, 420, 46, 0, 7); c.fill(); c.shadowBlur = 0; }
    else { for (let i = 0; i < 11; i++) { const cx = r() * 2048, cy = 330 + r() * 260, s = 50 + r() * 80; c.fillStyle = type === 'sunset' ? 'rgba(255,200,170,0.75)' : 'rgba(255,255,255,0.85)';
      for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(cx + (k - 2.5) * s * 0.5, cy + Math.sin(k) * s * 0.15, s * 0.55, s * 0.32, 0, 0, 7); c.fill(); } }
      if (type === 'sunset') { c.fillStyle = '#fff3c4'; c.shadowColor = '#ffd27a'; c.shadowBlur = 80; c.beginPath(); c.arc(1024, 640, 70, 0, 7); c.fill(); c.shadowBlur = 0; } }
    // Ferne Silhouetten: Stadt (Nacht) oder Baumreihe (Tag)
    if (type === 'night') {
      let x = 0; while (x < 2048) { const bw = 60 + r() * 120, bh = 120 + r() * 260; c.fillStyle = '#1b2150'; c.fillRect(x, 900 - bh, bw, bh);
        for (let wy = 900 - bh + 14; wy < 880; wy += 22) for (let wx = x + 8; wx < x + bw - 10; wx += 18) if (r() < 0.35) { c.fillStyle = r() < 0.8 ? '#ffcf6a' : '#9fd1ff'; c.fillRect(wx, wy, 8, 10); }
        x += bw + 4; }
    } else {
      for (let layer = 0; layer < 2; layer++) { c.fillStyle = layer ? '#4f9a46' : '#7fb07a'; c.beginPath(); c.moveTo(0, 900);
        for (let x = 0; x <= 2048; x += 30) c.lineTo(x, 760 - layer * 40 + Math.sin(x * 0.02 + layer) * 20 - r() * 40); c.lineTo(2048, 900); c.fill(); }
    }
  });
  const m = mesh(new THREE.PlaneGeometry(w, h), noOutline(new THREE.MeshBasicMaterial({ map: tex, fog: false })), { pos: [0, y, z], shadow: false });
  scene.add(m); return m;
}
/** Nasse Strasse: Lichtreflex-Streifen unter Lichtquellen (additiv) */
export function wetGlint(x, z, color = '#ffc977', len = 2.2, w = 0.5) {
  const tex = canvasTex(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.4, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); });
  const m = mesh(new THREE.PlaneGeometry(w, len), noOutline(new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(color).multiplyScalar(0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })), { rot: [-Math.PI / 2, 0, 0], pos: [x, 0.02, z], shadow: false });
  scene.add(m); return m;
}
