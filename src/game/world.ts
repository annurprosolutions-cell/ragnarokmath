// Builds one map: terrain, scenery, portals, lights and collision.
import * as THREE from 'three';
import { Rng } from '../math';
import { MapDef, PortalDef } from '../rpg/data';
import { Quality } from '../save';
import { G, basic, put, toon } from './materials';
import { fbm, smoothstep } from './noise';
import { Batch, KITS } from './props';

export interface Circle {
  x: number;
  z: number;
  r: number;
}

export interface PortalInst {
  def: PortalDef;
  x: number;
  z: number;
  group: THREE.Group;
}

const PI = Math.PI;

function seedOf(id: string): number {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

let glowTex: THREE.Texture | null = null;
function glowTexture(): THREE.Texture {
  if (!glowTex) {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0.9)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 64);
    glowTex = new THREE.CanvasTexture(c);
  }
  return glowTex;
}

export class World {
  readonly group = new THREE.Group();
  readonly circles: Circle[] = [];
  readonly portals: PortalInst[] = [];
  readonly bound: number;
  readonly waterLevel: number;
  private animated: ((t: number, dt: number) => void)[] = [];
  private sky!: THREE.Mesh;
  private sun!: THREE.DirectionalLight;
  private pathZ = (x: number) => Math.sin(x * 0.07) * 4;

  constructor(readonly def: MapDef, readonly quality: Quality) {
    this.bound = def.size - 2;
    this.waterLevel = def.theme === 'beach' ? -0.35 : -Infinity;
    const rng = new Rng(seedOf(def.id));
    this.buildSky();
    this.buildLights();
    this.buildTerrain();
    this.buildPortals();
    if (def.theme === 'town') this.buildTown(rng);
    else this.buildField(rng);
  }

  // ---------------------------------------------------------------- height & collision

  heightAt(x: number, z: number): number {
    const d = this.def;
    const s = d.size;
    let h = 0;
    if (d.hill > 0) {
      h = (fbm(x * 0.045 + 10, z * 0.045 - 5, seedOf(d.id)) - 0.5) * 2 * d.hill;
      // Keep the main path, spawn and portals gentle
      const onPath = 1 - smoothstep(2, 7, Math.abs(z - this.pathZ(x)));
      h *= 1 - onPath * 0.75;
      for (const p of d.portals) h *= smoothstep(3, 9, Math.hypot(x - p.pos[0], z - p.pos[1]));
    }
    if (d.theme === 'town') {
      const r = Math.hypot(x, z);
      h = r < 10 ? 0.05 : 0;
    }
    // Raised rim beyond the walkable area
    const edge = smoothstep(s - 3, s + 10, Math.max(Math.abs(x), Math.abs(z)));
    h += edge * (d.theme === 'cave' ? 9 : 4) * (0.6 + fbm(x * 0.1, z * 0.1, 7) * 0.8);
    if (d.theme === 'beach') {
      const sea = smoothstep(s * 0.3, s * 0.7, z);
      h = h * (1 - sea) - sea * 2.2;
    }
    return h;
  }

  isWater(x: number, z: number): boolean {
    return this.heightAt(x, z) < this.waterLevel + 0.15;
  }

  /** Push a moving circle out of scenery and keep it inside the map. */
  resolve(x: number, z: number, radius: number): [number, number] {
    for (const c of this.circles) {
      const dx = x - c.x, dz = z - c.z;
      const min = c.r + radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        x = c.x + (dx / d) * min;
        z = c.z + (dz / d) * min;
      }
    }
    const b = this.bound;
    return [Math.max(-b, Math.min(b, x)), Math.max(-b, Math.min(b, z))];
  }

  blocked(x: number, z: number, radius = 0.4): boolean {
    if (Math.abs(x) > this.bound - 1 || Math.abs(z) > this.bound - 1) return true;
    if (this.isWater(x, z)) return true;
    for (const c of this.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + radius) return true;
    return false;
  }

  randomSpot(rng: Rng, margin = 4): [number, number] {
    for (let i = 0; i < 80; i++) {
      const x = rng.range(-this.bound + margin, this.bound - margin);
      const z = rng.range(-this.bound + margin, this.bound - margin);
      if (this.blocked(x, z, 1)) continue;
      if (this.portals.some((p) => Math.hypot(p.x - x, p.z - z) < 7)) continue;
      return [x, z];
    }
    return [0, 0];
  }

  // ---------------------------------------------------------------- building

  private buildSky(): void {
    const d = this.def;
    const geo = new THREE.SphereGeometry(180, 24, 12);
    const top = new THREE.Color(d.sky);
    const horizon = new THREE.Color(d.fog);
    const cols: number[] = [];
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.max(0, Math.min(1, pos.getY(i) / 120));
      const c = horizon.clone().lerp(top, t);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -1;
    this.group.add(sky);
    this.sky = sky;

    if (d.theme !== 'cave') {
      const clouds = KITS.cloud();
      const r = new Rng(seedOf(d.id) + 3);
      for (let i = 0; i < 9; i++) clouds.add(r.range(-90, 90), r.range(28, 40), r.range(-90, 90), r.range(0, PI), r.range(1, 2.2));
      const cg = new THREE.Group();
      clouds.build(cg);
      this.group.add(cg);
      this.animated.push((_t, dt) => {
        cg.position.x += dt * 0.6;
        if (cg.position.x > 60) cg.position.x = -60;
      });
    }
  }

  private buildLights(): void {
    const d = this.def;
    const cave = d.theme === 'cave';
    const hemi = new THREE.HemisphereLight(cave ? 0x8a7ad0 : 0xffffff, cave ? 0x2a2040 : 0x8a7a5a, cave ? 1.6 : 1.5);
    this.group.add(hemi);
    const sun = new THREE.DirectionalLight(cave ? 0xb8a8ff : 0xfff3df, cave ? 1.2 : 2.4);
    sun.position.set(30, 50, 20);
    this.group.add(sun);
    this.group.add(sun.target);
    this.sun = sun;
  }

  private buildTerrain(): void {
    const d = this.def;
    const ext = d.size * 2 + 50;
    const segs = this.quality === 'low' ? 70 : 100;
    const geo = new THREE.PlaneGeometry(ext, ext, segs, segs);
    geo.rotateX(-PI / 2);
    const pos = geo.attributes.position;
    const cols: number[] = [];
    const g0 = new THREE.Color(d.ground[0]), g1 = new THREE.Color(d.ground[1]), g2 = new THREE.Color(d.ground[2]);
    const dirt = new THREE.Color(d.theme === 'desert' || d.theme === 'beach' ? 0xd9b878 : d.theme === 'cave' ? 0x5a4a6a : d.theme === 'peak' ? 0xc9d6e4 : 0xc9a86a);
    const stone = new THREE.Color(0xcfc6b8);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = this.heightAt(x, z);
      pos.setY(i, y);
      const n = fbm(x * 0.08, z * 0.08, 3);
      c.copy(g0).lerp(n > 0.5 ? g2 : g1, Math.abs(n - 0.5) * 2.2);
      if (d.theme === 'town') {
        const r = Math.hypot(x, z);
        if (r < 10) c.copy(stone).multiplyScalar(0.92 + ((Math.floor(x * 1.2) + Math.floor(z * 1.2)) & 1) * 0.08);
        else if (Math.abs(z) < 2.2 && x > 0) c.lerp(dirt, 0.85);
        else if (Math.abs(x) < 2.2 && z > 0) c.lerp(dirt, 0.85);
      } else {
        const path = 1 - smoothstep(1.2, 2.6, Math.abs(z - this.pathZ(x)));
        c.lerp(dirt, path * 0.8);
      }
      if (d.theme === 'beach' && y < this.waterLevel + 0.4) c.lerp(new THREE.Color(0xe0c88a), 0.6);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.group.add(ground);

    if (this.waterLevel > -Infinity) {
      const water = new THREE.Mesh(G.plane(400, 400), toon(0x4fb3e0, { opacity: 0.85 }));
      water.rotation.x = -PI / 2;
      water.position.y = this.waterLevel;
      this.group.add(water);
      this.animated.push((t) => (water.position.y = this.waterLevel + Math.sin(t * 0.8) * 0.06));
    }
  }

  get ground(): THREE.Object3D {
    return this.group.getObjectByName('ground')!;
  }

  private buildPortals(): void {
    const tex = glowTexture();
    for (const p of this.def.portals) {
      const [x, z] = p.pos;
      const g = new THREE.Group();
      g.position.set(x, this.heightAt(x, z) + 0.05, z);
      const ring = put(g, G.torus(1.3, 0.1, PI * 2, 8, 40), basic(0x7fe8ff, 1, true), [0, 0.05, 0], [PI / 2, 0, 0]);
      put(g, new THREE.CircleGeometry(1.25, 32), basic(0x3fb8ff, 0.45, true), [0, 0.04, 0], [-PI / 2, 0, 0]);
      const colMat = new THREE.MeshBasicMaterial({ map: tex, color: 0x7fe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      put(g, G.cyl(1.2, 1.2, 3.2, 24, true), colMat, [0, 1.6, 0]);
      const sparks: THREE.Mesh[] = [];
      for (let i = 0; i < 6; i++) sparks.push(put(g, G.octa(0.08), basic(0xe0fbff, 1, true)));
      this.animated.push((t) => {
        ring.rotation.z = t;
        ring.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
        sparks.forEach((s, i) => {
          const a = t * 1.5 + (i / 6) * PI * 2;
          s.position.set(Math.cos(a) * 1.0, ((t * 0.8 + i / 6) % 1) * 3, Math.sin(a) * 1.0);
        });
      });
      this.group.add(g);
      this.portals.push({ def: p, x, z, group: g });
    }
  }

  private place(batch: Batch, x: number, z: number, rot: number, s: number, collide: number, tint?: number): void {
    batch.add(x, this.heightAt(x, z), z, rot, s, tint);
    if (collide > 0 && Math.abs(x) < this.def.size && Math.abs(z) < this.def.size) this.circles.push({ x, z, r: collide * s });
  }

  private clearOf(x: number, z: number, spots: [number, number, number][]): boolean {
    return spots.every(([sx, sz, r]) => Math.hypot(x - sx, z - sz) > r);
  }

  private buildField(rng: Rng): void {
    const d = this.def;
    const s = d.size;
    const keep: [number, number, number][] = [
      ...d.portals.map((p) => [p.pos[0], p.pos[1], 6] as [number, number, number]),
      [d.spawn[0], d.spawn[1], 5],
    ];
    const onPath = (x: number, z: number) => Math.abs(z - this.pathZ(x)) < 3;
    const scatter = (batch: Batch, n: number, scale: [number, number], collide: number, opts: { ring?: boolean; inner?: boolean; tints?: number[] } = {}) => {
      let placed = 0;
      for (let tries = 0; placed < n && tries < n * 20; tries++) {
        let x: number, z: number;
        if (opts.ring) {
          // Dense band just outside the walkable area hides the map edge
          const a = rng.range(0, PI * 2);
          const r = s + rng.range(-1, 14);
          x = Math.max(-s - 14, Math.min(s + 14, Math.cos(a) * r * 1.3));
          z = Math.max(-s - 14, Math.min(s + 14, Math.sin(a) * r * 1.3));
          if (Math.max(Math.abs(x), Math.abs(z)) < s - 1) continue;
        } else {
          x = rng.range(-s + 2, s - 2);
          z = rng.range(-s + 2, s - 2);
        }
        if (!this.clearOf(x, z, keep) || onPath(x, z)) continue;
        if (this.isWater(x, z) && !opts.ring) continue;
        if (opts.ring && d.theme === 'beach' && z > s * 0.3) continue;
        this.place(batch, x, z, rng.range(0, PI * 2), rng.range(...scale), collide, opts.tints ? rng.pick(opts.tints) : undefined);
        placed++;
      }
    };

    const lowQ = this.quality === 'low' ? 0.6 : 1;
    const N = (k: number) => Math.round(k * lowQ);
    const batches: Batch[] = [];
    const add = (b: Batch) => (batches.push(b), b);

    switch (d.theme) {
      case 'meadow': {
        const trees = add(KITS.roundTree());
        scatter(trees, N(22), [0.9, 1.3], 0.7);
        scatter(trees, N(60), [1, 1.5], 0, { ring: true });
        scatter(add(KITS.bush()), N(30), [0.7, 1.2], 0.5);
        scatter(add(KITS.flower()), N(220), [0.8, 1.3], 0, { tints: [0xf28aa0, 0xf2c94c, 0xffffff, 0xa98bd9, 0xff8a5c] });
        scatter(add(KITS.rock()), N(14), [0.6, 1.1], 0.7);
        break;
      }
      case 'forest': {
        const pines = add(KITS.pine());
        scatter(pines, N(45), [0.9, 1.5], 0.6);
        scatter(pines, N(90), [1.1, 1.8], 0, { ring: true });
        scatter(add(KITS.roundTree(0x3f8f45)), N(15), [1, 1.4], 0.7);
        scatter(add(KITS.mushroomDeco()), N(25), [0.6, 1.6], 0.3, { tints: [0xe0533c, 0x8e5bd6, 0xf2c94c] });
        scatter(add(KITS.log()), N(10), [0.8, 1.1], 0.8);
        scatter(add(KITS.bush(0x3f8a3e)), N(40), [0.7, 1.3], 0.4);
        scatter(add(KITS.flower()), N(90), [0.8, 1.2], 0, { tints: [0xf2c94c, 0xffffff, 0xa98bd9] });
        break;
      }
      case 'beach': {
        const palms = add(KITS.palm());
        scatter(palms, N(22), [0.9, 1.3], 0.5);
        scatter(palms, N(40), [1, 1.4], 0, { ring: true });
        scatter(add(KITS.rock(0xb9a58a)), N(18), [0.6, 1.2], 0.7);
        scatter(add(KITS.shell()), N(60), [0.8, 1.6], 0, { tints: [0xffffff, 0xf7c6d0, 0xf2d7a8] });
        scatter(add(KITS.umbrella()), N(5), [1, 1.1], 0.3, { tints: [0xe0533c, 0x2f56a6, 0xf2c94c] });
        break;
      }
      case 'desert': {
        scatter(add(KITS.cactus()), N(30), [0.8, 1.4], 0.5);
        const rocks = add(KITS.sandRock());
        scatter(rocks, N(22), [0.7, 1.5], 1.0);
        scatter(rocks, N(50), [1.5, 3], 0, { ring: true });
        const pyr = add(KITS.pyramid());
        for (const [x, z, sc] of [[-75, -60, 1.2], [-55, -85, 0.8], [70, -70, 1], [80, 60, 0.9]]) pyr.add(x, this.heightAt(x, z) - 1, z, 0, sc);
        // Oasis
        const pond = put(this.group, new THREE.CircleGeometry(4, 28), toon(0x4fb3e0, { opacity: 0.85 }), [6, this.heightAt(6, 10) + 0.06, 10], [-PI / 2, 0, 0]);
        pond.renderOrder = 1;
        this.circles.push({ x: 6, z: 10, r: 4 });
        const palms = add(KITS.palm());
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * PI * 2 + 0.3;
          this.place(palms, 6 + Math.cos(a) * 5.5, 10 + Math.sin(a) * 5.5, rng.range(0, PI * 2), rng.range(0.9, 1.2), 0.5);
        }
        break;
      }
      case 'cave': {
        const stal = add(KITS.stalagmite());
        scatter(stal, N(40), [0.6, 1.4], 0.45);
        scatter(add(KITS.stalagmite(0x3c3350)), N(120), [1.5, 3.5], 0, { ring: true });
        for (const col of [0x7ad3e8, 0xd07ae8, 0x7ae8a8]) scatter(add(KITS.crystalDeco(col)), N(14), [0.7, 1.6], 0.5);
        scatter(add(KITS.rock(0x5a4d70)), N(25), [0.7, 1.4], 0.7);
        scatter(add(KITS.mushroomDeco()), N(15), [0.5, 1], 0.2, { tints: [0x7ae8d8, 0xb07ae8] });
        break;
      }
      case 'peak': {
        const pines = add(KITS.pine(0x2f6a4a, true));
        scatter(pines, N(35), [0.9, 1.5], 0.6);
        scatter(pines, N(70), [1.1, 1.7], 0, { ring: true });
        scatter(add(KITS.iceRock()), N(25), [0.7, 1.5], 0.8);
        scatter(add(KITS.snowman()), 4, [1, 1.2], 0.6);
        this.addSnow();
        break;
      }
    }
    for (const b of batches) b.build(this.group);
  }

  private addSnow(): void {
    const n = this.quality === 'low' ? 300 : 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.9, depthWrite: false }));
    pts.name = 'snow';
    this.group.add(pts);
    this.animated.push((t, dt) => {
      const a = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < n; i++) {
        let y = a.getY(i) - dt * 2.2;
        if (y < 0) y += 25;
        a.setY(i, y);
        a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.3);
      }
      a.needsUpdate = true;
    });
  }

  /** Keeps the snow volume centred on the player. */
  follow(x: number, z: number): void {
    const snow = this.group.getObjectByName('snow');
    if (snow) snow.position.set(x, 0, z);
    this.sun.position.set(x + 30, 50, z + 20);
    this.sun.target.position.set(x, 0, z);
    this.sky.position.set(x, 0, z);
  }

  private buildTown(rng: Rng): void {
    const s = this.def.size;
    // Fountain
    const f = new THREE.Group();
    put(f, G.cyl(2.4, 2.6, 0.6, 24), toon(0xcfc6b8), [0, 0.3, 0]);
    put(f, new THREE.CircleGeometry(2.15, 24), toon(0x6fc3ec, { opacity: 0.9 }), [0, 0.62, 0], [-PI / 2, 0, 0]);
    put(f, G.cyl(0.35, 0.45, 1.6, 12), toon(0xcfc6b8), [0, 1.2, 0]);
    put(f, G.cyl(1.1, 0.6, 0.35, 16), toon(0xcfc6b8), [0, 2.0, 0]);
    const spout = put(f, G.sphere(0.4, 12, 10), toon(0x9fdcff, { opacity: 0.8 }), [0, 2.4, 0]);
    put(f, G.octa(0.3), toon(0xf2c94c, { emissive: 0xb08a20, emissiveIntensity: 0.6 }), [0, 3.0, 0]);
    this.group.add(f);
    this.circles.push({ x: 0, z: 0, r: 2.7 });
    this.animated.push((t) => spout.scale.setScalar(1 + Math.sin(t * 4) * 0.1));

    // Houses around the plaza
    const roofs = [0xc0504d, 0x2f56a6, 0x5d7a45, 0x8e5bd6, 0xd77a2b];
    const houses: [number, number][] = [[-15, -16], [-2, -22], [12, -19], [22, -9], [-22, 13], [-9, 21], [6, 22], [21, 15]];
    houses.forEach(([x, z], i) => {
      const b = KITS.house(roofs[i % roofs.length]);
      const rot = Math.atan2(-x, -z);
      b.add(x, 0, z, rot, 1);
      b.build(this.group);
      this.circles.push({ x, z, r: 3.1 });
      this.circles.push({ x: x + Math.sin(rot + PI / 2) * 1.6, z: z + Math.cos(rot + PI / 2) * 1.6, r: 2.2 });
      this.circles.push({ x: x - Math.sin(rot + PI / 2) * 1.6, z: z - Math.cos(rot + PI / 2) * 1.6, r: 2.2 });
    });

    // Market stall for the shop NPC
    const stall = new THREE.Group();
    stall.position.set(12, 0, 5.5);
    for (const [x, z] of [[-1.4, -0.8], [1.4, -0.8], [-1.4, 0.8], [1.4, 0.8]]) put(stall, G.cyl(0.07, 0.07, 2.2, 6), toon(0x7a4f2e), [x, 1.1, z]);
    put(stall, G.box(3, 0.9, 1.4), toon(0xa0703e), [0, 0.45, 0]);
    for (let i = 0; i < 6; i++) put(stall, G.box(0.52, 0.08, 1.9), toon(i % 2 ? 0xffffff : 0xe0533c), [-1.3 + i * 0.52, 2.3, 0], [0.12, 0, 0]);
    for (const [x, c] of [[-0.9, 0xe0533c], [-0.3, 0xd77a2b], [0.3, 0x4f8fe8], [0.9, 0xf2c94c]] as const) put(stall, G.sphere(0.18, 8, 6), toon(c), [x, 1.0, 0]);
    this.group.add(stall);
    this.circles.push({ x: 12, z: 5.5, r: 1.7 });

    // Style shop tent
    const tent = new THREE.Group();
    tent.position.set(-12, 0, 5.5);
    put(tent, G.cone(2.2, 2.6, 8), toon(0xe7a1b6), [0, 2.2, 0]);
    put(tent, G.cyl(2.0, 2.0, 1.0, 8, true), toon(0xf4f1ea, { side: THREE.DoubleSide }), [0, 0.5, 0]);
    put(tent, G.sphere(0.2), toon(0xf2c94c), [0, 3.6, 0]);
    this.group.add(tent);
    this.circles.push({ x: -12, z: 5.5, r: 2.1 });

    // Lamps around the plaza
    const lamps = KITS.lamp();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2 + PI / 8;
      this.place(lamps, Math.cos(a) * 10.5, Math.sin(a) * 10.5, 0, 1, 0.25);
    }
    lamps.build(this.group);

    // Town wall with an east gate and a west opening to the training ground
    const wall = KITS.wall();
    for (let v = -s; v <= s; v += 4) {
      wall.add(v, 0, -s, 0, 1);
      wall.add(v, 0, s, 0, 1);
      if (Math.abs(v) > 4) {
        wall.add(s, 0, v, PI / 2, 1);
      }
      wall.add(-s, 0, v, PI / 2, 1);
    }
    wall.build(this.group);

    // Training ground (west) fence
    const fence = KITS.fencePost();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * PI * 2;
      fence.add(-23 + Math.cos(a) * 7, 0, Math.sin(a) * 7, -a, 1);
    }
    fence.build(this.group);

    // Trees and flowers
    const trees = KITS.roundTree();
    const flowers = KITS.flower();
    const keep: [number, number, number][] = [[0, 0, 13], [-23, 0, 8.5], [s - 3, 0, 6], ...houses.map(([x, z]) => [x, z, 5] as [number, number, number]), [12, 5.5, 3], [-12, 5.5, 3.5]];
    for (let i = 0; i < 160 && trees.count < 26; i++) {
      const x = rng.range(-s + 3, s - 3), z = rng.range(-s + 3, s - 3);
      if (!this.clearOf(x, z, keep) || Math.abs(z) < 3 || Math.abs(x) < 3) continue;
      this.place(trees, x, z, rng.range(0, PI * 2), rng.range(0.8, 1.2), 0.7);
    }
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * PI * 2;
      const r = 11.5 + rng.range(0, 1);
      if (Math.abs(Math.sin(a)) < 0.15 || Math.abs(Math.cos(a)) < 0.15) continue;
      flowers.add(Math.cos(a) * r, 0, Math.sin(a) * r, 0, rng.range(0.9, 1.3), rng.pick([0xf28aa0, 0xf2c94c, 0xffffff, 0xa98bd9]));
    }
    // Outside the walls
    for (let i = 0; i < 70; i++) {
      const a = rng.range(0, PI * 2);
      const r = s + rng.range(4, 18);
      trees.add(Math.cos(a) * r, this.heightAt(Math.cos(a) * r, Math.sin(a) * r), Math.sin(a) * r, rng.range(0, PI * 2), rng.range(1, 1.5));
    }
    trees.build(this.group);
    flowers.build(this.group);

    // Sign by the east gate
    const sign = new THREE.Group();
    sign.position.set(s - 5, 0, 3.5);
    put(sign, G.cyl(0.08, 0.08, 1.8, 6), toon(0x7a4f2e), [0, 0.9, 0]);
    put(sign, G.box(1.6, 0.5, 0.1), toon(0xa0703e), [0.3, 1.6, 0], [0, 0, -0.1]);
    this.group.add(sign);
  }

  update(t: number, dt: number): void {
    for (const f of this.animated) f(t, dt);
  }

  dispose(): void {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh || (o as THREE.Points).isPoints) {
        if (o.name === 'ground' || o.name === 'snow' || (m.material as THREE.Material & { vertexColors?: boolean })?.vertexColors) m.geometry.dispose();
        if ((m as unknown as THREE.InstancedMesh).isInstancedMesh) (m as unknown as THREE.InstancedMesh).dispose();
      }
    });
  }
}
