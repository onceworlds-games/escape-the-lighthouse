// Props for the radio room and the lamp room.
import { THREE, M, std, mat, tex, glow, box, cyl, sph, tor, lathe, plane, group, part, tween, ease, TAU, rad, FONT, drawText, rngOf, paintPaper } from './gfx.js';
import { def, OAK, DARK, PINE, GREY, stoneMat, paperTexMat } from './props_core.js';
import { buildItem } from './items.js';
import { paintClockFace, paintMorseChart, paintChannelChart, paintPlaque, paintPlate, paintPlacard, paintPainting } from './art.js';
import { drawSymbol } from './symbols.js';
import { slidingStart } from '../engine/locks.js';

const keep = (o) => ((o.userData.keep = true), o);
const paintMat = (c, r = 0.55, m = 0.2) => mat('pt' + c, () => std(c, r, m));

def('opdesk', (g, p) => {
  const w = p.w || 2.3;
  box(g, DARK(), w, 0.06, 0.78, 0, 0.78, 0, { r: 0.012 });
  box(g, mat('leatherTop', () => std(0x2f4a3a, 0.8)), w - 0.3, 0.01, 0.6, 0, 0.81, 0.02);
  for (const sx of [-1, 1]) box(g, OAK(), 0.06, 0.75, 0.72, sx * (w / 2 - 0.05), 0.375, 0, { r: 0.01 });
  box(g, OAK(), w - 0.1, 0.6, 0.04, 0, 0.45, -0.34);
  for (const k of [0, 1]) box(g, OAK(), 0.7, 0.17, 0.03, 0.55, 0.64 - k * 0.2, 0.37, { r: 0.006 });
  for (const k of [0, 1]) cyl(g, M.brass(), 0.012, 0.012, 0.03, 0.55, 0.64 - k * 0.2, 0.395, { rx: 1.5708, seg: 8 });
  const dr = part(g, 'drawer', 0, 0, 0);
  box(dr, OAK(), 0.7, 0.17, 0.03, 0.55, 0.64, 0.37, { r: 0.006 });
  g.children.forEach(() => {});
  g.userData.setState = (st, instant) => {
    const z = st.open ? 0.25 : 0;
    if (instant) dr.position.z = z;
    else tween(dr.position, { z }, 0.45, ease.out);
  };
  for (let i = 0; i < 6; i++) box(g, M.paper(), 0.14, 0.012, 0.18, -0.7 + i * 0.002, 0.82 + i * 0.012, 0.1, { ry: i * 0.1, cast: false });
});

def('radioset', (g) => {
  box(g, DARK(), 0.95, 0.62, 0.5, 0, 0.31, 0, { r: 0.02 });
  box(g, M.black(), 0.88, 0.5, 0.02, 0, 0.32, 0.255, { r: 0.006 });
  const live = mat('radioDial', () => std(0xd9c9a0, 0.5, 0.1, { emissive: 0x000000 }));
  const dialMat = [];
  for (const sx of [-1, 1]) {
    tor(g, M.brass(), 0.1, 0.014, sx * 0.29, 0.38, 0.27, { seg: 20 });
    const d = cyl(g, live, 0.098, 0.098, 0.012, sx * 0.29, 0.38, 0.265, { rx: 1.5708, seg: 20 });
    cyl(g, M.black(), 0.035, 0.04, 0.05, sx * 0.29, 0.38, 0.29, { rx: 1.5708, seg: 10 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      box(g, M.black(), 0.004, 0.02, 0.003, sx * 0.29 + Math.sin(a) * 0.078, 0.38 + Math.cos(a) * 0.078, 0.272, { rz: -a, cast: false });
    }
  }
  // speaker grille and meter
  box(g, mat('cloth', () => std(0x8a7350, 1)), 0.26, 0.26, 0.01, 0, 0.3, 0.27);
  for (let i = 0; i < 6; i++) box(g, M.brassDark(), 0.27, 0.01, 0.014, 0, 0.19 + i * 0.043, 0.272);
  cyl(g, live, 0.06, 0.06, 0.01, 0, 0.5, 0.268, { rx: 1.5708, seg: 18 });
  tor(g, M.brass(), 0.06, 0.008, 0, 0.5, 0.272, { seg: 18 });
  const needle = keep(box(g, M.black(), 0.003, 0.05, 0.003, 0, 0.5, 0.277, { cast: false }));
  // toggles
  for (let i = 0; i < 3; i++) {
    cyl(g, M.brass(), 0.01, 0.01, 0.05, -0.2 + i * 0.07, 0.12, 0.285, { rx: 1.2, seg: 6 });
    cyl(g, M.black(), 0.02, 0.02, 0.01, -0.2 + i * 0.07, 0.12, 0.262, { rx: 1.5708, seg: 8 });
  }
  // fuse holder (lower right) with a glass fuse when fitted
  box(g, M.brass(), 0.15, 0.17, 0.02, 0.33, 0.14, 0.27, { r: 0.004 });
  cyl(g, M.black(), 0.02, 0.02, 0.012, 0.33, 0.14, 0.285, { rx: 1.5708, seg: 8 });
  const fuse = keep(group(g, 0.33, 0.14, 0.3));
  const fg = buildItem('fuse_fixed');
  fg.rotation.z = Math.PI / 2;
  fg.scale.setScalar(0.8);
  fuse.add(fg);
  // the telegraph key on a base
  box(g, DARK(), 0.4, 0.04, 0.24, 0, 0.02, 0.38, { r: 0.008 });
  box(g, M.brass(), 0.2, 0.014, 0.05, 0, 0.05, 0.38);
  const arm = part(g, 'arm', 0.0, 0.07, 0.38);
  box(arm, M.brass(), 0.026, 0.014, 0.19, 0, 0.012, 0.0);
  cyl(arm, M.black(), 0.026, 0.022, 0.034, 0, 0.034, 0.08, { seg: 10 });
  // paper tape and its slot
  box(g, M.black(), 0.2, 0.025, 0.06, -0.3, 0.64, 0.14);
  const tape = keep(box(g, M.paper(), 0.07, 0.005, 0.22, -0.3, 0.62, 0.26, { rx: 0.5, cast: false }));
  const lamp = keep(sph(g, mat('radioLamp', () => new THREE.MeshBasicMaterial({ color: 0x2a4a38 })), 0.014, 0.0, 0.57, 0.272, { seg: 8, cast: false }));
  const eye = glow(g, 0x6fe0a8, 0.5, 0, 0.57, 0.3, 0);
  g.userData.setState = (st) => {
    fuse.visible = !!st.fuse;
    live.emissive.setHex(st.live ? 0x6a4a18 : 0x000000);
    lamp.material.color.setHex(st.live ? 0x6fe0a8 : 0x2a4a38);
    eye.material.opacity = st.live ? 0.7 : 0;
    tape.visible = !!st.live;
  };
  g.userData.update = (dt, t) => {
    needle.rotation.z = Math.sin(t * 1.7) * 0.2 - 0.3;
  };
});

def('logbook', (g) => {
  box(g, mat('logCover', () => std(0x5a2a22, 0.7)), 0.3, 0.045, 0.22, 0, 0.0225, 0, { r: 0.008, ry: 0.15 });
  box(g, M.paper(), 0.28, 0.03, 0.2, 0.005, 0.02, 0.0, { ry: 0.15, cast: false });
  box(g, M.brass(), 0.03, 0.047, 0.22, -0.13, 0.0235, 0.0, { ry: 0.15 });
});

def('headphones', (g) => {
  tor(g, M.black(), 0.09, 0.008, 0, 0.1, 0, { arc: Math.PI, seg: 14 });
  for (const sx of [-1, 1]) cyl(g, M.black(), 0.04, 0.04, 0.03, sx * 0.09, 0.03, 0, { rz: 1.5708, seg: 10 });
});

def('wallclock', (g, p) => {
  const r = p.r || 0.3;
  const face = paperTexMat('wc' + r, 256, 256, (c, w, h) => paintClockFace(c, w, h, { hands: true, hour: 3, minute: 50 }), 0.4);
  cyl(g, DARK(), r + 0.04, r + 0.04, 0.06, 0, 0, 0.03, { rx: 1.5708, seg: 28 });
  cyl(g, face, r, r, 0.004, 0, 0, 0.062, { rx: 1.5708, seg: 28, cast: false });
  tor(g, M.brass(), r + 0.02, 0.012, 0, 0, 0.062, { seg: 28 });
  for (const a of [0.8, 2.4, 3.9, 5.5]) cyl(g, M.steel(), 0.012, 0.012, 0.02, Math.sin(a) * (r + 0.03), Math.cos(a) * (r + 0.03), 0.065, { rx: 1.5708, seg: 6 });
});

def('cables', (g) => {
  const m = M.black();
  for (let i = 0; i < 3; i++) {
    const pts = [new THREE.Vector3(i * 0.05, 1.0, 0.03), new THREE.Vector3(i * 0.08 - 0.05, 0.5, 0.1), new THREE.Vector3(i * 0.1 - 0.15, 0.1, 0.08), new THREE.Vector3(-0.3 + i * 0.1, -0.3, 0.03)];
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 5, false);
    const mesh = new THREE.Mesh(geo, i === 1 ? mat('redwire', () => std(0x8a2a22, 0.6)) : m);
    mesh.castShadow = true;
    g.add(mesh);
  }
});

def('workbench', (g, p) => {
  const w = p.w || 2.5;
  box(g, OAK(), w, 0.09, 0.8, 0, 0.88, 0, { r: 0.012 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, DARK(), 0.1, 0.84, 0.1, sx * (w / 2 - 0.08), 0.42, sz * 0.32, { r: 0.012 });
  box(g, DARK(), w - 0.2, 0.05, 0.64, 0, 0.25, 0);
  box(g, DARK(), w - 0.2, 0.2, 0.04, 0, 0.74, -0.36);
  // drawer unit on the left
  box(g, DARK(), 0.7, 0.5, 0.7, -0.85, 0.55, 0, { r: 0.01 });
  for (const k of [0, 1]) {
    box(g, OAK(), 0.64, 0.22, 0.03, -0.85, 0.7 - k * 0.26, 0.37, { r: 0.006 });
    cyl(g, M.brass(), 0.012, 0.012, 0.04, -0.85, 0.7 - k * 0.26, 0.4, { rx: 1.5708, seg: 8 });
  }
  // clutter: hammer, jars, rag, oil can
  box(g, OAK(), 0.28, 0.025, 0.03, -0.1, 0.945, 0.2, { ry: 0.5 });
  box(g, M.iron(), 0.1, 0.05, 0.04, 0.0, 0.96, 0.15, { ry: 0.5 });
  for (let i = 0; i < 3; i++) {
    cyl(g, M.glass(), 0.035, 0.035, 0.09, -0.5 + i * 0.1, 0.99, -0.2, { seg: 8, cast: false });
    cyl(g, M.rust(), 0.036, 0.036, 0.015, -0.5 + i * 0.1, 1.04, -0.2, { seg: 8 });
  }
  box(g, M.cloth(0x8a6a4a), 0.2, 0.02, 0.15, 0.8, 0.94, 0.1, { r: 0.01, ry: 0.4 });
});

def('toolbox', (g) => {
  const red = paintMat(0xa8322a, 0.5, 0.3);
  box(g, red, 0.62, 0.22, 0.3, 0, 0.11, 0, { r: 0.015 });
  box(g, M.black(), 0.56, 0.02, 0.24, 0, 0.21, 0);
  const lid = part(g, 'lid', 0, 0.22, -0.15);
  box(lid, red, 0.64, 0.06, 0.32, 0, 0.03, 0.15, { r: 0.015 });
  tor(lid, M.steel(), 0.07, 0.01, 0, 0.08, 0.15, { arc: Math.PI, seg: 12 });
  const stencil = paperTexMat('stencil', 256, 64, (c, w, h) => {
    c.fillStyle = '#a8322a';
    c.fillRect(0, 0, w, h);
    drawText(c, 'STORM', w / 2, h / 2, { size: 46, color: '#e8dcc0', font: FONT.ui, spacing: 6 });
  });
  plane(lid, stencil, 0.4, 0.05, 0, 0.03, 0.312);
  box(g, M.steel(), 0.3, 0.1, 0.012, 0, 0.2, 0.156, { r: 0.004 });
  const cols = [0xe0b020, 0xc0392b, 0x2f6fb0, 0x3d9a5a];
  const shapes = ['circle', 'triangle', 'square', 'diamond'];
  const sy = paperTexMat('latchsyms', 256, 64, (c, w, h) => {
    c.fillStyle = '#a9b0b8';
    c.fillRect(0, 0, w, h);
    shapes.forEach((s, i) => drawSymbol(c, s, 32 + i * 64, 32, 40, '#'+cols[i].toString(16).padStart(6, '0'), 9, '#'+cols[i].toString(16).padStart(6, '0')));
  });
  plane(g, sy, 0.28, 0.07, 0, 0.2, 0.163);
  g.userData.setState = (st, instant) => {
    const a = st.open ? -1.9 : 0;
    if (instant) lid.rotation.x = a;
    else tween(lid.rotation, { x: a }, 0.7, ease.out);
  };
});

def('pennants', (g) => {
  const syms = [['circle', 0xe0b020, -0.95], ['triangle', 0xc0392b, -0.5], ['diamond', 0x3d9a5a, -0.05], ['square', 0x2f6fb0, 0.65], ['square', 0x2f6fb0, 1.05]];
  const rope = M.rope();
  for (let i = 0; i < 24; i++) {
    const x = -1.2 + (i / 23) * 2.4;
    box(g, rope, 0.12, 0.012, 0.012, x, 0.1 - Math.sin((i / 23) * Math.PI) * 0.1, 0, { cast: false });
  }
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');
  for (const [s, c, x] of syms) {
    const m = mat('flag' + s + c, () => new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, map: tex('flagT' + s + c, 128, 160, (ctx, w, h) => {
      ctx.fillStyle = hex(c);
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, 0, w, 12);
      drawSymbol(ctx, s, w / 2, h / 2 + 4, 76, '#f4ecd6', 9, '#f4ecd6');
    }) }));
    const f = plane(g, m, 0.36, 0.45, x, -0.18, 0.02, { cast: true });
    f.rotation.y = 0.06;
  }
  const pl = (txt, x) => plane(g, paperTexMat('plac' + txt, 160, 56, (c, w, h) => paintPlacard(c, w, h, txt)), 0.3, 0.1, x, 0.02, 0.03);
  pl('STORM', -0.5);
  pl('FAIR', 0.85);
  box(g, M.iron(), 0.04, 0.04, 0.04, -1.22, 0.1, 0);
  box(g, M.iron(), 0.04, 0.04, 0.04, 1.22, 0.1, 0);
});

def('pegboard', (g) => {
  const t = paperTexMat('pegT', 256, 256, (c, w, h) => {
    c.fillStyle = '#b79a6a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(60,40,20,0.4)';
    for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) {
      c.beginPath();
      c.arc(x, y, 2, 0, TAU);
      c.fill();
    }
    c.strokeStyle = '#2a1a0c';
    c.lineWidth = 4;
    c.strokeRect(30, 40, 24, 100);
    c.strokeRect(86, 30, 70, 20);
    c.beginPath();
    c.arc(200, 70, 22, 0, TAU);
    c.stroke();
    c.strokeRect(90, 120, 90, 14);
  });
  box(g, DARK(), 1.05, 1.0, 0.03, 0, 0, 0.015);
  plane(g, t, 1.0, 0.95, 0, 0, 0.031);
  box(g, OAK(), 0.04, 0.3, 0.04, -0.3, 0.1, 0.07, { r: 0.006 });
  box(g, M.iron(), 0.1, 0.06, 0.04, -0.3, 0.28, 0.07);
  box(g, M.steel(), 0.3, 0.03, 0.02, 0.05, -0.1, 0.06);
  tor(g, M.steel(), 0.06, 0.012, 0.3, 0.1, 0.06, { seg: 12 });
});

def('vise', (g) => {
  box(g, M.iron(), 0.2, 0.1, 0.16, 0, 0.05, 0, { r: 0.01 });
  box(g, M.iron(), 0.04, 0.14, 0.16, -0.06, 0.15, 0.02);
  box(g, M.iron(), 0.04, 0.14, 0.16, 0.06, 0.15, 0.02);
  cyl(g, M.steel(), 0.012, 0.012, 0.3, 0, 0.1, 0.18, { rx: 1.5708, seg: 6 });
  sph(g, M.iron(), 0.02, 0.0, 0.1, 0.34, { seg: 6 });
});

def('jerrycan', (g) => {
  const m = paintMat(0x5a6a3a, 0.55, 0.3);
  box(g, m, 0.34, 0.5, 0.16, 0, 0.25, 0, { r: 0.02 });
  box(g, M.iron(), 0.14, 0.04, 0.06, 0, 0.52, 0.0);
  cyl(g, M.iron(), 0.03, 0.03, 0.04, 0.1, 0.52, 0);
  box(g, m, 0.002, 0.2, 0.002, 0, 0.3, 0.081).visible = false;
  box(g, mat('xstamp', () => std(0x3b4a28, 0.6)), 0.2, 0.01, 0.002, 0, 0.3, 0.082, { rz: 0.8 });
  box(g, mat('xstamp', () => std(0x3b4a28, 0.6)), 0.2, 0.01, 0.002, 0, 0.3, 0.082, { rz: -0.8 });
});

def('dynamo', (g) => {
  box(g, M.iron(), 1.1, 0.12, 0.7, 0, 0.06, 0, { r: 0.01 });
  cyl(g, paintMat(0x2f4a45, 0.5, 0.5), 0.3, 0.3, 0.8, 0, 0.47, 0, { rz: 1.5708, seg: 20 });
  cyl(g, mat('coil', () => std(0xb06a38, 0.35, 0.9)), 0.24, 0.24, 0.1, 0.45, 0.47, 0, { rz: 1.5708, seg: 18 });
  for (let i = 0; i < 4; i++) tor(g, M.brassDark(), 0.3, 0.015, -0.3 + i * 0.2, 0.47, 0, { ry: 1.5708, seg: 20 });
  for (const sx of [-1, 1]) box(g, M.iron(), 0.1, 0.35, 0.5, sx * 0.4, 0.22, 0, { r: 0.01 });
  const wheel = part(g, 'wheel', -0.52, 0.47, 0.0);
  tor(wheel, M.iron(), 0.26, 0.03, 0, 0, 0, { ry: 1.5708, seg: 22 });
  for (let i = 0; i < 6; i++) box(wheel, M.iron(), 0.03, 0.5, 0.03, 0, 0, 0, { rx: (i / 6) * Math.PI });
  cyl(wheel, M.brass(), 0.05, 0.05, 0.08, 0, 0, 0, { rz: 1.5708, seg: 8 });
  box(wheel, M.steel(), 0.06, 0.04, 0.04, -0.06, 0, 0);
  box(g, M.black(), 0.16, 0.1, 0.02, 0.0, 0.7, 0.3);
  const lamp = keep(sph(g, mat('dynLamp', () => new THREE.MeshBasicMaterial({ color: 0x3a2a14 })), 0.025, 0.1, 0.7, 0.32, { seg: 8, cast: false }));
  let spin = 0;
  let run = false;
  g.userData.setState = (st) => {
    run = !!st.running;
    lamp.material.color.setHex(run ? 0xffc060 : 0x3a2a14);
  };
  g.userData.update = (dt) => {
    if (run) wheel.rotation.x += dt * 9;
  };
});

def('breakerbox', (g) => {
  box(g, paintMat(0x5a6168, 0.5, 0.5), 0.58, 0.74, 0.1, 0, 0, 0.05, { r: 0.01 });
  box(g, M.black(), 0.5, 0.66, 0.02, 0, 0, 0.1);
  const lbl = paperTexMat('breakLbl', 256, 64, (c, w, h) => {
    c.fillStyle = '#e6dcc0';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) drawText(c, String(i + 1), 21 + i * 43, 32, { size: 40, color: '#2a1a0c', font: FONT.ui });
  });
  plane(g, lbl, 0.46, 0.115, 0, 0.17, 0.112);
  const levers = [];
  const init = [1, 0, 1, 0, 0, 1];
  for (let i = 0; i < 6; i++) {
    const x = -0.215 + i * 0.086;
    box(g, M.steel(), 0.05, 0.16, 0.02, x, -0.04, 0.115);
    const lv = part(g, 'lv' + i, x, -0.04, 0.125);
    box(lv, M.black(), 0.026, 0.1, 0.026, 0, 0.0, 0.0);
    sph(lv, paintMat(0xc0392b), 0.022, 0, 0.055, 0, { seg: 8 });
    lv.rotation.x = init[i] ? -0.5 : 0.5;
    lv.userData.state = init[i];
    levers.push(lv);
  }
  const sol = [0, 1, 0, 1, 1, 0];
  g.userData.setState = (st, instant) => {
    levers.forEach((lv, i) => {
      const up = st.set ? sol[i] : init[i];
      const a = up ? -0.5 : 0.5;
      if (instant) lv.rotation.x = a;
      else tween(lv.rotation, { x: a }, 0.5, ease.out, i * 0.06);
    });
  };
  tor(g, M.brassDark(), 0.025, 0.006, 0.0, -0.3, 0.12, { seg: 8 });
});

def('barrel', (g, p) => {
  const h = p.small ? 0.6 : 1.0;
  const r = p.small ? 0.25 : 0.38;
  lathe(g, OAK(), [[0, 0], [r * 0.85, 0], [r, h * 0.5], [r * 0.85, h], [0, h]], 0, 0, 0, { seg: 16 });
  for (const y of [0.15, 0.4, 0.7, 0.9]) {
    const k = Math.sin((y / 1) * Math.PI) * 0.15 + 0.85;
    tor(g, M.iron(), r * (0.85 + 0.15 * Math.sin((y / h) * Math.PI)) + 0.005, 0.014, 0, y * h, 0, { rx: Math.PI / 2, seg: 18 });
  }
  cyl(g, M.brass(), 0.025, 0.025, 0.12, 0, h * 0.2, r + 0.03, { rx: 1.5708, seg: 8 });
  box(g, M.brass(), 0.02, 0.06, 0.02, 0, h * 0.2, r + 0.1);
});

def('pipes', (g) => {
  const m = M.iron();
  cyl(g, m, 0.05, 0.05, 2.4, -0.4, 0, 0.05, { rz: 1.5708, seg: 10 });
  cyl(g, m, 0.04, 0.04, 1.2, 0.5, -0.5, 0.05, { seg: 10 });
  cyl(g, m, 0.05, 0.05, 1.4, -1.0, -0.6, 0.05, { seg: 10 });
  tor(g, M.brass(), 0.07, 0.012, 0.2, 0, 0.1, { seg: 12 });
  for (const x of [-1.2, -0.4, 0.4, 1.0]) box(g, M.iron(), 0.04, 0.12, 0.04, x, 0, 0.0);
});

def('ropecoil', (g) => {
  for (let i = 0; i < 5; i++) tor(g, M.rope(), 0.25 - i * 0.015, 0.035, 0, 0.04 + i * 0.05, 0, { rx: Math.PI / 2, seg: 18 });
});

def('framedpic', (g) => {
  const grid = slidingStart(3, 11);
  const scramble = paperTexMat('slidingScr', 384, 384, (c, w, h) => {
    const img = document.createElement('canvas');
    img.width = 384;
    img.height = 384;
    paintPainting(img.getContext('2d'), 384, 384, 'tower');
    const cs = 128;
    grid.forEach((tile, pos) => {
      if (tile === 8) {
        c.fillStyle = '#120d08';
        c.fillRect((pos % 3) * cs, Math.floor(pos / 3) * cs, cs, cs);
        return;
      }
      c.drawImage(img, (tile % 3) * cs, Math.floor(tile / 3) * cs, cs, cs, (pos % 3) * cs, Math.floor(pos / 3) * cs, cs, cs);
    });
    c.strokeStyle = 'rgba(10,6,2,0.85)';
    c.lineWidth = 4;
    for (let i = 1; i < 3; i++) {
      c.beginPath();
      c.moveTo(i * cs, 0);
      c.lineTo(i * cs, h);
      c.moveTo(0, i * cs);
      c.lineTo(w, i * cs);
      c.stroke();
    }
  }, 0.5);
  const solved = paperTexMat('slidingSol', 384, 384, (c, w, h) => paintPainting(c, w, h, 'tower'), 0.5);
  box(g, DARK(), 1.0, 1.0, 0.02, 0, 0, 0.01);
  box(g, mat('cavity', () => std(0x0c0906, 1)), 0.8, 0.8, 0.05, 0, 0, 0.03);
  const door = part(g, 'door', -0.5, 0, 0.06);
  box(door, DARK(), 1.0, 1.0, 0.05, 0.5, 0, 0, { r: 0.008 });
  const face = keep(plane(door, scramble, 0.86, 0.86, 0.5, 0, 0.027));
  g.userData.setState = (st, instant) => {
    face.material = st.open ? solved : scramble;
    const a = st.open ? -1.9 : 0;
    if (instant) door.rotation.y = a;
    else tween(door.rotation, { y: a }, 0.9, ease.inOut, 0.3);
  };
});

def('charttable', (g, p) => {
  const w = p.w || 1.4;
  const top = group(g, 0, 0.8, 0, { rx: -0.1 });
  box(top, OAK(), w, 0.05, 0.85, 0, 0, 0, { r: 0.01 });
  box(top, M.paper(), 0.9, 0.006, 0.6, 0, 0.03, 0.0, { cast: false });
  box(g, DARK(), 0.04, 0.14, 0.04, 0.5, 0.88, 0.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, DARK(), 0.07, 0.78, 0.07, sx * (w / 2 - 0.06), 0.39, sz * 0.34, { r: 0.01 });
  box(g, DARK(), w - 0.1, 0.04, 0.6, 0, 0.3, 0);
  cyl(g, M.brass(), 0.008, 0.008, 0.2, 0.5, 0.86, 0.3, { rz: 1.4, seg: 6 });
  box(g, M.black(), 0.015, 0.012, 0.2, -0.55, 0.86, 0.15, { ry: 0.4 });
});

def('morseposter', (g) => {
  const t = paperTexMat('morsePoster', 512, 768, paintMorseChart);
  box(g, DARK(), 0.86, 1.14, 0.03, 0, 0, 0.015, { r: 0.006 });
  plane(g, t, 0.78, 1.06, 0, 0, 0.032);
});

def('gate', (g) => {
  const dark = mat('alcove', () => std(0x07090c, 1));
  box(g, dark, 1.0, 2.3, 0.04, 0, 1.15, -0.5);
  const st = stoneMat(4);
  for (let i = 0; i < 4; i++) box(g, st, 0.95, 0.18, 0.5 - i * 0.12, 0, 0.09 + i * 0.18, -0.25 - i * 0.06, { r: 0.004 });
  box(g, OAK(), 0.1, 2.35, 0.2, -0.54, 1.175, 0.0, { r: 0.01 });
  box(g, OAK(), 0.1, 2.35, 0.2, 0.54, 1.175, 0.0, { r: 0.01 });
  box(g, OAK(), 1.18, 0.1, 0.2, 0, 2.3, 0.0, { r: 0.01 });
  const leaf = part(g, 'leaf', -0.5, 0, 0.05);
  const iron = M.iron();
  box(leaf, iron, 0.04, 2.18, 0.04, 0.02, 1.1, 0);
  box(leaf, iron, 0.04, 2.18, 0.04, 1.0, 1.1, 0);
  for (let i = 0; i < 8; i++) box(leaf, iron, 0.02, 2.1, 0.02, 0.12 + i * 0.11, 1.1, 0);
  for (const y of [0.3, 1.1, 1.9]) box(leaf, iron, 1.0, 0.04, 0.03, 0.5, y, 0.005);
  const lockbox = group(leaf, 0.86, 1.1, 0.06);
  box(lockbox, M.brass(), 0.22, 0.1, 0.08, 0, 0, 0, { r: 0.012 });
  for (let i = 0; i < 5; i++) {
    cyl(lockbox, M.brassDark(), 0.017, 0.017, 0.03, -0.08 + i * 0.04, 0, 0.05, { rx: 1.5708, seg: 10 });
  }
  g.userData.setState = (st, instant) => {
    const a = st.open ? 1.7 : 0;
    if (instant) leaf.rotation.y = a;
    else tween(leaf.rotation, { y: a }, 1.2, ease.inOut);
  };
});

def('globe', (g) => {
  cyl(g, DARK(), 0.18, 0.2, 0.04, 0, 0.02, 0, { seg: 12 });
  cyl(g, DARK(), 0.03, 0.03, 0.6, 0, 0.32, 0, { seg: 6 });
  const s = sph(g, mat('globeM', () => std(0x4f6f7a, 0.5, 0.2)), 0.22, 0, 0.9, 0, { seg: 16 });
  tor(g, M.brass(), 0.25, 0.012, 0, 0.9, 0, { ry: 0.3, seg: 24 });
  sph(g, mat('land', () => std(0x7a8a5a, 0.8)), 0.1, 0.12, 0.95, 0.12, { seg: 8, sx: 1, sy: 0.6 });
});

// ---- the lamp room ----
def('lampbase', (g) => {
  const iron = M.iron();
  const brass = M.brass();
  cyl(g, paintMat(0x2a2d33, 0.5, 0.6), 0.78, 0.82, 0.8, 0, 0.4, 0, { seg: 24 });
  tor(g, brass, 0.8, 0.03, 0, 0.8, 0, { rx: Math.PI / 2, seg: 28 });
  tor(g, brass, 0.82, 0.025, 0, 0.05, 0, { rx: Math.PI / 2, seg: 28 });
  // the case at the front
  box(g, M.black(), 0.7, 0.55, 0.06, 0, 0.42, 0.74);
  const gears = keep(group(g, 0, 0.42, 0.74));
  const gl = buildItem('gear_large');
  const gm = buildItem('gear_mid');
  const gs = buildItem('gear_small');
  for (const [o, x, y] of [[gl, -0.17, 0.0], [gm, 0.05, 0.08], [gs, 0.22, -0.04]]) {
    o.rotation.x = Math.PI / 2;
    o.position.set(x, y, 0.06);
    gears.add(o);
  }
  gears.visible = false;
  const door = part(g, 'door', -0.36, 0, 0.82);
  box(door, paintMat(0x3a3d44, 0.45, 0.6), 0.72, 0.56, 0.04, 0.36, 0.42, 0.0, { r: 0.008 });
  const catchPlate = box(door, brass, 0.2, 0.2, 0.014, 0.36, 0.42, 0.03, { r: 0.006 });
  for (const [dx, dy, rz] of [[0, 0.06, 0], [0.06, 0, -1.5708], [0, -0.06, Math.PI], [-0.06, 0, 1.5708]]) {
    const a = box(door, iron, 0.012, 0.05, 0.004, 0.36 + dx, 0.42 + dy, 0.04, { rz });
  }
  // winding socket
  box(g, brass, 0.1, 0.1, 0.03, 0.55, 0.42, 0.78, { r: 0.006 });
  box(g, M.black(), 0.04, 0.04, 0.034, 0.55, 0.42, 0.79);
  // the burner, tank and lens
  cyl(g, brass, 0.2, 0.26, 0.2, 0, 0.9, 0, { seg: 14 });
  const tank = keep(cyl(g, mat('paraffinTank', () => std(0x6a4a14, 0.4, 0.8)), 0.17, 0.17, 0.14, 0, 1.08, 0, { seg: 14 }));
  const col = cyl(g, brass, 0.05, 0.05, 0.3, 0, 1.3, 0, { seg: 10 });
  const mantleM = keep(sph(g, mat('mantleGlow', () => new THREE.MeshBasicMaterial({ color: 0x8a8576 })), 0.1, 0, 1.5, 0, { sy: 1.5, seg: 10, cast: false }));
  mantleM.visible = false;
  const flash = glow(g, 0xfff0c0, 2.6, 0, 1.5, 0, 0);
  const lens = keep(group(g, 0, 1.5, 0));
  const glass = mat('lensGlass', () => new THREE.MeshStandardMaterial({ color: 0xbfe0dc, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }));
  for (let i = 0; i < 9; i++) {
    const y = -0.5 + i * 0.125;
    const rr = 0.62 - Math.abs(i - 4) * 0.045;
    tor(lens, glass, rr, 0.055, 0, y, 0, { rx: Math.PI / 2, seg: 24, cast: false });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    cyl(lens, brass, 0.014, 0.014, 1.2, Math.sin(a) * 0.64, 0.05, Math.cos(a) * 0.64, { seg: 5 });
  }
  tor(lens, brass, 0.64, 0.03, 0, 0.62, 0, { rx: Math.PI / 2, seg: 24 });
  tor(lens, brass, 0.64, 0.03, 0, -0.58, 0, { rx: Math.PI / 2, seg: 24 });
  // three focusing rings above the lens
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = tor(g, brass, 0.72 - i * 0.14, 0.022, 0, 2.2 + i * 0.07, 0, { rx: Math.PI / 2, seg: 28 });
    keep(r);
    rings.push(r);
  }
  cyl(g, brass, 0.06, 0.1, 0.25, 0, 2.5, 0, { seg: 10 });
  const beamGlow = glow(g, 0xfff4cc, 7, 0, 1.5, 0, 0);
  let wound = false;
  let lit = false;
  let beam = false;
  let focused = false;
  g.userData.setState = (st, instant) => {
    gears.visible = !!st.geared;
    mantleM.visible = !!st.mantle;
    mantleM.material.color.setHex(st.lit ? 0xfff3c8 : 0x8a8576);
    flash.material.opacity = st.lit ? 0.45 : 0;
    tank.material.color.setHex(st.tank ? 0xd9a52a : 0x6a4a14);
    const a = st.open ? -1.8 : 0;
    if (instant) door.rotation.y = a;
    else tween(door.rotation, { y: a }, 0.9, ease.inOut);
    wound = !!st.wound;
    lit = !!st.lit;
    beam = !!st.beam;
    focused = !!st.focused;
    rings.forEach((r, i) => r.material === brass ? 0 : 0);
    beamGlow.material.opacity = beam ? 0.5 : 0;
  };
  g.userData.update = (dt, t) => {
    if (wound) {
      lens.rotation.y += dt * (beam ? 1.3 : 0.45);
      gears.children.forEach((c, i) => (c.rotation.y += dt * (i % 2 ? -1.6 : 1.2)));
    }
    rings.forEach((r, i) => (r.rotation.z = focused ? 0 : Math.sin(t * 0.6 + i) * 0.01));
  };
});

def('lever', (g) => {
  box(g, M.iron(), 0.22, 0.16, 0.16, 0, 0.08, 0, { r: 0.01 });
  box(g, M.brassDark(), 0.1, 0.02, 0.2, 0, 0.17, 0);
  const arm = part(g, 'arm', 0, 0.2, 0);
  cyl(arm, M.brass(), 0.014, 0.014, 0.55, 0, 0.27, 0, { seg: 8 });
  sph(arm, paintMat(0xa81810), 0.045, 0, 0.56, 0, { seg: 10 });
  arm.rotation.x = -0.6;
  g.userData.setState = (st, instant) => {
    const a = st.down ? 0.7 : -0.6;
    if (instant) arm.rotation.x = a;
    else tween(arm.rotation, { x: a }, 0.7, ease.out);
  };
});

def('floorhatch', (g) => {
  box(g, M.iron(), 0.9, 0.04, 0.9, 0, 0.02, 0, { r: 0.006 });
  tor(g, M.brass(), 0.06, 0.012, 0, 0.05, 0.3, { rx: Math.PI / 2, seg: 10 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) sph(g, M.brass(), 0.018, sx * 0.4, 0.045, sz * 0.4, { seg: 6 });
});

def('plaque', (g) => {
  const t = paperTexMat('plaqueT', 384, 256, paintPlaque, 0.4);
  box(g, DARK(), 0.56, 0.4, 0.04, 0, 0, 0.02, { r: 0.006 });
  plane(g, t, 0.5, 0.34, 0, 0, 0.042);
});

def('plate', (g, p) => {
  const t = paperTexMat('plate' + p.sign, 256, 256, (c, w, h) => paintPlate(c, w, h, p.sign), 0.4);
  box(g, M.brassDark(), 0.4, 0.4, 0.03, 0, 0, 0.015, { r: 0.006 });
  plane(g, t, 0.38, 0.38, 0, 0, 0.032);
});

def('telescope', (g) => {
  for (let i = 0; i < 3; i++) cyl(g, M.iron(), 0.014, 0.018, 1.25, Math.sin((i / 3) * TAU) * 0.25, 0.62, Math.cos((i / 3) * TAU) * 0.25, { rx: -Math.cos((i / 3) * TAU) * 0.2, rz: Math.sin((i / 3) * TAU) * 0.2, seg: 6 });
  const tube = group(g, 0, 1.28, 0, { rx: 0.18 });
  cyl(tube, M.brass(), 0.05, 0.06, 0.9, 0, 0, 0.1, { rx: 1.5708, seg: 14 });
  cyl(tube, M.brassDark(), 0.065, 0.065, 0.12, 0, 0, 0.5, { rx: 1.5708, seg: 14 });
  cyl(tube, M.leather(), 0.05, 0.05, 0.3, 0, 0, 0.02, { rx: 1.5708, seg: 12 });
  sph(tube, M.black(), 0.03, 0, 0, -0.38, { seg: 8 });
});

def('gallerydoor', (g) => {
  const iron = mat('lampIron', () => std(0x1d2024, 0.5, 0.7));
  box(g, iron, 0.06, 2.1, 0.1, -0.45, 1.05, 0.02);
  box(g, iron, 0.06, 2.1, 0.1, 0.45, 1.05, 0.02);
  box(g, iron, 0.96, 0.06, 0.1, 0, 2.1, 0.02);
  box(g, mat('doorGlass', () => new THREE.MeshStandardMaterial({ color: 0x1a2634, roughness: 0.1, transparent: true, opacity: 0.55 })), 0.84, 2.04, 0.02, 0, 1.03, 0.02);
  box(g, iron, 0.03, 2.04, 0.03, 0, 1.03, 0.04);
  box(g, iron, 0.84, 0.03, 0.03, 0, 1.03, 0.04);
  sph(g, M.brass(), 0.03, 0.3, 1.0, 0.07, { seg: 8 });
});

def('cabinet', (g) => {
  box(g, OAK(), 1.1, 1.85, 0.5, 0, 0.925, 0, { r: 0.012 });
  box(g, M.black(), 0.96, 1.7, 0.04, 0, 0.95, 0.2);
  for (let i = 0; i < 4; i++) box(g, DARK(), 0.96, 0.03, 0.44, 0, 0.45 + i * 0.4, 0.0);
  const L = part(g, 'dl', -0.55, 0, 0.26);
  const R = part(g, 'dr', 0.55, 0, 0.26);
  box(L, OAK(), 0.54, 1.8, 0.04, 0.27, 0.925, 0, { r: 0.008 });
  box(R, OAK(), 0.54, 1.8, 0.04, -0.27, 0.925, 0, { r: 0.008 });
  box(L, DARK(), 0.4, 0.7, 0.01, 0.27, 1.2, 0.025);
  box(R, DARK(), 0.4, 0.7, 0.01, -0.27, 1.2, 0.025);
  // keypad box on the right door
  box(R, M.brassDark(), 0.2, 0.26, 0.03, -0.1, 1.15, 0.03, { r: 0.006 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) cyl(R, M.black(), 0.02, 0.02, 0.015, -0.16 + c * 0.06, 1.24 - r * 0.055, 0.05, { rx: 1.5708, seg: 8 });
  const lamp = keep(sph(R, mat('keypadLamp', () => new THREE.MeshBasicMaterial({ color: 0x7a2018 })), 0.012, -0.1, 1.29, 0.05, { seg: 6, cast: false }));
  g.userData.setState = (st, instant) => {
    lamp.material.color.setHex(st.open ? 0x4fe08a : 0x7a2018);
    const a = st.open ? 1.9 : 0;
    if (instant) {
      L.rotation.y = -a;
      R.rotation.y = a;
    } else {
      tween(L.rotation, { y: -a }, 0.9, ease.out);
      tween(R.rotation, { y: a }, 0.9, ease.out);
    }
  };
});

def('tag', (g) => {
  box(g, M.paper(), 0.14, 0.2, 0.006, 0, -0.1, 0, { ry: 0.1, rz: 0.08, cast: false });
  cyl(g, M.rope(), 0.002, 0.002, 0.14, 0, 0.0, 0, { seg: 3 });
});

def('channelchart', (g) => {
  const t = paperTexMat('channelT', 512, 640, paintChannelChart);
  box(g, DARK(), 0.82, 1.02, 0.04, 0, 0, 0.02, { r: 0.008 });
  plane(g, t, 0.74, 0.94, 0, 0, 0.042);
});
