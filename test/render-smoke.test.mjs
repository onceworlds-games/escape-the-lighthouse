// Builds every prop, shell and item with a stub canvas, so a typo in a builder fails here and not on a player's phone.
import test from 'node:test';
import assert from 'node:assert/strict';

const noop = () => {};
const ctxProxy = () =>
  new Proxy(
    {},
    {
      get: (t, k) => {
        if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop: noop });
        if (k === 'measureText') return () => ({ width: 10 });
        if (k === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
        if (k in t) return t[k];
        return noop;
      },
      set: (t, k, v) => ((t[k] = v), true),
    }
  );
globalThis.document = {
  createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => ctxProxy(), toDataURL: () => 'data:' }),
};
globalThis.Path2D = class {};
globalThis.devicePixelRatio = 1;

const { ROOMS } = await import('./helpers.mjs');
const { makeProp } = await import('../src/render/props_core.js');
await import('../src/render/props_a.js');
await import('../src/render/props_b.js');
const { buildItem, itemIds } = await import('../src/render/items.js');
const { buildShell } = await import('../src/render/shell.js');
const { mergeStatic, THREE } = await import('../src/render/gfx.js');

test('every item model builds', () => {
  for (const r of ROOMS) for (const id of Object.keys(r.items)) {
    const g = buildItem(id);
    assert.ok(g.children.length > 0, id);
    const bb = new THREE.Box3().setFromObject(g);
    const s = bb.getSize(new THREE.Vector3());
    assert.ok(Number.isFinite(s.x) && s.x > 0.02 && s.x < 1.5, `${id} size ${s.x}`);
  }
  assert.ok(itemIds().length >= 20);
});

test('every prop of every room builds, runs its state and update, and merges', () => {
  for (const room of ROOMS) {
    for (const th of room.things) {
      if (!th.prop) continue;
      const g = makeProp(th.prop, th.params, th);
      assert.ok(g.children.length > 0, `${room.id}/${th.id} (${th.prop}) is empty`);
      if (g.userData.setState) {
        const states = {};
        for (const k of Object.keys(th.states || {})) states[k] = true;
        assert.doesNotThrow(() => g.userData.setState(states, true), `${th.id} setState`);
        for (const k of Object.keys(states)) states[k] = false;
        assert.doesNotThrow(() => g.userData.setState(states, true));
      }
      if (g.userData.update) assert.doesNotThrow(() => g.userData.update(0.016, 1.2));
      assert.doesNotThrow(() => mergeStatic(g), `${th.id} merge`);
    }
  }
});

test('every room shell builds', () => {
  for (const room of ROOMS) {
    const s = buildShell(room, 'high');
    assert.ok(s.root.children.length > 0);
    assert.equal(typeof s.frame.place, 'function');
  }
});

test('a room stays under the draw call budget', () => {
  for (const room of ROOMS) {
    let n = 0;
    const count = (o) => o.traverse((c) => (c.isMesh || c.isSprite) && c.visible !== false && n++);
    count(buildShell(room, 'high').root);
    const decor = new THREE.Group();
    for (const th of room.things) {
      if (!th.prop) continue;
      const g = makeProp(th.prop, th.params, th);
      const dynamic = th.tap || th.use || th.lock || th.states || th.showIf || th.hideIf || g.userData.update || g.userData.setState;
      if (dynamic) {
        mergeStatic(g);
        count(g);
      } else decor.add(g);
    }
    mergeStatic(decor);
    count(decor);
    n += 14; // sky, sea, rain, rocks, tower
    console.log(`${room.id}: about ${n} meshes`);
    assert.ok(n < 250, `${room.id} has ${n}`);
  }
});
