// Canvas painters for things that are read in the world: clock faces, charts, paintings, tape. Pure drawing, no DOM at import.
import { MORSE } from '../engine/morse.js';
import { FONT, TAU, rngOf, drawText, paintPaper } from './gfx.js';
import { drawSymbol } from './symbols.js';

export function paintClockFace(ctx, w, h, { hour = 10, minute = 35, hands = false } = {}) {
  const c = w / 2;
  const R = w * 0.48;
  const g = ctx.createRadialGradient(c, c, R * 0.1, c, c, R);
  g.addColorStop(0, '#efe3c2');
  g.addColorStop(1, '#d6c597');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2a1a0c';
  ctx.lineWidth = w * 0.012;
  ctx.beginPath();
  ctx.arc(c, c, R * 0.9, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = w * 0.006;
  ctx.beginPath();
  ctx.arc(c, c, R * 0.74, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const long = i % 5 === 0;
    ctx.lineWidth = long ? w * 0.01 : w * 0.004;
    ctx.beginPath();
    ctx.moveTo(c + Math.sin(a) * R * (long ? 0.8 : 0.84), c - Math.cos(a) * R * (long ? 0.8 : 0.84));
    ctx.lineTo(c + Math.sin(a) * R * 0.9, c - Math.cos(a) * R * 0.9);
    ctx.stroke();
  }
  const roman = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    drawText(ctx, roman[i], c + Math.sin(a) * R * 0.62, c - Math.cos(a) * R * 0.62, { size: w * 0.105, weight: 700, color: '#2a1a0c' });
  }
  drawText(ctx, 'MARREN & SON', c, c - R * 0.28, { size: w * 0.04, weight: 600, color: '#5a3a22', spacing: 2 });
  if (hands) {
    const hr = ((hour % 12) + minute / 60) / 12;
    const mn = minute / 60;
    ctx.strokeStyle = '#1a1008';
    ctx.lineCap = 'round';
    ctx.lineWidth = w * 0.03;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.sin(hr * TAU) * R * 0.45, c - Math.cos(hr * TAU) * R * 0.45);
    ctx.stroke();
    ctx.lineWidth = w * 0.018;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.sin(mn * TAU) * R * 0.7, c - Math.cos(mn * TAU) * R * 0.7);
    ctx.stroke();
  }
}

export function paintPainting(ctx, w, h, kind) {
  const r = rngOf(kind === 'sea' ? 8 : 12);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, kind === 'sea' ? '#14233b' : '#0e1a2e');
  sky.addColorStop(1, kind === 'sea' ? '#6b6f78' : '#3a4a68');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // clouds
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(${150 + r() * 60},${150 + r() * 50},${160 + r() * 50},0.14)`;
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h * 0.45, 50 + r() * 90, 12 + r() * 20, 0, 0, TAU);
    ctx.fill();
  }
  const sea = ctx.createLinearGradient(0, h * 0.6, 0, h);
  sea.addColorStop(0, '#1d3b4a');
  sea.addColorStop(1, '#0a1a24');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.62, w, h);
  ctx.strokeStyle = 'rgba(230,240,245,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const x = r() * w;
    const y = h * 0.64 + r() * h * 0.34;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 14, y - 8, x + 30, y);
    ctx.stroke();
  }
  if (kind === 'sea') {
    // a brig under reefed sails
    const bx = w * 0.55;
    const by = h * 0.66;
    ctx.fillStyle = '#1a120c';
    ctx.beginPath();
    ctx.moveTo(bx - 70, by);
    ctx.lineTo(bx + 80, by - 6);
    ctx.lineTo(bx + 60, by + 24);
    ctx.lineTo(bx - 50, by + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(bx - 4, by - 120, 6, 120);
    ctx.fillRect(bx + 34, by - 96, 5, 96);
    ctx.fillStyle = '#d9cdb0';
    ctx.beginPath();
    ctx.moveTo(bx - 40, by - 110);
    ctx.lineTo(bx + 28, by - 104);
    ctx.lineTo(bx + 22, by - 40);
    ctx.lineTo(bx - 36, by - 36);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + 42, by - 90);
    ctx.lineTo(bx + 80, by - 84);
    ctx.lineTo(bx + 76, by - 36);
    ctx.lineTo(bx + 42, by - 34);
    ctx.fill();
  } else {
    // the tower and its dark lamp
    const tx = w * 0.5;
    ctx.fillStyle = '#0b0f17';
    ctx.beginPath();
    ctx.moveTo(tx - 46, h * 0.72);
    ctx.lineTo(tx - 22, h * 0.18);
    ctx.lineTo(tx + 22, h * 0.18);
    ctx.lineTo(tx + 46, h * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(tx - 34, h * 0.14, 68, 12);
    ctx.fillRect(tx - 18, h * 0.06, 36, 14);
    ctx.beginPath();
    ctx.moveTo(tx - 20, h * 0.06);
    ctx.lineTo(tx, h * 0.0);
    ctx.lineTo(tx + 20, h * 0.06);
    ctx.fill();
    ctx.fillStyle = '#3a4258';
    ctx.fillRect(tx - 12, h * 0.075, 24, 10);
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, h * 0.7, w, h * 0.06);
  }
  // varnish
  const v = ctx.createLinearGradient(0, 0, w, h);
  v.addColorStop(0, 'rgba(255,220,150,0.08)');
  v.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

export function paintCalendar(ctx, w, h) {
  paintPaper(ctx, w, h, [236, 226, 196]);
  ctx.fillStyle = '#7a2a22';
  ctx.fillRect(0, 0, w, h * 0.17);
  drawText(ctx, 'OCTOBER', w / 2, h * 0.09, { size: h * 0.1, color: '#f1e6c8', spacing: 3 });
  const cw = w / 7;
  const ch = (h * 0.8) / 6;
  for (let i = 0; i < 31; i++) {
    const col = (i + 3) % 7;
    const row = Math.floor((i + 3) / 7);
    const x = col * cw + cw / 2;
    const y = h * 0.2 + row * ch + ch / 2;
    drawText(ctx, String(i + 1), x, y, { size: ch * 0.55, weight: 600, color: '#2a1a0c', font: FONT.ui });
    if (i < 27) {
      ctx.strokeStyle = 'rgba(150,30,20,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - cw * 0.3, y - ch * 0.3);
      ctx.lineTo(x + cw * 0.3, y + ch * 0.3);
      ctx.stroke();
    }
  }
}

export function paintBarometer(ctx, w, h) {
  const c = w / 2;
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2a1a0c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.86, 0, TAU);
  ctx.stroke();
  const words = ['STORMY', 'RAIN', 'CHANGE', 'FAIR', 'VERY DRY'];
  words.forEach((t, i) => {
    const a = (-0.8 + (i / 4) * 1.6) * Math.PI * 0.8 - Math.PI / 2 + Math.PI * 0.0;
    drawText(ctx, t, c + Math.cos(a) * c * 0.6, c + Math.sin(a) * c * 0.6, { size: w * 0.07, weight: 700 });
  });
  ctx.strokeStyle = '#8c1c14';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c, c);
  const a = -Math.PI / 2 - 1.15;
  ctx.lineTo(c + Math.cos(a) * c * 0.7, c + Math.sin(a) * c * 0.7);
  ctx.stroke();
}

export function paintMorseChart(ctx, w, h) {
  paintPaper(ctx, w, h, [228, 214, 176]);
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  drawText(ctx, 'INTERNATIONAL MORSE', w / 2, h * 0.055, { size: h * 0.04, color: '#3a2410', spacing: 3 });
  const letters = Object.keys(MORSE);
  const cols = 2;
  const rows = 13;
  const top = h * 0.1;
  const rh = (h * 0.87) / rows;
  letters.forEach((L, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const x0 = (w / cols) * col + w * 0.07;
    const y = top + row * rh + rh / 2;
    drawText(ctx, L, x0 + w * 0.04, y, { size: rh * 0.78, color: '#2a1608', font: FONT.serif });
    let x = x0 + w * 0.15;
    ctx.fillStyle = '#2a1608';
    for (const ch of MORSE[L]) {
      if (ch === '.') {
        ctx.beginPath();
        ctx.arc(x + rh * 0.12, y, rh * 0.12, 0, TAU);
        ctx.fill();
        x += rh * 0.45;
      } else {
        ctx.beginPath();
        ctx.roundRect(x, y - rh * 0.1, rh * 0.62, rh * 0.2, rh * 0.1);
        ctx.fill();
        x += rh * 0.85;
      }
    }
  });
}

// Safe channel: legs of the track as arrows. Legs are 'U','R','U','L','U' from the anchor.
export function channelLegs() {
  return 'URULU';
}
export function paintChannelChart(ctx, w, h) {
  paintPaper(ctx, w, h, [214, 205, 170]);
  const r = rngOf(31);
  ctx.strokeStyle = 'rgba(70,90,110,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    const y = h * 0.12 + i * (h * 0.05);
    ctx.moveTo(w * 0.05, y);
    for (let x = w * 0.05; x < w * 0.95; x += 22) ctx.lineTo(x + 11, y + (r() - 0.5) * 5);
    ctx.stroke();
  }
  ctx.strokeStyle = '#2a1a0c';
  ctx.lineWidth = 7;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  drawText(ctx, 'THE TEETH  ·  SAFE CHANNEL', w / 2, h * 0.055, { size: h * 0.036, color: '#2a1a0c', spacing: 2 });
  // grid of channel cells
  const cell = Math.min(w * 0.19, h * 0.15);
  let x = w * 0.34;
  let y = h * 0.82;
  const pts = [[x, y]];
  for (const leg of channelLegs()) {
    if (leg === 'U') y -= cell * 1.15;
    if (leg === 'D') y += cell * 1.15;
    if (leg === 'R') x += cell * 1.15;
    if (leg === 'L') x -= cell * 1.15;
    pts.push([x, y]);
  }
  // rocks
  ctx.fillStyle = '#3b3128';
  const rocks = [[0.12, 0.7], [0.18, 0.45], [0.62, 0.8], [0.7, 0.55], [0.5, 0.32], [0.22, 0.24], [0.8, 0.3], [0.08, 0.9], [0.9, 0.78]];
  for (const [rx, ry] of rocks) {
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU;
      const rr = w * (0.028 + r() * 0.022);
      ctx.lineTo(rx * w + Math.cos(a) * rr, ry * h + Math.sin(a) * rr * 0.8);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,60,80,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // the track
  ctx.strokeStyle = '#9b1f16';
  ctx.fillStyle = '#9b1f16';
  ctx.lineWidth = 7;
  ctx.setLineDash([16, 10]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const ang = Math.atan2(by - ay, bx - ax);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -13);
    ctx.lineTo(-10, 13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  drawSymbol(ctx, 'anchor', pts[0][0], pts[0][1] + cell * 0.45, cell * 0.55, '#1c3550', 8);
  const e = pts[pts.length - 1];
  // the lighthouse at the end of the channel
  ctx.fillStyle = '#efe6cf';
  ctx.strokeStyle = '#2a1a0c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(e[0] - 14, e[1] - 6);
  ctx.lineTo(e[0] - 8, e[1] - 54);
  ctx.lineTo(e[0] + 8, e[1] - 54);
  ctx.lineTo(e[0] + 14, e[1] - 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9b1f16';
  ctx.fillRect(e[0] - 12, e[1] - 34, 24, 8);
  ctx.fillRect(e[0] - 10, e[1] - 62, 20, 9);
  // compass rose
  const cx = w * 0.86;
  const cy = h * 0.2;
  ctx.strokeStyle = '#2a1a0c';
  ctx.fillStyle = '#2a1a0c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 34);
  ctx.lineTo(cx + 8, cy);
  ctx.lineTo(cx, cy + 34);
  ctx.lineTo(cx - 8, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 34);
  ctx.lineTo(cx + 8, cy);
  ctx.lineTo(cx - 8, cy);
  ctx.closePath();
  ctx.fill();
  drawText(ctx, 'N', cx, cy - 46, { size: 26, color: '#2a1a0c' });
}

export function paintTape(ctx, w, h, word) {
  paintPaper(ctx, w, h, [238, 232, 210]);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 0; x < w; x += 24) ctx.fillRect(x, 0, 2, h);
  const letters = String(word).toUpperCase().split('');
  const slot = w / (letters.length + 0.5);
  letters.forEach((L, i) => {
    let x = slot * (i + 0.35);
    const y = h / 2;
    ctx.fillStyle = '#1b1208';
    for (const ch of MORSE[L] || '') {
      if (ch === '.') {
        ctx.beginPath();
        ctx.arc(x + h * 0.09, y, h * 0.09, 0, TAU);
        ctx.fill();
        x += h * 0.3;
      } else {
        ctx.beginPath();
        ctx.roundRect(x, y - h * 0.09, h * 0.42, h * 0.18, h * 0.09);
        ctx.fill();
        x += h * 0.58;
      }
    }
  });
}

export function paintPlaque(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#8a6a2e');
  g.addColorStop(0.5, '#b89448');
  g.addColorStop(1, '#7c5c24');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#4a3410';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  drawText(ctx, 'THIS LIGHT', w / 2, h * 0.24, { size: h * 0.16, color: '#2b1c06', spacing: 4 });
  drawText(ctx, 'FIRST SHONE IN THE YEAR', w / 2, h * 0.46, { size: h * 0.13, color: '#2b1c06', spacing: 3 });
  drawText(ctx, '1891', w / 2, h * 0.76, { size: h * 0.3, color: '#2b1c06', spacing: 6 });
}

export function paintPlate(ctx, w, h, sign) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, '#c9a24c');
  g.addColorStop(1, '#7a5a22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#4a3410';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  drawSymbol(ctx, sign, w / 2, h / 2, w * 0.62, '#2b1c06', 9);
  ctx.fillStyle = '#4a3410';
  for (const [x, y] of [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]]) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, TAU);
    ctx.fill();
  }
}

export function paintPlacard(ctx, w, h, text) {
  ctx.fillStyle = '#e6dcc0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#7a2a22';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  drawText(ctx, text, w / 2, h / 2, { size: h * 0.46, color: '#7a2a22', spacing: 3, font: FONT.ui });
}
