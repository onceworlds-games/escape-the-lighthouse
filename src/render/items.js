// Item models: each is built around the origin, roughly 0.3 units across, standing or lying as it would be held.
import { THREE, M, std, mat, box, cyl, sph, tor, lathe, plane, group, tex, canvasOf, drawText, FONT, TAU, rad } from './gfx.js';

const ITEMS = {};
const def = (id, fn) => (ITEMS[id] = fn);

def('matches', (g) => {
  const tex1 = tex('matchbox', 128, 64, (c, w, h) => {
    c.fillStyle = '#b3322a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8dcc0';
    c.fillRect(8, 8, w - 16, h - 16);
    drawText(c, 'SAFETY', w / 2, h * 0.38, { size: 22, color: '#b3322a', spacing: 2, font: FONT.ui });
    drawText(c, 'MATCHES', w / 2, h * 0.7, { size: 22, color: '#2a1a0c', spacing: 2, font: FONT.ui });
  });
  const top = mat('matchtop', () => std(0xffffff, 0.8, 0, { map: tex1 }));
  box(g, M.painted(0xb3322a), 0.17, 0.045, 0.1, 0, 0, 0, { r: 0.004 });
  box(g, top, 0.172, 0.01, 0.102, 0, 0.024, 0, { r: 0.002 });
  box(g, M.painted(0xd9cba8), 0.17, 0.02, 0.003, 0, -0.01, 0.052);
  // the drawer slid open a little, three match sticks showing
  for (let i = 0; i < 3; i++) {
    cyl(g, M.oak(), 0.004, 0.004, 0.09, 0, 0.03, -0.025 + i * 0.025, { rz: 1.5708 });
    sph(g, M.painted(0xa81810), 0.007, 0.047, 0.03, -0.025 + i * 0.025, { seg: 6 });
  }
});

def('lantern', (g, o = {}) => {
  cyl(g, M.iron(), 0.07, 0.08, 0.025, 0, 0.0125, 0);
  cyl(g, M.iron(), 0.062, 0.062, 0.05, 0, 0.05, 0);
  cyl(g, M.glass(), 0.052, 0.058, 0.17, 0, 0.16, 0, { cast: false });
  for (const a of [0.8, 2.4, 4.0, 5.5]) cyl(g, M.iron(), 0.004, 0.004, 0.19, Math.sin(a) * 0.055, 0.16, Math.cos(a) * 0.055);
  cyl(g, M.iron(), 0.065, 0.045, 0.04, 0, 0.26, 0);
  cyl(g, M.iron(), 0.02, 0.03, 0.04, 0, 0.3, 0);
  tor(g, M.iron(), 0.05, 0.005, 0, 0.35, 0, { ry: 0, seg: 16, arc: Math.PI });
  tor(g, M.brassDark(), 0.056, 0.004, 0, 0.215, 0, { rx: Math.PI / 2 });
  // wick
  cyl(g, M.black(), 0.008, 0.008, 0.03, 0, 0.075, 0);
  if (o.lit) {
    const f = sph(g, M.flame(), 0.022, 0, 0.115, 0, { sy: 1.8, cast: false });
    g.userData.flame = f;
  }
});
def('lantern_lit', (g) => ITEMS.lantern(g, { lit: true }));

def('screwdriver', (g) => {
  cyl(g, M.oak(), 0.018, 0.022, 0.1, 0, 0.06, 0, { rz: 1.5708 });
  box(g, M.black(), 0.008, 0.008, 0.008, -0.01, 0.06, 0);
  cyl(g, M.steel(), 0.004, 0.004, 0.13, 0.115, 0.06, 0, { rz: 1.5708 });
  box(g, M.steel(), 0.012, 0.012, 0.002, 0.185, 0.06, 0);
  cyl(g, M.brassDark(), 0.02, 0.02, 0.012, 0.012, 0.06, 0, { rz: 1.5708 });
});

def('oilcan', (g) => {
  const rust = M.rust();
  cyl(g, rust, 0.055, 0.06, 0.12, 0, 0.06, 0);
  sph(g, rust, 0.055, 0, 0.12, 0, { sy: 0.5 });
  cyl(g, M.steel(), 0.007, 0.007, 0.16, 0.08, 0.17, 0, { rz: -1.0 });
  cyl(g, M.steel(), 0.012, 0.007, 0.03, 0.15, 0.24, 0, { rz: -1.0 });
  tor(g, M.iron(), 0.04, 0.005, -0.03, 0.14, 0, { ry: 1.57, arc: 4.4 });
  cyl(g, M.brassDark(), 0.012, 0.012, 0.02, 0, 0.19, 0);
  box(g, M.painted(0x8a8a7a), 0.06, 0.04, 0.002, 0, 0.06, 0.06);
});

def('door_key', (g) => {
  const m = mat('ironkey', () => std(0x2b2d31, 0.5, 0.8));
  tor(g, m, 0.04, 0.011, -0.1, 0.0, 0, { seg: 18 });
  tor(g, m, 0.018, 0.007, -0.1, 0.0, 0, { seg: 12 });
  cyl(g, m, 0.009, 0.009, 0.17, 0.0, 0.0, 0, { rz: 1.5708 });
  box(g, m, 0.016, 0.05, 0.012, 0.06, -0.022, 0);
  box(g, m, 0.014, 0.035, 0.012, 0.085, -0.016, 0);
  tor(g, m, 0.013, 0.004, -0.045, 0, 0, { seg: 8 });
});

def('torch', (g) => {
  const black = M.black();
  cyl(g, black, 0.03, 0.03, 0.2, 0, 0.0, 0, { rz: 1.5708 });
  cyl(g, M.rubber(), 0.032, 0.032, 0.08, -0.08, 0, 0, { rz: 1.5708 });
  cyl(g, M.steel(), 0.05, 0.034, 0.05, 0.12, 0, 0, { rz: 1.5708 });
  cyl(g, mat('uvlens', () => std(0x7a4cd4, 0.2, 0.1, { emissive: 0x2a1060 })), 0.045, 0.045, 0.01, 0.148, 0, 0, { rz: 1.5708 });
  box(g, M.brass(), 0.03, 0.012, 0.012, 0.0, 0.032, 0, { r: 0.003 });
  const t = tex('uvlabel', 128, 40, (c, w, h) => {
    c.fillStyle = '#c9a24c';
    c.fillRect(0, 0, w, h);
    drawText(c, 'UV INSPECTION', w / 2, h / 2, { size: 20, color: '#1a1008', font: FONT.ui, spacing: 1 });
  });
  plane(g, mat('uvlabelM', () => std(0xffffff, 0.6, 0.2, { map: t })), 0.1, 0.03, 0, 0, 0.0301, { ry: 0 });
});
def('uv_torch', (g, o) => {
  ITEMS.torch(g);
  cyl(g, mat('uvbeam', () => new THREE.MeshBasicMaterial({ color: 0x9a6cff, transparent: true, opacity: 0.25, depthWrite: false })), 0.2, 0.045, 0.5, 0.4, 0, 0, { rz: -1.5708, cast: false, recv: false });
});

def('battery', (g) => {
  cyl(g, mat('cellbody', () => std(0x3b3a30, 0.6, 0.3)), 0.04, 0.04, 0.12, 0, 0.06, 0);
  cyl(g, M.brass(), 0.043, 0.043, 0.02, 0, 0.005, 0);
  cyl(g, M.brass(), 0.043, 0.043, 0.02, 0, 0.115, 0);
  cyl(g, M.brass(), 0.014, 0.014, 0.02, 0, 0.14, 0);
  cyl(g, M.painted(0xc9a24c), 0.0415, 0.0415, 0.04, 0, 0.06, 0);
});

def('crank', (g) => {
  const m = M.iron();
  cyl(g, M.steel(), 0.012, 0.012, 0.15, 0, 0, 0, { rz: 1.5708 });
  box(g, m, 0.02, 0.16, 0.02, 0.075, -0.08, 0, { r: 0.004 });
  cyl(g, M.oak(), 0.018, 0.018, 0.1, 0.075, -0.17, 0, { rx: 1.5708 });
  cyl(g, M.oak(), 0.018, 0.018, 0.1, 0.075, -0.17, 0);
  box(g, M.steel(), 0.026, 0.026, 0.026, -0.075, 0, 0);
});

def('copper_wire', (g) => {
  const m = mat('copper', () => std(0xc4703a, 0.3, 0.95));
  for (let i = 0; i < 5; i++) tor(g, m, 0.06 - i * 0.003, 0.006, 0, i * 0.012, 0, { rx: Math.PI / 2, seg: 22 });
  cyl(g, m, 0.004, 0.004, 0.12, 0.06, 0.02, 0, { rz: 1.2 });
});

def('blown_fuse', (g, o = {}) => {
  const glass = mat('fuseglass', () => new THREE.MeshStandardMaterial({ color: o.fixed ? 0xcfe0e8 : 0x4a4640, roughness: 0.1, transparent: true, opacity: o.fixed ? 0.45 : 0.82 }));
  cyl(g, glass, 0.017, 0.017, 0.1, 0, 0, 0, { rz: 1.5708 });
  cyl(g, M.brass(), 0.019, 0.019, 0.025, -0.055, 0, 0, { rz: 1.5708 });
  cyl(g, M.brass(), 0.019, 0.019, 0.025, 0.055, 0, 0, { rz: 1.5708 });
  if (o.fixed) {
    const m = mat('copper', () => std(0xc4703a, 0.3, 0.95));
    for (let i = 0; i < 4; i++) tor(g, m, 0.012, 0.0035, -0.025 + i * 0.016, 0, 0, { ry: 1.5708, seg: 8 });
  }
});
def('fuse_fixed', (g) => ITEMS.blown_fuse(g, { fixed: true }));

def('compass', (g) => {
  const face = tex('compassface', 128, 128, (c, w, h) => {
    c.fillStyle = '#efe6cf';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#2a1a0c';
    c.lineWidth = 3;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU;
      c.beginPath();
      c.moveTo(64 + Math.sin(a) * (i % 8 ? 52 : 46), 64 - Math.cos(a) * (i % 8 ? 52 : 46));
      c.lineTo(64 + Math.sin(a) * 58, 64 - Math.cos(a) * 58);
      c.stroke();
    }
    c.fillStyle = '#9b1f16';
    c.beginPath();
    c.moveTo(64, 14);
    c.lineTo(72, 64);
    c.lineTo(56, 64);
    c.fill();
    c.fillStyle = '#2a1a0c';
    c.beginPath();
    c.moveTo(64, 114);
    c.lineTo(72, 64);
    c.lineTo(56, 64);
    c.fill();
    drawText(c, 'N', 64, 30, { size: 14, color: '#2a1a0c', weight: 700 });
  });
  const back = tex('compassback', 128, 128, (c, w, h) => {
    c.fillStyle = '#9a7630';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#4a3410';
    c.lineWidth = 3;
    c.strokeRect(10, 10, w - 20, h - 20);
    drawText(c, 'STATION', 64, 44, { size: 18, color: '#2b1c06', spacing: 3, font: FONT.ui });
    drawText(c, 'K N P', 64, 80, { size: 30, color: '#2b1c06', spacing: 3, font: FONT.serif });
  });
  cyl(g, M.brass(), 0.075, 0.075, 0.03, 0, 0.0, 0);
  cyl(g, mat('compassFaceM', () => std(0xffffff, 0.5, 0, { map: face })), 0.066, 0.066, 0.002, 0, 0.0155, 0, { cast: false });
  cyl(g, M.glass(), 0.068, 0.068, 0.004, 0, 0.022, 0, { cast: false });
  tor(g, M.brass(), 0.012, 0.005, 0, 0.022, -0.09, { rx: Math.PI / 2 });
  // the engraved back (visible when the item is turned over)
  cyl(g, mat('compassBackM', () => std(0xffffff, 0.4, 0.5, { map: back })), 0.066, 0.066, 0.002, 0, -0.0155, 0, { rx: Math.PI, cast: false });
  g.userData.backNormal = new THREE.Vector3(0, -1, 0);
});

def('gear', (g, o = {}) => {
  const teeth = o.teeth || 12;
  const r = o.r || 0.1;
  const m = o.mat || M.brass();
  cyl(g, m, r * 0.82, r * 0.82, 0.03, 0, 0, 0, { seg: 24 });
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    box(g, m, r * 0.3, 0.03, r * 0.26, Math.cos(a) * r * 0.92, 0, Math.sin(a) * r * 0.92, { ry: -a });
  }
  cyl(g, M.iron(), r * 0.2, r * 0.2, 0.036, 0, 0, 0, { seg: 12 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    cyl(g, M.black(), r * 0.14, r * 0.14, 0.034, Math.cos(a) * r * 0.5, 0, Math.sin(a) * r * 0.5, { seg: 10 });
  }
});
def('gear_large', (g) => ITEMS.gear(g, { teeth: 16, r: 0.13 }));
def('gear_mid', (g) => ITEMS.gear(g, { teeth: 12, r: 0.095, mat: mat('brassC', () => std(0xc19a4a, 0.4, 0.85)) }));
def('gear_small', (g) => ITEMS.gear(g, { teeth: 8, r: 0.062 }));

def('mantle', (g) => {
  const m = mat('mantleM', () => std(0xe9e4d4, 1, 0, { transparent: true, opacity: 0.95 }));
  sph(g, m, 0.045, 0, 0.05, 0, { sy: 1.4, sx: 0.9, sz: 0.9 });
  cyl(g, M.rope(), 0.02, 0.02, 0.025, 0, -0.005, 0);
  box(g, M.paper(), 0.12, 0.003, 0.08, 0, -0.03, 0);
});

def('fuel_can', (g, o = {}) => {
  const m = mat('fuelcan', () => std(0x4b6f4f, 0.55, 0.45));
  box(g, m, 0.16, 0.2, 0.08, 0, 0.1, 0, { r: 0.012 });
  cyl(g, M.iron(), 0.03, 0.03, 0.02, 0, 0.21, 0);
  box(g, M.iron(), 0.12, 0.02, 0.02, 0, 0.225, 0);
  cyl(g, M.steel(), 0.012, 0.012, 0.17, 0.09, 0.27, 0, { rz: -0.9 });
  box(g, M.painted(0xd9cba8), 0.1, 0.07, 0.002, 0, 0.1, 0.041);
  if (o.full) {
    cyl(g, mat('paraffin', () => new THREE.MeshBasicMaterial({ color: 0xe9d57a })), 0.006, 0.006, 0.01, 0.16, 0.34, 0);
  }
});
def('fuel_can_full', (g) => ITEMS.fuel_can(g, { full: true }));

// Builds an item model, standing roughly on y=0. Returns a group with userData.size.
export function buildItem(id, opts = {}) {
  const g = new THREE.Group();
  g.userData.isProp = true;
  const fn = ITEMS[id];
  if (fn) fn(g, opts);
  else box(g, M.paper(), 0.1, 0.1, 0.1);
  return g;
}
export const itemIds = () => Object.keys(ITEMS);
