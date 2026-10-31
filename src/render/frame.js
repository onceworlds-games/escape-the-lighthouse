// Wall-local coordinates: wall 0 N, 1 E, 2 S, 3 W; x runs along the wall (to the viewer's right), d out from the wall.
// Pure numbers, so it can be tested without a renderer.
export const EYE = 1.55;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const RIGHTS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export function makeFrame(shell) {
  if (shell.kind === 'rect') {
    const a = [shell.d / 2, shell.w / 2, shell.d / 2, shell.w / 2];
    return {
      kind: 'rect',
      h: shell.h,
      a,
      reach: (w) => a[w],
      place(w, x, d) {
        return { x: DIRS[w][0] * (a[w] - d) + RIGHTS[w][0] * x, z: DIRS[w][1] * (a[w] - d) + RIGHTS[w][1] * x, ry: (-w * Math.PI) / 2 };
      },
    };
  }
  const R = shell.r;
  return {
    kind: 'round',
    h: shell.h,
    R,
    reach: () => R,
    place(w, x, d) {
      const r = Math.max(R - d, 0.3);
      const th = (w * Math.PI) / 2 + x / r;
      return { x: Math.sin(th) * r, z: -Math.cos(th) * r, ry: -th };
    },
  };
}

// The view a wall gives: camera backed off by `back` so a narrow screen sees more of it.
export function wallEye(frame, w, back) {
  const p = frame.place(w, 0, frame.reach(w) * 2);
  const k = back / (frame.reach(w) * 2 || 1);
  return { x: p.x * k, z: p.z * k };
}
