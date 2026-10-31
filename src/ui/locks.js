// Lock panels: each draws its own mechanism. ctx.submit(input) asks the engine; true means it opened.
import { SYMBOLS } from '../render/symbols.js';
import { encodeMorse, MORSE } from '../engine/morse.js';
import { slidingStart, slidingMove } from '../engine/locks.js';
import { paintPainting } from '../render/art.js';
import { drawSymbol } from '../render/symbols.js';

const h = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
const chev = (up) => `<svg viewBox="0 0 24 24"><path d="${up ? 'M5 15l7-7 7 7' : 'M5 9l7 7 7-7'}"/></svg>`;
const sym = (name, color = '#f0d79a', fill = 'none', w = 7) => `<svg viewBox="0 0 100 100" fill="${fill}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${SYMBOLS[name]}"/></svg>`;
const SW = (n) => ['top:8px;left:8px', 'top:8px;right:8px', 'bottom:8px;left:8px', 'bottom:8px;right:8px'].map((p) => `<i class="screw" style="${p}"></i>`).join('');

function plate(title) {
  const p = h('div', 'plate', `${SW()}<h3>${title || ''}</h3>`);
  return p;
}
async function attempt(ctx, input, plateEl) {
  const ok = await ctx.submit(input);
  if (!ok) {
    ctx.sound('buzz');
    plateEl.classList.remove('shake');
    void plateEl.offsetWidth;
    plateEl.classList.add('shake');
  } else {
    plateEl.classList.add('ok');
  }
  return ok;
}

// ---- wheels: digits, letters ----
function wheelsLock(ctx, faces, n, cls) {
  const p = plate(ctx.lock.title);
  const row = h('div', 'wheels');
  const pos = (ctx.saved && Array.isArray(ctx.saved) && ctx.saved.length === n ? ctx.saved : Array(n).fill(0)).map((v) => v | 0);
  const els = [];
  const draw = () =>
    els.forEach((e, i) => {
      const L = faces.length;
      e.up.textContent = faces[(pos[i] + L - 1) % L];
      e.mid.textContent = faces[pos[i]];
      e.dn.textContent = faces[(pos[i] + 1) % L];
    });
  let timer = null;
  const touched = new Set();
  const check = () => {
    clearTimeout(timer);
    // a dial opens as soon as it is right; a wrong set only buzzes once every wheel has been turned and you stop
    timer = setTimeout(() => {
      const code = pos.map((v) => faces[v]).join('');
      if (code === String(ctx.lock.solution).toUpperCase() || touched.size >= n) attempt(ctx, code, p);
    }, 1000);
  };
  const step = (i, d) => {
    touched.add(i);
    pos[i] = (pos[i] + d + faces.length) % faces.length;
    ctx.sound('tick');
    ctx.save(pos.slice());
    draw();
    check();
  };
  for (let i = 0; i < n; i++) {
    const w = h('div', 'wheel ' + (cls || ''));
    const up = h('button', '', chev(true));
    const win = h('div', 'win', '<span class="up"></span><span class="mid"></span><span class="dn"></span>');
    const dn = h('button', '', chev(false));
    up.setAttribute('aria-label', 'Up');
    dn.setAttribute('aria-label', 'Down');
    up.onclick = () => step(i, -1);
    dn.onclick = () => step(i, 1);
    let y0 = null;
    win.onpointerdown = (e) => {
      y0 = e.clientY;
      win.setPointerCapture(e.pointerId);
    };
    win.onpointermove = (e) => {
      if (y0 == null) return;
      if (Math.abs(e.clientY - y0) > 24) {
        step(i, e.clientY < y0 ? 1 : -1);
        y0 = e.clientY;
      }
    };
    win.onpointerup = () => (y0 = null);
    win.onwheel = (e) => {
      e.preventDefault();
      step(i, e.deltaY > 0 ? 1 : -1);
    };
    w.append(up, win, dn);
    row.append(w);
    els.push({ up: win.children[0], mid: win.children[1], dn: win.children[2] });
  }
  p.append(row);
  draw();
  return { el: p, destroy: () => clearTimeout(timer) };
}

function keypadLock(ctx) {
  const p = plate(ctx.lock.title);
  const lcd = h('div', 'lcd', '');
  const max = ctx.lock.max || 4;
  let v = '';
  const draw = () => (lcd.textContent = v.padEnd(max, '_'));
  const grid = h('div', 'keypad');
  const add = (label, fn, cls) => {
    const b = h('button', cls || '', label);
    b.onclick = () => {
      ctx.sound('click');
      fn();
    };
    grid.append(b);
  };
  for (const d of '123456789') add(d, () => v.length < max && ((v += d), draw()));
  add('CLR', () => ((v = ''), draw()), 'fn');
  add('0', () => v.length < max && ((v += '0'), draw()));
  add('ENT', async () => {
    const ok = await attempt(ctx, v, p);
    if (!ok) {
      v = '';
      draw();
    }
  }, 'fn');
  p.append(lcd, grid);
  draw();
  return { el: p };
}

function arrowsLock(ctx) {
  const p = plate(ctx.lock.title);
  const n = ctx.lock.solution.length;
  const pips = h('div', 'pips', '<i></i>'.repeat(n));
  const grid = h('div', 'arrows');
  let v = '';
  const dirs = { U: [1, 0, 'M12 19V5M5 12l7-7 7 7'], L: [0, 1, 'M19 12H5M12 5l-7 7 7 7'], R: [2, 1, 'M5 12h14M12 5l7 7-7 7'], D: [1, 2, 'M12 5v14M5 12l7 7 7-7'] };
  for (const [k, [c, r, d]] of Object.entries(dirs)) {
    const b = h('button', '', `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`);
    b.style.gridColumn = c + 1;
    b.style.gridRow = r + 1;
    b.setAttribute('aria-label', k);
    b.onclick = async () => {
      ctx.sound('click');
      v += k;
      [...pips.children].forEach((e, i) => e.classList.toggle('on', i < v.length));
      if (v.length >= n) {
        const cur = v;
        v = '';
        setTimeout(async () => {
          const ok = await attempt(ctx, cur, p);
          if (!ok) [...pips.children].forEach((e) => e.classList.remove('on'));
        }, 280);
      }
    };
    grid.append(b);
  }
  p.append(pips, grid);
  return { el: p };
}

function symbolsLock(ctx) {
  const p = plate(ctx.lock.title);
  const n = ctx.lock.solution.length;
  const row = h('div', 'slotsel', '<div class="pip"></div>'.repeat(n));
  const btns = h('div', 'symrow');
  let v = [];
  const draw = () => [...row.children].forEach((e, i) => (e.innerHTML = v[i] ? sym(v[i], ctx.lock.symbols.find((s) => s.id === v[i]).color, ctx.lock.symbols.find((s) => s.id === v[i]).color) : ''));
  for (const s of ctx.lock.symbols) {
    const b = h('button', '', sym(s.id, s.color, s.color));
    b.setAttribute('aria-label', s.id);
    b.onclick = () => {
      ctx.sound('click');
      v.push(s.id);
      draw();
      if (v.length >= n) {
        const cur = v.slice();
        setTimeout(async () => {
          const ok = await attempt(ctx, cur, p);
          v = [];
          if (!ok) draw();
        }, 320);
      }
    };
    btns.append(b);
  }
  p.append(row, btns);
  return { el: p };
}

function switchesLock(ctx) {
  const p = plate(ctx.lock.title);
  const st = Array.isArray(ctx.saved) && ctx.saved.length === ctx.lock.labels.length ? ctx.saved.slice() : ctx.lock.init.slice();
  const row = h('div', 'switches');
  const lampEl = h('div', 'hintline', '<span class="lamp"></span>RADIO CIRCUIT');
  const els = ctx.lock.labels.map((lb, i) => {
    const s = h('div', 'sw', `<b>${lb}</b><div class="track"><div class="lever"></div></div><i>${'OFF'}</i>`);
    s.onclick = async () => {
      st[i] = st[i] ? 0 : 1;
      ctx.sound('click');
      ctx.save(st.slice());
      draw();
      if (st.every((v, k) => v === ctx.lock.solution[k])) setTimeout(() => attempt(ctx, st.slice(), p), 400);
    };
    row.append(s);
    return s;
  });
  const draw = () => els.forEach((s, i) => {
    s.className = 'sw ' + (st[i] ? 'up' : 'down');
    s.querySelector('i').textContent = st[i] ? 'ON' : 'OFF';
  });
  draw();
  p.append(row, lampEl);
  return { el: p };
}

function morseLock(ctx) {
  const p = plate(ctx.lock.title);
  p.classList.add('morse');
  const tape = h('div', 'tape', '');
  const key = h('button', 'key', 'KEY');
  let seq = '';
  const draw = () => (tape.textContent = seq.replace(/\./g, '•').replace(/-/g, '—').replace(/\//g, '  ') || ' ');
  let t0 = 0;
  const down = (e) => {
    e.preventDefault();
    if (t0) return;
    t0 = performance.now();
    key.classList.add('down');
    ctx.sound('morseTone', true);
  };
  const up = (e) => {
    if (!t0) return;
    const d = performance.now() - t0;
    t0 = 0;
    key.classList.remove('down');
    ctx.sound('morseTone', false);
    seq += d < 240 ? '.' : '-';
    draw();
  };
  key.onpointerdown = down;
  key.onpointerup = up;
  key.onpointercancel = up;
  key.onpointerleave = up;
  key.onkeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (!e.repeat) down(e);
    }
  };
  key.onkeyup = (e) => {
    if (e.key === ' ' || e.key === 'Enter') up(e);
  };
  const btns = h('div', 'btns');
  const mk = (label, fn, cls) => {
    const b = h('button', cls || '', label);
    b.onclick = () => {
      ctx.sound('click');
      fn();
    };
    btns.append(b);
  };
  mk('DOT', () => ((seq += '.'), draw()));
  mk('DASH', () => ((seq += '-'), draw()));
  mk('GAP', () => seq && !seq.endsWith('/') && ((seq += '/'), draw()));
  mk('CLEAR', () => ((seq = ''), draw()));
  mk('SEND', async () => {
    const ok = await attempt(ctx, seq.replace(/\/$/, ''), p);
    if (!ok) {
      seq = '';
      draw();
    }
  }, 'go');
  p.append(tape, key, btns);
  draw();
  return { el: p, destroy: () => ctx.sound('morseTone', false) };
}

function slidingLock(ctx) {
  const n = ctx.lock.size;
  const p = plate(ctx.lock.title);
  let tiles = Array.isArray(ctx.saved) && ctx.saved.length === n * n ? ctx.saved.slice() : slidingStart(n, ctx.lock.seed);
  const size = Math.min(320, innerWidth - 90, innerHeight - 230);
  const grid = h('div', 'tiles');
  grid.style.cssText = `width:${size}px;height:${size}px;grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr)`;
  const img = document.createElement('canvas');
  img.width = img.height = 384;
  paintPainting(img.getContext('2d'), 384, 384, 'tower');
  const draw = () => {
    grid.innerHTML = '';
    tiles.forEach((t, i) => {
      const b = h('button', t === n * n - 1 ? 'blank' : '');
      if (t !== n * n - 1) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const cs = 384 / n;
        c.getContext('2d').drawImage(img, (t % n) * cs, Math.floor(t / n) * cs, cs, cs, 0, 0, 128, 128);
        b.append(c);
      }
      b.onclick = async () => {
        const next = slidingMove(tiles, n, i);
        if (!next) return ctx.sound('reject');
        ctx.sound('tick');
        tiles = next;
        ctx.save(tiles.slice());
        draw();
        if (tiles.every((v, k) => v === k)) setTimeout(() => attempt(ctx, tiles.slice(), p), 300);
      };
      grid.append(b);
    });
  };
  draw();
  p.append(grid);
  return { el: p };
}

function revealLock(ctx) {
  const p = plate(ctx.lock.title);
  p.classList.add('reveal');
  const W = Math.min(340, innerWidth - 90);
  const H = Math.round(W * 0.72);
  const cv = document.createElement('canvas');
  cv.width = W * 2;
  cv.height = H * 2;
  cv.style.cssText = `width:${W}px;height:${H}px`;
  const g = cv.getContext('2d');
  const paper = document.createElement('canvas');
  paper.width = cv.width;
  paper.height = cv.height;
  const pg = paper.getContext('2d');
  pg.fillStyle = '#e1d3ae';
  pg.fillRect(0, 0, paper.width, paper.height);
  const ink = document.createElement('canvas');
  ink.width = cv.width;
  ink.height = cv.height;
  const ig = ink.getContext('2d');
  ig.fillStyle = '#5a2fb8';
  ig.textAlign = 'center';
  ig.font = `700 ${cv.height * 0.12}px Caveat, cursive`;
  const lines = ['BREAKER SCHEDULE', 'RADIO: 2, 4, 5', 'LAMP: 1, 3, 6', 'never both together', 'rest OFF'];
  lines.forEach((l, i) => ig.fillText(l, cv.width / 2, cv.height * (0.2 + i * 0.17)));
  const mask = document.createElement('canvas');
  mask.width = cv.width;
  mask.height = cv.height;
  const mg = mask.getContext('2d');
  let done = false;
  let covered = new Set();
  const compose = (x, y) => {
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(paper, 0, 0);
    const t = document.createElement('canvas');
    t.width = cv.width;
    t.height = cv.height;
    const tg = t.getContext('2d');
    tg.drawImage(ink, 0, 0);
    tg.globalCompositeOperation = 'destination-in';
    tg.drawImage(mask, 0, 0);
    g.drawImage(t, 0, 0);
    if (x != null) {
      const gr = g.createRadialGradient(x, y, 0, x, y, 90);
      gr.addColorStop(0, 'rgba(150,100,255,0.55)');
      gr.addColorStop(1, 'rgba(150,100,255,0)');
      g.fillStyle = gr;
      g.fillRect(x - 90, y - 90, 180, 180);
    }
  };
  compose();
  const move = (e) => {
    if (done) return;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * cv.width;
    const y = ((e.clientY - r.top) / r.height) * cv.height;
    const gr = mg.createRadialGradient(x, y, 0, x, y, 70);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    mg.fillStyle = gr;
    mg.fillRect(x - 70, y - 70, 140, 140);
    covered.add(Math.floor(x / 40) + ',' + Math.floor(y / 40));
    compose(x, y);
    const cells = (cv.width / 40) * (cv.height / 40);
    if (covered.size > cells * 0.2 && !done) {
      done = true;
      setTimeout(() => attempt(ctx, true, p), 500);
    }
  };
  cv.onpointerdown = (e) => {
    cv.setPointerCapture(e.pointerId);
    cv.dragging = true;
    move(e);
  };
  cv.onpointermove = (e) => (cv.dragging || e.pointerType === 'mouse') && move(e);
  cv.onpointerup = () => (cv.dragging = false);
  p.append(cv, h('div', 'hintline', 'Sweep the torch across the paper'));
  return { el: p };
}

function ringsLock(ctx) {
  const L = ctx.lock;
  const p = plate(L.title);
  const size = Math.min(320, innerWidth - 80, innerHeight - 220);
  const pos = Array.isArray(ctx.saved) && ctx.saved.length === L.rings ? ctx.saved.slice() : L.init.slice();
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-110 -110 220 220');
  svg.style.cssText = `width:${size}px;height:${size}px;touch-action:none`;
  const gs = [];
  const radii = [96, 70, 44];
  const step = 360 / L.positions;
  for (let r = 0; r < L.rings; r++) {
    const g = document.createElementNS(NS, 'g');
    const R = radii[r];
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('r', R);
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', r === 0 ? '#7a5a22' : r === 1 ? '#9a7630' : '#b88a3a');
    ring.setAttribute('stroke-width', 24);
    g.append(ring);
    for (let i = 0; i < L.positions; i++) {
      const a = (i * step * Math.PI) / 180;
      const s = document.createElementNS(NS, 'g');
      const k = 0.16;
      s.setAttribute('transform', `translate(${Math.sin(a) * R},${-Math.cos(a) * R}) rotate(${i * step}) scale(${k}) translate(-50,-50)`);
      s.innerHTML = `<path d="${SYMBOLS[L.symbols[i]]}" fill="none" stroke="#1a0f06" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
      g.append(s);
    }
    g.style.transition = 'transform .25s cubic-bezier(.3,1.4,.5,1)';
    g.style.cursor = 'pointer';
    g.dataset.r = r;
    svg.append(g);
    gs.push(g);
  }
  const mark = document.createElementNS(NS, 'path');
  mark.setAttribute('d', 'M0 -112 L9 -96 L-9 -96 Z');
  mark.setAttribute('fill', '#ffe6a0');
  svg.append(mark);
  const hub = document.createElementNS(NS, 'circle');
  hub.setAttribute('r', 22);
  hub.setAttribute('fill', '#1c1510');
  hub.setAttribute('stroke', '#b88a3a');
  hub.setAttribute('stroke-width', 3);
  svg.append(hub);
  let acc = pos.map((v) => -v * step);
  const draw = () => gs.forEach((g, r) => (g.style.transform = `rotate(${acc[r]}deg)`));
  draw();
  let timer = null;
  const moved = new Set();
  const turn = (r, d) => {
    moved.add(r);
    pos[r] = (pos[r] + d + L.positions) % L.positions;
    acc[r] -= d * step;
    ctx.sound('tick');
    ctx.save(pos.slice());
    draw();
    clearTimeout(timer);
    timer = setTimeout(() => (pos.every((v, k) => v === L.solution[k]) || moved.size >= L.rings) && attempt(ctx, pos.slice(), p), 1100);
  };
  svg.addEventListener('pointerdown', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 220 - 110;
    const y = ((e.clientY - rect.top) / rect.height) * 220 - 110;
    const d = Math.hypot(x, y);
    let r = -1;
    for (let i = 0; i < radii.length; i++) if (Math.abs(d - radii[i]) < 13) r = i;
    if (r < 0) return;
    // tapping the right half turns clockwise, the left half back
    turn(r, x >= 0 ? 1 : -1);
  });
  const row = h('div', 'hintline', 'Tap a ring: right half turns it on, left half back');
  p.append(svg, row);
  return { el: p, destroy: () => clearTimeout(timer) };
}

function slotsLock(ctx) {
  const L = ctx.lock;
  const p = plate(L.title);
  const box = h('div', 'gears');
  const pos = [[10, 80, 110], [118, 10, 90], [220, 90, 80]];
  const socks = L.slots.map((s, i) => {
    const e = h('div', 'sock');
    const [x, y, d] = pos[i % pos.length];
    e.style.cssText = `left:${x}px;top:${y}px;width:${d}px;height:${d}px`;
    e.dataset.slot = s.id;
    e.onclick = () => {
      const r = ctx.place(s.id);
      if (r === 'none') ctx.say('Select a gear first.');
    };
    box.append(e);
    return e;
  });
  const draw = () => {
    const placed = ctx.placed() || {};
    L.slots.forEach((s, i) => {
      const e = socks[i];
      e.classList.toggle('full', !!placed[s.id]);
      e.innerHTML = placed[s.id] ? `<img src="${ctx.icon(s.item)}" class="spin" style="width:90%;height:90%;animation-duration:${3 + i}s;animation-direction:${i % 2 ? 'reverse' : 'normal'}">` : `<span style="font:700 18px var(--ui);letter-spacing:.12em;color:#a89c80">${s.label.toUpperCase()}</span>`;
    });
  };
  draw();
  p.append(box, h('div', 'hintline', 'Select a gear below, then tap its socket'));
  return { el: p, refresh: draw };
}

export function buildLock(ctx) {
  const t = ctx.lock.type;
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const D = '0123456789'.split('');
  switch (t) {
    case 'digits':
      return wheelsLock(ctx, D, ctx.lock.n, '');
    case 'letters':
      return wheelsLock(ctx, A, ctx.lock.n, 'letters');
    case 'keypad':
      return keypadLock(ctx);
    case 'arrows':
      return arrowsLock(ctx);
    case 'symbols':
      return symbolsLock(ctx);
    case 'switches':
      return switchesLock(ctx);
    case 'morse':
      return morseLock(ctx);
    case 'sliding':
      return slidingLock(ctx);
    case 'reveal':
      return revealLock(ctx);
    case 'rings':
      return ringsLock(ctx);
    case 'slots':
      return slotsLock(ctx);
    default:
      return { el: h('div') };
  }
}
