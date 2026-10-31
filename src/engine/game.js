// The puzzle state machine. Pure: no three.js, no DOM. Rooms are plain data (see src/data); this plays any room.
// Every action returns { ok, events }; the page turns events into sound, motion and text.
import { check } from './locks.js';

export const HINT_COOLDOWN = 60;
export const SPEED_LIMIT = 25 * 60;

const newRoomState = () => ({ flags: {}, lock: {}, notes: [], time: 0, hints: 0, tier: {}, ready: 0, done: false, stars: 0 });
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function createGame(rooms, saved) {
  const byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
  const items = {};
  for (const r of rooms) Object.assign(items, r.items);

  let s = fresh();
  if (saved) {
    const loaded = sanitize(saved);
    if (loaded) s = loaded;
  }

  function fresh() {
    return { v: 1, cur: rooms[0].id, inv: [], rooms: {}, carry: {}, records: { time: {}, stars: {}, hintless: {} }, badges: [], started: false, finished: false };
  }

  function sanitize(d) {
    if (!isObj(d) || !byId[d.cur]) return null;
    const out = fresh();
    out.cur = d.cur;
    out.started = !!d.started;
    out.finished = !!d.finished;
    out.inv = Array.isArray(d.inv) ? d.inv.filter((i) => items[i]) : [];
    out.badges = Array.isArray(d.badges) ? d.badges.filter((b) => typeof b === 'string') : [];
    if (isObj(d.carry)) for (const id of Object.keys(d.carry)) if (byId[id] && Array.isArray(d.carry[id])) out.carry[id] = d.carry[id].filter((i) => items[i]);
    if (isObj(d.records)) for (const k of ['time', 'stars', 'hintless']) if (isObj(d.records[k])) for (const id of Object.keys(d.records[k])) if (byId[id] && Number.isFinite(d.records[k][id])) out.records[k][id] = d.records[k][id];
    if (isObj(d.rooms)) {
      for (const id of Object.keys(d.rooms)) {
        const r = d.rooms[id];
        if (!byId[id] || !isObj(r)) continue;
        const n = newRoomState();
        if (isObj(r.flags)) for (const k of Object.keys(r.flags)) if (r.flags[k]) n.flags[k] = r.flags[k] === true ? true : String(r.flags[k]).slice(0, 80);
        if (isObj(r.lock)) for (const k of Object.keys(r.lock)) if (byId[id].locks?.[k]) n.lock[k] = r.lock[k];
        if (Array.isArray(r.notes)) n.notes = r.notes.filter((x) => byId[id].notes?.[x]);
        for (const k of ['time', 'hints', 'ready', 'stars']) n[k] = Number.isFinite(r[k]) && r[k] >= 0 ? r[k] : 0;
        n.done = !!r.done;
        if (isObj(r.tier)) for (const k of Object.keys(r.tier)) if (Number.isFinite(r.tier[k])) n.tier[k] = Math.max(0, Math.min(3, r.tier[k] | 0));
        out.rooms[id] = n;
      }
    }
    return out;
  }

  const room = () => byId[s.cur];
  const rs = () => (s.rooms[s.cur] ||= newRoomState());
  const thing = (id) => room().things.find((t) => t.id === id);

  // ---- conditions ----
  function ev(c) {
    if (c == null || c === true) return true;
    if (c === false) return false;
    if (typeof c === 'string') return !!rs().flags[c];
    if (Array.isArray(c)) return c.every(ev);
    if (c.flag !== undefined) return !!rs().flags[c.flag];
    if (c.has !== undefined) return s.inv.includes(c.has);
    if (c.got !== undefined) return !!rs().flags['got:' + c.got];
    if (c.lock !== undefined) return !!rs().flags['lock:' + c.lock];
    if (c.note !== undefined) return rs().notes.includes(c.note);
    if (c.not !== undefined) return !ev(c.not);
    if (c.all) return c.all.every(ev);
    if (c.any) return c.any.some(ev);
    return false;
  }

  // ---- effects ----
  function run(effects, out) {
    for (const e of effects || []) {
      if (e.give) {
        if (!s.inv.includes(e.give) && items[e.give]) {
          s.inv.push(e.give);
          rs().flags['got:' + e.give] = true;
          out.push({ t: 'give', item: e.give, from: e.from || null });
        }
      } else if (e.take) {
        const i = s.inv.indexOf(e.take);
        if (i >= 0) {
          s.inv.splice(i, 1);
          out.push({ t: 'take', item: e.take });
        }
      } else if (e.set) rs().flags[e.set] = true;
      else if (e.clear) delete rs().flags[e.clear];
      else if (e.note) {
        if (room().notes?.[e.note] && !rs().notes.includes(e.note)) {
          rs().notes.push(e.note);
          out.push({ t: 'note', id: e.note, read: e.read !== false });
        }
      } else if (e.readNote) out.push({ t: 'note', id: e.readNote, read: true, again: true });
      else if (e.say) out.push({ t: 'say', text: e.say });
      else if (e.go) out.push({ t: 'go', view: e.go });
      else if (e.lock) {
        if (!rs().flags['lock:' + e.lock]) out.push({ t: 'openLock', id: e.lock });
      } else if (e.sfx) out.push({ t: 'sfx', name: e.sfx });
      else if (e.anim) out.push({ t: 'anim', name: e.anim });
    }
  }

  function rules(list, out) {
    for (const r of list || []) {
      if (!ev(r.if)) continue;
      if (r.say) out.push({ t: 'say', text: r.say });
      run(r.do, out);
      return true;
    }
    return false;
  }

  function visible(th) {
    return (!th.showIf || ev(th.showIf)) && !(th.hideIf && ev(th.hideIf));
  }
  function states(th) {
    const o = {};
    if (th.states) for (const k of Object.keys(th.states)) o[k] = ev(th.states[k]);
    return o;
  }

  function finish(out) {
    const r = rs();
    if (r.done || !room().escape || !ev(room().escape)) return;
    const rm = room();
    r.done = true;
    r.stars = r.hints === 0 && r.time <= rm.par ? 3 : r.hints <= 2 ? 2 : 1;
    const rec = s.records;
    if (!(rec.time[rm.id] <= r.time)) rec.time[rm.id] = Math.round(r.time);
    rec.stars[rm.id] = Math.max(rec.stars[rm.id] || 0, r.stars);
    if (r.hints === 0) rec.hintless[rm.id] = 1;
    s.carry[rm.id] = s.inv.filter((i) => items[i].carry);
    const idx = rooms.indexOf(rm);
    const last = idx === rooms.length - 1;
    if (last) s.finished = true;
    const earned = [];
    const award = (id) => {
      if (!s.badges.includes(id)) {
        s.badges.push(id);
        earned.push(id);
      }
    };
    if (rm.badge) award(rm.badge);
    if (r.hints === 0) award('no-hints');
    const all = rooms.every((x) => s.rooms[x.id]?.done);
    if (all) {
      const total = rooms.reduce((a, x) => a + s.rooms[x.id].time, 0);
      if (total < SPEED_LIMIT) award('speedrun');
      if (rooms.every((x) => rec.stars[x.id] === 3)) award('three-stars');
    }
    out.push({ t: 'escape', room: rm.id, time: r.time, hints: r.hints, stars: r.stars, last, badges: earned, best: rec.time[rm.id] });
  }

  const result = (out, ok) => {
    finish(out);
    return { ok, events: out };
  };

  // ---- actions ----
  function tap(id) {
    const th = thing(id);
    const out = [];
    if (!th || !visible(th)) return { ok: false, events: out };
    s.started = true;
    let handled = th.tap ? rules(th.tap, out) : false;
    if (!handled && th.lock) {
      const lk = room().locks[th.lock];
      if (rs().flags['lock:' + th.lock]) out.push({ t: 'say', text: lk.openedMsg || 'Already open.' });
      else if (lk.type === 'key') out.push({ t: 'say', text: lk.msg || "It's locked." });
      else out.push({ t: 'openLock', id: th.lock });
      handled = true;
    }
    if (!handled) out.push({ t: 'say', text: th.look || 'Nothing more to find here.' });
    return result(out, true);
  }

  function solved(lockId) {
    const r = rs();
    r.flags['lock:' + lockId] = true;
    const out = [{ t: 'lockSolved', id: lockId }];
    run(room().locks[lockId].onSolve, out);
    return out;
  }

  function useItem(itemId, thingId) {
    const th = thing(thingId);
    const out = [];
    if (!th || !visible(th) || !s.inv.includes(itemId)) return { ok: false, events: out };
    s.started = true;
    const lk = th.lock ? room().locks[th.lock] : null;
    if (lk && lk.type === 'key' && lk.item === itemId && !rs().flags['lock:' + th.lock]) {
      if (!lk.needs || ev(lk.needs)) {
        out.push(...solved(th.lock));
        return result(out, true);
      }
      out.push({ t: 'say', text: lk.stuck || "It won't turn." });
      return result(out, true);
    }
    if (lk && lk.type === 'slots' && !rs().flags['lock:' + th.lock]) {
      const slot = lk.slots.find((x) => x.item === itemId && !rs().lock[th.lock]?.[x.id]);
      if (slot) return placeItem(th.lock, slot.id, itemId);
    }
    const list = th.use && (th.use[itemId] || th.use['*']);
    if (list && rules(list, out)) return result(out, true);
    out.push({ t: 'reject', text: th.noUse || "That doesn't work here." });
    return { ok: false, events: out };
  }

  function placeItem(lockId, slotId, itemId) {
    const out = [];
    const lk = room().locks[lockId];
    if (!lk || lk.type !== 'slots' || rs().flags['lock:' + lockId]) return { ok: false, events: out };
    const slot = lk.slots.find((x) => x.id === slotId);
    const placed = (rs().lock[lockId] ||= {});
    if (!slot || placed[slotId] || !s.inv.includes(itemId)) return { ok: false, events: out };
    if (slot.item !== itemId) {
      out.push({ t: 'reject', text: slot.wrong || "It doesn't fit." });
      return { ok: false, events: out };
    }
    s.inv.splice(s.inv.indexOf(itemId), 1);
    placed[slotId] = itemId;
    out.push({ t: 'take', item: itemId }, { t: 'placed', lock: lockId, slot: slotId });
    if (lk.slots.every((x) => placed[x.id])) out.push(...solved(lockId));
    return result(out, true);
  }

  function combine(a, b) {
    const out = [];
    if (a === b || !s.inv.includes(a) || !s.inv.includes(b)) return { ok: false, events: out };
    const c = room().combos?.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    if (!c || (c.if && !ev(c.if))) {
      out.push({ t: 'reject', text: c && c.msgNo ? c.msgNo : "These don't go together." });
      return { ok: false, events: out };
    }
    for (const it of [a, b]) if (!(c.keep || []).includes(it)) run([{ take: it }], out);
    run([{ give: c.result }], out);
    out.push({ t: 'combined', result: c.result });
    if (c.say) out.push({ t: 'say', text: c.say });
    run(c.do, out);
    return result(out, true);
  }

  function solveLock(lockId, input) {
    const out = [];
    const lk = room().locks[lockId];
    if (!lk || rs().flags['lock:' + lockId]) return { ok: !!lk, events: out };
    s.started = true;
    if (!check(lk, input)) {
      out.push({ t: 'lockFail', id: lockId });
      return { ok: false, events: out };
    }
    out.push(...solved(lockId));
    return result(out, true);
  }

  // A clue seen outside the scene (an item turned over in the inspect view).
  function learn(noteId) {
    const out = [];
    run([{ note: noteId }], out);
    return result(out, out.length > 0);
  }

  function setLockState(lockId, v) {
    const lk = room().locks[lockId];
    if (!lk || lk.type === 'slots') return;
    try {
      rs().lock[lockId] = JSON.parse(JSON.stringify(v));
    } catch (e) {
      // not serialisable: ignore
    }
  }
  const getLockState = (lockId) => rs().lock[lockId];

  // ---- steps and hints ----
  function stepList() {
    const rm = room();
    const done = new Set();
    for (const st of rm.steps) if (ev(st.done)) done.add(st.id);
    return rm.steps.map((st) => ({ ...st, isDone: done.has(st.id), open: !done.has(st.id) && (st.requires || []).every((q) => done.has(q)) }));
  }

  function hintStep() {
    const list = stepList();
    const open = list.filter((x) => x.open);
    if (!open.length) return null;
    const ratio = (th) => {
      const m = list.filter((x) => x.thread === th);
      return m.length ? m.filter((x) => x.isDone).length / m.length : 0;
    };
    let best = null;
    for (const st of open) if (!best || ratio(st.thread) > ratio(best.thread)) best = st;
    return best;
  }

  function hint() {
    const r = rs();
    if (r.done) return { ok: false, reason: 'done' };
    if (r.time < r.ready) return { ok: false, reason: 'wait', wait: Math.ceil(r.ready - r.time) };
    const st = hintStep();
    if (!st) return { ok: false, reason: 'none' };
    const tier = Math.min(r.tier[st.id] || 0, 2);
    r.tier[st.id] = Math.min(3, (r.tier[st.id] || 0) + 1);
    r.hints++;
    r.ready = r.time + HINT_COOLDOWN;
    return { ok: true, step: st.id, tier: tier + 1, text: st.hints[tier] };
  }

  function hintWait() {
    const r = rs();
    return Math.max(0, Math.ceil(r.ready - r.time));
  }

  function tick(dt) {
    if (!(dt > 0) || dt > 10) return;
    const r = rs();
    if (!r.done) r.time += dt;
  }

  // ---- rooms ----
  const roomIndex = () => rooms.indexOf(room());
  function unlocked(id) {
    const i = rooms.findIndex((x) => x.id === id);
    return i === 0 || (i > 0 && !!s.rooms[rooms[i - 1].id]?.done);
  }
  function startRoom(id, freshRun = true) {
    if (!byId[id] || !unlocked(id)) return false;
    const i = rooms.findIndex((x) => x.id === id);
    s.cur = id;
    if (freshRun || !s.rooms[id]) {
      s.rooms[id] = newRoomState();
      s.inv = i > 0 ? (s.carry[rooms[i - 1].id] || []).slice() : [];
    }
    return true;
  }
  const next = () => rooms[roomIndex() + 1] || null;
  function advance() {
    const n = next();
    return n ? startRoom(n.id, true) : false;
  }
  function newGame() {
    const keep = { records: s.records, badges: s.badges };
    s = fresh();
    s.records = keep.records;
    s.badges = keep.badges;
  }
  // A whole new campaign keeps nothing; replaying one chapter keeps the records.
  function restartRoom() {
    return startRoom(s.cur, true);
  }

  function progress() {
    const l = stepList();
    return { done: l.filter((x) => x.isDone).length, total: l.length };
  }

  function summary() {
    return rooms.map((r) => ({ id: r.id, name: r.name, unlocked: unlocked(r.id), done: !!s.rooms[r.id]?.done, stars: s.records.stars[r.id] || 0, best: s.records.time[r.id] || 0 }));
  }

  return {
    get s() {
      return s;
    },
    rooms,
    items,
    get room() {
      return room();
    },
    get rs() {
      return rs();
    },
    thing,
    ev,
    visible,
    states,
    tap,
    useItem,
    combine,
    solveLock,
    learn,
    placeItem,
    setLockState,
    getLockState,
    stepList,
    hint,
    hintWait,
    hintStep,
    tick,
    unlocked,
    startRoom,
    advance,
    next,
    newGame,
    restartRoom,
    progress,
    summary,
    serialize: () => JSON.parse(JSON.stringify(s)),
    load(d) {
      const l = sanitize(d);
      if (l) s = l;
      return !!l;
    },
  };
}
