// Everything outside the windows: sky, sea, rocks, rain, the dark tower, a ship in trouble, and the lightning.
import { THREE, M, std, mat, tex, canvasOf, box, cyl, sph, plane, group, glow, rngOf, TAU, clamp, ease, tween } from './gfx.js';

export const SEA_Y = -4.5;

function skyTexture() {
  return tex('sky', 1024, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#02050b');
    g.addColorStop(0.42, '#0b1626');
    g.addColorStop(0.5, '#2a3d5a');
    g.addColorStop(0.52, '#1a283d');
    g.addColorStop(1, '#070d18');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const r = rngOf(41);
    for (let i = 0; i < 260; i++) {
      const x = r() * w;
      const y = h * (0.12 + r() * 0.38);
      const rr = 30 + r() * 110;
      const gr = c.createRadialGradient(x, y, 0, x, y, rr);
      const lite = r() > 0.55;
      gr.addColorStop(0, lite ? 'rgba(110,130,165,0.2)' : 'rgba(2,6,12,0.34)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr;
      c.save();
      c.translate(x, y);
      c.scale(2.4, 0.55);
      c.translate(-x, -y);
      c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      c.restore();
    }
  });
}

function makeSea(quality) {
  const seg = quality === 'low' ? 36 : 56;
  const geo = new THREE.PlaneGeometry(700, 700, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.35, metalness: 0.2, flatShading: true });
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.y = SEA_Y;
  const base = geo.attributes.position.array.slice();
  mesh.userData.update = (t) => {
    const p = geo.attributes.position.array;
    const c = geo.attributes.color.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      const d = Math.hypot(x, z);
      const amp = 0.6 + Math.min(2.6, d * 0.018);
      const h = Math.sin(x * 0.11 + t * 1.1) * 0.5 + Math.sin(z * 0.13 - t * 0.9) * 0.45 + Math.sin((x + z) * 0.31 + t * 1.9) * 0.18;
      p[i + 1] = h * amp;
      const k = clamp(0.5 + h * 0.55, 0, 1);
      const foam = clamp((h - 0.55) * 2.2, 0, 1);
      c[i] = 0.035 + k * 0.04 + foam * 0.5;
      c[i + 1] = 0.08 + k * 0.07 + foam * 0.55;
      c[i + 2] = 0.13 + k * 0.1 + foam * 0.6;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  };
  mesh.userData.update(0);
  return mesh;
}

function makeRain(count) {
  const pos = new Float32Array(count * 6);
  const seeds = new Float32Array(count * 3);
  const r = rngOf(5);
  for (let i = 0; i < count; i++) {
    seeds[i * 3] = (r() - 0.5) * 70;
    seeds[i * 3 + 1] = r() * 40 - 8;
    seeds[i * 3 + 2] = (r() - 0.5) * 70;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0xb8c8e0, transparent: true, opacity: 0.4, depthWrite: false });
  const lines = new THREE.LineSegments(geo, m);
  lines.frustumCulled = false;
  lines.userData.update = (t) => {
    for (let i = 0; i < count; i++) {
      const sx = seeds[i * 3];
      const sy = seeds[i * 3 + 1];
      const sz = seeds[i * 3 + 2];
      const y = 32 - ((sy + 8 + t * 22 + (i % 7)) % 40);
      const x = sx + (32 - y) * 0.32;
      const j = i * 6;
      pos[j] = x;
      pos[j + 1] = y;
      pos[j + 2] = sz;
      pos[j + 3] = x + 0.12;
      pos[j + 4] = y - 0.85;
      pos[j + 5] = sz;
    }
    geo.attributes.position.needsUpdate = true;
  };
  lines.userData.update(0);
  return lines;
}

function makeTower() {
  const g = new THREE.Group();
  const white = std(0xd5d6d8, 0.9);
  const red = std(0x9a3a30, 0.8);
  const dark = std(0x16191f, 0.7, 0.3);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.6, 22, 14, 1), white);
  body.position.y = 11;
  g.add(body);
  for (const y of [5, 14]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.0 - y * 0.04, 3.3 - y * 0.04, 4.2, 14), red);
    band.position.y = y;
    g.add(band);
  }
  const gal = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.4, 0.5, 16), dark);
  gal.position.y = 22.3;
  g.add(gal);
  const lant = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.6, 12), std(0x1c2530, 0.3, 0.5));
  lant.position.y = 23.8;
  g.add(lant);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 12), dark);
  roof.position.y = 25.9;
  g.add(roof);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 0), std(0x2a2724, 1));
  rock.scale.set(1.4, 0.5, 1.2);
  rock.position.y = -1;
  g.add(rock);
  return g;
}

function makeShip() {
  const g = new THREE.Group();
  const hullMat = std(0x1a1410, 0.8);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(14, 2.4, 4), hullMat);
  hull.position.y = 1.2;
  g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(8.8, 1.2, 0);
  g.add(bow);
  for (const [x, h] of [[-3, 11], [2, 12.5], [6, 8]]) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, h, 5), hullMat);
    mast.position.set(x, 2.4 + h / 2, 0);
    g.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.4, h * 0.6), std(0x8c8670, 1, 0, { side: THREE.DoubleSide }));
    sail.rotation.y = Math.PI / 2;
    sail.position.set(x + 0.2, 2.4 + h * 0.58, 0);
    g.add(sail);
  }
  const lamp = glow(g, 0xffc070, 3.2, 8, 6.6, 0, 0.95);
  const mastLamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
  mastLamp.position.set(2, 14.6, 0);
  g.add(mastLamp);
  glow(g, 0xffc070, 3, 2, 14.6, 0, 0.8);
  g.userData.lamp = lamp;
  return g;
}

function makeRocks() {
  const g = new THREE.Group();
  const m = std(0x15130f, 0.95);
  const r = rngOf(8);
  const spots = [[-30, 60], [-12, 74], [10, 66], [34, 80], [-52, 72], [60, 58], [24, 94]];
  for (const [x, z] of spots) {
    const k = 3 + r() * 6;
    const rock = new THREE.Mesh(new THREE.ConeGeometry(k * 0.7, k * 2.2, 5), m);
    rock.position.set(x, SEA_Y + k * 0.6, z);
    rock.rotation.y = r() * 3;
    g.add(rock);
    const foam = new THREE.Mesh(new THREE.RingGeometry(k * 0.7, k * 1.2, 14), new THREE.MeshBasicMaterial({ color: 0xcfe0ee, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(x, SEA_Y + 0.4, z);
    foam.userData.pulse = r() * 6;
    g.add(foam);
  }
  return g;
}

function makeCliff() {
  // a grassy bluff to the west and south of the cottage, falling away to the sea
  const g = new THREE.Group();
  const ground = std(0x1c2418, 1);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(60, 60, 8, 8), ground);
  top.rotation.x = -Math.PI / 2;
  top.position.set(-6, -0.7, 0);
  const pa = top.geometry.attributes.position;
  const r = rngOf(3);
  for (let i = 0; i < pa.count; i++) pa.setZ(i, pa.getZ(i) + (r() - 0.5) * 0.4);
  top.geometry.computeVertexNormals();
  g.add(top);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(60, 12, 14), std(0x1d1b19, 1));
  wall.position.set(-6, -6.5, 36);
  g.add(wall);
  const wall2 = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 60), std(0x1d1b19, 1));
  wall2.position.set(-36, -6.5, 0);
  g.add(wall2);
  // fence posts and wind-bent grass tufts
  const fm = std(0x2d2218, 0.9);
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), fm);
    p.position.set(-8 - i * 1.6, -0.1, 11.5 - i * 0.4);
    p.rotation.z = 0.05;
    g.add(p);
  }
  for (let i = 0; i < 40; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.6, 4), std(0x2b3a22, 1));
    t.position.set(-4 - r() * 24, -0.45, -10 + r() * 28);
    t.rotation.z = 0.35;
    g.add(t);
  }
  return g;
}

export function buildOutside(env, quality) {
  const g = new THREE.Group();
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat);
  sky.renderOrder = -10;
  g.add(sky);
  const sea = makeSea(quality);
  g.add(sea);
  g.add(makeRocks());
  const rain = makeRain(quality === 'low' ? 500 : 1100);
  g.add(rain);
  let tower = null;
  let ship = null;
  let cliff = null;
  if (env.outside === 'cliff') {
    cliff = makeCliff();
    g.add(cliff);
    tower = makeTower();
    tower.position.set(-96, SEA_Y + 0, 14);
    tower.scale.setScalar(1.05);
    g.add(tower);
  }
  if (env.ship) {
    ship = makeShip();
    g.add(ship);
  }
  const state = { sky: skyMat, sea, rain, tower, ship, g, flash: 0 };
  return state;
}

// Ship progress: it drifts toward the rocks as the room is solved, then turns away when the light finds it.
export function placeShip(out, progress, turn) {
  if (!out.ship) return;
  const p = clamp(progress, 0, 1);
  const x = 130 - p * 52;
  const z = -20 + p * 30;
  out.ship.position.set(x, SEA_Y + 0.3, z);
  out.ship.rotation.y = -Math.PI * (0.62 + turn * 0.62);
}

export function updateOutside(out, t, dt, quality, flash) {
  out.sea.userData.update(t);
  out.rain.userData.update(t);
  out.sky.color.setScalar(1 + flash * 2.4);
  out.rain.material.opacity = 0.34 + flash * 0.5;
  if (out.ship) {
    out.ship.position.y = SEA_Y + 0.3 + Math.sin(t * 1.2) * 0.35;
    out.ship.rotation.z = Math.sin(t * 0.9) * 0.05;
    out.ship.rotation.x = Math.sin(t * 1.3 + 1) * 0.03;
  }
}
