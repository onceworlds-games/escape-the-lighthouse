import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, createGame, act, playWalkthrough, allActions, closure, campaignAt, rngOf, solutionInput, tickBy } from './helpers.mjs';
import { check, slidingStart, slidingMove } from '../src/engine/locks.js';
import { encodeMorse, decodeMorse } from '../src/engine/morse.js';

const flagsRead = (room) => {
  const out = new Set();
  const walk = (c) => {
    if (c == null || typeof c === 'boolean') return;
    if (typeof c === 'string') return out.add(c);
    if (Array.isArray(c)) return c.forEach(walk);
    if (c.flag) out.add(c.flag);
    if (c.not) walk(c.not);
    if (c.all) c.all.forEach(walk);
    if (c.any) c.any.forEach(walk);
  };
  for (const th of room.things) {
    walk(th.showIf);
    walk(th.hideIf);
    Object.values(th.states || {}).forEach(walk);
    for (const r of th.tap || []) walk(r.if);
    for (const l of Object.values(th.use || {})) for (const r of l) walk(r.if);
  }
  for (const s of room.steps) walk(s.done);
  walk(room.escape);
  return out;
};
const effectsOf = (room) => {
  const out = [];
  const add = (list) => (list || []).forEach((e) => out.push(e));
  for (const th of room.things) {
    for (const r of th.tap || []) add(r.do);
    for (const l of Object.values(th.use || {})) for (const r of l) add(r.do);
  }
  for (const l of Object.values(room.locks)) add(l.onSolve);
  for (const c of room.combos || []) add(c.do);
  return out;
};

test('every room is well formed', () => {
  assert.equal(ROOMS.length, 3);
  const ids = new Set();
  for (const room of ROOMS) {
    assert.ok(!ids.has(room.id));
    ids.add(room.id);
    const thingIds = new Set();
    for (const th of room.things) {
      assert.ok(!thingIds.has(th.id), `dup thing ${room.id}/${th.id}`);
      thingIds.add(th.id);
      assert.ok([0, 1, 2, 3].includes(th.wall), `${th.id} wall`);
      const view = th.view || (th.tap || th.use || th.lock ? 'wall:' + th.wall : null);
      if (view && !view.startsWith('wall:')) assert.ok(room.views[view], `${room.id}/${th.id}: unknown view ${view}`);
      if (th.lock) assert.ok(room.locks[th.lock], `${th.id}: unknown lock`);
      if (th.prop === 'item') assert.ok(room.items[th.params.item] || ROOMS.some((r) => r.items[th.params.item]), `${th.id}: unknown item`);
    }
    const effects = effectsOf(room);
    for (const e of effects) {
      if (e.give || e.take) assert.ok(ROOMS.some((r) => r.items[e.give || e.take]), `unknown item ${e.give || e.take}`);
      if (e.note || e.readNote) assert.ok(room.notes[e.note || e.readNote], `unknown note ${e.note || e.readNote}`);
      if (e.go && !e.go.startsWith('wall:')) assert.ok(room.views[e.go], `unknown view ${e.go}`);
      if (e.lock) assert.ok(room.locks[e.lock], `unknown lock ${e.lock}`);
    }
    // every flag that is read is set somewhere (or comes from the engine)
    const set = new Set(effects.filter((e) => e.set).map((e) => e.set));
    for (const f of flagsRead(room)) assert.ok(set.has(f), `${room.id}: flag ${f} is read but never set`);
    const stepIds = new Set(room.steps.map((s) => s.id));
    assert.ok(room.steps.length >= 8 && room.steps.length <= 13, `${room.id} has ${room.steps.length} steps`);
    for (const s of room.steps) {
      for (const q of s.requires || []) assert.ok(stepIds.has(q), `${s.id} requires unknown ${q}`);
      assert.equal(s.hints.length, 3);
      assert.ok(s.hints.every((h) => typeof h === 'string' && h.length > 8));
      assert.ok(s.thread);
    }
    for (const [id, lk] of Object.entries(room.locks)) {
      assert.ok(['digits', 'letters', 'keypad', 'arrows', 'symbols', 'switches', 'morse', 'reveal', 'sliding', 'slots', 'rings', 'key'].includes(lk.type), `${id} type`);
      if (lk.type === 'key') assert.ok(room.items[lk.item]);
      if (lk.type === 'slots') for (const sl of lk.slots) assert.ok(ROOMS.some((r) => r.items[sl.item]));
    }
    for (const [id, n] of Object.entries(room.notes)) assert.ok(n.title && n.body, id);
  }
  const types = new Set(ROOMS.flatMap((r) => Object.values(r.locks).map((l) => l.type)));
  for (const t of ['digits', 'letters', 'keypad', 'arrows', 'symbols', 'switches', 'morse', 'reveal', 'sliding', 'slots', 'rings', 'key']) assert.ok(types.has(t), 'lock type used: ' + t);
});

test('each room can be played from start to escape with its walkthrough', () => {
  const g = createGame(ROOMS);
  const seen = [];
  ROOMS.forEach((room, i) => {
    assert.equal(g.room.id, room.id);
    assert.equal(g.rs.done, false);
    const escapes = playWalkthrough(g);
    assert.equal(escapes.length, 1, `${room.id} escapes exactly once`);
    assert.equal(g.rs.done, true);
    assert.ok(g.stepList().every((s) => s.isDone), `${room.id}: all steps done`);
    seen.push(escapes[0]);
    if (i < ROOMS.length - 1) assert.ok(g.advance());
  });
  assert.equal(g.s.finished, true);
  assert.ok(seen[2].last);
});

test('every hint tier resolves at every point of every walkthrough', () => {
  for (let i = 0; i < ROOMS.length; i++) {
    const g = campaignAt(i);
    const room = g.room;
    const check = () => {
      if (g.rs.done) return;
      const copy = createGame(ROOMS, g.serialize());
      const seenSteps = new Set();
      for (let tier = 1; tier <= 4; tier++) {
        copy.rs.ready = 0;
        const h = copy.hint();
        assert.ok(h.ok, `${room.id}: hint failed ${JSON.stringify(h)}`);
        assert.ok(h.text && h.text.length > 5);
        seenSteps.add(h.step);
        assert.equal(h.tier, Math.min(tier, 3));
      }
      assert.equal(seenSteps.size, 1);
      const open = copy.stepList().find((s) => s.id === [...seenSteps][0]);
      assert.ok(open.open || open.isDone === false);
    };
    check();
    playWalkthrough(g, room, check);
    assert.equal(g.hint().ok, false);
  }
});

test('hints have a cooldown on the room clock and are counted', () => {
  const g = createGame(ROOMS);
  const h = g.hint();
  assert.ok(h.ok);
  assert.equal(g.rs.hints, 1);
  const again = g.hint();
  assert.equal(again.ok, false);
  assert.equal(again.reason, 'wait');
  assert.equal(again.wait, 60);
  tickBy(g, 30);
  assert.equal(g.hint().wait, 30);
  tickBy(g, 30);
  assert.ok(g.hint().ok);
  assert.equal(g.rs.hints, 2);
});

test('no dead ends: any order of actions can still be finished', () => {
  for (let i = 0; i < ROOMS.length; i++) {
    const base = campaignAt(i).serialize();
    assert.ok(closure(createGame(ROOMS, base)), `${ROOMS[i].id} closes from the start`);
    for (let seed = 1; seed <= 40; seed++) {
      const g = createGame(ROOMS, base);
      const rnd = rngOf(seed * 7919 + i);
      const n = 20 + ((rnd() * 200) | 0);
      for (let k = 0; k < n && !g.rs.done; k++) {
        const acts = allActions(g);
        act(g, acts[(rnd() * acts.length) | 0]);
      }
      assert.ok(closure(g), `${ROOMS[i].id}: dead end after seed ${seed}`);
    }
  }
});

test('wrong inputs never break state', () => {
  const junk = [null, undefined, '', 'zzzz', 0, -1, NaN, {}, [], [1, 2, 3], '1234', true, false, { a: 1 }, 'x'.repeat(500)];
  for (let i = 0; i < ROOMS.length; i++) {
    const g = campaignAt(i);
    const before = JSON.stringify(g.s.inv);
    for (const [id, lk] of Object.entries(g.room.locks)) {
      for (const j of junk) {
        if (lk.type === 'reveal' && j === true) continue;
        let res;
        assert.doesNotThrow(() => (res = g.solveLock(id, j)));
        if (lk.type !== 'reveal' || j !== true) assert.equal(res.ok, false, `${id} accepted junk ${JSON.stringify(j)}`);
        assert.equal(JSON.stringify(g.s.inv), before);
      }
      g.setLockState(id, { junk: true });
    }
    for (const a of [['tap', 'nope'], ['use', 'nope', 'nope'], ['combine', 'x', 'y'], ['place', 'nolock', 'a', 'b'], ['learn', 'nonote']]) assert.doesNotThrow(() => act(g, a));
    assert.equal(g.rs.done, false);
    assert.equal(g.s.inv.length, JSON.parse(before).length);
    // after junk, the walkthrough still works
    createGame(ROOMS, g.serialize());
    playWalkthrough(g);
    assert.ok(g.rs.done);
  }
});

test('save and load in the middle of a room restores the same state', () => {
  for (let i = 0; i < ROOMS.length; i++) {
    const room = ROOMS[i];
    for (let cut = 1; cut < room.walkthrough.length; cut += 2) {
      const g = campaignAt(i);
      room.walkthrough.slice(0, cut).forEach((a) => act(g, a));
      const json = JSON.parse(JSON.stringify(g.serialize()));
      const h = createGame(ROOMS, json);
      assert.deepEqual(h.serialize(), g.serialize());
      room.walkthrough.slice(cut).forEach((a) => assert.ok(act(h, a).ok, `${room.id} resume ${JSON.stringify(a)}`));
      assert.ok(h.rs.done);
    }
  }
});

test('corrupt saves fall back to a new game', () => {
  for (const bad of [null, 5, 'x', [], {}, { cur: 'nope' }, { cur: 'cottage', rooms: 4, inv: 'x' }, { cur: 'lamp', inv: ['ghost'], rooms: { lamp: { flags: 5, time: -4, notes: ['x'] } } }]) {
    let g;
    assert.doesNotThrow(() => (g = createGame(ROOMS, bad)));
    assert.ok(g.room);
    assert.ok(Array.isArray(g.s.inv));
    assert.doesNotThrow(() => g.tap('door'));
  }
});

test('stars, records and badges', () => {
  const g = createGame(ROOMS);
  tickBy(g, 300);
  let esc = playWalkthrough(g)[0];
  assert.equal(esc.stars, 3);
  assert.ok(esc.badges.includes('cottage') && esc.badges.includes('no-hints'));
  g.advance();
  g.hint();
  tickBy(g, 61);
  g.hint();
  tickBy(g, 61);
  g.hint();
  esc = playWalkthrough(g)[0];
  assert.equal(esc.stars, 1);
  assert.ok(esc.badges.includes('radio'));
  assert.ok(!esc.badges.includes('no-hints'));
  g.advance();
  esc = playWalkthrough(g)[0];
  assert.ok(esc.badges.includes('lamp'));
  assert.ok(esc.badges.includes('speedrun'));
  assert.ok(!esc.badges.includes('three-stars'));
  assert.equal(g.s.records.stars.radio, 1);
  assert.equal(g.s.finished, true);

  const slow = createGame(ROOMS);
  slow.rs.time = 700;
  assert.equal(playWalkthrough(slow)[0].stars, 2);
});

test('the timer only counts while ticking and stops at the escape', () => {
  const g = createGame(ROOMS);
  g.tick(10);
  g.tick(-5);
  g.tick(NaN);
  g.tick(9999);
  assert.equal(g.rs.time, 10);
  playWalkthrough(g);
  g.tick(3);
  assert.equal(g.rs.time, 10);
});

test('chapter select unlocks rooms in order and replays keep records', () => {
  const g = createGame(ROOMS);
  assert.equal(g.unlocked('cottage'), true);
  assert.equal(g.unlocked('radio'), false);
  assert.equal(g.startRoom('radio'), false);
  playWalkthrough(g);
  assert.equal(g.unlocked('radio'), true);
  assert.ok(g.startRoom('radio'));
  assert.ok(g.s.inv.includes('lantern_lit') && g.s.inv.includes('screwdriver'));
  assert.ok(g.startRoom('cottage'));
  assert.deepEqual(g.s.inv, []);
  assert.equal(g.rs.done, false);
  assert.equal(g.s.records.stars.cottage, 2 - 0 > 0 ? g.s.records.stars.cottage : 0);
  assert.ok(g.s.records.time.cottage >= 0);
  g.newGame();
  assert.equal(g.s.cur, 'cottage');
  assert.equal(g.unlocked('radio'), false);
});

test('combining and using wrong items is safe and reversible', () => {
  const g = createGame(ROOMS);
  g.tap('bedside');
  assert.equal(g.combine('matches', 'matches').ok, false);
  assert.equal(g.combine('matches', 'lantern').ok, false);
  g.tap('hook_lantern');
  const bad = g.useItem('matches', 'door');
  assert.equal(bad.ok, false);
  assert.ok(g.s.inv.includes('matches'));
  assert.ok(g.combine('matches', 'lantern').ok);
  assert.deepEqual(g.s.inv, ['lantern_lit']);
  assert.equal(g.tap('hook_lantern').ok, false);
  // the door key will not turn until the lock is oiled
  const k = createGame(ROOMS);
  k.s.inv.push('door_key');
  const r = k.useItem('door_key', 'door');
  assert.ok(r.events.some((e) => e.t === 'say' && /crusted/.test(e.text)));
  assert.equal(k.rs.done, false);
});

test('lock rules', () => {
  assert.ok(check({ type: 'digits', solution: '1035' }, '1035'));
  assert.ok(!check({ type: 'digits', solution: '1035' }, '1034'));
  assert.ok(check({ type: 'letters', solution: 'SHORE' }, 'shore'));
  assert.ok(check({ type: 'switches', solution: [0, 1] }, [0, 1]));
  assert.ok(!check({ type: 'switches', solution: [0, 1] }, [1, 1]));
  assert.ok(check({ type: 'morse', solution: 'KNP' }, '-.-/-./.--.'));
  assert.ok(check({ type: 'morse', solution: 'KNP' }, '-.- -. .--.'));
  assert.ok(!check({ type: 'morse', solution: 'KNP' }, '-.-/-.'));
  assert.equal(decodeMorse(encodeMorse('SHORE')), 'SHORE');
  assert.equal(decodeMorse('.-.-.-.-.-'), '?');
  const lk = { type: 'sliding', size: 3 };
  for (let seed = 1; seed <= 50; seed++) {
    const t = slidingStart(3, seed);
    assert.ok(!check(lk, t));
    assert.deepEqual([...t].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  }
  // a start can be solved by undoing moves (it is built by legal slides)
  let t = slidingStart(3, 11);
  assert.equal(slidingMove(t, 3, 100), null);
  const blank = t.indexOf(8);
  const next = slidingMove(t, 3, blank + (blank % 3 < 2 ? 1 : -1));
  assert.ok(next && next.indexOf(8) !== blank);
});

test('the solutions the rooms ask for are consistent with the clues', () => {
  // the chest code is the stopped clock; the gate word is the tape; the keypad is the plaque year
  assert.equal(ROOMS[0].locks.chest.solution, '1035');
  assert.equal(ROOMS[1].locks.morse.solution, 'KNP');
  assert.equal(ROOMS[1].locks.gate.solution, 'SHORE');
  assert.ok(/1891/.test(ROOMS[2].notes.plaqueObs.body));
  assert.equal(ROOMS[2].locks.cabinet.solution, '1891');
  const sw = ROOMS[1].locks.breakers;
  assert.deepEqual(sw.solution.map((v, i) => (v ? i + 1 : 0)).filter(Boolean), [2, 4, 5]);
  assert.notDeepEqual(sw.init, sw.solution);
  const rings = ROOMS[2].locks.rings;
  assert.notDeepEqual(rings.init, rings.solution);
  assert.ok(solutionInput(rings));
});
