// The DOM layer: title, HUD, inventory, notes, hints, results.
import { paintMorseChart, paintChannelChart, paintTape } from '../render/art.js';
import { canvasOf } from '../render/gfx.js';
import { buildLock } from './locks.js';

const h = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
export const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  hint: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 115 .6c0 1.6-2.5 2-2.5 3.9M12 17.5v.1"/></svg>',
  notes: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  look: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></svg>',
  l: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  r: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
};
const STAR = '<svg viewBox="0 0 100 100"><path d="M50 8 L62 38 L94 38 L68 58 L78 90 L50 70 L22 90 L32 58 L6 38 L38 38 Z"/></svg>';

export class UI {
  constructor(root, cb) {
    this.root = root;
    this.cb = cb;
    this.sayTimer = 0;
    this.build();
  }
  build() {
    const r = this.root;
    r.innerHTML = '';
    this.hud = h('div', 'hidden');
    this.hud.id = 'hud';
    this.hud.innerHTML = `<div class="name"><b></b><i></i></div>
      <div class="tl"></div><div class="tr"></div>`;
    this.btnBack = this.ringBtn(ICON.back, 'Back', () => this.cb.back());
    this.btnBack.classList.add('hidden');
    this.hud.querySelector('.tl').append(this.btnBack);
    this.btnHint = this.ringBtn(ICON.hint, 'Hint', () => this.cb.hint());
    this.hintBadge = h('span', 'badge hidden', '');
    this.btnHint.append(this.hintBadge);
    this.btnNotes = this.ringBtn(ICON.notes, 'Notes', () => this.cb.journal());
    this.notesBadge = h('span', 'badge hidden', '');
    this.btnNotes.append(this.notesBadge);
    this.btnPause = this.ringBtn(ICON.pause, 'Pause', () => this.cb.pause());
    this.hud.querySelector('.tr').append(this.btnHint, this.btnNotes, this.btnPause);
    this.tl = h('button', 'ring btn turn l', `<span class="in">${ICON.l}</span>`);
    this.tr = h('button', 'ring btn turn r', `<span class="in">${ICON.r}</span>`);
    this.tl.setAttribute('aria-label', 'Turn left');
    this.tr.setAttribute('aria-label', 'Turn right');
    this.tl.onclick = () => this.cb.turn(-1);
    this.tr.onclick = () => this.cb.turn(1);
    this.hud.append(this.tl, this.tr);
    this.say_ = h('div', 'ol');
    this.say_.id = 'say';
    this.inv = h('div', 'hidden');
    this.inv.id = 'inv';
    this.rail = h('div', 'rail');
    this.inv.append(this.rail);
    this.tools = h('div', 'hidden');
    this.tools.id = 'invtools';
    this.btnLook = this.ringBtn(ICON.look, 'Inspect', () => this.cb.inspect());
    this.tools.append(this.btnLook);
    this.tip = h('div', 'ol hidden');
    this.tip.id = 'tip';
    this.focus = h('div', '');
    this.focus.id = 'focus';
    this.sparks = h('div');
    r.append(this.hud, this.inv, this.tools, this.say_, this.tip, this.focus, this.sparks);
  }
  ringBtn(icon, label, fn) {
    const b = h('button', 'ring btn', `<span class="in">${icon}</span>`);
    b.setAttribute('aria-label', label);
    b.title = label;
    b.onclick = fn;
    return b;
  }
  showHud(on) {
    this.hud.classList.toggle('hidden', !on);
    this.inv.classList.toggle('hidden', !on);
    this.say_.style.display = on ? '' : 'none';
    if (!on) this.tools.classList.add('hidden');
  }
  setRoom(name, wall, dir, time, closeName) {
    const n = this.hud.querySelector('.name');
    n.querySelector('b').textContent = closeName || name;
    n.querySelector('i').innerHTML = `${closeName ? '' : (dir ? dir + ' · ' : '') + wall + ' · '}<span>${fmt(time)}</span>`;
  }
  setTime(t, closeName, wall, dir) {
    const sp = this.hud.querySelector('.name i span');
    if (sp) sp.textContent = fmt(t);
  }
  setClose(on) {
    this.btnBack.classList.toggle('hidden', !on);
    this.tl.classList.toggle('hidden', on);
    this.tr.classList.toggle('hidden', on);
  }
  setBadges(hintWait, notesNew) {
    this.hintBadge.classList.toggle('hidden', !(hintWait > 0));
    this.hintBadge.textContent = hintWait > 0 ? hintWait : '';
    this.notesBadge.classList.toggle('hidden', !notesNew);
    this.notesBadge.textContent = notesNew || '';
  }
  // ----- inventory -----
  setInventory(items, selected, icon, names) {
    this.slots = this.slots || new Map();
    const keep = new Set(items);
    for (const [id, el] of this.slots) if (!keep.has(id)) {
      el.remove();
      this.slots.delete(id);
    }
    items.forEach((id, i) => {
      let el = this.slots.get(id);
      if (!el) {
        el = h('button', 'ring slot pop', `<span class="in"><img alt=""></span>`);
        el.querySelector('img').src = icon(id);
        el.dataset.id = id;
        el.setAttribute('aria-label', names[id] || id);
        let tmr = 0;
        let long = false;
        let last = 0;
        el.onpointerdown = () => {
          long = false;
          tmr = setTimeout(() => {
            long = true;
            this.cb.inspectItem(id);
          }, 520);
        };
        el.onpointerup = el.onpointerleave = el.onpointercancel = () => clearTimeout(tmr);
        el.onclick = () => {
          if (long) return;
          const now = performance.now();
          if (now - last < 320) return this.cb.inspectItem(id);
          last = now;
          this.cb.select(id);
        };
        this.slots.set(id, el);
        this.rail.append(el);
        setTimeout(() => el.classList.remove('pop'), 600);
      }
      el.classList.toggle('sel', id === selected);
      this.rail.insertBefore(el, this.rail.children[i] || null);
    });
    this.tools.classList.toggle('hidden', !selected || this.hud.classList.contains('hidden'));
    if (selected && this.slots.get(selected)) this.slots.get(selected).scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    this.rail.parentElement.style.minHeight = items.length ? '' : '0';
  }
  slotRect(id) {
    const el = this.slots && this.slots.get(id);
    if (el) return el.getBoundingClientRect();
    const r = this.rail.getBoundingClientRect();
    return { left: r.left + r.width / 2 - 32, top: r.top, width: 64, height: 64 };
  }
  shakeSlot(id) {
    const el = this.slots && this.slots.get(id);
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }
  fly(src, from, to) {
    const im = h('img');
    im.id = 'flyer';
    im.src = src;
    im.style.left = from.x - 32 + 'px';
    im.style.top = from.y - 32 + 'px';
    this.root.append(im);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    im.animate(
      [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1 - 60}px) scale(1.7)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy}px) scale(.9)`, opacity: 1 },
      ],
      { duration: 750, easing: 'cubic-bezier(.4,0,.3,1)' }
    ).onfinish = () => im.remove();
  }
  // ----- words in the scene -----
  say(text, ms) {
    this.say_.textContent = text;
    this.say_.classList.add('show');
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => this.say_.classList.remove('show'), ms || 2600 + text.length * 35);
  }
  setTip(text, x, y) {
    if (!text) return this.tip.classList.add('hidden');
    this.tip.textContent = text;
    this.tip.style.left = x + 'px';
    this.tip.style.top = y + 'px';
    this.tip.classList.remove('hidden');
  }
  pulse(box) {
    if (!box) return;
    const f = this.focus;
    f.style.cssText = `left:${box.x - 6}px;top:${box.y - 6}px;width:${box.w + 12}px;height:${box.h + 12}px`;
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }
  showSparks(boxes) {
    this.sparks.innerHTML = '';
    boxes.forEach((b, i) => {
      const s = h('i', 'spark');
      s.style.left = b.x + b.w / 2 + 'px';
      s.style.top = b.y + b.h / 2 + 'px';
      s.style.animationDelay = i * 0.35 + 's';
      this.sparks.append(s);
    });
  }
  clearSparks() {
    this.sparks.innerHTML = '';
  }
  // ----- overlays -----
  overlay(content, cls, dismiss) {
    this.closeOverlay();
    const o = h('div', 'scrim ' + (cls || ''));
    o.append(content);
    if (dismiss) o.addEventListener('pointerdown', (e) => e.target === o && dismiss());
    this.root.append(o);
    this.ov = o;
    return o;
  }
  closeOverlay() {
    if (this.lockCtl && this.lockCtl.destroy) this.lockCtl.destroy();
    this.lockCtl = null;
    if (this.ov) this.ov.remove();
    this.ov = null;
  }
  hasOverlay() {
    return !!this.ov;
  }
  noteCard(note, done) {
    const c = h('div', 'card');
    c.innerHTML = `<button class="x" aria-label="Close">×</button><h2>${esc(note.title)}</h2>`;
    const p = h(note.hand ? 'p' : 'div', note.hand ? '' : 'plain');
    p.textContent = note.body;
    c.append(p);
    if (note.art) {
      const cv = canvasOf(512, note.art === 'morse' ? 760 : note.art === 'channel' ? 640 : 120);
      const g = cv.getContext('2d');
      if (note.art === 'morse') paintMorseChart(g, cv.width, cv.height);
      else if (note.art === 'channel') paintChannelChart(g, cv.width, cv.height);
      else if (note.art === 'tape') paintTape(g, cv.width, cv.height, note.tapeWord || 'SHORE');
      c.append(cv);
    }
    const close = () => {
      this.closeOverlay();
      done && done();
    };
    c.querySelector('.x').onclick = close;
    this.overlay(c, '', close);
  }
  journal(rooms, open, onClose) {
    const j = h('div', 'journal');
    j.innerHTML = '<h2>Notes</h2>';
    const list = h('div', 'list');
    let any = false;
    for (const r of rooms) {
      if (!r.notes.length) continue;
      any = true;
      list.append(h('div', 'sec', esc(r.name)));
      for (const n of r.notes) {
        const b = h('button', 'entry', esc(n.title));
        b.onclick = () => open(n);
        list.append(b);
      }
    }
    if (!any) list.append(h('div', 'none', 'Nothing yet. Look around.'));
    j.append(list);
    const close = h('button', 'bigbtn sm alt', 'Close');
    close.style.alignSelf = 'center';
    const shut = () => {
      this.closeOverlay();
      onClose && onClose();
    };
    close.onclick = shut;
    j.append(close);
    this.overlay(j, '', shut);
  }
  hintCard(text, tier, left) {
    const c = h('div', 'card');
    c.innerHTML = `<button class="x" aria-label="Close">×</button><h2>${['A nudge', 'A pointer', 'The answer'][tier - 1] || 'Hint'}</h2>`;
    const p = h('p', '');
    p.textContent = text;
    c.append(p);
    c.querySelector('.x').onclick = () => this.closeOverlay();
    this.overlay(c, '', () => this.closeOverlay());
  }
  openLock(ctx, onClose) {
    const wrap = h('div', 'lockwrap');
    const ctl = buildLock(ctx);
    wrap.append(ctl.el);
    const back = h('button', 'bigbtn sm alt', 'Back');
    back.onclick = () => onClose();
    wrap.append(back);
    const o = this.overlay(wrap, 'lockscrim', onClose);
    o.style.paddingBottom = 'calc(var(--slot) + 40px)';
    this.lockCtl = ctl;
    return ctl;
  }
  result(info, buttons) {
    const c = h('div', 'card res');
    const stars = [1, 2, 3].map((i) => `<span style="display:inline-block;animation-delay:${0.4 + i * 0.25}s">${STAR.replace('<svg', i <= info.stars ? '<svg class="on" style="animation-delay:' + (0.4 + i * 0.25) + 's"' : '<svg')}</span>`).join('');
    c.innerHTML = `<h2>${esc(info.title)}</h2><div class="stars">${stars}</div><div class="big">${fmt(info.time)}</div>
      <div class="sub">${info.hints} hint${info.hints === 1 ? '' : 's'}${info.best ? ' · best ' + fmt(info.best) : ''}</div>`;
    if (info.line) c.append(h('p', 'plain', esc(info.line)));
    const row = h('div', 'row');
    row.style.cssText = 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap';
    for (const b of buttons) {
      const e = h('button', 'bigbtn ' + (b.alt ? 'alt' : ''), b.label);
      e.onclick = b.fn;
      row.append(e);
    }
    c.append(row);
    this.overlay(c, '');
  }
  pauseCard(buttons) {
    const c = h('div', 'card res');
    c.innerHTML = '<h2>Paused</h2>';
    const col = h('div');
    col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0';
    for (const b of buttons) {
      const e = h('button', 'bigbtn ' + (b.alt ? 'alt' : ''), b.label);
      e.onclick = b.fn;
      col.append(e);
    }
    c.append(col);
    this.overlay(c, '');
  }
  chapters(list, pick, back) {
    const c = h('div', 'card');
    c.innerHTML = '<button class="x" aria-label="Close">×</button><h2>Chapters</h2>';
    const col = h('div', 'chap');
    for (const r of list) {
      const b = h('button', '', `<span>${esc(r.name)}<small>${r.done ? 'Best ' + fmt(r.best) : r.unlocked ? 'Ready' : 'Locked'}</small></span><span class="st">${[1, 2, 3].map((i) => STAR.replace('<svg', i <= r.stars ? '<svg class="on"' : '<svg')).join('')}</span>`);
      b.disabled = !r.unlocked;
      b.onclick = () => pick(r.id);
      col.append(b);
    }
    c.append(col);
    c.querySelector('.x').onclick = back;
    this.overlay(c, '', back);
  }
  title(info) {
    this.closeOverlay();
    if (this.titleEl) this.titleEl.remove();
    const t = h('div', '');
    t.id = 'title';
    t.innerHTML = `<h1><em>Escape the</em>Lighthouse</h1><div class="stack"></div>`;
    const st = t.querySelector('.stack');
    const main = h('button', 'bigbtn', info.has ? 'Continue' : 'Play');
    main.style.cssText = 'height:72px;min-width:240px;font-size:32px';
    main.onclick = () => info.has ? info.onContinue() : info.onNew();
    st.append(main);
    const row = h('div', 'row');
    if (info.has) {
      const n = h('button', 'bigbtn sm alt', 'New game');
      n.onclick = info.onNew;
      row.append(n);
    }
    if (info.chapters) {
      const c = h('button', 'bigbtn sm alt', 'Chapters');
      c.onclick = info.onChapters;
      row.append(c);
    }
    st.append(row);
    if (info.best) st.append(h('div', 'best ol', info.best));
    this.root.append(t);
    this.titleEl = t;
    return main;
  }
  hideTitle() {
    if (this.titleEl) this.titleEl.remove();
    this.titleEl = null;
  }
  inspectView(name, cap) {
    this.closeInspect();
    this.hud.classList.add('hidden');
    this.tools.style.display = 'none';
    const e = h('div', '');
    e.id = 'inspect';
    e.innerHTML = `<div class="nm ol">${esc(name)}</div><div class="cap ol"></div><div class="hint ol">DRAG TO TURN</div>`;
    const done = this.ringBtn(ICON.back, 'Close', () => this.cb.closeInspect());
    done.style.cssText = 'position:absolute;left:max(var(--res-x,150px),env(safe-area-inset-left));top:10px';
    e.append(done);
    this.root.append(e);
    this.insp = e;
    this.setInspectCap(cap);
  }
  setInspectCap(t) {
    if (this.insp) this.insp.querySelector('.cap').textContent = t || '';
  }
  closeInspect() {
    if (this.insp) {
      this.insp.remove();
      this.hud.classList.remove('hidden');
      this.tools.style.display = '';
    }
    this.insp = null;
  }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
