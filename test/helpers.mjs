import { ROOMS } from '../src/data/index.js';
import { createGame } from '../src/engine/game.js';
import { encodeMorse } from '../src/engine/morse.js';

export { ROOMS, createGame };

export const identity = (n) => Array.from({ length: n * n }, (_, i) => i);

export function act(g, a) {
  const [k, ...r] = a;
  switch (k) {
    case 'tap':
      return g.tap(r[0]);
    case 'use':
      return g.useItem(r[0], r[1]);
    case 'combine':
      return g.combine(r[0], r[1]);
    case 'lock': {
      const lk = g.room.locks[r[0]];
      return g.solveLock(r[0], r[1] === 'solved' ? identity(lk.size) : r[1]);
    }
    case 'place':
      return g.placeItem(r[0], r[1], r[2]);
    case 'learn':
      return g.learn(r[0]);
    default:
      throw new Error('unknown action ' + k);
  }
}

export function solutionInput(lk) {
  switch (lk.type) {
    case 'morse':
      return encodeMorse(lk.solution);
    case 'sliding':
      return identity(lk.size);
    case 'reveal':
      return true;
    default:
      return lk.solution;
  }
}

export function playWalkthrough(g, room = g.room, onStep) {
  const escapes = [];
  room.walkthrough.forEach((a, i) => {
    const res = act(g, a);
    if (!res.ok) throw new Error(`${room.id}: walkthrough step ${i} ${JSON.stringify(a)} failed: ${JSON.stringify(res.events)}`);
    for (const e of res.events) if (e.t === 'escape') escapes.push(e);
    if (onStep) onStep(i, a);
  });
  return escapes;
}

export function allActions(g) {
  const acts = [];
  const inv = g.s.inv.slice();
  for (const th of g.room.things) {
    acts.push(['tap', th.id]);
    for (const it of inv) acts.push(['use', it, th.id]);
  }
  for (let i = 0; i < inv.length; i++) for (let j = i + 1; j < inv.length; j++) acts.push(['combine', inv[i], inv[j]]);
  for (const [id, lk] of Object.entries(g.room.locks)) {
    if (lk.type === 'slots') for (const sl of lk.slots) for (const it of inv) acts.push(['place', id, sl.id, it]);
    else if (lk.type !== 'key') acts.push(['lock', id, solutionInput(lk)]);
  }
  for (const n of Object.keys(g.room.notes)) acts.push(['learn', n]);
  return acts;
}

export function closure(g, rounds = 60) {
  for (let r = 0; r < rounds; r++) {
    if (g.rs.done) return true;
    const before = JSON.stringify(g.s);
    for (const a of allActions(g)) act(g, a);
    if (JSON.stringify(g.s) === before) break;
  }
  return !!g.rs.done;
}

// A campaign positioned at the start of room index i, by playing the earlier rooms' walkthroughs.
export function campaignAt(i) {
  const g = createGame(ROOMS);
  for (let k = 0; k < i; k++) {
    playWalkthrough(g);
    g.advance();
  }
  return g;
}

export function rngOf(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tickBy(g, secs) {
  for (let left = secs; left > 0; left -= 5) g.tick(Math.min(5, left));
}
