// Line symbols on a 100x100 grid. Used by the 3D plates, the ring lock and the toolbox.
export const SYMBOLS = {
  anchor: 'M50 14 a7 7 0 1 0 0.01 0 M50 28 V84 M34 40 H66 M18 60 Q24 88 50 88 Q76 88 82 60 M18 60 L10 70 M18 60 L28 68 M82 60 L90 70 M82 60 L72 68',
  star: 'M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z',
  wave: 'M8 34 Q20 18 32 34 T56 34 T80 34 T96 34 M4 54 Q16 38 28 54 T52 54 T76 54 T92 54 M8 74 Q20 58 32 74 T56 74 T80 74 T96 74',
  shell: 'M50 86 L14 42 Q50 4 86 42 Z M50 86 L50 20 M50 86 L32 26 M50 86 L68 26 M50 86 L21 34 M50 86 L79 34',
  bell: 'M50 10 V20 M24 72 Q28 30 50 22 Q72 30 76 72 Z M16 72 H84 M42 80 Q50 94 58 80',
  fish: 'M10 50 Q34 18 62 38 L90 22 L82 50 L90 78 L62 62 Q34 82 10 50 Z M28 46 h0.01',
  sun: 'M50 32 a18 18 0 1 0 0.01 0 M50 4 V16 M50 84 V96 M4 50 H16 M84 50 H96 M17 17 L26 26 M74 74 L83 83 M83 17 L74 26 M26 74 L17 83',
  key: 'M30 50 a15 15 0 1 0 0.01 0 M45 50 H92 M76 50 V66 M88 50 V62',
  circle: 'M50 14 a36 36 0 1 0 0.01 0',
  triangle: 'M50 10 L92 86 H8 Z',
  square: 'M14 14 H86 V86 H14 Z',
  diamond: 'M50 6 L92 50 L50 94 L8 50 Z',
};
const cache = {};
export function drawSymbol(ctx, name, cx, cy, size, color, lw = 7, fill = null) {
  const d = SYMBOLS[name];
  if (!d) return;
  const p = (cache[name] ||= new Path2D(d));
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 100, size / 100);
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  ctx.strokeStyle = color;
  ctx.stroke(p);
  ctx.restore();
}
