// The 3D stage: renderer, room, lights, weather, camera rig, picking, item icons and the inspect view.
import { THREE, M, std, mat, tween, ease, updateTweens, clearTweens, mergeStatic, clamp, lerp, TAU, rad, glow, box, cyl, sph, group, disposeTree, clearTexCache, clearMatCache, clearGeoCache } from './gfx.js';
import { makeFrame, EYE } from './frame.js';
import { buildShell } from './shell.js';
import { makeProp } from './props_core.js';
import './props_a.js';
import './props_b.js';
import { buildOutside, updateOutside, placeShip, SEA_Y } from './weather.js';
import { buildItem } from './items.js';

const shortest = (from, to) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from));
const LIGHT_K = 10;

export class Stage {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.quality = opts.quality || 'high';
    this.reduced = !!opts.reduced;
    this.poster = !!opts.poster;
    this.pixelRatio = opts.pixelRatio || Math.min(devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.quality !== 'low', powerPreference: 'high-performance', preserveDrawingBuffer: this.poster, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(60, 1, 0.05, 900);
    this.cam.rotation.order = 'YXZ';
    this.time = 0;
    this.flash = 0;
    this.nextFlash = 3 + Math.random() * 4;
    this.trauma = 0;
    this.shakeT = 0;
    this.pan = 0;
    this.mouse = { x: 0, y: 0 };
    this.pose = { px: 0, py: EYE, pz: 0, yaw: 0, pitch: -0.03, fov: 60 };
    this.view = 'wall:0';
    this.wall = 0;
    this.hits = [];
    this.things = new Map();
    this.updaters = [];
    this.lights = [];
    this.iconCache = new Map();
    this.iconScene = null;
    this.inspect = null;
    this.onThunder = null;
    this.w = 1;
    this.h = 1;
    this.progress = 0;
    this.finale = null;
    this.beamAngle = 0;
    this.spin = 0;
  }

  resize(w, h, pr) {
    this.w = Math.max(2, w | 0);
    this.h = Math.max(2, h | 0);
    if (pr) this.pixelRatio = pr;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.w, this.h, false);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.cam.aspect = this.w / this.h;
    this.cam.updateProjectionMatrix();
    if (this.room) this.applyPose(this.currentPoseTarget(), true);
  }

  setQuality(q, pr) {
    this.quality = q;
    this.renderer.shadowMap.enabled = q !== 'low';
    if (pr) this.pixelRatio = pr;
    this.resize(this.w, this.h);
    for (const l of this.lights) if (l.light.shadow) this.sizeShadow(l.light);
    if (this.moon) this.sizeShadow(this.moon);
    this.scene.traverse((o) => {
      if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true;
    });
  }

  sizeShadow(l) {
    const s = this.quality === 'high' ? 2048 : this.quality === 'medium' ? 1024 : 512;
    l.castShadow = this.quality !== 'low' && l.userData.wantShadow !== false;
    if (l.shadow.mapSize.x !== s && l.castShadow) {
      l.shadow.mapSize.set(l.isDirectionalLight ? s : s / 2, l.isDirectionalLight ? s : s / 2);
      if (l.shadow.map) {
        l.shadow.map.dispose();
        l.shadow.map = null;
      }
    }
  }

  // ---------- rooms ----------
  clearRoom() {
    clearTweens();
    if (this.scene) {
      this.scene.traverse((o) => {
        if (o.userData && o.userData.merged && o.geometry) o.geometry.dispose();
        if (o.isMesh && o.geometry && !o.userData.merged) o.geometry.dispose?.();
      });
      this.scene.clear();
    }
    this.hits = [];
    this.things.clear();
    this.updaters = [];
    this.lights = [];
    this.moon = null;
    this.outside = null;
  }

  loadRoom(room, game) {
    this.clearRoom();
    this.settled = false;
    this.room = room;
    this.game = game;
    const env = room.env;
    this.env = env;
    this.scene.background = new THREE.Color(env.sky);
    this.scene.fog = new THREE.FogExp2(env.fog, env.fogDensity);
    const shell = buildShell(room, this.quality);
    this.frame = shell.frame;
    this.scene.add(shell.root);
    this.shellRoot = shell.root;
    this.drops = [];
    shell.root.traverse((o) => {
      if (o.userData.windowDrops) this.drops.push(o);
    });
    // weather and the world outside
    this.outside = buildOutside(env, this.quality);
    this.scene.add(this.outside.g);
    // lights
    this.amb = new THREE.HemisphereLight(0x5d78ad, 0x2a1d14, env.ambientI * 1.0);
    this.scene.add(this.amb);
    this.fill = new THREE.AmbientLight(env.ambient, 0.55);
    this.scene.add(this.fill);
    const moon = new THREE.DirectionalLight(env.moon.color, env.moon.i * 1.6);
    moon.position.set(...env.moon.from);
    moon.target.position.set(0, 1, 0);
    moon.castShadow = true;
    moon.shadow.camera.left = -5;
    moon.shadow.camera.right = 5;
    moon.shadow.camera.top = 5;
    moon.shadow.camera.bottom = -5;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 40;
    moon.shadow.bias = -0.0004;
    moon.shadow.normalBias = 0.04;
    moon.shadow.radius = 4;
    this.scene.add(moon, moon.target);
    this.moon = moon;
    this.sizeShadow(moon);
    for (const l of room.lights || []) {
      const p = this.frame.place(l.wall, l.x, l.d);
      let light;
      if (l.shadow && this.quality !== 'low') {
        light = new THREE.SpotLight(l.color, l.i * LIGHT_K, l.dist * 1.6, 1.25, 1, 2);
        light.target.position.set(0, 0.4, 0);
        this.scene.add(light.target);
        light.shadow.camera.near = 0.3;
        light.shadow.camera.far = 14;
        light.shadow.bias = -0.0006;
        light.shadow.normalBias = 0.03;
        light.shadow.radius = 5;
        light.castShadow = true;
        this.sizeShadow(light);
      } else {
        light = new THREE.PointLight(l.color, l.i * LIGHT_K, l.dist * 1.6, 2);
      }
      light.position.set(p.x, l.y, p.z);
      this.scene.add(light);
      this.lights.push({ light, base: l.i * LIGHT_K, flicker: l.flicker || 0, showIf: l.showIf, phase: Math.random() * 10, def: l });
      if (l.fixture === 'hanging') this.addHanging(p.x, l.y, p.z, room.shell.h);
    }
    // things
    const decor = new THREE.Group();
    const dyn = new THREE.Group();
    this.scene.add(decor, dyn);
    for (const th of room.things) {
      let g = null;
      const place = this.frame.place(th.wall, th.x, th.d);
      if (th.prop) {
        g = makeProp(th.prop, th.params, th);
        g.position.set(place.x, th.y || 0, place.z);
        g.rotation.y = place.ry + rad(th.ry || 0);
        const interactive = !!(th.tap || th.use || th.lock);
        if (!interactive && !th.states && !th.showIf && !th.hideIf && !g.userData.update && !g.userData.setState) decor.add(g);
        else {
          dyn.add(g);
          g.updateMatrixWorld(true);
          mergeStatic(g);
        }
        if (g.userData.update) this.updaters.push(g.userData.update);
      }
      const rec = { th, group: g, hit: null, enabled: false };
      if (th.tap || th.use || th.lock) {
        const hs = th.hit || [0.5, 0.5, 0.5];
        const hm = new THREE.Mesh(new THREE.BoxGeometry(hs[0], hs[1], hs[2]), new THREE.MeshBasicMaterial({ visible: false }));
        hm.userData.thingId = th.id;
        if (g) {
          hm.position.set(hs[3] ?? 0, hs[4] ?? hs[1] / 2, hs[5] ?? 0);
          g.add(hm);
        } else {
          hm.position.set(place.x, th.y || 0, place.z);
          hm.rotation.y = place.ry;
          this.scene.add(hm);
        }
        rec.hit = hm;
        this.hits.push(rec);
      }
      this.things.set(th.id, rec);
    }
    decor.updateMatrixWorld(true);
    mergeStatic(decor);
    this.decor = decor;
    this.dyn = dyn;
    this.view = 'wall:' + (room.start?.wall ?? 0);
    this.wall = room.start?.wall ?? 0;
    this.pan = 0;
    this.refresh(true);
    this.applyPose(this.currentPoseTarget(), true);
    this.scene.updateMatrixWorld(true);
  }

  addHanging(x, y, z, h) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    cyl(g, M.iron(), 0.012, 0.012, h - y, 0, (h + y) / 2, 0, { seg: 4 });
    cyl(g, M.iron(), 0.22, 0.05, 0.16, 0, y + 0.1, 0, { seg: 14 });
    cyl(g, M.glass(), 0.09, 0.09, 0.18, 0, y - 0.04, 0, { seg: 10, cast: false });
    sph(g, M.flame(), 0.045, 0, y - 0.04, 0, { sy: 1.5, cast: false, seg: 8 });
    glow(g, 0xffb050, 1.4, 0, y - 0.04, 0, 0.6);
    this.scene.add(g);
  }

  // Apply the game's state to what is seen: which things show, their open/closed states, lights.
  refresh(instant = false) {
    const game = this.game;
    if (!game) return;
    for (const rec of this.things.values()) {
      const th = rec.th;
      const vis = game.visible(th);
      if (rec.group) {
        rec.group.visible = vis;
        if (vis && rec.group.userData.setState) rec.group.userData.setState(game.states(th), instant || !this.settled);
      }
      rec.show = vis;
      rec.enabled = vis && this.viewOf(th) === this.view;
    }
    for (const l of this.lights) l.light.visible = !l.showIf || game.ev(l.showIf);
    this.settled = true;
    const p = game.progress();
    this.setProgress(p.total ? p.done / p.total : 0);
  }

  viewOf(th) {
    return th.view || 'wall:' + th.wall;
  }

  setProgress(p) {
    this.progress = p;
    if (this.outside) placeShip(this.outside, p, this.finale ? this.finale.turn : 0);
  }

  // ---------- camera ----------
  aspect() {
    return this.w / this.h;
  }
  wallTarget(w) {
    const a = this.aspect();
    const t = clamp((1.3 - a) / 0.85, 0, 1);
    const fov = lerp(60, 80, t);
    const reach = this.frame.reach((w + 2) % 4) - 0.9;
    const back = Math.min(1.25 * t, Math.max(0, reach));
    const p = this.frame.place(w, 0, 0);
    const len = Math.hypot(p.x, p.z) || 1;
    return { px: (-p.x / len) * back, pz: (-p.z / len) * back, py: EYE, yaw: (-w * Math.PI) / 2, pitch: lerp(-0.17, -0.09, t), fov, panMax: lerp(0.3, 0.62, t) };
  }
  viewDef(id) {
    return this.room.views[id];
  }
  closeTarget(id) {
    const v = this.viewDef(id);
    const a = this.aspect();
    const fov = v.fov || 42;
    const th = Math.tan(rad(fov) / 2);
    const need = (v.wid || 0.8) / (th * Math.min(a, 1.8));
    const reach = this.frame.reach(v.wall);
    const dcam = Math.min(Math.max(v.d, need), reach - 0.35);
    const pos = this.frame.place(v.wall, v.x, dcam);
    const tgt = this.frame.place(v.wall, v.x, v.td ?? 0.3);
    const dx = tgt.x - pos.x;
    const dz = tgt.z - pos.z;
    const dy = v.ty - v.y;
    const yaw = Math.atan2(-dx, -dz);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    // aim a little low on phones so the view sits above the inventory bar
    return { px: pos.x, pz: pos.z, py: v.y, yaw, pitch, fov, panMax: 0 };
  }
  currentPoseTarget() {
    return this.view.startsWith('wall:') ? this.wallTarget(+this.view.slice(5)) : this.closeTarget(this.view);
  }
  applyPose(t, instant, dur = 0.9) {
    (this.dbgLog ||= []).push(`${instant ? 'I' : 'T'}${t.yaw.toFixed(2)}`);
    if (this.dbgLog.length > 6) this.dbgLog.shift();
    this.panMax = t.panMax || 0;
    const target = { px: t.px, py: t.py, pz: t.pz, yaw: shortest(this.pose.yaw, t.yaw), pitch: t.pitch, fov: t.fov };
    if (instant) Object.assign(this.pose, target);
    else tween(this.pose, target, dur, ease.inOut);
  }

  async goView(id, instant = false) {
    if (id === this.view) return;
    const wasWall = this.view.startsWith('wall:');
    this.view = id;
    if (id.startsWith('wall:')) this.wall = +id.slice(5);
    this.pan = 0;
    this.refresh();
    const dur = instant ? 0 : wasWall && !id.startsWith('wall:') ? 0.85 : 0.75;
    this.applyPose(this.currentPoseTarget(), instant, dur);
    if (!instant) await new Promise((r) => setTimeout(r, dur * 800));
  }

  turn(dir) {
    if (!this.view.startsWith('wall:')) return;
    const w = (this.wall + dir + 4) % 4;
    this.wall = w;
    this.view = 'wall:' + w;
    this.pan = 0;
    this.refresh();
    const t = this.wallTarget(w);
    this.panMax = t.panMax;
    // a right turn lowers the yaw by a quarter; the sweep always runs the way you pressed
    const yaw = this.pose.yaw + (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    tween(this.pose, { px: t.px, py: t.py, pz: t.pz, yaw, pitch: t.pitch, fov: t.fov }, 0.7, ease.inOut);
  }

  addPan(d) {
    this.pan = clamp(this.pan + d, -this.panMax, this.panMax);
  }
  panOverflow(d) {
    return this.pan + d;
  }

  addTrauma(t) {
    if (this.reduced) return;
    this.trauma = Math.min(1, this.trauma + t);
  }

  // ---------- picking and projection ----------
  pick(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.raycaster ||= new THREE.Raycaster();
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(ndc, this.cam);
    const meshes = this.hits.filter((h) => h.enabled).map((h) => h.hit);
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.thingId : null;
  }

  // A hit that is just outside the view still counts for the nearest big target: be generous on touch.
  pickNear(cx, cy, radius = 36) {
    const exact = this.pick(cx, cy);
    if (exact) return exact;
    const r = this.canvas.getBoundingClientRect();
    let best = null;
    let bd = radius;
    for (const h of this.hits) {
      if (!h.enabled) continue;
      const b = this.screenBox(h.th.id);
      if (!b) continue;
      const dx = Math.max(b.x - cx, 0, cx - (b.x + b.w));
      const dy = Math.max(b.y - cy, 0, cy - (b.y + b.h));
      const d = Math.hypot(dx, dy);
      if (d < bd) {
        bd = d;
        best = h.th.id;
      }
    }
    return best;
  }

  screenBox(id) {
    const rec = this.things.get(id);
    if (!rec || !rec.hit) return null;
    rec.hit.updateWorldMatrix(true, false);
    const gm = rec.hit.geometry;
    gm.computeBoundingBox();
    const bb = gm.boundingBox;
    const r = this.canvas.getBoundingClientRect();
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const v = new THREE.Vector3();
    let front = 0;
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
      v.set(x, y, z).applyMatrix4(rec.hit.matrixWorld).project(this.cam);
      if (v.z < 1) front++;
      x0 = Math.min(x0, v.x);
      x1 = Math.max(x1, v.x);
      y0 = Math.min(y0, v.y);
      y1 = Math.max(y1, v.y);
    }
    if (front < 4) return null;
    const sx = (n) => r.left + ((n + 1) / 2) * r.width;
    const sy = (n) => r.top + ((1 - n) / 2) * r.height;
    return { x: sx(x0), y: sy(y1), w: sx(x1) - sx(x0), h: sy(y0) - sy(y1) };
  }

  // ---------- frame ----------
  update(dt) {
    dt = Math.max(0, Math.min(dt, 0.1));
    this.time += dt;
    const t = this.time;
    updateTweens(dt);
    for (const u of this.updaters) u(dt, t);
    // lights
    for (const l of this.lights) {
      if (!l.light.visible) continue;
      const f = l.flicker ? 1 + (Math.sin(t * 9 + l.phase) * 0.5 + Math.sin(t * 23 + l.phase * 2) * 0.5) * l.flicker * 0.12 : 1;
      l.light.intensity = l.base * f;
    }
    // lightning
    this.nextFlash -= dt;
    if (this.nextFlash <= 0 && !this.reduced) {
      this.nextFlash = 7 + Math.random() * 9;
      this.strike();
    }
    updateOutside(this.outside, t, dt, this.quality, this.flash);
    if (this.finale) placeShip(this.outside, 1, this.finale.turn);
    this.moon.intensity = this.env.moon.i * 1.6 + this.flash * 5;
    this.amb.intensity = this.env.ambientI + this.flash * 3.5;
    this.fill.intensity = 0.55 + this.flash * 1.4;
    for (const d of this.drops || []) d.material.map.offset.y = (t * 0.01) % 1;
    // beam
    if (this.beam) this.updateBeam(dt);
    // camera
    this.trauma = Math.min(1, Math.max(0, this.trauma - dt * 0.9));
    const sh = this.trauma * this.trauma;
    const p = this.pose;
    const idle = this.reduced ? 0 : 1;
    const sway = Math.sin(t * 0.5) * 0.0025 * idle;
    this.cam.position.set(p.px + Math.sin(t * 43) * sh * 0.02, p.py + Math.sin(t * 0.7) * 0.004 * idle + Math.sin(t * 51) * sh * 0.02, p.pz);
    this.cam.rotation.set(p.pitch + sway + this.mouse.y * -0.01 * idle + Math.sin(t * 37) * sh * 0.02, p.yaw + this.pan + this.mouse.x * -0.014 * idle + Math.sin(t * 29) * sh * 0.02, 0);
    if (Math.abs(this.cam.fov - p.fov) > 0.01) {
      this.cam.fov = p.fov;
      this.cam.updateProjectionMatrix();
    }
  }

  strike() {
    const seq = [[0, 1], [0.07, 0.15], [0.14, 0.8], [0.3, 0.1], [0.45, 0]];
    for (const [d, v] of seq) setTimeout(() => (this.flash = v), d * 1000);
    if (this.onThunder) this.onThunder(0.5 + Math.random() * 1.8);
    this.addTrauma(0.12);
  }

  draw() {
    if (this.inspect && this.inspect.active) return this.drawInspect();
    this.renderer.render(this.scene, this.cam);
  }

  // ---------- item icons ----------
  itemIcon(id, size = 160) {
    if (this.iconCache.has(id)) return this.iconCache.get(id);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff0dc, 0x6a5a48, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(1.5, 2.5, 2.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb8ff, 1.2);
    rim.position.set(-2, 1, -2);
    scene.add(rim);
    const model = buildItem(id);
    const wrap = new THREE.Group();
    wrap.add(model);
    wrap.rotation.set(0.5, -0.6, 0);
    scene.add(wrap);
    wrap.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(wrap);
    const c = bb.getCenter(new THREE.Vector3());
    const s = bb.getSize(new THREE.Vector3());
    const k = 1 / Math.max(s.x, s.y, s.z, 0.01);
    wrap.scale.setScalar(k);
    wrap.position.set(-c.x * k, -c.y * k, -c.z * k);
    const cam = new THREE.OrthographicCamera(-0.62, 0.62, 0.62, -0.62, 0.1, 10);
    cam.position.set(0, 0, 3);
    const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4, colorSpace: THREE.SRGBColorSpace });
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevClear = new THREE.Color();
    r.getClearColor(prevClear);
    const prevAlpha = r.getClearAlpha();
    r.setRenderTarget(rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(scene, cam);
    const buf = new Uint8Array(size * size * 4);
    r.readRenderTargetPixels(rt, 0, 0, size, size, buf);
    r.setRenderTarget(prevTarget);
    r.setClearColor(prevClear, prevAlpha);
    rt.dispose();
    scene.traverse((o) => o.geometry && !o.geometry.userData.shared && 0);
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) img.data.set(buf.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    ctx.putImageData(img, 0, 0);
    const url = cv.toDataURL('image/png');
    this.iconCache.set(id, url);
    return url;
  }

  // ---------- inspecting an item ----------
  startInspect(id) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0a08);
    scene.add(new THREE.HemisphereLight(0xfff0dc, 0x50402e, 1.1));
    const key = new THREE.DirectionalLight(0xffe2b8, 3.0);
    key.position.set(2, 3, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8aa6e6, 1.4);
    rim.position.set(-3, 1, -2);
    scene.add(rim);
    const spot = new THREE.PointLight(0xffb060, 14, 8, 2);
    spot.position.set(0.8, 0.8, 1.6);
    scene.add(spot);
    const model = buildItem(id);
    const wrap = new THREE.Group();
    wrap.add(model);
    scene.add(wrap);
    wrap.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(wrap);
    const c = bb.getCenter(new THREE.Vector3());
    const s = bb.getSize(new THREE.Vector3());
    const k = 1.0 / Math.max(s.x, s.y, s.z, 0.01);
    model.position.set(-c.x, -c.y, -c.z);
    const pivot = new THREE.Group();
    pivot.add(model);
    pivot.scale.setScalar(k);
    scene.remove(wrap);
    scene.add(pivot);
    pivot.rotation.set(0.4, -0.7, 0);
    const cam = new THREE.PerspectiveCamera(36, this.aspect(), 0.1, 20);
    const dist = 2.9 * (this.aspect() < 1 ? 1.5 : 1);
    cam.position.set(0, 0, dist);
    this.inspect = { active: true, scene, cam, pivot, model, id, rx: 0.4, ry: -0.7, vx: 0, vy: 0, dragging: false, back: model.userData.backNormal || null, backTime: 0, seenBack: false };
  }
  dragInspect(dx, dy) {
    const i = this.inspect;
    if (!i) return;
    i.ry += dx * 0.011;
    i.rx = clamp(i.rx + dy * 0.011, -1.4, 1.4);
    i.vy = dx * 0.011;
    i.vx = dy * 0.011;
  }
  endInspect() {
    if (this.inspect) {
      this.inspect.scene.traverse((o) => o.geometry && o.geometry.dispose());
      this.inspect = null;
    }
  }
  drawInspect() {
    const i = this.inspect;
    const dt = 0.016;
    if (!i.dragging) {
      i.ry += i.vy;
      i.rx = clamp(i.rx + i.vx, -1.4, 1.4);
      i.vy *= 0.94;
      i.vx *= 0.94;
      if (Math.abs(i.vy) < 0.0008 && !this.reduced) i.ry += 0.004;
    }
    i.pivot.rotation.set(i.rx, i.ry, 0, 'YXZ');
    i.cam.aspect = this.aspect();
    i.cam.updateProjectionMatrix();
    this.renderer.render(i.scene, i.cam);
    if (i.back) {
      i.pivot.updateMatrixWorld(true);
      const n = i.back.clone().transformDirection(i.pivot.matrixWorld);
      const facing = n.dot(new THREE.Vector3(0, 0, 1));
      if (facing > 0.72) {
        i.backTime += dt;
        if (i.backTime > 0.35 && !i.seenBack) {
          i.seenBack = true;
          if (this.onBackSeen) this.onBackSeen(i.id);
        }
      } else i.backTime = 0;
      i.showingBack = facing > 0.72;
    }
  }

  // ---------- the finale ----------
  async playFinale() {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    this.finale = { turn: 0 };
    if (!this.beam) this.buildBeam();
    this.setProgress(1);
    tween(this.beam, { power: 1 }, 2.2, ease.out);
    this.addTrauma(0.35);
    await wait(2800);
    await this.goView('wall:1');
    await wait(900);
    tween(this.finale, { turn: 1 }, 4.5, ease.inOut);
    await wait(5200);
  }

  buildBeamPlaceholder() {}

  buildBeam() {
    const lens = this.things.get('lampbase');
    const p = this.frame.place(0, 0, 1.7);
    const g = new THREE.Group();
    g.position.set(p.x, 1.55, p.z);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(7, 160, 16, 1, true), beamMat);
    cone.rotation.z = Math.PI / 2;
    cone.position.x = 80;
    g.add(cone);
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(3, 160, 12, 1, true), beamMat.clone());
    cone2.rotation.z = Math.PI / 2;
    cone2.position.x = 80;
    g.add(cone2);
    this.scene.add(g);
    this.beam = { g, cone, cone2, power: 0, angle: 0 };
  }
  updateBeam(dt) {
    const b = this.beam;
    b.angle += dt * 0.9 * b.power;
    b.g.rotation.y = b.angle;
    b.cone.material.opacity = 0.16 * b.power;
    b.cone2.material.opacity = 0.2 * b.power;
  }
}
