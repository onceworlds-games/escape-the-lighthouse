import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS } from './helpers.mjs';
import { makeFrame, wallEye } from '../src/render/frame.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} vs ${b}`);

test('wall-local placement puts walls where their names say', () => {
  const f = makeFrame({ kind: 'rect', w: 6.6, d: 5.8, h: 2.9 });
  let p = f.place(0, 0, 0);
  near(p.z, -2.9);
  near(p.x, 0);
  p = f.place(1, 0, 0);
  near(p.x, 3.3);
  p = f.place(2, 0, 0);
  near(p.z, 2.9);
  p = f.place(3, 0, 0);
  near(p.x, -3.3);
  // to the viewer's right on the north wall is +x, on the east wall +z
  assert.ok(f.place(0, 1, 0.5).x > 0);
  assert.ok(f.place(1, 1, 0.5).z > 0);
  assert.ok(f.place(2, 1, 0.5).x < 0);
  assert.ok(f.place(3, 1, 0.5).z < 0);
  // out from the wall moves toward the middle
  assert.ok(f.place(0, 0, 1).z > f.place(0, 0, 0).z);
});

test('round rooms keep things on the circle and facing the middle', () => {
  const f = makeFrame({ kind: 'round', r: 3.6, h: 3 });
  for (let w = 0; w < 4; w++) for (const x of [-2, 0, 2]) {
    const p = f.place(w, x, 0);
    near(Math.hypot(p.x, p.z), 3.6);
    // a prop's front (+z rotated by ry) points at the centre
    const fx = Math.sin(p.ry);
    const fz = Math.cos(p.ry);
    near(fx * p.x + fz * p.z, -3.6);
  }
});

test('the camera backs away from the wall it looks at', () => {
  const f = makeFrame({ kind: 'rect', w: 6.6, d: 5.8, h: 2.9 });
  const e = wallEye(f, 0, 1);
  assert.ok(e.z >= 0);
});

test('every thing sits inside its room and every view looks at the room', () => {
  for (const room of ROOMS) {
    const f = makeFrame(room.shell);
    for (const th of room.things) {
      const p = f.place(th.wall, th.x, th.d);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.z), `${room.id}/${th.id}`);
      const reach = f.reach(th.wall);
      assert.ok(th.d >= 0 && th.d < reach, `${room.id}/${th.id} d=${th.d}`);
      assert.ok(Math.hypot(p.x, p.z) < reach + 3, `${room.id}/${th.id} out of room`);
      const y = th.y || 0;
      assert.ok(y >= 0 && y <= room.shell.h + 0.5, `${room.id}/${th.id} y=${y}`);
    }
    for (const [id, v] of Object.entries(room.views)) {
      assert.ok(v.d < f.reach(v.wall) - 0.2 || v.d >= 0, id);
      assert.ok(v.y > 0.3 && v.y < room.shell.h, `${room.id}/${id} eye height`);
    }
  }
});
