// The game shell: input, modes, events from the puzzle engine turned into sound, motion and words, saves, the loop.
import { ROOMS } from './data/index.js';
import { createGame } from './engine/game.js';
import { Stage } from './render/stage.js';
import { UI, fmt } from './ui/ui.js';
import { Sound } from './audio.js';

const SAVE_KEY = 'progress';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (fn) => {
  try {
    return fn();
  } catch (e) {
    return undefined;
  }
};

export class Game {
  constructor({ ow, canvas, root, debug }) {
    this.ow = ow;
    this.canvas = canvas;
    this.debug = debug;
    this.engine = createGame(ROOMS);
    this.sound = new Sound();
    this.mode = 'boot';
    this.paused = false;
    this.platformPaused = false;
    this.selected = null;
    this.lockId = null;
    this.idle = 0;
    this.saveTimer = 0;
    this.queue = Promise.resolve();
    this.last = performance.now();
    this.hintTick = 0;
    this.newNotes = 0;
    const settings = ow && ow.settings;
    this.reduced = !!(settings && settings.reducedMotion) || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = (settings && settings.quality) || 'high';
    this.stage = new Stage(canvas, { quality: q, reduced: this.reduced, pixelRatio: safe(() => settings.pixelRatio(2)) });
    this.ui = new UI(root, {
      back: () => this.back(),
      hint: () => this.hint(),
      journal: () => this.journal(),
      pause: () => this.pause(),
      turn: (d) => this.turn(d),
      select: (id) => this.select(id),
      inspect: () => this.selected && this.inspectItem(this.selected),
      inspectItem: (id) => this.inspectItem(id),
      closeInspect: () => this.closeInspect(),
    });
    this.stage.onThunder = (d) => this.sound.thunder(d);
    this.stage.onBackSeen = (id) => this.backSeen(id);
    this.fit();
    addEventListener('resize', () => this.fit());
    if (settings && settings.on) settings.on('change', () => this.applySettings());
    if (ow && ow.on) {
      ow.on('pause', () => (this.platformPaused = true));
      ow.on('resume', () => (this.platformPaused = false));
    }
    document.addEventListener('visibilitychange', () => document.hidden && this.flushSave());
    this.bindInput();
  }

  applySettings() {
    const s = this.ow.settings;
    this.reduced = !!s.reducedMotion;
    this.stage.reduced = this.reduced;
    this.stage.setQuality(s.quality, safe(() => s.pixelRatio(2)));
  }

  fit() {
    const w = innerWidth;
    const h = innerHeight;
    this.stage.resize(w, h, safe(() => this.ow.settings.pixelRatio(2)));
    this.stage.refresh(true);
    if (this.ow && this.ow.ui) {
      // the platform's buttons keep the top-left
    }
  }

  async start() {
    await Promise.race([
      Promise.all(['700 32px "Cormorant Garamond"', '500 32px Caveat', '600 32px "Barlow Condensed"'].map((f) => document.fonts.load(f))).catch(() => 0),
      wait(2500),
    ]);
    let saved = null;
    if (this.ow && this.ow.save) saved = await Promise.resolve(safe(() => this.ow.save.get(SAVE_KEY))).catch(() => null);
    this.hasSave = !!(saved && this.engine.load(saved) && this.engine.s.started);
    if (!this.hasSave) this.engine = createGame(ROOMS);
    this.engine.s.started = this.hasSave;
    this.setLook();
    this.loadRoom();
    this.debugJump();
    if (this.debugOn) this.sound.start();
    if (!this.debugOn || this.debug.get('title')) this.showTitle();
    else this.enterPlay();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  get debugOn() {
    return this.debug && this.debug.has('debug');
  }

  setLook() {
    safe(() => this.ow.ui.setLook({ accent: '#c9a24c', panel: '#1c2d4a', text: '#ffffff' }));
    safe(() => this.ow.ui.setOrientation('any'));
  }

  loadRoom() {
    const e = this.engine;
    this.stage.loadRoom(e.room, e);
    this.stage.fit = true;
    this.selected = null;
    this.ui.slots = null;
    this.ui.rail.innerHTML = '';
    this.syncInv(true);
    this.updateHud();
  }

  debugJump() {
    if (!this.debugOn) return;
    const d = this.debug;
    const e = this.engine;
    const ri = +d.get('room');
    if (ri >= 1) {
      for (let i = 0; i < ri && i < ROOMS.length - 1; i++) {
        e.startRoom(ROOMS[i].id, true);
        this.runWalkthrough(ROOMS[i].walkthrough.length);
        e.advance();
      }
    }
    const ff = +d.get('ff');
    if (ff > 0) this.runWalkthrough(ff);
    this.loadRoom();
    if (d.get('wall') != null) this.stage.goView('wall:' + (+d.get('wall') % 4), true);
    if (d.get('view')) this.stage.goView(d.get('view'), true);
    if (d.get('select')) this.select(d.get('select'));
    if (d.get('lock')) setTimeout(() => this.openLock(d.get('lock')), 200);
    if (d.get('inspect')) setTimeout(() => this.inspectItem(d.get('inspect')), 200);
    if (d.get('lit')) {
      this.stage.finale = { turn: 0 };
    }
  }

  runWalkthrough(n) {
    const e = this.engine;
    const room = e.room;
    room.walkthrough.slice(0, n).forEach((a) => {
      const [k, ...r] = a;
      if (k === 'tap') e.tap(r[0]);
      else if (k === 'use') e.useItem(r[0], r[1]);
      else if (k === 'combine') e.combine(r[0], r[1]);
      else if (k === 'place') e.placeItem(r[0], r[1], r[2]);
      else if (k === 'learn') e.learn(r[0]);
      else if (k === 'lock') {
        const lk = room.locks[r[0]];
        e.solveLock(r[0], r[1] === 'solved' ? Array.from({ length: lk.size * lk.size }, (_, i) => i) : r[1]);
      }
    });
  }

  // ---------- title and flow ----------
  showTitle() {
    this.mode = 'title';
    this.ui.showHud(false);
    this.stage.view !== 'wall:' + this.stage.wall && this.stage.goView('wall:' + this.stage.wall, true);
    this.sound.musicLevel(0.5);
    const e = this.engine;
    const sum = e.summary();
    const stars = sum.reduce((a, r) => a + r.stars, 0);
    const best = sum.some((r) => r.done) ? `STARS ${stars} / ${sum.length * 3}` : '';
    this.ui.title({
      has: this.hasSave,
      chapters: sum[1] && sum[1].unlocked,
      best,
      onContinue: () => this.begin(false),
      onNew: () => (this.hasSave ? this.confirmNew() : this.begin(true)),
      onChapters: () => this.chapters(),
    });
  }
  confirmNew() {
    this.ui.pauseCard([
      { label: 'Start over', fn: () => (this.ui.closeOverlay(), this.begin(true)) },
      { label: 'Cancel', alt: true, fn: () => this.ui.closeOverlay() },
    ]);
  }
  chapters() {
    this.ui.chapters(
      this.engine.summary(),
      (id) => {
        this.ui.closeOverlay();
        this.engine.startRoom(id, true);
        this.hasSave = false;
        this.begin(false, true);
      },
      () => this.ui.closeOverlay()
    );
  }
  begin(fresh, loaded) {
    this.sound.start();
    this.sound.play('click');
    if (fresh) {
      this.engine.newGame();
      this.stage.finale = null;
    }
    this.ui.hideTitle();
    this.engine.s.started = true;
    if (fresh || loaded || this.stage.room !== this.engine.room) this.loadRoom();
    this.enterPlay();
    this.scheduleSave();
  }
  enterPlay() {
    this.mode = 'play';
    this.ui.showHud(true);
    this.stage.refresh();
    this.sound.musicLevel(0.35);
    safe(() => this.ow.controls.set(null));
    this.updateHud();
    this.syncInv();
    this.poke();
  }

  // ---------- state to screen ----------
  roomWallName() {
    const r = this.engine.room;
    const w = r.walls[this.stage.wall];
    return w;
  }
  updateHud() {
    const r = this.engine.room;
    const w = this.roomWallName();
    const close = !this.stage.view.startsWith('wall:');
    const vd = close && r.views[this.stage.view];
    this.ui.setRoom(r.name, w.name, w.dir, this.engine.rs.time, vd ? vd.name : null);
    this.ui.setClose(close);
  }
  syncInv(instant) {
    const names = {};
    for (const id of this.engine.s.inv) names[id] = this.engine.items[id].name;
    this.ui.setInventory(this.engine.s.inv, this.selected, (id) => this.stage.itemIcon(id), names);
  }

  // ---------- input ----------
  poke() {
    this.idle = 0;
    this.ui.clearSparks();
  }
  bindInput() {
    const c = this.canvas;
    if (this.debug && this.debug.has('still')) return;
    let down = null;
    c.addEventListener('pointerdown', (e) => {
      this.sound.start();
      this.poke();
      if (this.mode === 'inspect') {
        this.stage.inspect && (this.stage.inspect.dragging = true);
        down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY };
        c.setPointerCapture(e.pointerId);
        return;
      }
      if (this.mode !== 'play' && this.mode !== 'title') return;
      c.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, moved: 0, over: 0 };
    });
    c.addEventListener('pointermove', (e) => {
      this.poke();
      this.stage.mouse.x = (e.clientX / innerWidth - 0.5) * 2;
      this.stage.mouse.y = (e.clientY / innerHeight - 0.5) * 2;
      if (down && this.mode === 'inspect') {
        this.stage.dragInspect(e.clientX - down.lx, e.clientY - down.ly);
        down.lx = e.clientX;
        down.ly = e.clientY;
        return;
      }
      if (down && this.mode === 'play') {
        const dx = e.clientX - down.lx;
        down.lx = e.clientX;
        down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
        if (down.moved > 8 && this.stage.view.startsWith('wall:')) {
          const want = this.stage.pan + dx * 0.0042;
          const lim = this.stage.panMax;
          this.stage.pan = Math.max(-lim, Math.min(lim, want));
          down.over += want - this.stage.pan;
        }
        return;
      }
      if (!down && this.mode === 'play' && e.pointerType === 'mouse') this.hover(e.clientX, e.clientY);
    });
    const end = (e) => {
      if (!down) return;
      const d = down;
      down = null;
      if (this.mode === 'inspect') {
        if (this.stage.inspect) this.stage.inspect.dragging = false;
        return;
      }
      if (this.mode !== 'play') return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      const dt = performance.now() - d.t;
      if (d.moved < 10 && dt < 600) return this.tap(e.clientX, e.clientY);
      if (this.stage.view.startsWith('wall:')) {
        if (Math.abs(d.over) > 0.14 || (Math.abs(dx) > 90 && Math.abs(dy) < 70 && dt < 350)) this.turn(dx > 0 ? -1 : 1);
        this.stage.pan *= 0.999;
      } else if (dy > 90 && Math.abs(dx) < 80) this.back();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', () => {
      down = null;
      if (this.stage.inspect) this.stage.inspect.dragging = false;
    });
    c.addEventListener('dblclick', () => this.mode === 'inspect' && this.stage.inspect && ((this.stage.inspect.rx = 0.4), (this.stage.inspect.ry = -0.7)));
    addEventListener('keydown', (e) => this.key(e));
  }

  key(e) {
    if (e.repeat && !['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) return;
    this.sound.start();
    this.poke();
    const k = e.key;
    if (this.mode === 'title') {
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        this.hasSave ? this.begin(false) : this.begin(true);
      }
      return;
    }
    if (k === 'Escape' || k === 'p' || k === 'P') {
      e.preventDefault();
      if (this.mode === 'inspect') return this.closeInspect();
      if (this.mode === 'result') return;
      if (this.ui.hasOverlay()) {
        if (this.mode === 'pause') return this.resume();
        if (this.mode === 'lock') return this.closeLock();
        this.ui.closeOverlay();
        if (this.mode === 'journal' || this.mode === 'note') this.mode = 'play';
        return;
      }
      if (k !== 'p' && k !== 'P' && !this.stage.view.startsWith('wall:')) return this.back();
      return this.pause();
    }
    if (this.mode === 'pause' && (k === ' ' || k === 'Enter')) return this.resume();
    if (this.mode !== 'play') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.turn(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.turn(1);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') this.back();
    else if (k === 'h' || k === 'H') this.hint();
    else if (k === 'j' || k === 'J' || k === 'n' || k === 'N') this.journal();
    else if (k === 'i' || k === 'I') this.selected && this.inspectItem(this.selected);
    else if (/^[1-9]$/.test(k)) {
      const id = this.engine.s.inv[+k - 1];
      id && this.select(id);
    }
  }

  hover(x, y) {
    const id = this.stage.pickNear(x, y, 10);
    this.canvas.style.cursor = id ? 'pointer' : 'default';
    if (id) {
      const th = this.engine.thing(id);
      this.ui.setTip(th.name || '', x, y + 22);
    } else this.ui.setTip(null);
  }

  turn(dir) {
    if (this.mode !== 'play' || !this.stage.view.startsWith('wall:')) return;
    this.stage.turn(dir);
    this.sound.play('whoosh');
    this.updateHud();
    this.ui.setTip(null);
  }
  async back() {
    if (this.mode !== 'play' || this.stage.view.startsWith('wall:')) return;
    this.sound.play('whoosh');
    await this.stage.goView('wall:' + this.stage.wall);
    this.updateHud();
  }

  tap(x, y) {
    const id = this.stage.pickNear(x, y, 22);
    if (!id) {
      this.sound.play('tap');
      return;
    }
    this.act(id);
  }

  act(thingId) {
    const e = this.engine;
    const th = e.thing(thingId);
    this.ui.pulse(this.stage.screenBox(thingId));
    this.sound.play('tap');
    this.stage.addTrauma(0.02);
    let res;
    if (this.selected) {
      res = e.useItem(this.selected, thingId);
      if (res.ok) this.selected = null;
    } else res = e.tap(thingId);
    this.process(res.events, thingId);
  }

  select(id) {
    if (this.mode !== 'play' && this.mode !== 'lock') return;
    this.sound.play('tap');
    if (this.selected && this.selected !== id) {
      const r = this.engine.combine(this.selected, id);
      const prev = this.selected;
      this.selected = null;
      if (!r.ok) {
        this.ui.shakeSlot(prev);
        this.ui.shakeSlot(id);
      }
      this.process(r.events);
      return;
    }
    this.selected = this.selected === id ? null : id;
    this.syncInv();
    if (this.selected) this.ui.say(this.engine.items[id].name + '. Tap something to use it, or another item to combine.', 2200);
  }

  // ---------- events ----------
  process(events, from) {
    this.queue = this.queue.then(() => this.handle(events, from)).catch((e) => console.error(e));
    return this.queue;
  }
  async handle(events, from) {
    const e = this.engine;
    let changed = false;
    for (const ev of events) {
      switch (ev.t) {
        case 'say':
          this.ui.say(ev.text);
          break;
        case 'reject':
          this.sound.play('reject');
          this.ui.say(ev.text);
          if (this.selected) this.ui.shakeSlot(this.selected);
          this.selected = null;
          this.syncInv();
          break;
        case 'sfx':
          this.sound.play(ev.name);
          break;
        case 'give': {
          changed = true;
          this.sound.play('pickup');
          const src = ev.from && this.stage.screenBox(ev.from);
          const from2 = src ? { x: src.x + src.w / 2, y: src.y + src.h / 2 } : { x: innerWidth / 2, y: innerHeight / 2 };
          this.stage.refresh();
          this.syncInv();
          const r = this.ui.slotRect(ev.item);
          this.ui.fly(this.stage.itemIcon(ev.item), from2, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
          this.ui.say(e.items[ev.item].name);
          break;
        }
        case 'take':
          changed = true;
          this.syncInv();
          break;
        case 'combined':
          changed = true;
          this.sound.play('snap');
          this.stage.addTrauma(0.1);
          this.syncInv();
          break;
        case 'note':
          changed = true;
          if (!ev.again) {
            this.sound.play('note');
            this.newNotes++;
            this.ui.say('New note: ' + e.room.notes[ev.id].title, 2200);
          }
          if (ev.read) await this.readNote(ev.id);
          break;
        case 'go':
          changed = true;
          await this.stage.goView(ev.view);
          this.updateHud();
          this.sound.play('whoosh');
          break;
        case 'openLock':
          await wait(120);
          this.openLock(ev.id);
          break;
        case 'lockSolved':
          changed = true;
          this.sound.play('open');
          this.stage.addTrauma(0.2);
          break;
        case 'placed':
          this.sound.play('snap');
          break;
        case 'escape':
          changed = true;
          this.escape(ev);
          break;
        default:
          break;
      }
    }
    this.stage.refresh();
    this.syncInv();
    if (changed || events.length) this.scheduleSave();
  }

  readNote(id) {
    const n = { ...this.engine.room.notes[id] };
    if (n.art === 'tape') n.tapeWord = this.engine.room.locks.gate ? this.engine.room.locks.gate.solution : 'SHORE';
    return new Promise((res) => {
      const prev = this.mode;
      this.mode = 'note';
      this.ui.noteCard(n, () => {
        this.mode = prev === 'lock' ? 'lock' : 'play';
        res();
      });
    });
  }

  journal() {
    if (this.mode !== 'play') return;
    this.mode = 'journal';
    this.newNotes = 0;
    const e = this.engine;
    const rooms = ROOMS.filter((r) => e.s.rooms[r.id]).map((r) => ({ name: r.name, notes: e.s.rooms[r.id].notes.map((id) => ({ id, ...r.notes[id], room: r.id })) }));
    this.ui.journal(rooms, (n) => {
      this.ui.closeOverlay();
      const prevRoom = this.engine.room;
      const note = { ...n };
      if (note.art === 'tape') note.tapeWord = 'SHORE';
      this.mode = 'note';
      this.ui.noteCard(note, () => (this.mode = 'play'));
    });
    this.ui.overlay && (this.ui.ov.addEventListener('pointerdown', (ev) => ev.target === this.ui.ov && (this.mode = 'play')));
  }

  hint() {
    if (this.mode !== 'play') return;
    const r = this.engine.hint();
    this.sound.play('tap');
    if (!r.ok) {
      this.ui.say(r.reason === 'wait' ? `Think a little longer. Next hint in ${r.wait} s.` : r.reason === 'done' ? 'You are out.' : 'Nothing left to hint at.');
      return;
    }
    this.mode = 'note';
    this.ui.hintCard(r.text, r.tier);
    this.ui.ov.addEventListener('pointerdown', () => {});
    const watch = setInterval(() => {
      if (!this.ui.hasOverlay()) {
        clearInterval(watch);
        if (this.mode === 'note') this.mode = 'play';
      }
    }, 150);
    this.scheduleSave();
  }

  // ---------- locks ----------
  openLock(id) {
    if (this.mode === 'lock') return;
    const e = this.engine;
    const lk = e.room.locks[id];
    if (!lk || e.rs.flags['lock:' + id]) return;
    this.mode = 'lock';
    this.lockId = id;
    this.sound.play('tap');
    let ctl = null;
    const close = () => this.closeLock();
    const ctx = {
      lock: lk,
      id,
      saved: e.getLockState(id),
      sound: (n, a) => (n === 'morseTone' ? this.sound.morseTone(a) : this.sound.play(n, a)),
      save: (v) => {
        e.setLockState(id, v);
        this.scheduleSave();
      },
      say: (t) => this.ui.say(t),
      icon: (i) => this.stage.itemIcon(i),
      placed: () => e.rs.lock[id],
      submit: async (input) => {
        const r = e.solveLock(id, input);
        if (!r.ok) return false;
        this.sound.play('open');
        setTimeout(() => {
          this.finishLock(r.events);
        }, 900);
        return true;
      },
      place: (slotId) => {
        if (!this.selected) return 'none';
        const item = this.selected;
        const r = e.placeItem(id, slotId, item);
        if (r.ok) {
          this.selected = null;
          this.sound.play('snap');
          this.syncInv();
          if (r.events.some((x) => x.t === 'lockSolved')) setTimeout(() => this.finishLock(r.events.filter((x) => x.t !== 'placed')), 900);
          else this.process(r.events.filter((x) => x.t !== 'placed'));
          ctl && ctl.refresh && ctl.refresh();
        } else {
          this.ui.shakeSlot(item);
          this.sound.play('reject');
          this.process(r.events);
        }
        return r.ok ? 'ok' : 'bad';
      },
    };
    ctl = this.ui.openLock(ctx, close);
    this.lockCtl = ctl;
  }
  closeLock() {
    if (this.mode !== 'lock') return;
    this.ui.closeOverlay();
    this.mode = 'play';
    this.lockId = null;
  }
  finishLock(events) {
    this.ui.closeOverlay();
    this.mode = 'play';
    this.lockId = null;
    this.process(events);
  }

  // ---------- inspect ----------
  inspectItem(id) {
    if (this.mode !== 'play' && this.mode !== 'lock') return;
    const it = this.engine.items[id];
    this.preInspect = this.mode;
    this.mode = 'inspect';
    this.inspectId = id;
    this.stage.startInspect(id);
    this.ui.inspectView(it.name, it.desc);
    this.ui.overlay && 0;
    this.sound.play('tap');
    if (this.ui.ov) this.ui.ov.style.display = 'none';
  }
  backSeen(id) {
    const it = this.engine.items[id];
    if (!it.inspect) return;
    this.ui.setInspectCap(it.inspect.back);
    this.sound.play('note');
    if (it.inspect.note) {
      const r = this.engine.learn(it.inspect.note);
      this.process(r.events.map((x) => (x.t === 'note' ? { ...x, read: false } : x)));
    }
  }
  closeInspect() {
    if (this.mode !== 'inspect') return;
    this.stage.endInspect();
    this.ui.closeInspect();
    this.mode = this.preInspect === 'lock' ? 'lock' : 'play';
    if (this.ui.ov) this.ui.ov.style.display = '';
    this.syncInv();
  }

  // ---------- pause ----------
  pause() {
    if (this.mode !== 'play') return;
    this.mode = 'pause';
    this.ui.pauseCard([
      { label: 'Resume', fn: () => this.resume() },
      { label: 'Notes', alt: true, fn: () => (this.resume(), this.journal()) },
      { label: 'Title', alt: true, fn: () => this.toTitle() },
    ]);
  }
  resume() {
    this.ui.closeOverlay();
    this.mode = 'play';
  }
  toTitle() {
    this.ui.closeOverlay();
    this.flushSave();
    this.hasSave = this.engine.s.started;
    this.showTitle();
  }

  // ---------- escape ----------
  async escape(ev) {
    this.mode = 'cutscene';
    this.ui.setTip(null);
    this.selected = null;
    this.syncInv();
    const e = this.engine;
    const last = ev.last;
    this.sound.musicLevel(0.8, true);
    this.sound.play(last ? 'lamp' : 'fanfare');
    this.ui.showHud(false);
    this.ui.closeOverlay();
    this.stage.refresh();
    if (last) {
      await this.stage.goView('wall:0', false);
      await this.stage.playFinale();
    } else {
      this.stage.addTrauma(0.3);
      await wait(1800);
    }
    for (const b of ev.badges) safe(() => this.ow.badges.award(b));
    this.submitScores(ev);
    this.flushSave();
    const r = e.room;
    this.mode = 'result';
    this.ui.result(
      { title: last ? 'The light holds' : 'Out', time: ev.time, hints: ev.hints, stars: ev.stars, best: ev.best, line: last ? 'The ship turns away from the Teeth.' : '' },
      last
        ? [
            { label: 'Chapters', fn: () => (this.ui.closeOverlay(), this.chapters()) },
            { label: 'Title', alt: true, fn: () => this.toTitle() },
          ]
        : [
            { label: 'Next room', fn: () => this.nextRoom() },
            { label: 'Replay', alt: true, fn: () => this.replay() },
          ]
    );
    this.sound.musicLevel(0.35);
  }
  nextRoom() {
    this.ui.closeOverlay();
    this.engine.advance();
    this.loadRoom();
    this.stage.finale = null;
    this.ui.showHud(true);
    this.enterPlay();
    this.scheduleSave();
    this.ui.say(this.engine.room.name, 3200);
  }
  replay() {
    this.ui.closeOverlay();
    this.engine.restartRoom();
    this.loadRoom();
    this.ui.showHud(true);
    this.enterPlay();
    this.scheduleSave();
  }
  submitScores(ev) {
    const e = this.engine;
    if (!ev.last || !this.ow || !this.ow.leaderboards) return;
    const all = ROOMS.map((r) => e.s.rooms[r.id]);
    if (all.every((r) => r && r.done && r.hints === 0)) {
      const total = Math.round(all.reduce((a, r) => a + r.time, 0));
      Promise.resolve(safe(() => this.ow.leaderboards.submit('fastest-escape', total, { lowerIsBetter: true }))).catch(() => {});
    }
  }

  // ---------- saving ----------
  scheduleSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushSave(), 500);
  }
  flushSave() {
    clearTimeout(this.saveTimer);
    if (!this.engine.s.started || !this.ow || !this.ow.save) return;
    Promise.resolve(safe(() => this.ow.save.set(SAVE_KEY, this.engine.serialize()))).catch(() => {});
  }

  // ---------- loop ----------
  frame(now) {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const running = !document.hidden && !this.platformPaused && ['play', 'lock', 'inspect', 'note', 'journal', 'cutscene'].includes(this.mode);
    if (running && this.mode !== 'cutscene') this.engine.tick(dt);
    if (this.mode === 'title') this.stage.pan = Math.sin(now / 5200) * 0.4;
    this.stage.update(dt);
    this.stage.draw();
    if (this.debugOn) {
      this.dbg ||= Object.assign(document.createElement('div'), { style: 'position:fixed;left:6px;top:60px;font:14px monospace;color:#0f0;z-index:99;pointer-events:none' });
      if (!this.dbg.parentNode) document.body.append(this.dbg);
      this.dbg.textContent = `${this.mode} w${this.stage.wall} ${this.stage.view} yaw ${this.stage.pose.yaw.toFixed(2)} pan ${this.stage.pan.toFixed(2)} ${(this.stage.dbgLog || []).join(' ')}`;
    }
    if (this.mode === 'play' || this.mode === 'lock') {
      this.hintTick += dt;
      if (this.hintTick > 0.5) {
        this.hintTick = 0;
        this.ui.setBadges(this.engine.hintWait(), this.newNotes);
        this.ui.setTime(this.engine.rs.time);
      }
      this.idle += dt;
      if (this.idle > 60 && this.mode === 'play' && !this.ui.hasOverlay()) {
        const boxes = this.stage.hits.filter((h) => h.enabled).map((h) => this.stage.screenBox(h.th.id)).filter(Boolean);
        this.ui.showSparks(boxes);
        this.idle = 45;
      }
    }
    requestAnimationFrame((t) => this.frame(t));
  }
}
