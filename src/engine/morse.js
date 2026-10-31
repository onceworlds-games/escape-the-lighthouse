// International Morse code, pure. Input strings use '.' and '-' for marks and '/' (or a space) between letters.
export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export function encodeMorse(word) {
  return String(word)
    .toUpperCase()
    .split('')
    .filter((c) => MORSE[c])
    .map((c) => MORSE[c])
    .join('/');
}

// "-.-/-./.--." -> "KNP"; unknown groups decode to '?'.
export function decodeMorse(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .split(/[\/\s]+/)
    .filter(Boolean)
    .map((g) => REVERSE[g] || '?')
    .join('');
}
