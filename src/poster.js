// Store pictures: ?poster=cover|action|win|icon|badge-<id>. One staged frame with the real renderer, no HUD.
import { ROOMS } from './data/index.js';
import { createGame } from './engine/game.js';
import { Stage } from './render/stage.js';
import { tween, THREE } from './render/gfx.js';
import { drawSymbol } from './render/symbols.js';

const SIZES = { cover: [1280, 720], action: [1280, 720], win: [1280, 720], icon: [512, 512] };

export async function runPoster(name) {
  const badge = name.startsWith('badge-');
  const [W, H] = badge ? [256, 256] : SIZES[name] || [1280, 720];
  document.body.style.cssText = 'margin:0;background:#000;overflow:hidden';
  const canvas = document.getElementById('gl');
  document.getElementById('ui').remove();
  await Promise.race([Promise.all(['700 32px "Cormorant Garamond"', '500 32px Caveat', '600 32px "Barlow Condensed"'].map((f) => document.fonts.load(f))).catch(() => 0), new Promise((r) => setTimeout(r, 3000))]);
  if (badge) return badgePoster(name.slice(6), canvas, W, H);
  const stage = new Stage(canvas, { quality: 'high', poster: true, reduced: true, pixelRatio: 1 });
  stage.nextFlash = 1e9;
  const game = createGame(ROOMS);
  const walk = (room, n) => {
    for (const a of room.walkthrough.slice(0, n)) {
      const [k, ...r] = a;
      if (k === 'tap') game.tap(r[0]);
      else if (k === 'use') game.useItem(r[0], r[1]);
      else if (k === 'combine') game.combine(r[0], r[1]);
      else if (k === 'place') game.placeItem(r[0], r[1], r[2]);
      else if (k === 'learn') game.learn(r[0]);
      else if (k === 'lock') {
        const lk = room.locks[r[0]];
        game.solveLock(r[0], r[1] === 'solved' ? Array.from({ length: lk.size * lk.size }, (_, i) => i) : r[1]);
      }
    }
  };
  const toRoom = (i, n) => {
    for (let k = 0; k < i; k++) {
      walk(ROOMS[k], 99);
      game.advance();
    }
    walk(ROOMS[i], n);
  };
  let view = 'wall:1';
  let pan = 0;
  let beamAngle = null;
  if (name === 'cover') {
    toRoom(2, 23);
    view = 'wall:0';
    pan = 0.0;
    beamAngle = -0.5;
  } else if (name === 'action') {
    toRoom(1, 19);
    view = 'radioview';
  } else if (name === 'win') {
    toRoom(2, 23);
    view = 'wall:1';
    pan = -0.12;
    beamAngle = -0.2;
  } else if (name === 'icon') {
    toRoom(2, 23);
    view = 'lensview';
  }
  stage.resize(W, H, 1);
  stage.loadRoom(game.room, game);
  const lit = name !== 'action';
  if (lit) {
    stage.finale = { turn: name === 'win' ? 0.45 : 0.1 };
    stage.buildBeam();
    stage.beam.power = name === 'icon' ? 0.55 : 1;
    stage.setProgress(1);
  }
  if (lit) {
    stage.ambScale = name === 'icon' ? 0.12 : 0.3;
    stage.renderer.toneMappingExposure = name === 'icon' ? 0.9 : 0.95;
    stage.scene.environmentIntensity = 0.05;
    if (name === 'icon') stage.scene.traverse((o) => o.isSprite && (o.material.opacity *= 0.3));
    for (const l of stage.lights) l.base *= name === 'icon' ? 0.3 : 0.4;
    if (stage.outside.ship) stage.outside.ship.scale.setScalar(name === 'win' ? 2.4 : 1.8);
  } else {
    stage.ambScale = 0.28;
    stage.scene.environmentIntensity = 0.05;
    for (const l of stage.lights) l.base *= l.def.id === 'fire' ? 2.6 : l.def.id === 'radio' ? 0.05 : 1.0;
    stage.scene.traverse((o) => o.isSprite && (o.material.opacity *= 0.4));
  }
  stage.refresh(true);
  stage.view = view;
  if (view.startsWith('wall:')) stage.wall = +view.slice(5);
  stage.applyPose(stage.currentPoseTarget(), true);
  stage.pan = pan;
  if (name === 'icon') {
    Object.assign(stage.pose, { px: 0.15, py: 1.15, pz: 0.2, yaw: 0, pitch: 0.2, fov: 40 });
    stage.beam.angle = -0.35;
  }
  stage.flash = 0;
  for (let i = 0; i < 4; i++) {
    stage.update(0.05);
    stage.draw();
  }
  if (name === 'cover') stage.flash = 0.0;
  if (beamAngle != null && stage.beam) stage.beam.angle = beamAngle;
  if (name === 'win') {
    stage.finale = null;
    const ship = stage.outside.ship;
    ship.scale.setScalar(1.3);
    ship.position.set(58, -4.2, 9);
    ship.rotation.y = -Math.PI * 0.85;
    stage.beam.angle = -0.18;
    const L = new THREE.PointLight(0xfff0c8, 1600, 70, 2);
    L.position.set(48, 8, 5);
    stage.scene.add(L);
  }

  if (name === 'cover') {
    const t = document.createElement('div');
    t.textContent = 'ESCAPE THE LIGHTHOUSE';
    t.style.cssText = 'position:fixed;left:48px;bottom:44px;font:700 78px/0.95 "Cormorant Garamond",Georgia,serif;letter-spacing:.1em;color:#fff6dc;text-shadow:0 3px 0 #000,0 0 26px rgba(0,0,0,.9);max-width:560px';
    document.body.append(t);
  }
  const loop = () => {
    stage.update(0);
    stage.draw();
    requestAnimationFrame(loop);
  };
  stage.draw();
  document.body.dataset.ready = '1';
  loop();
}

function badgePoster(id, canvas, W, H) {
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const c = canvas.getContext('2d');
  const sym = { cottage: 'key', radio: 'wave', lamp: 'sun', 'no-hints': 'anchor', speedrun: 'bell', 'three-stars': 'star' }[id] || 'star';
  const col = { cottage: '#7a3b34', radio: '#2f5a7a', lamp: '#b87a1c', 'no-hints': '#3e6f58', speedrun: '#6a3f7a', 'three-stars': '#1c2d4a' }[id] || '#1c2d4a';
  const g = c.createRadialGradient(W * 0.4, H * 0.35, 10, W / 2, H / 2, W * 0.6);
  g.addColorStop(0, '#fff2c8');
  g.addColorStop(0.35, col);
  g.addColorStop(1, '#0b1424');
  c.fillStyle = g;
  c.beginPath();
  c.arc(W / 2, H / 2, W / 2 - 4, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 12;
  c.strokeStyle = '#d9b25c';
  c.beginPath();
  c.arc(W / 2, H / 2, W / 2 - 14, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 3;
  c.strokeStyle = '#5a3f14';
  c.beginPath();
  c.arc(W / 2, H / 2, W / 2 - 24, 0, Math.PI * 2);
  c.stroke();
  drawSymbol(c, sym, W / 2, H / 2, W * 0.5, '#fff6dc', 9);
  document.body.dataset.ready = '1';
}
