import { THREE, M, std, mat, tex, paintPlanks, paintStone, paintPlaster, paintFabric, paintRug, paintMetal, paintPaper, drawText, FONT, TAU } from './gfx.js';

export const PROPS = {};
export const def = (name, fn) => (PROPS[name] = fn);

export function makeProp(name, params, thing) {
  const g = new THREE.Group();
  g.userData.isProp = true;
  const fn = PROPS[name];
  if (!fn) {
    console.warn('[lighthouse] no prop', name);
    return g;
  }
  fn(g, params || {}, thing || {});
  return g;
}

// ---- shared materials ----
const wood = (name, base, n = 2, rough = 0.72) =>
  mat('wood' + name, () => std(0xffffff, rough, 0, { map: tex('woodT' + name, 256, 256, (c, w, h) => paintPlanks(c, w, h, base, { n, vertical: true, seed: name.length * 7 + n })) }));
export const OAK = () => wood('oak', [128, 86, 50], 2);
export const DARK = () => wood('dark', [72, 46, 28], 2);
export const PINE = () => wood('pine', [176, 136, 88], 3, 0.8);
export const GREY = () => wood('grey', [120, 112, 100], 3, 0.9);
export const stoneMat = (rows = 6) => mat('stoneT' + rows, () => std(0xffffff, 0.95, 0, { map: tex('stoneTx' + rows, 512, 512, (c, w, h) => paintStone(c, w, h, [118, 112, 104], { rows, seed: rows })) }));
export const fabricMat = (key, base, stripe) => mat('fab' + key, () => std(0xffffff, 0.95, 0, { map: tex('fabT' + key, 128, 128, (c, w, h) => paintFabric(c, w, h, base, stripe)) }));
export const paperTexMat = (key, w, h, paint, rough = 0.85) => mat('pm' + key, () => std(0xffffff, rough, 0, { map: tex('pmT' + key, w, h, paint) }));
export const shade = (c) => M.painted(c);

export const stoneTile = () => mat('stoneTile', () => std(0xffffff, 0.95, 0, { map: tex('stoneTileT', 512, 512, (c, w, h) => paintStone(c, w, h, [122, 116, 108], { rows: 6, seed: 4 }), { repeat: [1, 1] }) }));
