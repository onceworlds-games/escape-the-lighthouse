// Shared drawing helpers: tweens, procedural textures, materials, primitive builders and static merging.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE };
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rad = (d) => (d * Math.PI) / 180;

export function rngOf(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- tweens ----
export const ease = {
  linear: (t) => t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};
const tweens = [];
export function tween(obj, props, dur = 0.4, fn = ease.out, delay = 0) {
  const from = {};
  for (const k of Object.keys(props)) from[k] = obj[k];
  // replace an unfinished tween on the same keys
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    if (t.obj === obj && Object.keys(props).some((k) => k in t.props)) tweens.splice(i, 1);
  }
  return new Promise((resolve) => tweens.push({ obj, props, from, dur: Math.max(dur, 0.0001), fn, delay, t: 0, resolve }));
}
export function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    if (tw.delay > 0) {
      tw.delay -= dt;
      continue;
    }
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    const e = tw.fn(k);
    for (const key of Object.keys(tw.props)) tw.obj[key] = tw.from[key] + (tw.props[key] - tw.from[key]) * e;
    if (k >= 1) {
      tweens.splice(i, 1);
      tw.resolve();
    }
  }
}
export function clearTweens() {
  for (const t of tweens.splice(0)) t.resolve();
}

// ---- textures ----
const texCache = new Map();
export function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
export function tex(key, w, h, paint, opts = {}) {
  if (texCache.has(key)) return texCache.get(key);
  const c = canvasOf(w, h);
  const ctx = c.getContext('2d');
  paint(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  texCache.set(key, t);
  return t;
}
export function clearTexCache() {
  for (const t of texCache.values()) t.dispose();
  texCache.clear();
}
const rgb = (c, k = 1, a = 1) => `rgba(${Math.round(clamp(c[0] * k, 0, 255))},${Math.round(clamp(c[1] * k, 0, 255))},${Math.round(clamp(c[2] * k, 0, 255))},${a})`;
const hexRgb = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const FONT = { serif: '"Cormorant Garamond", "Iowan Old Style", Georgia, serif', hand: 'Caveat, "Segoe Script", cursive', ui: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif' };

export function paintPlanks(ctx, w, h, base, { n = 6, seed = 1, vertical = false, dark = 0.55 } = {}) {
  const r = rngOf(seed);
  ctx.fillStyle = rgb(base, 0.55);
  ctx.fillRect(0, 0, w, h);
  const pw = (vertical ? w : h) / n;
  for (let i = 0; i < n; i++) {
    const k = 0.78 + r() * 0.4;
    const x0 = vertical ? i * pw : 0;
    const y0 = vertical ? 0 : i * pw;
    const pwid = vertical ? pw - 3 : w;
    const phei = vertical ? h : pw - 3;
    ctx.fillStyle = rgb(base, k);
    ctx.fillRect(x0 + (vertical ? 1.5 : 0), y0 + (vertical ? 0 : 1.5), pwid, phei);
    // grain
    for (let g = 0; g < 26; g++) {
      ctx.strokeStyle = rgb(base, k * (0.55 + r() * 0.3), 0.35);
      ctx.lineWidth = 0.6 + r() * 1.6;
      ctx.beginPath();
      if (vertical) {
        const gx = x0 + 3 + r() * (pw - 8);
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + (r() - 0.5) * 8, h * 0.33, gx + (r() - 0.5) * 8, h * 0.66, gx + (r() - 0.5) * 4, h);
      } else {
        const gy = y0 + 3 + r() * (pw - 8);
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(w * 0.33, gy + (r() - 0.5) * 8, w * 0.66, gy + (r() - 0.5) * 8, w, gy + (r() - 0.5) * 4);
      }
      ctx.stroke();
    }
    // knots
    if (r() > 0.45) {
      const kx = vertical ? x0 + pw / 2 : r() * w;
      const ky = vertical ? r() * h : y0 + pw / 2;
      ctx.strokeStyle = rgb(base, 0.4, 0.55);
      ctx.lineWidth = 1.2;
      for (let q = 1; q < 4; q++) {
        ctx.beginPath();
        ctx.ellipse(kx, ky, q * 3.2, q * 1.9, vertical ? Math.PI / 2 : 0, 0, TAU);
        ctx.stroke();
      }
    }
    // nails
    ctx.fillStyle = rgb(base, dark * 0.6, 0.9);
    const m = 10 + r() * 20;
    for (const nx of [m, w - m]) {
      if (!vertical) {
        ctx.beginPath();
        ctx.arc(nx, y0 + pw / 2, 2, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  if (vertical) for (let i = 1; i < n; i++) ctx.fillRect(i * pw - 1.5, 0, 3, h);
  else for (let i = 1; i < n; i++) ctx.fillRect(0, i * pw - 1.5, w, 3);
}

export function paintPlaster(ctx, w, h, base, seed = 3) {
  const r = rngOf(seed);
  ctx.fillStyle = rgb(base);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    const x = r() * w;
    const y = r() * h;
    const rr = 6 + r() * 48;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    const dark = r() > 0.5;
    g.addColorStop(0, dark ? rgb(base, 0.8, 0.14) : rgb(base, 1.18, 0.12));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  // water stains running down
  for (let i = 0; i < 9; i++) {
    const x = r() * w;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgb(base, 0.7, 0.0));
    g.addColorStop(0.3, rgb(base, 0.72, 0.12));
    g.addColorStop(1, rgb(base, 0.7, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 6 + r() * 14, h);
  }
}

export function paintStone(ctx, w, h, base, { rows = 8, seed = 5, mortar = 0.45 } = {}) {
  const r = rngOf(seed);
  ctx.fillStyle = rgb(base, mortar);
  ctx.fillRect(0, 0, w, h);
  const rh = h / rows;
  for (let j = 0; j < rows; j++) {
    let x = -r() * 60;
    while (x < w) {
      const bw = 70 + r() * 90;
      const k = 0.78 + r() * 0.42;
      const g = ctx.createLinearGradient(x, j * rh, x, (j + 1) * rh);
      g.addColorStop(0, rgb(base, k * 1.12));
      g.addColorStop(1, rgb(base, k * 0.85));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x + 3, j * rh + 3, bw - 6, rh - 6, 7);
      ctx.fill();
      for (let s = 0; s < 14; s++) {
        ctx.fillStyle = rgb(base, 0.6 + r() * 0.7, 0.18);
        ctx.fillRect(x + 8 + r() * (bw - 16), j * rh + 6 + r() * (rh - 12), 2 + r() * 4, 2 + r() * 3);
      }
      x += bw;
    }
  }
}

export function paintFabric(ctx, w, h, base, stripe) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = stripe;
  for (let x = 0; x < w; x += w / 8) ctx.fillRect(x, 0, w / 24, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  for (let y = 0; y < h; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

export function paintRug(ctx, w, h, color, stripe) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = stripe;
  ctx.lineWidth = w * 0.018;
  ctx.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
  ctx.lineWidth = w * 0.008;
  ctx.strokeRect(w * 0.11, h * 0.11, w * 0.78, h * 0.78);
  ctx.fillStyle = stripe;
  const cx = w / 2;
  const cy = h / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.2);
  ctx.lineTo(cx + w * 0.16, cy);
  ctx.lineTo(cx, cy + h * 0.2);
  ctx.lineTo(cx - w * 0.16, cy);
  ctx.closePath();
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, h * 0.06, 0, TAU);
  ctx.fill();
  const r = rngOf(9);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.04)`;
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  for (let x = 0; x < w; x += 6) {
    ctx.fillStyle = stripe;
    ctx.fillRect(x, 0, 2, 5);
    ctx.fillRect(x, h - 5, 2, 5);
  }
}

export function paintMetal(ctx, w, h, base, seed = 2) {
  const r = rngOf(seed);
  ctx.fillStyle = rgb(base);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    ctx.strokeStyle = rgb(base, 0.7 + r() * 0.6, 0.3);
    ctx.lineWidth = 0.6 + r();
    const y = r() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + (r() - 0.5) * 3);
    ctx.stroke();
  }
}

export function paintPaper(ctx, w, h, base = [226, 210, 172]) {
  ctx.fillStyle = rgb(base);
  ctx.fillRect(0, 0, w, h);
  const r = rngOf(4);
  for (let i = 0; i < 120; i++) {
    const x = r() * w;
    const y = r() * h;
    const rr = 6 + r() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, rgb(base, 0.8, 0.12));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
}

export function drawText(ctx, text, x, y, { font = FONT.serif, size = 32, weight = 700, color = '#2a1a0c', align = 'center', base = 'middle', spacing = 0 } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (spacing && 'letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
  ctx.fillText(text, x, y);
  if (spacing && 'letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

// ---- materials ----
const matCache = new Map();
export function mat(name, make) {
  if (!matCache.has(name)) matCache.set(name, make());
  return matCache.get(name);
}
export function clearMatCache() {
  for (const m of matCache.values()) m.dispose();
  matCache.clear();
}
export const std = (color, rough = 0.8, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

export const M = {
  oak: () => mat('oak', () => std(0x6a4528, 0.75)),
  oakDark: () => mat('oakDark', () => std(0x3e2616, 0.7)),
  pine: () => mat('pine', () => std(0xa27a4c, 0.8)),
  painted: (c) => mat('painted' + c, () => std(c, 0.7)),
  brass: () => mat('brass', () => std(0xb88a3a, 0.35, 0.85)),
  brassDark: () => mat('brassD', () => std(0x7a5a24, 0.45, 0.8)),
  iron: () => mat('iron', () => std(0x23262b, 0.55, 0.7)),
  rust: () => mat('rust', () => std(0x6e3a20, 0.85, 0.35)),
  steel: () => mat('steel', () => std(0x9aa3ad, 0.4, 0.85)),
  stone: () => mat('stone', () => std(0x6c6a66, 0.95)),
  paper: () => mat('paperM', () => std(0xe6d7b0, 0.9)),
  leather: () => mat('leather', () => std(0x4b2a1b, 0.7)),
  cloth: (c) => mat('cloth' + c, () => std(c, 0.95)),
  rope: () => mat('rope', () => std(0xb59a68, 0.95)),
  glass: () => mat('glass', () => new THREE.MeshStandardMaterial({ color: 0xaecde0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false })),
  black: () => mat('black', () => std(0x0e0f11, 0.6, 0.2)),
  rubber: () => mat('rubber', () => std(0x16171a, 0.9)),
  flame: () => mat('flame', () => new THREE.MeshBasicMaterial({ color: 0xffc866 })),
  glow: (c) => mat('glow' + c, () => new THREE.MeshBasicMaterial({ color: c })),
  white: () => mat('white', () => std(0xe9e2d2, 0.8)),
  texd: (key, t, rough = 0.8, extra = {}) => mat('tex' + key, () => std(0xffffff, rough, 0, { map: t, ...extra })),
};

// ---- primitive builders (all return the mesh, added to parent) ----
const geoCache = new Map();
function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}
export function clearGeoCache() {
  for (const g of geoCache.values()) g.dispose();
  geoCache.clear();
}

export function put(parent, mesh, x = 0, y = 0, z = 0, o = {}) {
  mesh.position.set(x, y, z);
  if (o.rx) mesh.rotation.x = o.rx;
  if (o.ry) mesh.rotation.y = o.ry;
  if (o.rz) mesh.rotation.z = o.rz;
  if (o.s) mesh.scale.setScalar(o.s);
  mesh.castShadow = o.cast !== false;
  mesh.receiveShadow = o.recv !== false;
  parent.add(mesh);
  return mesh;
}
// Boxes are centred on (x, y, z). r > 0 rounds the edges.
export function box(parent, m, w, h, d, x = 0, y = 0, z = 0, o = {}) {
  const r = o.r || 0;
  const g = r > 0 ? geo(`rb${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005))) : geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
  return put(parent, new THREE.Mesh(g, m), x, y, z, o);
}
export function cyl(parent, m, rt, rb, h, x = 0, y = 0, z = 0, o = {}) {
  const g = geo(`c${rt}|${rb}|${h}|${o.seg || 14}`, () => new THREE.CylinderGeometry(rt, rb, h, o.seg || 14));
  return put(parent, new THREE.Mesh(g, m), x, y, z, o);
}
export function sph(parent, m, r, x = 0, y = 0, z = 0, o = {}) {
  const g = geo(`s${r}|${o.seg || 12}`, () => new THREE.SphereGeometry(r, o.seg || 12, Math.max(6, (o.seg || 12) / 2)));
  const mesh = put(parent, new THREE.Mesh(g, m), x, y, z, o);
  if (o.sx || o.sy || o.sz) mesh.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
  return mesh;
}
export function tor(parent, m, R, r, x = 0, y = 0, z = 0, o = {}) {
  const g = geo(`t${R}|${r}|${o.seg || 20}`, () => new THREE.TorusGeometry(R, r, 8, o.seg || 20, o.arc || TAU));
  return put(parent, new THREE.Mesh(g, m), x, y, z, o);
}
export function lathe(parent, m, pts, x = 0, y = 0, z = 0, o = {}) {
  const key = 'l' + pts.map((p) => p.join(',')).join(';') + (o.seg || 16);
  const g = geo(key, () => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), o.seg || 16));
  return put(parent, new THREE.Mesh(g, m), x, y, z, o);
}
export function plane(parent, m, w, h, x = 0, y = 0, z = 0, o = {}) {
  const g = geo(`p${w}|${h}`, () => new THREE.PlaneGeometry(w, h));
  return put(parent, new THREE.Mesh(g, m), x, y, z, { cast: false, ...o });
}
export function group(parent, x = 0, y = 0, z = 0, o = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (o.rx) g.rotation.x = o.rx;
  if (o.ry) g.rotation.y = o.ry;
  if (o.rz) g.rotation.z = o.rz;
  if (parent) parent.add(g);
  return g;
}
// A named moving part: never merged away.
export function part(parent, name, x = 0, y = 0, z = 0) {
  const g = group(parent, x, y, z);
  g.userData.keep = true;
  const root = findProp(parent);
  if (root) (root.userData.parts ||= {})[name] = g;
  return g;
}
function findProp(o) {
  while (o) {
    if (o.userData && o.userData.isProp) return o;
    o = o.parent;
  }
  return null;
}

// Merge every static mesh under `root` into one mesh per material. Parts marked keep stay as they are.
export function mergeStatic(root) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const doomed = [];
  const visit = (o, kept) => {
    if (o.userData && o.userData.keep) kept = true;
    if (o.isMesh && !kept && !o.userData.noMerge && o.geometry && o.geometry.attributes.position && !o.isInstancedMesh) {
      const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
      if (!buckets.has(key)) buckets.set(key, { material: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
      let g = o.geometry.index ? o.geometry : o.geometry;
      g = g.clone();
      if (!g.index) g = g.toNonIndexed();
      else g = g.toNonIndexed();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((g.attributes.position.count || 0) * 2), 2));
      buckets.get(key).geos.push(g);
      doomed.push(o);
    }
    for (const c of o.children) visit(c, kept);
  };
  visit(root, false);
  for (const o of doomed) o.removeFromParent();
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.recv;
    mesh.matrixAutoUpdate = false;
    mesh.userData.merged = true;
    root.add(mesh);
    for (const g of b.geos) g.dispose();
  }
  // drop empty groups
  const prune = (o) => {
    for (const c of o.children.slice()) prune(c);
    if (o !== root && o.isGroup && !o.children.length && !o.userData.keep && !o.userData.isProp) o.removeFromParent();
  };
  prune(root);
}

export function disposeTree(root) {
  root.traverse((o) => {
    if (o.isMesh && o.userData.merged) o.geometry.dispose();
  });
}

// ---- soft light sprites (cheap bloom) ----
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = canvasOf(128, 128);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}
export function glow(parent, color, size, x = 0, y = 0, z = 0, opacity = 0.7) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.position.set(x, y, z);
  s.userData.noMerge = true;
  s.userData.glow = true;
  parent.add(s);
  return s;
}

// A box whose texture coordinates are in metres, so a stone course or plank keeps its size on any wall.
export function wbox(w, h, d, tile, ox = 0, oy = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [fw, fh] = dims[f];
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * fw) / tile + ox, (uv.getY(k) * fh) / tile + oy);
    }
  }
  return g;
}
