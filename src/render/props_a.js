// Props for the cottage and furniture shared by every room.
import { THREE, M, std, mat, tex, glow, wbox, box, cyl, sph, tor, lathe, plane, group, part, put, tween, ease, TAU, rad, FONT, drawText, paintRug, paintPaper, rngOf, canvasOf } from './gfx.js';
import { def, OAK, DARK, PINE, stoneMat, stoneTile, fabricMat, paperTexMat } from './props_core.js';
import { buildItem } from './items.js';
import { paintClockFace, paintPainting, paintCalendar, paintBarometer } from './art.js';

const sbox = (g, w, h, d, x, y, z) => put(g, new THREE.Mesh(wbox(w, h, d, 1.1, x * 0.3, y * 0.3), stoneTile()), x, y, z);
const place = (g, o, x, y, z, s = 1) => {
  o.position.set(x, y, z);
  if (s !== 1) o.scale.setScalar(s);
  g.add(o);
  return o;
};

// ---- an item sitting in the world ----
def('item', (g, p) => {
  const it = buildItem(p.item);
  it.userData.isProp = false;
  if (p.hang) {
    // hangs from an iron bracket on the wall
    box(g, M.iron(), 0.03, 0.03, 0.2, 0, 0.395, 0.05);
    box(g, M.iron(), 0.08, 0.08, 0.012, 0, 0.395, 0.006);
    tor(g, M.iron(), 0.02, 0.005, 0, 0.375, 0.12, { seg: 10 });
    it.position.set(0, 0, 0.12);
    it.scale.setScalar(1.1);
    it.userData.keep = true;
    g.add(it);
    g.userData.update = (dt, t) => {
      it.rotation.z = Math.sin(t * 1.3) * 0.03;
    };
  } else if (p.floor) {
    it.position.set(0, 0.0, 0);
    if (p.item === 'oilcan') it.rotation.y = 0.6;
    g.add(it);
  } else {
    it.position.set(0, 0.0, 0);
    it.rotation.x = 0;
    g.add(it);
  }
  g.userData.item = it;
});

// ---- rugs, curtains, small things ----
def('rug', (g, p) => {
  const m = mat('rug' + p.color + p.stripe, () => std(0xffffff, 1, 0, { map: tex('rugT' + p.color + p.stripe, 256, 256, (c, w, h) => paintRug(c, w, h, p.color, p.stripe)) }));
  const r = box(g, m, p.w, 0.014, p.d, 0, 0.007, 0, { r: 0.004, cast: false });
});

def('curtain', (g, p) => {
  const m = M.cloth(0x7a3b34);
  const n = 7;
  const r = rngOf(4);
  box(g, M.brassDark(), p.w + 0.3, 0.03, 0.03, 0, 0.1, 0.06, { r: 0.01 });
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < n; i++) {
      const w = (p.w * 0.22) / n;
      box(g, m, w, p.h * (0.88 + r() * 0.1), 0.03, side * (p.w * 0.5 - 0.1 - i * w * 0.9), -p.h * 0.44 + 0.02, 0.05 + (i % 2) * 0.03, { r: 0.004 });
    }
  }
  sph(g, M.brass(), 0.03, -p.w / 2 - 0.15, 0.1, 0.06);
  sph(g, M.brass(), 0.03, p.w / 2 + 0.15, 0.1, 0.06);
});

def('stool', (g) => {
  cyl(g, OAK(), 0.17, 0.17, 0.04, 0, 0.45, 0, { seg: 14 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    cyl(g, DARK(), 0.016, 0.022, 0.45, Math.sin(a) * 0.11, 0.22, Math.cos(a) * 0.11, { rx: Math.cos(a) * 0.15, rz: -Math.sin(a) * 0.15, seg: 8 });
  }
  tor(g, DARK(), 0.1, 0.01, 0, 0.18, 0, { rx: Math.PI / 2, seg: 14 });
});

def('chair', (g) => {
  const w = OAK();
  box(g, w, 0.44, 0.04, 0.42, 0, 0.46, 0, { r: 0.008 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, DARK(), 0.04, 0.46, 0.04, sx * 0.19, 0.23, sz * 0.18, { r: 0.006 });
  for (const sx of [-1, 1]) box(g, DARK(), 0.035, 0.5, 0.035, sx * 0.19, 0.72, -0.19, { r: 0.006 });
  box(g, w, 0.44, 0.1, 0.03, 0, 0.9, -0.19, { r: 0.006 });
  box(g, w, 0.4, 0.07, 0.025, 0, 0.74, -0.19, { r: 0.006 });
  box(g, w, 0.4, 0.02, 0.02, 0, 0.18, 0.18);
  box(g, w, 0.4, 0.02, 0.02, 0, 0.18, -0.18);
});

def('boots', (g) => {
  for (const sx of [-1, 1]) {
    const b = group(g, sx * 0.13, 0, 0, { ry: sx * 0.15 });
    box(b, M.rubber(), 0.13, 0.1, 0.34, 0, 0.05, 0.04, { r: 0.03 });
    cyl(b, M.rubber(), 0.065, 0.075, 0.34, 0, 0.26, -0.06, { seg: 10 });
    box(b, M.rubber(), 0.14, 0.03, 0.14, 0, 0.015, -0.1);
    tor(b, M.rubber(), 0.065, 0.015, 0, 0.43, -0.06, { rx: Math.PI / 2, seg: 10 });
  }
});

def('lifebuoy', (g) => {
  const white = M.white();
  const red = M.painted(0xb3322a);
  g.rotation.x = Math.PI / 2;
  tor(g, white, 0.28, 0.07, 0, 0, 0, { seg: 24 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    tor(g, red, 0.28, 0.0715, 0, 0, 0, { seg: 24, arc: 0.7, rz: a, rx: 0 });
  }
  const r2 = group(g);
  r2.rotation.x = 0;
});

def('barometer', (g) => {
  const f = paperTexMat('baro', 256, 256, (c, w, h) => paintBarometer(c, w, h));
  cyl(g, M.brass(), 0.14, 0.14, 0.05, 0, 0, 0.025, { rx: 1.5708, seg: 24 });
  cyl(g, f, 0.12, 0.12, 0.003, 0, 0, 0.053, { rx: 1.5708, seg: 24 });
  cyl(g, M.glass(), 0.125, 0.125, 0.004, 0, 0, 0.058, { rx: 1.5708, seg: 24, cast: false });
  tor(g, M.brassDark(), 0.14, 0.012, 0, 0, 0.05, { seg: 24 });
});

def('coatrack', (g) => {
  box(g, OAK(), 1.0, 0.12, 0.03, 0, 1.75, 0.02, { r: 0.006 });
  for (const x of [-0.35, 0, 0.35]) cyl(g, M.brass(), 0.012, 0.015, 0.11, x, 1.74, 0.08, { rx: 1.5708, seg: 8 });
  // the oilskin coat and a sou'wester
  const yellow = M.cloth(0xc89a22);
  box(g, yellow, 0.34, 0.8, 0.12, 0, 1.28, 0.14, { r: 0.04 });
  box(g, yellow, 0.1, 0.62, 0.1, -0.2, 1.3, 0.14, { r: 0.04, rz: 0.08 });
  box(g, yellow, 0.1, 0.62, 0.1, 0.2, 1.3, 0.14, { r: 0.04, rz: -0.08 });
  box(g, M.cloth(0x6e5a2a), 0.1, 0.12, 0.13, 0, 1.64, 0.15, { r: 0.03 });
  sph(g, yellow, 0.1, 0.35, 1.62, 0.12, { sy: 0.7, sz: 0.9 });
  box(g, yellow, 0.26, 0.015, 0.2, 0.35, 1.58, 0.14, { r: 0.006 });
});

def('shelf', (g, p) => {
  const w = p.w || 1.4;
  box(g, OAK(), w, 0.04, 0.24, 0, 0, 0.12, { r: 0.006 });
  for (const sx of [-1, 1]) box(g, DARK(), 0.04, 0.2, 0.2, sx * (w / 2 - 0.12), -0.12, 0.1, { r: 0.006 });
  const r = rngOf(Math.round(w * 100));
  let x = -w / 2 + 0.1;
  if (p.books) {
    const cols = [0x6b2b2b, 0x2b4a63, 0x4a5a2b, 0x7a5a22, 0x3b2b4a, 0x8a7a5a];
    while (x < w / 2 - 0.1) {
      const bw = 0.03 + r() * 0.03;
      const bh = 0.16 + r() * 0.1;
      box(g, M.cloth(cols[(r() * cols.length) | 0]), bw, bh, 0.15, x + bw / 2, 0.02 + bh / 2, 0.12, { r: 0.003, rz: x > w / 4 ? 0.18 : 0 });
      x += bw + 0.002;
    }
  } else if (p.tins) {
    const cols = [0xb3322a, 0x2f6fb0, 0xc9a24c, 0x4b6f4f];
    for (let i = 0; i < 7; i++) cyl(g, M.painted(cols[i % 4]), 0.05, 0.05, 0.1 + (i % 3) * 0.03, -w / 2 + 0.2 + i * 0.28, 0.07 + (i % 3) * 0.015, 0.12, { seg: 10 });
  } else if (p.tubes) {
    for (let i = 0; i < 8; i++) {
      cyl(g, M.glass(), 0.03, 0.03, 0.14, -w / 2 + 0.12 + i * 0.15, 0.1, 0.12, { seg: 8, cast: false });
      cyl(g, M.brassDark(), 0.032, 0.032, 0.03, -w / 2 + 0.12 + i * 0.15, 0.04, 0.12, { seg: 8 });
      sph(g, M.glow(0xffa860), 0.012, -w / 2 + 0.12 + i * 0.15, 0.1, 0.12, { seg: 6 });
    }
  }
});

def('bookstack', (g) => {
  box(g, M.cloth(0x6b2b2b), 0.24, 0.045, 0.17, 0, 0.0225, 0, { r: 0.005, ry: 0.1 });
  box(g, M.cloth(0x2b4a63), 0.22, 0.04, 0.16, 0.01, 0.065, 0, { r: 0.005, ry: -0.15 });
  box(g, M.cloth(0x4a5a2b), 0.2, 0.035, 0.15, 0, 0.1, 0, { r: 0.005, ry: 0.2 });
  box(g, M.paper(), 0.19, 0.03, 0.14, 0, 0.0225, 0.005, { r: 0.002, cast: false });
});

def('oillamp', (g, p, th) => {
  cyl(g, M.brass(), 0.06, 0.07, 0.03, 0, 0.015, 0, { seg: 14 });
  lathe(g, M.brass(), [[0.0, 0], [0.07, 0.01], [0.075, 0.06], [0.05, 0.11], [0.025, 0.14], [0.0, 0.14]], 0, 0.03, 0, { seg: 14 });
  cyl(g, M.glass(), 0.032, 0.045, 0.19, 0, 0.27, 0, { seg: 12, cast: false });
  cyl(g, M.black(), 0.012, 0.012, 0.03, 0, 0.19, 0, { seg: 6 });
  const f = sph(g, M.flame(), 0.02, 0, 0.215, 0, { sy: 2, cast: false, seg: 8 });
  const f2 = sph(g, mat('flameCore', () => new THREE.MeshBasicMaterial({ color: 0xfff2c0 })), 0.011, 0, 0.212, 0, { sy: 1.6, cast: false, seg: 6 });
  f.userData.keep = f2.userData.keep = true;
  glow(g, 0xffb050, 0.55, 0, 0.23, 0, 0.55);
  g.userData.update = (dt, t) => {
    const k = 1 + Math.sin(t * 9 + g.id) * 0.06 + Math.sin(t * 23) * 0.04;
    f.scale.set(k, 2 * k, k);
    f2.scale.set(k, 1.6 * k, k);
  };
});

def('candlestick', (g) => {
  cyl(g, M.brass(), 0.05, 0.06, 0.02, 0, 0.01, 0, { seg: 12 });
  cyl(g, M.brass(), 0.012, 0.018, 0.16, 0, 0.1, 0, { seg: 8 });
  cyl(g, M.brass(), 0.03, 0.02, 0.03, 0, 0.19, 0, { seg: 10 });
  cyl(g, M.painted(0xe8dcc0), 0.016, 0.017, 0.12, 0, 0.26, 0, { seg: 8 });
  const f = sph(g, M.flame(), 0.012, 0, 0.345, 0, { sy: 2, cast: false, seg: 6 });
  f.userData.keep = true;
  glow(g, 0xffb050, 0.3, 0, 0.35, 0, 0.5);
  g.userData.update = (dt, t) => {
    f.scale.y = 2 + Math.sin(t * 11 + g.id) * 0.25;
  };
});

def('painting', (g, p) => {
  const w = p.w || 1;
  const h = p.h || 0.7;
  const t = paperTexMat('paint' + p.art, 384, 256, (c, ww, hh) => paintPainting(c, ww, hh, p.art), 0.5);
  box(g, DARK(), w + 0.1, h + 0.1, 0.04, 0, 0, 0.02, { r: 0.008 });
  box(g, M.brassDark(), w + 0.02, h + 0.02, 0.043, 0, 0, 0.02, { r: 0.002 });
  plane(g, t, w, h, 0, 0, 0.043);
});

def('calendar', (g) => {
  const t = paperTexMat('calendar', 256, 320, paintCalendar);
  box(g, M.paper(), 0.3, 0.38, 0.006, 0, 0, 0.003);
  plane(g, t, 0.28, 0.36, 0, 0, 0.0075);
  cyl(g, M.iron(), 0.006, 0.006, 0.02, 0, 0.2, 0.01, { seg: 6 });
});

def('bookshelf', (g, p) => {
  const w = p.w || 1.1;
  const h = p.h || 2;
  const d = 0.3;
  box(g, DARK(), 0.05, h, d, -w / 2 + 0.025, h / 2, d / 2, { r: 0.006 });
  box(g, DARK(), 0.05, h, d, w / 2 - 0.025, h / 2, d / 2, { r: 0.006 });
  box(g, DARK(), w, h, 0.02, 0, h / 2, 0.01);
  const rows = 5;
  const r = rngOf(17);
  const cols = [0x6b2b2b, 0x2b4a63, 0x4a5a2b, 0x7a5a22, 0x3b2b4a, 0x8a7a5a, 0x5a3a22, 0x33463b];
  for (let i = 0; i <= rows; i++) box(g, OAK(), w, 0.035, d, 0, 0.04 + (i * (h - 0.1)) / rows, d / 2, { r: 0.004 });
  for (let row = 0; row < rows; row++) {
    const y0 = 0.06 + (row * (h - 0.1)) / rows;
    let x = -w / 2 + 0.07;
    const bh = (h - 0.1) / rows - 0.05;
    while (x < w / 2 - 0.08) {
      if (r() < 0.07) {
        x += 0.12;
        continue;
      }
      const bw = 0.025 + r() * 0.035;
      const hh = bh * (0.6 + r() * 0.38);
      box(g, M.cloth(cols[(r() * cols.length) | 0]), bw, hh, d * 0.7, x + bw / 2, y0 + 0.02 + hh / 2, d * 0.5, { r: 0.002 });
      x += bw + 0.003;
    }
  }
  // a pot of dried flowers on top
  cyl(g, M.painted(0x6b4a3a), 0.05, 0.04, 0.09, 0.25, h + 0.045, 0.15, { seg: 8 });
});

def('desk', (g, p, th) => {
  const w = p.w || 1.5;
  const dp = 0.7;
  const top = OAK();
  box(g, top, w + 0.06, 0.05, dp + 0.06, 0, 0.775, 0, { r: 0.01 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, DARK(), 0.07, 0.75, 0.07, sx * (w / 2 - 0.05), 0.375, sz * (dp / 2 - 0.05), { r: 0.01 });
  box(g, DARK(), w - 0.1, 0.16, 0.03, 0, 0.62, -dp / 2 + 0.05);
  box(g, DARK(), 0.03, 0.12, dp - 0.1, -w / 2 + 0.05, 0.62, 0);
  box(g, DARK(), 0.03, 0.12, dp - 0.1, w / 2 - 0.05, 0.62, 0);
  box(g, DARK(), w - 0.1, 0.03, dp - 0.1, 0, 0.55, 0);
  const dr = part(g, 'drawer', 0, 0, dp / 2 - 0.02);
  box(dr, OAK(), 0.82, 0.14, 0.03, 0, 0.64, 0, { r: 0.005 });
  box(dr, M.brass(), 0.14, 0.04, 0.012, 0, 0.64, 0.02);
  for (const sx of [-1, 1]) cyl(dr, M.steel(), 0.006, 0.006, 0.01, sx * 0.07, 0.64, 0.028, { rx: 1.5708, seg: 6 });
  box(dr, DARK(), 0.76, 0.1, 0.45, 0, 0.62, -0.23);
  box(dr, M.paper(), 0.5, 0.01, 0.35, 0, 0.675, -0.2, { rz: 0.0, cast: false }).visible = false;
  const lid = dr;
  g.userData.setState = (st, instant) => {
    const to = st.open ? 0.32 : 0;
    if (instant) dr.position.z = dp / 2 - 0.02 + to;
    else tween(dr.position, { z: dp / 2 - 0.02 + to }, 0.5, ease.out);
  };
  // desk top clutter: blotter, ink well and a candle stub
  box(g, M.cloth(0x2f4a3a), 0.5, 0.008, 0.34, -0.15, 0.804, 0.05, { r: 0.002 });
  cyl(g, M.black(), 0.035, 0.04, 0.05, 0.38, 0.825, 0.1, { seg: 10 });
  cyl(g, M.painted(0xe8dcc0), 0.012, 0.012, 0.15, 0.4, 0.9, 0.0, { rz: 0.35, seg: 6 });
  cyl(g, M.rope(), 0.003, 0.003, 0.2, 0.14, 0.806, 0.1, { rx: 1.5708, seg: 4 });
});

def('bed', (g) => {
  const L = 2.0;
  const W = 0.95;
  box(g, DARK(), L, 0.28, W, 0, 0.25, 0, { r: 0.015 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, DARK(), 0.07, 0.15, 0.07, sx * (L / 2 - 0.04), 0.075, sz * (W / 2 - 0.04), { r: 0.01 });
  box(g, M.cloth(0xcbbf9d), L - 0.08, 0.16, W - 0.08, 0, 0.42, 0, { r: 0.05 });
  // headboard and footboard
  box(g, OAK(), 0.07, 0.8, W, -L / 2 + 0.035, 0.55, 0, { r: 0.012 });
  box(g, OAK(), 0.06, 0.45, W, L / 2 - 0.03, 0.43, 0, { r: 0.012 });
  // patchwork quilt, rumpled where someone slept
  const q = mat('quilt', () => std(0xffffff, 1, 0, { map: tex('quiltT', 256, 256, (c, w, h) => {
    const r = rngOf(5);
    const cols = ['#6b2b2b', '#3d5a6e', '#a67c52', '#4a5a2b', '#c9b88a', '#7a3b4a'];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      c.fillStyle = cols[(r() * cols.length) | 0];
      c.fillRect(x * 32, y * 32, 32, 32);
      c.strokeStyle = 'rgba(0,0,0,0.25)';
      c.setLineDash([5, 4]);
      c.strokeRect(x * 32 + 2, y * 32 + 2, 28, 28);
    }
  }) }));
  box(g, q, L * 0.72, 0.1, W + 0.04, 0.22, 0.52, 0, { r: 0.035 });
  box(g, q, 0.5, 0.11, W * 0.5, -0.38, 0.575, 0.2, { r: 0.05, rz: 0.15, ry: 0.25 });
  box(g, q, L * 0.72, 0.16, 0.05, 0.22, 0.45, W / 2 + 0.02, { r: 0.02 });
});

def('pillow', (g) => {
  box(g, M.cloth(0xe6dfcb), 0.5, 0.12, 0.34, 0, 0.06, 0, { r: 0.05, ry: 0.1 });
  box(g, M.paper(), 0.13, 0.005, 0.18, 0.12, 0.125, 0.02, { ry: 0.5, cast: false });
});

def('chest', (g, p) => {
  const w = p.w || 1;
  const h = p.h || 0.55;
  const dp = p.dp || 0.55;
  const w1 = OAK();
  const iron = M.iron();
  box(g, w1, w, h * 0.62, dp, 0, h * 0.31, 0, { r: 0.012 });
  box(g, DARK(), w - 0.08, 0.02, dp - 0.08, 0, h * 0.6, 0);
  // oilskins folded inside, seen when the lid is up
  box(g, M.cloth(0x2a4a6a), w - 0.12, 0.1, dp - 0.12, 0, h * 0.55, 0, { r: 0.03 });
  for (const x of [-0.35, 0, 0.35]) box(g, iron, 0.05, h * 0.62 + 0.01, dp + 0.012, x, h * 0.31, 0);
  for (const sx of [-1, 1]) {
    box(g, iron, 0.02, h * 0.62, dp + 0.012, sx * (w / 2 - 0.005), h * 0.31, 0);
    tor(g, M.brassDark(), 0.035, 0.006, sx * (w / 2 + 0.012), h * 0.35, 0, { ry: 1.5708, seg: 12 });
  }
  const lid = part(g, 'lid', 0, h * 0.62, -dp / 2);
  box(lid, w1, w + 0.02, 0.08, dp + 0.02, 0, 0.04, dp / 2, { r: 0.015 });
  cyl(lid, w1, dp / 2 + 0.01, dp / 2 + 0.01, w + 0.02, 0, 0.08, dp / 2, { rz: 1.5708, seg: 10 }).scale.set(0.35, 1, 1);
  for (const x of [-0.35, 0, 0.35]) box(lid, iron, 0.05, 0.12, dp + 0.03, x, 0.08, dp / 2, { r: 0.01 });
  box(lid, iron, 0.1, 0.1, 0.012, 0, -0.01, dp + 0.02);
  const lock = part(g, 'padlock', 0, h * 0.5, dp / 2 + 0.03);
  box(lock, M.brass(), 0.09, 0.1, 0.045, 0, -0.02, 0.0, { r: 0.012 });
  tor(lock, M.steel(), 0.032, 0.008, 0, 0.04, 0, { seg: 12, arc: Math.PI });
  cyl(lock, M.black(), 0.008, 0.008, 0.012, 0, -0.025, 0.025, { rx: 1.5708, seg: 6 });
  g.userData.setState = (st, instant) => {
    const open = st.open ? -1.75 : 0;
    if (instant) lid.rotation.x = open;
    else tween(lid.rotation, { x: open }, 0.9, ease.out);
    lock.visible = !st.unlocked;
  };
});

def('bedside', (g) => {
  const dp = 0.4;
  box(g, OAK(), 0.46, 0.04, dp, 0, 0.72, 0, { r: 0.008 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, DARK(), 0.04, 0.7, 0.04, sx * 0.2, 0.35, sz * 0.16, { r: 0.006 });
  box(g, DARK(), 0.4, 0.24, dp - 0.06, 0, 0.58, -0.02);
  const dr = part(g, 'drawer', 0, 0, 0);
  box(dr, OAK(), 0.38, 0.2, 0.025, 0, 0.58, dp / 2 - 0.02, { r: 0.004 });
  cyl(dr, M.brass(), 0.012, 0.012, 0.03, 0, 0.58, dp / 2 + 0.01, { rx: 1.5708, seg: 8 });
  box(dr, DARK(), 0.34, 0.14, 0.3, 0, 0.58, dp / 2 - 0.18);
  box(g, DARK(), 0.4, 0.03, dp - 0.06, 0, 0.35, -0.02);
  // a candle stub and a saucer
  cyl(g, M.white(), 0.05, 0.05, 0.012, 0.0, 0.748, 0.02, { seg: 12 });
  cyl(g, M.painted(0xe8dcc0), 0.016, 0.017, 0.05, 0.0, 0.78, 0.02, { seg: 8 });
  g.userData.setState = (st, instant) => {
    const z = st.open ? 0.2 : 0;
    if (instant) dr.position.z = z;
    else tween(dr.position, { z }, 0.45, ease.out);
  };
});

def('fireplace', (g, p) => {
  const w = p.w || 2.1;
  const h = p.h || 1.35;
  const dp = 0.5;
  const st = stoneMat(6);
  const pw = 0.4;
  sbox(g, pw, h, dp, -w / 2 + pw / 2, h / 2, dp / 2);
  sbox(g, pw, h, dp, w / 2 - pw / 2, h / 2, dp / 2);
  sbox(g, w, 0.3, dp, 0, h - 0.15, dp / 2);
  // the mantel shelf
  box(g, DARK(), w + 0.3, 0.07, 0.52, 0, h + 0.035, 0.27, { r: 0.012 });
  box(g, OAK(), w + 0.2, 0.08, 0.04, 0, h - 0.06, dp + 0.08);
  // chimney breast to the ceiling
  sbox(g, w - 0.1, 2.9 - h - 0.07, 0.14, 0, h + 0.07 + (2.9 - h - 0.07) / 2, 0.07);
  // firebox
  const inner = M.black();
  box(g, mat('soot', () => std(0x141110, 1)), w - 2 * pw, h - 0.3, 0.02, 0, (h - 0.3) / 2, 0.03);
  box(g, mat('soot', () => std(0x141110, 1)), 0.02, h - 0.3, 0.46, -(w - 2 * pw) / 2, (h - 0.3) / 2, 0.26);
  box(g, mat('soot', () => std(0x141110, 1)), 0.02, h - 0.3, 0.46, (w - 2 * pw) / 2, (h - 0.3) / 2, 0.26);
  sbox(g, w - 2 * pw, 0.1, dp + 0.5, 0, 0.05, dp / 2 + 0.25);
  // grate, logs and a bed of embers
  const iron = M.iron();
  for (let i = 0; i < 6; i++) cyl(g, iron, 0.012, 0.012, 0.32, -0.3 + i * 0.12, 0.2, 0.26, { rx: 1.5708, seg: 6 });
  for (const sx of [-1, 1]) box(g, iron, 0.03, 0.3, 0.03, sx * 0.36, 0.25, 0.4);
  const ember = plane(g, mat('ember', () => new THREE.MeshBasicMaterial({ color: 0xff5a1a })), 0.7, 0.4, 0, 0.14, 0.26, { rx: -1.5708 });
  ember.userData.keep = true;
  for (let i = 0; i < 3; i++) cyl(g, mat('log', () => std(0x4a2f1c, 0.9)), 0.07, 0.07, 0.62, 0, 0.2 + (i === 2 ? 0.12 : 0), 0.18 + i * 0.1, { rz: 1.5708, ry: 0.2 * (i - 1), seg: 8 });
  // flames
  const flames = [];
  const fm = mat('fire1', () => new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.92 }));
  const fm2 = mat('fire2', () => new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.95 }));
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.1 - i * 0.008, 0.46 - i * 0.03, 7), i % 2 ? fm2 : fm);
    c.position.set(-0.22 + i * 0.11, 0.42, 0.26 + (i % 2) * 0.06);
    c.userData.ph = i * 1.7;
    c.userData.keep = true;
    g.add(c);
    flames.push(c);
  }
  glow(g, 0xff8a3a, 2.4, 0, 0.5, 0.45, 0.55);
  g.userData.update = (dt, t) => {
    for (const f of flames) {
      const k = 1 + Math.sin(t * 8 + f.userData.ph) * 0.18 + Math.sin(t * 19 + f.userData.ph * 2) * 0.1;
      f.scale.set(1 + Math.sin(t * 6 + f.userData.ph) * 0.1, k, 1);
      f.position.y = 0.2 + 0.23 * k;
    }
    ember.material.color.setHSL(0.04 + Math.sin(t * 3) * 0.01, 1, 0.45 + Math.sin(t * 7) * 0.06);
  };
});

def('mantelclock', (g) => {
  const face = paperTexMat('clockface', 256, 256, (c, w, h) => paintClockFace(c, w, h, { hands: false }), 0.4);
  box(g, DARK(), 0.34, 0.05, 0.16, 0, 0.025, 0, { r: 0.01 });
  box(g, OAK(), 0.28, 0.36, 0.13, 0, 0.23, 0, { r: 0.012 });
  cyl(g, OAK(), 0.14, 0.14, 0.13, 0, 0.41, 0, { rx: 1.5708, seg: 18 });
  sph(g, M.brass(), 0.02, 0, 0.56, 0, { seg: 8 });
  tor(g, M.brass(), 0.105, 0.012, 0, 0.3, 0.067, { seg: 24 });
  cyl(g, face, 0.1, 0.1, 0.004, 0, 0.3, 0.068, { rx: 1.5708, seg: 24, cast: false });
  cyl(g, M.glass(), 0.103, 0.103, 0.004, 0, 0.3, 0.074, { rx: 1.5708, seg: 24, cast: false });
  // hands at ten thirty-five
  const hr = ((10 + 35 / 60) / 12) * TAU;
  const mn = (35 / 60) * TAU;
  const hh = box(g, M.black(), 0.012, 0.062, 0.003, 0, 0, 0, {});
  const mh = box(g, M.black(), 0.008, 0.088, 0.003, 0, 0, 0, {});
  for (const [m, a, l] of [[hh, hr, 0.031], [mh, mn, 0.044]]) {
    m.position.set(Math.sin(a) * l, 0.3 + Math.cos(a) * l, 0.0745);
    m.rotation.z = -a;
  }
  sph(g, M.brass(), 0.008, 0, 0.3, 0.076, { seg: 6 });
  // pendulum window
  box(g, mat('pendbg', () => std(0x1b130c, 0.9)), 0.15, 0.12, 0.005, 0, 0.11, 0.066);
  cyl(g, M.brass(), 0.04, 0.04, 0.008, 0, 0.1, 0.07, { rx: 1.5708, seg: 14 });
  cyl(g, M.brass(), 0.004, 0.004, 0.08, 0, 0.14, 0.07, { seg: 4 });
  for (const sx of [-1, 1]) sph(g, M.brass(), 0.018, sx * 0.1, 0.045, 0.06, { seg: 8 });
});

def('bottle', (g) => {
  const glass = mat('bottleglass', () => new THREE.MeshStandardMaterial({ color: 0x7fb59a, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.32, depthWrite: false }));
  box(g, DARK(), 0.07, 0.04, 0.08, -0.1, 0.02, 0, { r: 0.01 });
  box(g, DARK(), 0.07, 0.04, 0.08, 0.1, 0.02, 0, { r: 0.01 });
  const body = lathe(g, glass, [[0, 0.0], [0.055, 0.02], [0.062, 0.08], [0.062, 0.2], [0.04, 0.27], [0.02, 0.31], [0.022, 0.38], [0.0, 0.38]], 0, 0.08, 0, { rz: -1.5708, seg: 14, cast: false });
  body.position.set(0.19, 0.08, 0);
  // the brig inside
  const sea = box(g, mat('bsea', () => std(0x2c5a7a, 0.4)), 0.2, 0.012, 0.07, -0.02, 0.063, 0);
  box(g, M.black(), 0.13, 0.03, 0.04, -0.02, 0.085, 0, { r: 0.008 });
  for (const x of [-0.06, -0.01, 0.045]) {
    cyl(g, M.oak(), 0.003, 0.003, 0.09, x, 0.13, 0, { seg: 4 });
    box(g, M.painted(0xe8dcc0), 0.002, 0.05, 0.04, x, 0.135, 0);
  }
  sph(g, M.rope(), 0.012, 0.15, 0.08, 0, { seg: 8 });
});

def('armchair', (g) => {
  const cloth = fabricMat('arm', '#4a5a3b', '#556a44');
  box(g, cloth, 0.8, 0.22, 0.75, 0, 0.3, 0, { r: 0.06 });
  box(g, cloth, 0.8, 0.62, 0.18, 0, 0.62, -0.3, { r: 0.07 });
  for (const sx of [-1, 1]) box(g, cloth, 0.16, 0.4, 0.75, sx * 0.4, 0.45, 0, { r: 0.06 });
  box(g, cloth, 0.58, 0.14, 0.6, 0, 0.48, 0.04, { r: 0.06 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, DARK(), 0.03, 0.022, 0.16, sx * 0.34, 0.08, sz * 0.3, { seg: 8 });
  box(g, M.cloth(0xa8832f), 0.5, 0.05, 0.4, 0, 0.58, 0.08, { r: 0.02, rx: -0.3 }); // a folded blanket
});

def('logbasket', (g) => {
  const wick = mat('wicker', () => std(0x9a7a45, 0.95));
  cyl(g, wick, 0.3, 0.24, 0.34, 0, 0.17, 0, { seg: 14 });
  tor(g, wick, 0.3, 0.02, 0, 0.34, 0, { rx: 1.5708, seg: 18 });
  for (let i = 0; i < 4; i++) cyl(g, mat('log', () => std(0x4a2f1c, 0.9)), 0.055, 0.055, 0.42, -0.1 + (i % 2) * 0.2, 0.36 + (i > 1 ? 0.08 : 0), (i > 1 ? 0.04 : -0.06), { rx: 1.5708, rz: 0.1 * i, seg: 8 });
});

def('poker', (g) => {
  box(g, M.iron(), 0.22, 0.02, 0.2, 0, 0.01, 0, { r: 0.004 });
  cyl(g, M.iron(), 0.008, 0.008, 0.95, 0, 0.5, 0, { seg: 6 });
  sph(g, M.iron(), 0.022, 0, 0.98, 0, { seg: 8 });
  cyl(g, M.iron(), 0.008, 0.008, 0.9, 0.06, 0.48, 0.02, { rz: -0.06, seg: 6 });
  cyl(g, M.iron(), 0.008, 0.008, 0.92, -0.06, 0.5, -0.02, { rz: 0.05, seg: 6 });
});

// ---- the door of the cottage ----
def('door', (g, p) => {
  const w = p.w || 1.15;
  const h = p.h || 2.15;
  const fr = DARK();
  box(g, fr, 0.12, h + 0.12, 0.2, -w / 2 - 0.06, (h + 0.12) / 2, 0.08, { r: 0.01 });
  box(g, fr, 0.12, h + 0.12, 0.2, w / 2 + 0.06, (h + 0.12) / 2, 0.08, { r: 0.01 });
  box(g, fr, w + 0.24, 0.14, 0.2, 0, h + 0.07, 0.08, { r: 0.01 });
  box(g, M.stone(), w + 0.2, 0.05, 0.3, 0, 0.025, 0.1);
  const leaf = part(g, 'leaf', -w / 2, 0, 0.02);
  const planks = 4;
  for (let i = 0; i < planks; i++) box(leaf, i % 2 ? OAK() : DARK(), w / planks - 0.01, h - 0.04, 0.06, (i + 0.5) * (w / planks), h / 2, 0.03, { r: 0.004 });
  const iron = M.iron();
  for (const y of [0.35, 1.0, 1.75]) {
    box(leaf, iron, w - 0.1, 0.1, 0.02, w / 2, y, 0.07);
    for (const x of [0.08, 0.3, 0.55, 0.8, 1.05]) sph(leaf, iron, 0.014, x, y, 0.08, { seg: 6 });
  }
  box(leaf, iron, 0.2, 0.32, 0.03, w - 0.2, 1.05, 0.08, { r: 0.006 });
  tor(leaf, iron, 0.06, 0.01, w - 0.2, 1.2, 0.1, { seg: 14 });
  box(leaf, M.black(), 0.025, 0.06, 0.02, w - 0.2, 1.0, 0.1);
  // a small barred window at the top
  box(leaf, M.black(), 0.28, 0.2, 0.07, w / 2, 1.78, 0.03);
  for (const x of [-0.08, 0, 0.08]) cyl(leaf, iron, 0.008, 0.008, 0.22, w / 2 + x, 1.78, 0.07, { seg: 5 });
  g.userData.setState = (st, instant) => {
    const a = st.open ? 1.35 : 0;
    if (instant) leaf.rotation.y = a;
    else tween(leaf.rotation, { y: a }, 1.4, ease.inOut);
  };
});
