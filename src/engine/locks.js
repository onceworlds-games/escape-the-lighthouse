// Lock rules, pure: what counts as the right input for each kind of lock, and a solvable sliding-tile shuffle.
import { decodeMorse } from './morse.js';

export const LOCK_TYPES = ['digits', 'letters', 'keypad', 'arrows', 'symbols', 'switches', 'morse', 'reveal', 'sliding', 'slots', 'rings', 'key'];

const same = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (String(a[i]) !== String(b[i])) return false;
  return true;
};

export function check(lock, input) {
  if (!lock) return false;
  switch (lock.type) {
    case 'digits':
    case 'letters':
    case 'keypad':
    case 'arrows':
      return typeof input === 'string' && input.toUpperCase() === String(lock.solution).toUpperCase();
    case 'symbols':
    case 'rings':
    case 'switches':
      return same(input, lock.solution);
    case 'morse':
      return decodeMorse(input) === String(lock.solution).toUpperCase();
    case 'sliding':
      return Array.isArray(input) && input.length === lock.size * lock.size && input.every((v, i) => v === i);
    case 'reveal':
      return input === true;
    default:
      return false;
  }
}

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function neighbours(idx, n) {
  const x = idx % n;
  const y = (idx / n) | 0;
  const out = [];
  if (x > 0) out.push(idx - 1);
  if (x < n - 1) out.push(idx + 1);
  if (y > 0) out.push(idx - n);
  if (y < n - 1) out.push(idx + n);
  return out;
}

// Tiles hold their home index; the blank is the last tile (n*n-1). Moves are always legal slides, so it is solvable.
export function slidingStart(n, seed, moves = 80) {
  const r = rng(seed);
  const tiles = Array.from({ length: n * n }, (_, i) => i);
  let blank = n * n - 1;
  let prev = -1;
  for (let i = 0; i < moves || tiles.every((v, k) => v === k); i++) {
    const opts = neighbours(blank, n).filter((k) => k !== prev);
    const pick = opts[(r() * opts.length) | 0];
    tiles[blank] = tiles[pick];
    tiles[pick] = n * n - 1;
    prev = blank;
    blank = pick;
  }
  return tiles;
}

export function slidingMove(tiles, n, idx) {
  const blank = tiles.indexOf(n * n - 1);
  if (idx < 0 || idx >= tiles.length || !neighbours(blank, n).includes(idx)) return null;
  const next = tiles.slice();
  next[blank] = next[idx];
  next[idx] = n * n - 1;
  return next;
}
