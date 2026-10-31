// The room itself: walls with window cut-outs, floor, ceiling and the things fixed to them.
import { THREE, M, std, mat, tex, box, cyl, sph, tor, plane, group, glow, wbox, paintPlanks, paintPlaster, paintStone, rngOf, TAU, canvasOf, mergeStatic } from './gfx.js';
import { makeFrame } from './frame.js';
import { OAK, DARK, stoneMat } from './props_core.js';

const plasterMat = (key, base) => mat('plaster' + key, () => std(0xffffff, 0.95, 0, { map: tex('plasterT' + key, 512, 512, (c, w, h) => paintPlaster(c, w, h, base, key.length * 3), { repeat: [1, 1] }) }));
const plankMat = (key, base, n, rep, rough = 0.78) =>
  mat('plank' + key, () => std(0xffffff, rough, 0, { map: tex('plankT' + key, 512, 512, (c, w, h) => paintPlanks(c, w, h, base, { n, seed: key.length }), { repeat: rep }) }));
const vwood = (key, base) => mat('vwood' + key, () => std(0xffffff, 0.8, 0, { map: tex('vwoodT' + key, 512, 512, (c, w, h) => paintPlanks(c, w, h, base, { n: 8, vertical: true, seed: 9 }), { repeat: [1, 1] }) }));
const towerStone = () => mat('towerStone', () => std(0xffffff, 0.95, 0, { map: tex('towerStoneT', 512, 512, (c, w, h) => paintStone(c, w, h, [112, 108, 100], { rows: 8, seed: 21 }), { repeat: [1, 1] }) }));
const rainGlassTex = () =>
  tex('rainglass', 256, 256, (c, w, h) => {
    const r = rngOf(77);
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = r() * w;
      const y = r() * h;
      c.fillStyle = 'rgba(220,235,255,0.5)';
      c.beginPath();
      c.ellipse(x, y, 1.5 + r() * 2.5, 2 + r() * 3.5, 0, 0, TAU);
      c.fill();
      if (r() > 0.5) {
        c.strokeStyle = 'rgba(210,230,255,0.28)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (r() - 0.5) * 3, y - 14 - r() * 36);
        c.stroke();
      }
    }
  });

class Bucket {
  constructor() {
    this.map = new Map();
  }
  add(material, geo, x, y, z, ry = 0, rx = 0, noCast = false) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0, 'YXZ')), new THREE.Vector3(1, 1, 1));
    const g = geo.clone();
    g.applyMatrix4(m);
    for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
    if (g.index) {
      const ng = g.toNonIndexed();
      g.dispose();
      return this.push(material, ng, noCast);
    }
    this.push(material, g, noCast);
  }
  push(material, g, noCast) {
    const key = noCast ? { m: material, n: 1 } : null;
    const k = noCast ? (this.nc ||= new Map()).get(material) || (this.nc.set(material, { material, geos: [] }), this.nc.get(material)) : null;
    if (noCast) return k.geos.push(g);
    if (!this.map.has(material)) this.map.set(material, []);
    this.map.get(material).push(g);
  }
  build(parent, cast = true) {
    const groups = [...this.map].map(([material, geos]) => ({ material, geos, cast }));
    if (this.nc) for (const v of this.nc.values()) groups.push({ material: v.material, geos: v.geos, cast: false });
    for (const { material, geos, cast } of groups) {
      const merged = geos.length === 1 ? geos[0] : mergeGeos(geos);
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      mesh.userData.merged = true;
      parent.add(mesh);
    }
  }
}
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const mergeGeos = (geos) => mergeGeometries(geos, false);

// ---- rectangular rooms (the cottage) ----
function buildRect(room, root, B, quality) {
  const sh = room.shell;
  const H = sh.h;
  const fr = makeFrame(sh);
  const wain = vwood('wain', [150, 112, 74]);
  const plaster = plasterMat('cot', [168, 148, 118]);
  const wainTop = 1.05;
  const T = 0.3;
  const wallBox = (w, lx, ya, yb, sw, mt, tile) => {
    const p = fr.place(w, lx, -T / 2);
    B.add(mt, wbox(sw, yb - ya, T, tile, lx * 0.37, ya * 0.37), p.x, (ya + yb) / 2, p.z, p.ry);
  };
  for (let w = 0; w < 4; w++) {
    const width = w % 2 === 0 ? sh.w : sh.d;
    const ops = sh.openings.filter((o) => o.wall === w).map((o) => ({ x0: o.x - o.w / 2, x1: o.x + o.w / 2, y0: o.y, y1: o.y + o.h, o }));
    const xs = [...new Set([-width / 2, width / 2, ...ops.flatMap((o) => [o.x0, o.x1])])].sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i++) {
      const xa = xs[i];
      const xb = xs[i + 1];
      if (xb - xa < 0.002) continue;
      const mid = (xa + xb) / 2;
      let free = [[0, H]];
      for (const o of ops) {
        if (o.x0 <= mid && o.x1 >= mid) {
          const next = [];
          for (const [a, b] of free) {
            if (o.y0 > a) next.push([a, Math.min(b, o.y0)]);
            if (o.y1 < b) next.push([Math.max(a, o.y1), b]);
          }
          free = next.filter(([a, b]) => b - a > 0.002);
        }
      }
      for (const [a, b] of free) {
        if (a < wainTop && b > wainTop) {
          wallBox(w, mid, a, wainTop, xb - xa, wain, 1.4);
          wallBox(w, mid, wainTop, b, xb - xa, plaster, 1.6);
        } else wallBox(w, mid, a, b, xb - xa, b <= wainTop ? wain : plaster, b <= wainTop ? 1.4 : 1.6);
      }
    }
    // chair rail and skirting along the whole wall
    const rail = fr.place(w, 0, 0.02);
    const dk = DARK();
    B.add(dk, new THREE.BoxGeometry(width, 0.07, 0.05), rail.x, wainTop, rail.z, rail.ry);
    const sk = fr.place(w, 0, 0.015);
    B.add(dk, new THREE.BoxGeometry(width, 0.13, 0.03), sk.x, 0.065, sk.z, sk.ry);
    for (const o of ops) windowDressing(fr, w, o.o, root, B);
  }
  // floor, ceiling, beams
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(sh.w, sh.d), plankMat('cotfloor', [140, 100, 62], 7, [1.2, 1.1]));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(sh.w, sh.d), plankMat('cotceil', [104, 76, 50], 9, [1.1, 1]));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  ceil.receiveShadow = true;
  root.add(ceil);
  for (const z of [-1.9, 0, 1.9]) B.add(DARK(), new THREE.BoxGeometry(sh.w, 0.22, 0.2), 0, H - 0.11, z, 0, 0, true);
  for (const x of [-2.2, 2.2]) B.add(DARK(), new THREE.BoxGeometry(0.16, 0.16, sh.d), x, H - 0.08, 0, 0, 0, true);
  // a ship's lantern bracket at the door side and hanging herbs
  return fr;
}

function windowDressing(fr, w, o, root, B) {
  if (!(o.y > 0.2)) return;
  const dk = DARK();
  const f = 0.07;
  const p0 = (lx, y, d, sw, sh, sd) => {
    const p = fr.place(w, lx, d);
    B.add(dk, new THREE.BoxGeometry(sw, sh, sd), p.x, y, p.z, p.ry);
  };
  p0(o.x - o.w / 2 + f / 2, o.y + o.h / 2, 0.02, f, o.h + f * 2, 0.06);
  p0(o.x + o.w / 2 - f / 2, o.y + o.h / 2, 0.02, f, o.h + f * 2, 0.06);
  p0(o.x, o.y + o.h - f / 2, 0.02, o.w, f, 0.06);
  p0(o.x, o.y + f / 2, 0.02, o.w, f, 0.06);
  p0(o.x, o.y - 0.02, 0.12, o.w + 0.2, 0.05, 0.26);
  p0(o.x, o.y + o.h / 2, -0.1, 0.035, o.h, 0.04);
  p0(o.x, o.y + o.h / 2, -0.1, o.w, 0.035, 0.04);
  const p = fr.place(w, o.x, -0.12);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), new THREE.MeshStandardMaterial({ color: 0x9fb8d0, transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false }));
  glass.position.set(p.x, o.y + o.h / 2, p.z);
  glass.rotation.y = p.ry;
  root.add(glass);
  const drops = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), new THREE.MeshBasicMaterial({ map: rainGlassTex(), transparent: true, opacity: 0.7, depthWrite: false }));
  const p2 = fr.place(w, o.x, -0.1);
  drops.position.set(p2.x, o.y + o.h / 2, p2.z);
  drops.rotation.y = p2.ry;
  root.add(drops);
  drops.userData.windowDrops = true;
}

// ---- round rooms: a ring of stone segments ----
function buildRound(room, root, B, quality) {
  const sh = room.shell;
  const R = sh.r;
  const H = sh.h;
  const fr = makeFrame(sh);
  const N = 48;
  const T = 0.55;
  const segW = 2 * (R + T) * Math.tan(Math.PI / N) + 0.02;
  const stone = towerStone();
  const holes = [];
  for (const o of sh.openings) {
    const th = (o.wall * Math.PI) / 2 + o.x / R;
    holes.push({ th, half: o.w / 2 / R, y0: o.y, y1: o.y + o.h, o });
  }
  const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const covers = new Map();
  for (let i = 0; i < N; i++) {
    const th = (i / N) * TAU;
    const hole = holes.find((h) => angDiff(th, h.th) <= h.half + 0.001);
    const rr = R + T / 2;
    const x = Math.sin(th) * rr;
    const z = -Math.cos(th) * rr;
    const parts = hole ? [] : [[0, H]];
    if (hole) {
      if (hole.y0 > 0.01) parts.push([0, hole.y0]);
      if (hole.y1 < H) parts.push([hole.y1, H]);
      const arr = covers.get(hole) || [];
      arr.push(th);
      covers.set(hole, arr);
    }
    for (const [a, b] of parts) B.add(stone, wbox(segW, b - a, T, 1.5, i * 0.31, a * 0.3), x, (a + b) / 2, z, -th);
  }
  // window dressing: a deep sill, a frame and glass at each opening's real width
  for (const [hole, ths] of covers) {
    const o = hole.o;
    if (!(o.y > 0.2)) continue;
    const mean = ths.reduce((a, b) => a + b, 0) / ths.length;
    const span = ths.length * ((2 * Math.PI) / N);
    const wdt = span * R;
    const px = Math.sin(mean) * (R - 0.01);
    const pz = -Math.cos(mean) * (R - 0.01);
    const dk = DARK();
    const g = group(root, px, 0, pz, { ry: -mean });
    const f = 0.08;
    box(g, dk, f, o.h + f * 2, 0.1, -wdt / 2 + f / 2, o.y + o.h / 2, 0.03, { r: 0.01 });
    box(g, dk, f, o.h + f * 2, 0.1, wdt / 2 - f / 2, o.y + o.h / 2, 0.03, { r: 0.01 });
    box(g, dk, wdt, f, 0.1, 0, o.y + o.h - f / 2, 0.03);
    box(g, dk, wdt, f, 0.1, 0, o.y + f / 2, 0.03);
    box(g, stone, wdt + 0.16, 0.06, 0.5, 0, o.y - 0.01, -0.2, { r: 0.01 });
    box(g, dk, 0.04, o.h, 0.05, 0, o.y + o.h / 2, -0.22);
    box(g, dk, wdt, 0.04, 0.05, 0, o.y + o.h * 0.55, -0.22);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(wdt, o.h), new THREE.MeshStandardMaterial({ color: 0x9fb8d0, transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false }));
    glass.position.set(0, o.y + o.h / 2, -0.28);
    g.add(glass);
    const drops = new THREE.Mesh(new THREE.PlaneGeometry(wdt, o.h), new THREE.MeshBasicMaterial({ map: rainGlassTex(), transparent: true, opacity: 0.7, depthWrite: false }));
    drops.position.set(0, o.y + o.h / 2, -0.26);
    g.add(drops);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.05, 48), plankMat('towerfloor', [128, 96, 64], 8, [1.6, 1.6]));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R + 0.05, 48), plankMat('towerceil', [86, 62, 42], 10, [1.3, 1.3]));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  root.add(ceil);
  const dk = DARK();
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * TAU + Math.PI / 8;
    B.add(dk, new THREE.BoxGeometry(0.18, 0.24, R), Math.sin(th) * R * 0.5, H - 0.12, -Math.cos(th) * R * 0.5, -th, 0, true);
  }
  B.add(M.iron(), new THREE.CylinderGeometry(0.35, 0.35, 0.16, 16), 0, H - 0.08, 0, 0);
  // skirting ring
  for (let i = 0; i < N; i++) {
    const th = ((i + 0.5) / N) * TAU;
    B.add(dk, new THREE.BoxGeometry(segW, 0.14, 0.04), Math.sin(th) * (R - 0.02), 0.07, -Math.cos(th) * (R - 0.02), -th);
  }
  return fr;
}

// ---- the lamp room: stone parapet, iron posts every 30 degrees, a copper dome ----
function buildLantern(room, root, B, quality) {
  const sh = room.shell;
  const R = sh.r;
  const H = sh.h;
  const fr = makeFrame(sh);
  const N = 36;
  const T = 0.4;
  const segW = 2 * (R + T) * Math.tan(Math.PI / N) + 0.02;
  const parapet = 1.05;
  const stone = towerStone();
  const paint = mat('lampPaint', () => std(0x7a2a22, 0.6, 0.1));
  for (let i = 0; i < N; i++) {
    const th = (i / N) * TAU;
    const x = Math.sin(th) * (R + T / 2);
    const z = -Math.cos(th) * (R + T / 2);
    B.add(i % 3 === 1 ? paint : stone, wbox(segW, parapet, T, 1.5, i * 0.2, 0), x, parapet / 2, z, -th);
    B.add(stone, new THREE.BoxGeometry(segW, 0.07, T + 0.1), Math.sin(th) * (R + T / 2 - 0.02), parapet + 0.035, -Math.cos(th) * (R + T / 2 - 0.02), -th);
  }
  const iron = mat('lampIron', () => std(0x1d2024, 0.5, 0.7));
  // posts every 30 degrees, with glass between them as a fine mullion grid
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * TAU;
    B.add(iron, new THREE.BoxGeometry(0.14, H - parapet + 0.2, 0.14), Math.sin(th) * (R + 0.06), parapet + (H - parapet) / 2, -Math.cos(th) * (R + 0.06), -th);
    const th2 = th + Math.PI / 12;
    const wd = 2 * R * Math.sin(Math.PI / 12);
    B.add(iron, new THREE.BoxGeometry(wd, 0.04, 0.04), Math.sin(th2) * (R + 0.04), parapet + 0.9, -Math.cos(th2) * (R + 0.04), -th2);
    B.add(iron, new THREE.BoxGeometry(0.03, H - parapet, 0.04), Math.sin(th2) * (R + 0.04), parapet + (H - parapet) / 2, -Math.cos(th2) * (R + 0.04), -th2);
    // glass pane
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(wd, H - parapet), new THREE.MeshStandardMaterial({ color: 0x9fb8d0, transparent: true, opacity: 0.07, roughness: 0.05, depthWrite: false }));
    pane.position.set(Math.sin(th2) * (R + 0.04), parapet + (H - parapet) / 2, -Math.cos(th2) * (R + 0.04));
    pane.rotation.y = -th2;
    root.add(pane);
  }
  B.add(iron, new THREE.CylinderGeometry(R + 0.2, R + 0.2, 0.12, 36), 0, H + 0.04, 0, 0);
  // floor of slate flags and a dome
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 0.05, 48), plankMat('lampfloor', [96, 92, 88], 8, [1.5, 1.5], 0.7));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  const copper = mat('copperRoof', () => std(0x4f7d6a, 0.5, 0.6));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R + 0.3, 36, 10, 0, TAU, 0, Math.PI / 2), copper);
  dome.scale.y = 0.55;
  dome.position.y = H + 0.1;
  const domeIn = new THREE.Mesh(new THREE.SphereGeometry(R + 0.2, 36, 10, 0, TAU, 0, Math.PI / 2), mat('domeIn', () => std(0x6a5a44, 0.9, 0.2, { side: THREE.BackSide })));
  domeIn.scale.y = 0.5;
  domeIn.position.y = H + 0.1;
  root.add(dome, domeIn);
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * TAU;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(R + 0.2, 0.04, 6, 20, Math.PI / 2), iron);
    rib.scale.y = 0.5;
    rib.rotation.y = -th + Math.PI / 2;
    rib.position.y = H + 0.1;
    root.add(rib);
  }
  sph(root, M.brass(), 0.22, 0, H + 0.1 + (R + 0.3) * 0.55, 0, { seg: 12 });
  return fr;
}

export function buildShell(room, quality) {
  const root = new THREE.Group();
  const B = new Bucket();
  let fr;
  if (room.shell.kind === 'rect') fr = buildRect(room, root, B, quality);
  else if (room.shell.kind === 'lantern') fr = buildLantern(room, root, B, quality);
  else fr = buildRound(room, root, B, quality);
  B.build(root);
  return { root, frame: fr };
}
