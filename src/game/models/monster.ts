// Cute procedural monsters. Each shape returns a group plus an animate hook.
import * as THREE from 'three';
import { MonsterDef } from '../../rpg/data';
import { G, basic, darken, put, toon } from '../materials';

const PI = Math.PI;

type Animate = (t: number, moving: number) => void;

function eyes(parent: THREE.Object3D, y: number, z: number, spread: number, size = 0.07): void {
  const black = toon(0x222222);
  const white = basic(0xffffff);
  for (const s of [-1, 1]) {
    put(parent, G.sphere(size, 10, 8), black, [s * spread, y, z], [0, s * 0.3, 0], [0.8, 1.15, 0.5]);
    put(parent, G.sphere(size * 0.32, 6, 5), white, [s * spread + size * 0.25, y + size * 0.4, z + size * 0.4]);
  }
}

function mouth(parent: THREE.Object3D, y: number, z: number, r = 0.05): void {
  put(parent, G.torus(r, r * 0.25, PI, 5, 8), toon(0x6a2a2a), [0, y, z], [0, 0, PI]);
}

export class MonsterModel {
  readonly root = new THREE.Group();
  readonly body = new THREE.Group();
  /** Approximate height for name tag placement. */
  height = 1;
  private animateFn: Animate = () => undefined;
  private t = Math.random() * 10;
  private hurtT = 0;
  private attackT = 0;
  private deathT = -1;

  constructor(def: MonsterDef) {
    this.root.add(this.body);
    this.build(def);
    this.root.scale.setScalar(def.scale);
    this.height *= def.scale;
  }

  private build(def: MonsterDef): void {
    const b = this.body;
    const c1 = toon(def.color);
    const c2 = toon(def.color2);
    switch (def.shape) {
      case 'slime': {
        const blob = put(b, G.sphere(0.55, 20, 14), toon(def.color, { opacity: 0.92 }), [0, 0.45, 0], [0, 0, 0], [1, 0.82, 1]);
        put(b, G.sphere(0.12, 8, 6), basic(0xffffff, 0.8), [-0.22, 0.72, 0.3], [0, 0, 0], [1, 0.7, 0.5]);
        eyes(b, 0.52, 0.45, 0.17, 0.085);
        mouth(b, 0.36, 0.5);
        if (def.boss) this.crown(b, 0.95);
        this.height = 1.1;
        this.animateFn = (t, mv) => {
          const s = Math.sin(t * (4 + mv * 4));
          blob.scale.set(1 + s * 0.06, 0.82 - s * 0.07, 1 + s * 0.06);
          b.position.y = Math.max(0, Math.sin(t * 8)) * 0.25 * mv;
        };
        break;
      }
      case 'bunny': {
        put(b, G.sphere(0.42, 16, 12), c1, [0, 0.42, 0], [0, 0, 0], [1, 0.9, 1.05]);
        const head = new THREE.Group();
        head.position.set(0, 0.85, 0.12);
        b.add(head);
        put(head, G.sphere(0.3, 16, 12), c1);
        for (const s of [-1, 1]) {
          put(head, G.capsule(0.08, 0.38), c1, [s * 0.13, 0.4, -0.04], [-0.15, 0, -s * 0.18]);
          put(head, G.capsule(0.045, 0.3), c2, [s * 0.13, 0.4, 0.0], [-0.15, 0, -s * 0.18]);
        }
        eyes(head, 0.02, 0.25, 0.11);
        put(head, G.sphere(0.035), toon(0xf28aa0), [0, -0.06, 0.29]);
        put(b, G.sphere(0.13), toon(0xffffff), [0, 0.35, -0.42]);
        this.height = 1.6;
        this.animateFn = (t, mv) => {
          b.position.y = Math.abs(Math.sin(t * 6)) * 0.3 * mv;
          head.rotation.z = Math.sin(t * 2) * 0.08;
        };
        break;
      }
      case 'mushroom': {
        put(b, G.cyl(0.24, 0.3, 0.5, 14), c2, [0, 0.25, 0]);
        const cap = new THREE.Group();
        cap.position.y = 0.5;
        b.add(cap);
        put(cap, G.partSphere(0.55, 0, PI * 2, 0, PI / 2, 20, 10), c1, [0, 0, 0], [0, 0, 0], [1, 0.75, 1]);
        put(cap, G.cyl(0.55, 0.55, 0.04, 20), toon(darken(def.color2, 0.9)), [0, 0, 0]);
        for (const [x, y, z, r] of [[0.2, 0.32, 0.25, 0.09], [-0.25, 0.28, 0.2, 0.07], [0, 0.4, -0.15, 0.1], [0.3, 0.2, -0.25, 0.07]]) {
          put(cap, G.sphere(r, 8, 6), toon(0xffffff), [x, y, z], [0, 0, 0], [1, 0.5, 1]);
        }
        eyes(b, 0.32, 0.27, 0.1, 0.06);
        mouth(b, 0.18, 0.29, 0.04);
        this.height = 1.1;
        this.animateFn = (t, mv) => {
          b.rotation.z = Math.sin(t * 8) * 0.12 * mv;
          cap.rotation.z = Math.sin(t * 2.5) * 0.06;
          b.position.y = Math.abs(Math.sin(t * 8)) * 0.08 * mv;
        };
        break;
      }
      case 'beetle': {
        put(b, G.sphere(0.5, 16, 12), c1, [0, 0.45, -0.05], [0, 0, 0], [1, 0.7, 1.25]);
        put(b, G.box(0.02, 0.36, 1.0), toon(darken(def.color, 0.6)), [0, 0.7, -0.05], [0, 0, 0]);
        put(b, G.sphere(0.25, 12, 10), c2, [0, 0.4, 0.6]);
        put(b, G.cone(0.07, 0.35, 6), c2, [0, 0.62, 0.72], [0.6, 0, 0]);
        eyes(b, 0.45, 0.8, 0.12, 0.06);
        const legs: THREE.Mesh[] = [];
        for (const s of [-1, 1]) for (const z of [-0.35, 0, 0.35]) legs.push(put(b, G.capsule(0.035, 0.25), c2, [s * 0.5, 0.2, z], [0, 0, s * 0.9]));
        this.height = 1.1;
        this.animateFn = (t, mv) => {
          legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 14 + i) * 0.5 * mv));
          b.position.y = Math.sin(t * 3) * 0.02;
        };
        break;
      }
      case 'stump': {
        put(b, G.cyl(0.42, 0.5, 0.75, 12), c1, [0, 0.38, 0]);
        put(b, G.cyl(0.42, 0.42, 0.02, 12), toon(0xd9b27a), [0, 0.76, 0]);
        for (const s of [-1, 1]) put(b, G.capsule(0.07, 0.35), c1, [s * 0.48, 0.45, 0], [0, 0, s * 1.1]);
        const leaves = put(b, G.ico(0.32, 0), c2, [0.1, 0.95, 0], [0, 0, 0], [1.3, 0.8, 1.3]);
        eyes(b, 0.48, 0.42, 0.14, 0.07);
        mouth(b, 0.3, 0.45, 0.07);
        this.height = 1.3;
        this.animateFn = (t, mv) => {
          b.rotation.z = Math.sin(t * 7) * 0.1 * mv;
          leaves.rotation.y = t * 0.6;
        };
        break;
      }
      case 'bee': {
        const body = new THREE.Group();
        body.position.y = 0.9;
        b.add(body);
        put(body, G.sphere(0.36, 14, 12), c1, [0, 0, 0], [0, 0, 0], [1, 0.95, 1.2]);
        for (const z of [-0.12, 0.1]) put(body, G.torus(0.33, 0.06, PI * 2, 6, 20), c2, [0, 0, z], [0, 0, 0], [1, 0.95, 1]);
        put(body, G.cone(0.07, 0.2, 6), c2, [0, 0, -0.48], [-PI / 2, 0, 0]);
        eyes(body, 0.05, 0.38, 0.12, 0.06);
        const wings: THREE.Mesh[] = [];
        for (const s of [-1, 1]) wings.push(put(body, G.sphere(0.25, 10, 8), basic(0xe8f6ff, 0.75), [s * 0.3, 0.32, -0.05], [0, 0, s * 0.5], [0.5, 1, 0.12]));
        this.height = 1.5;
        this.animateFn = (t) => {
          body.position.y = 0.9 + Math.sin(t * 3) * 0.12;
          wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (0.5 + Math.sin(t * 40) * 0.5)));
        };
        break;
      }
      case 'crab': {
        put(b, G.sphere(0.48, 16, 12), c1, [0, 0.38, 0], [0, 0, 0], [1.25, 0.6, 0.95]);
        for (const s of [-1, 1]) {
          put(b, G.cyl(0.03, 0.03, 0.25, 6), c1, [s * 0.15, 0.68, 0.25]);
          put(b, G.sphere(0.07, 8, 6), toon(0xffffff), [s * 0.15, 0.82, 0.25]);
          put(b, G.sphere(0.035, 6, 5), toon(0x222222), [s * 0.15, 0.83, 0.31]);
          put(b, G.sphere(0.2, 10, 8), c1, [s * 0.68, 0.45, 0.35], [0, 0, 0], [1, 0.7, 1.2]);
          put(b, G.cone(0.08, 0.22, 6), c2, [s * 0.68, 0.47, 0.58], [PI / 2, 0, 0]);
          for (const z of [-0.2, 0.05]) put(b, G.capsule(0.03, 0.25), c1, [s * 0.55, 0.2, z], [0, 0, s * 1.1]);
        }
        mouth(b, 0.32, 0.45, 0.05);
        if (def.boss) this.crown(b, 0.75);
        this.height = 1.1;
        this.animateFn = (t, mv) => {
          b.rotation.z = Math.sin(t * 10) * 0.06 * mv;
          b.position.x = Math.sin(t * 10) * 0.04 * mv;
        };
        break;
      }
      case 'turtle': {
        put(b, G.partSphere(0.55, 0, PI * 2, 0, PI / 2, 16, 8), c2, [0, 0.25, 0], [0, 0, 0], [1, 0.8, 1.1]);
        put(b, G.cyl(0.56, 0.5, 0.12, 16), toon(darken(def.color2, 0.8)), [0, 0.22, 0], [0, 0, 0], [1, 1, 1.1]);
        const head = put(b, G.sphere(0.22, 12, 10), c1, [0, 0.4, 0.62]);
        eyes(head, 0.05, 0.19, 0.09, 0.05);
        for (const [x, z] of [[-0.4, 0.4], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4]]) put(b, G.capsule(0.09, 0.12), c1, [x, 0.12, z]);
        this.height = 1.0;
        this.animateFn = (t, mv) => {
          head.position.z = 0.62 + Math.sin(t * 2) * 0.04;
          b.rotation.z = Math.sin(t * 6) * 0.05 * mv;
        };
        break;
      }
      case 'cactus': {
        put(b, G.capsule(0.3, 0.7), c1, [0, 0.65, 0]);
        put(b, G.capsule(0.12, 0.25), c1, [-0.4, 0.75, 0], [0, 0, 0.0]);
        put(b, G.capsule(0.12, 0.2), c1, [-0.27, 0.55, 0], [0, 0, PI / 2]);
        put(b, G.capsule(0.12, 0.25), c1, [0.4, 0.95, 0]);
        put(b, G.capsule(0.12, 0.2), c1, [0.27, 0.75, 0], [0, 0, PI / 2]);
        for (let i = 0; i < 5; i++) put(b, G.sphere(0.07, 8, 6), c2, [Math.cos(i * 1.256) * 0.1, 1.28, Math.sin(i * 1.256) * 0.1]);
        put(b, G.sphere(0.06, 8, 6), toon(0xf2c94c), [0, 1.3, 0]);
        eyes(b, 0.8, 0.28, 0.1, 0.06);
        mouth(b, 0.62, 0.3, 0.05);
        put(b, G.cyl(0.38, 0.4, 0.2, 12), toon(0xc0703a), [0, 0.1, 0]);
        this.height = 1.5;
        this.animateFn = (t, mv) => {
          b.rotation.z = Math.sin(t * 2) * 0.05 + Math.sin(t * 9) * 0.08 * mv;
        };
        break;
      }
      case 'scorpion': {
        put(b, G.sphere(0.4, 14, 10), c1, [0, 0.3, 0], [0, 0, 0], [1, 0.55, 1.3]);
        put(b, G.sphere(0.24, 12, 10), c1, [0, 0.33, 0.48], [0, 0, 0], [1, 0.7, 1]);
        eyes(b, 0.43, 0.68, 0.1, 0.05);
        const tail = new THREE.Group();
        tail.position.set(0, 0.35, -0.45);
        b.add(tail);
        for (let i = 0; i < 4; i++) {
          const a = i * 0.55;
          put(tail, G.sphere(0.13 - i * 0.015, 10, 8), c1, [0, Math.sin(a) * 0.45, -Math.cos(a) * 0.3 + 0.0 - i * 0.04]);
        }
        put(tail, G.cone(0.07, 0.22, 6), c2, [0, 0.62, 0.12], [1.2, 0, 0]);
        for (const s of [-1, 1]) {
          put(b, G.sphere(0.13, 10, 8), c1, [s * 0.4, 0.32, 0.65], [0, 0, 0], [1, 0.7, 1.3]);
          for (const z of [-0.25, 0, 0.25]) put(b, G.capsule(0.03, 0.22), c2, [s * 0.4, 0.15, z], [0, 0, s * 1.1]);
        }
        this.height = 1.1;
        this.animateFn = (t, mv) => {
          tail.rotation.x = Math.sin(t * 3) * 0.15;
          b.position.y = Math.sin(t * 12) * 0.02 * mv;
        };
        break;
      }
      case 'golem': {
        const torso = put(b, G.box(0.85, 0.8, 0.6), c1, [0, 0.95, 0]);
        torso.rotation.y = 0.05;
        put(b, G.box(0.5, 0.42, 0.45), c1, [0, 1.55, 0.05]);
        put(b, G.box(0.36, 0.08, 0.05), c2, [0, 1.62, 0.29]);
        put(b, G.sphere(0.05, 6, 6), basic(0xfff1a8), [-0.1, 1.62, 0.32]);
        put(b, G.sphere(0.05, 6, 6), basic(0xfff1a8), [0.1, 1.62, 0.32]);
        const arms: THREE.Group[] = [];
        for (const s of [-1, 1]) {
          const arm = new THREE.Group();
          arm.position.set(s * 0.6, 1.2, 0);
          put(arm, G.box(0.3, 0.75, 0.3), c1, [0, -0.35, 0]);
          put(arm, G.box(0.36, 0.25, 0.36), c2, [0, -0.78, 0]);
          b.add(arm);
          arms.push(arm);
          put(b, G.box(0.3, 0.55, 0.32), c1, [s * 0.24, 0.28, 0]);
        }
        put(b, G.octa(0.12), toon(def.color2, { emissive: def.color2, emissiveIntensity: 0.5 }), [0, 1.0, 0.32]);
        if (def.boss) this.crown(b, 1.85);
        this.height = 2;
        this.animateFn = (t, mv) => {
          arms[0].rotation.x = Math.sin(t * 4) * 0.4 * mv;
          arms[1].rotation.x = -Math.sin(t * 4) * 0.4 * mv;
          b.rotation.z = Math.sin(t * 4) * 0.04 * mv;
        };
        break;
      }
      case 'bat': {
        const body = new THREE.Group();
        body.position.y = 1.1;
        b.add(body);
        put(body, G.sphere(0.3, 14, 10), c1);
        for (const s of [-1, 1]) put(body, G.cone(0.08, 0.2, 4), c1, [s * 0.15, 0.3, 0], [0, 0, -s * 0.3]);
        eyes(body, 0.05, 0.26, 0.1, 0.055);
        put(body, G.cone(0.02, 0.06, 4), basic(0xffffff), [0.05, -0.12, 0.27], [PI, 0, 0]);
        const wings: THREE.Group[] = [];
        for (const s of [-1, 1]) {
          const w = new THREE.Group();
          w.position.set(s * 0.25, 0.05, 0);
          put(w, G.cone(0.32, 0.6, 3), c2, [s * 0.3, 0, 0], [0, 0, s * PI / 2], [1, 1, 0.15]);
          body.add(w);
          wings.push(w);
        }
        this.height = 1.6;
        this.animateFn = (t) => {
          body.position.y = 1.1 + Math.sin(t * 4) * 0.15;
          const f = Math.sin(t * 18) * 0.7;
          wings[0].rotation.z = f;
          wings[1].rotation.z = -f;
        };
        break;
      }
      case 'crystal': {
        const core = put(b, G.octa(0.45), toon(def.color, { emissive: def.color, emissiveIntensity: 0.35 }), [0, 1.0, 0], [0, 0, 0], [0.8, 1.3, 0.8]);
        const shards: THREE.Mesh[] = [];
        for (let i = 0; i < 4; i++) shards.push(put(b, G.octa(0.12), toon(def.color2, { emissive: def.color2, emissiveIntensity: 0.4 }), [0, 1, 0]));
        eyes(core, 0.05, 0.3, 0.12, 0.06);
        this.height = 1.8;
        this.animateFn = (t) => {
          core.position.y = 1.0 + Math.sin(t * 2) * 0.1;
          core.rotation.y = t * 0.8;
          shards.forEach((s, i) => {
            const a = t * 1.5 + (i * PI) / 2;
            s.position.set(Math.cos(a) * 0.65, 1.0 + Math.sin(t * 3 + i) * 0.2, Math.sin(a) * 0.65);
          });
        };
        break;
      }
      case 'ghost': {
        const g = new THREE.Group();
        b.add(g);
        put(g, G.sphere(0.42, 16, 12), toon(def.color, { opacity: 0.85 }), [0, 1.0, 0]);
        put(g, G.cone(0.42, 0.7, 16), toon(def.color, { opacity: 0.85 }), [0, 0.55, 0], [PI, 0, 0]);
        eyes(g, 1.05, 0.38, 0.13, 0.075);
        put(g, G.sphere(0.06, 8, 6), toon(0x6a2a4a), [0, 0.88, 0.4], [0, 0, 0], [1, 1.3, 0.5]);
        for (const s of [-1, 1]) put(g, G.capsule(0.07, 0.15), toon(def.color, { opacity: 0.85 }), [s * 0.42, 0.85, 0.05], [0, 0, s * 0.8]);
        this.height = 1.7;
        this.animateFn = (t) => {
          g.position.y = 0.2 + Math.sin(t * 2) * 0.15;
          g.rotation.z = Math.sin(t * 1.4) * 0.08;
        };
        break;
      }
      case 'yeti': {
        put(b, G.sphere(0.55, 16, 12), c1, [0, 0.7, 0], [0, 0, 0], [1, 1.1, 0.9]);
        put(b, G.sphere(0.36, 14, 12), c1, [0, 1.35, 0.05]);
        put(b, G.sphere(0.24, 12, 10), c2, [0, 1.3, 0.24], [0, 0, 0], [1.1, 0.9, 0.6]);
        eyes(b, 1.36, 0.36, 0.1, 0.06);
        mouth(b, 1.22, 0.38, 0.05);
        const arms: THREE.Mesh[] = [];
        for (const s of [-1, 1]) {
          arms.push(put(b, G.capsule(0.15, 0.45), c1, [s * 0.6, 0.75, 0.05], [0, 0, s * 0.3]));
          put(b, G.capsule(0.14, 0.2), c1, [s * 0.22, 0.2, 0]);
        }
        this.height = 1.9;
        this.animateFn = (t, mv) => {
          arms[0].rotation.x = Math.sin(t * 6) * 0.5 * mv;
          arms[1].rotation.x = -Math.sin(t * 6) * 0.5 * mv;
          b.position.y = Math.abs(Math.sin(t * 6)) * 0.08 * mv;
        };
        break;
      }
      case 'dragon': {
        put(b, G.sphere(0.5, 16, 12), c1, [0, 0.6, 0], [0, 0, 0], [1, 0.9, 1.2]);
        put(b, G.sphere(0.32, 12, 10), c2, [0, 0.55, 0.3], [0, 0, 0], [1, 1, 0.6]);
        const head = new THREE.Group();
        head.position.set(0, 1.15, 0.35);
        b.add(head);
        put(head, G.sphere(0.36, 14, 12), c1, [0, 0, 0], [0, 0, 0], [1, 0.9, 1.05]);
        put(head, G.sphere(0.2, 12, 10), c1, [0, -0.08, 0.3], [0, 0, 0], [1, 0.7, 1]);
        for (const s of [-1, 1]) put(head, G.cone(0.07, 0.3, 6), c2, [s * 0.18, 0.32, -0.1], [-0.5, 0, -s * 0.3]);
        eyes(head, 0.06, 0.3, 0.14, 0.07);
        const wings: THREE.Group[] = [];
        for (const s of [-1, 1]) {
          const w = new THREE.Group();
          w.position.set(s * 0.35, 0.95, -0.2);
          put(w, G.cone(0.4, 0.8, 3), c2, [s * 0.38, 0.1, 0], [0, 0, s * PI / 2.3], [1, 1, 0.12]);
          b.add(w);
          wings.push(w);
        }
        const tail = put(b, G.cone(0.2, 0.8, 8), c1, [0, 0.35, -0.75], [-PI / 2 - 0.3, 0, 0]);
        for (const s of [-1, 1]) put(b, G.capsule(0.12, 0.15), c1, [s * 0.28, 0.15, 0.1]);
        if (def.boss) this.crown(head, 0.4);
        this.height = 1.9;
        this.animateFn = (t, mv) => {
          const f = Math.sin(t * (4 + mv * 6)) * 0.4;
          wings[0].rotation.z = f;
          wings[1].rotation.z = -f;
          tail.rotation.z = Math.sin(t * 2) * 0.2;
          head.rotation.x = Math.sin(t * 1.5) * 0.06;
          b.position.y = Math.abs(Math.sin(t * 2)) * 0.1;
        };
        break;
      }
      case 'dummy': {
        put(b, G.cyl(0.06, 0.06, 1.3, 8), toon(0x7a4f2e), [0, 0.65, 0]);
        put(b, G.capsule(0.28, 0.35), c1, [0, 0.95, 0]);
        put(b, G.box(0.9, 0.1, 0.1), toon(0x7a4f2e), [0, 1.05, 0]);
        put(b, G.sphere(0.24, 12, 10), c1, [0, 1.48, 0]);
        put(b, G.cyl(0.18, 0.18, 0.02, 16), toon(0xffffff), [0, 0.98, 0.29], [PI / 2, 0, 0]);
        put(b, G.cyl(0.12, 0.12, 0.025, 16), c2, [0, 0.98, 0.29], [PI / 2, 0, 0]);
        put(b, G.cyl(0.05, 0.05, 0.03, 12), toon(0xffffff), [0, 0.98, 0.29], [PI / 2, 0, 0]);
        eyes(b, 1.5, 0.22, 0.08, 0.04);
        this.height = 1.8;
        this.animateFn = () => undefined;
        break;
      }
    }
  }

  private crown(parent: THREE.Object3D, y: number): void {
    const g = new THREE.Group();
    g.position.y = y;
    put(g, G.cyl(0.18, 0.2, 0.1, 10, true), toon(0xe7c14a, { side: THREE.DoubleSide }));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      put(g, G.cone(0.04, 0.1, 4), toon(0xe7c14a), [Math.cos(a) * 0.18, 0.09, Math.sin(a) * 0.18]);
    }
    parent.add(g);
  }

  hurt(): void {
    this.hurtT = 0.35;
  }

  attack(): void {
    this.attackT = 0.45;
  }

  die(): void {
    this.deathT = 0;
  }

  /** Returns true while the death animation is still playing. */
  update(dt: number, moving: number): boolean {
    this.t += dt;
    this.animateFn(this.t, moving);
    this.body.position.x = 0;
    if (this.hurtT > 0) {
      this.hurtT -= dt;
      this.body.position.x = Math.sin(this.hurtT * 60) * 0.08;
    }
    this.body.position.z = 0;
    if (this.attackT > 0) {
      this.attackT -= dt;
      const k = 1 - this.attackT / 0.45;
      this.body.position.z = Math.sin(k * PI) * 0.5;
    }
    if (this.deathT >= 0) {
      this.deathT += dt;
      const k = Math.min(1, this.deathT / 0.6);
      this.body.scale.set(1 + k * 0.3, Math.max(0.01, 1 - k), 1 + k * 0.3);
      return k < 1;
    }
    return true;
  }

  reset(): void {
    this.deathT = -1;
    this.body.scale.set(1, 1, 1);
  }
}
