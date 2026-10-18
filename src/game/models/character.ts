// Procedural chibi character inspired by the job sheet: big head, small body,
// tudung / hood / witch hat options and a job outfit with its weapon.
import * as THREE from 'three';
import { Appearance } from '../../rpg/character';
import { CLOTH_COLORS, EYE_COLORS, HAIR_COLORS, HATS, JOBS, JobId, Outfit, SKIN_TONES, TUDUNG_COLORS } from '../../rpg/data';
import { G, basic, darken, put, toon } from '../materials';

const PI = Math.PI;
const DS = THREE.DoubleSide;

type Action = { kind: 'attack' | 'cast' | 'hurt' | 'cheer'; t: number; dur: number };

export class CharacterModel {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private head = new THREE.Group();
  private hipL = new THREE.Group();
  private hipR = new THREE.Group();
  private shoulderL = new THREE.Group();
  private shoulderR = new THREE.Group();
  private cape: THREE.Object3D | null = null;
  private halo: THREE.Object3D | null = null;
  private t = Math.random() * 10;
  private walk = 0;
  private action: Action | null = null;
  private downed = false;

  constructor(app: Appearance, job: JobId) {
    this.root.add(this.body);
    this.build(app, job);
  }

  private build(app: Appearance, job: JobId): void {
    const def = JOBS[job];
    const o: Outfit = { ...def.outfit };
    if (job === 'novice') {
      o.top = CLOTH_COLORS[app.outfitColor] ?? o.top;
      if (app.gender === 'P') o.robe = darken(o.top, 0.75);
    }
    const skin = toon(SKIN_TONES[app.skin] ?? SKIN_TONES[0]);
    const top = toon(o.top);
    const trim = toon(o.trim);
    const gloves = job === 'priest' || job === 'mage' || job === 'novice' ? skin : toon(0x5a3a24);
    const b = this.body;

    // Legs
    for (const [hip, x] of [[this.hipL, -0.1], [this.hipR, 0.1]] as const) {
      hip.position.set(x, 0.42, 0);
      b.add(hip);
      put(hip, G.capsule(0.085, 0.2), toon(o.pants), [0, -0.17, 0]);
      put(hip, G.sphere(0.1), toon(o.boots), [0, -0.36, 0.03], [0, 0, 0], [1.05, 0.8, 1.45]);
    }

    // Torso, belt, trim
    put(b, G.cyl(0.19, 0.23, 0.42), top, [0, 0.63, 0]);
    put(b, G.torus(0.17, 0.035), trim, [0, 0.84, 0], [PI / 2, 0, 0]);
    put(b, G.torus(0.225, 0.032), toon(o.belt), [0, 0.5, 0], [PI / 2, 0, 0]);
    put(b, G.box(0.07, 0.06, 0.03), toon(0xd7b45a), [0, 0.5, 0.235]);
    if (o.panel) put(b, G.box(0.12, 0.36, 0.03), toon(o.panel), [0, 0.64, 0.2], [-0.09, 0, 0]);
    if (o.robe) {
      put(b, G.cyl(0.22, 0.4, 0.5, 16, true), toon(o.robe, { side: DS }), [0, 0.3, 0]);
      put(b, G.torus(0.4, 0.022), trim, [0, 0.06, 0], [PI / 2, 0, 0]);
      if (o.panel && job !== 'blacksmith') put(b, G.box(0.14, 0.46, 0.03), toon(o.panel), [0, 0.3, 0.31], [-0.32, 0, 0]);
      if (job === 'blacksmith') put(b, G.box(0.36, 0.5, 0.03), toon(o.panel ?? o.top), [0, 0.42, 0.25], [-0.2, 0, 0]);
    } else {
      put(b, G.cyl(0.2, 0.21, 0.12), toon(o.pants), [0, 0.45, 0]);
    }
    if (o.armor) {
      const armor = toon(o.armor);
      put(b, G.cyl(0.21, 0.24, 0.28), armor, [0, 0.69, 0]);
      put(b, G.box(0.04, 0.2, 0.03), trim, [0, 0.7, 0.235]);
      put(b, G.box(0.16, 0.03, 0.03), trim, [0, 0.74, 0.235]);
    }
    if (o.cape) {
      this.cape = put(b, G.arcCyl(0.27, 0.42, 0.72, PI / 2 + 0.35, PI - 0.7), toon(o.cape, { side: DS }), [0, 0.47, -0.02]);
    }
    if (o.weapon === 'bow') {
      const quiver = new THREE.Group();
      quiver.position.set(0.12, 0.72, -0.24);
      quiver.rotation.set(0.25, 0, -0.45);
      put(quiver, G.cyl(0.07, 0.06, 0.42), toon(0x6b4128));
      for (const dx of [-0.03, 0, 0.03]) put(quiver, G.cone(0.03, 0.09, 4), toon(0xf4f1ea), [dx, 0.26, 0]);
      b.add(quiver);
    }

    // Arms
    const sleeve = toon(o.armor && job === 'knight' ? o.top : o.top);
    for (const [sh, x, side] of [[this.shoulderL, -0.26, -1], [this.shoulderR, 0.26, 1]] as const) {
      sh.position.set(x, 0.8, 0);
      sh.rotation.z = side * 0.12;
      b.add(sh);
      put(sh, G.capsule(0.068, 0.22), sleeve, [0, -0.16, 0]);
      put(sh, G.sphere(0.075), gloves, [0, -0.34, 0]);
      if (o.armor) put(sh, G.sphere(0.12), toon(o.armor), [0, -0.01, 0], [0, 0, 0], [1, 0.7, 1]);
      if (job === 'priest' || job === 'mage') put(sh, G.cyl(0.08, 0.13, 0.16, 12, true), toon(o.top, { side: DS }), [0, -0.27, 0]);
    }
    this.addWeapon(o);

    // Neck & scarf
    put(b, G.cyl(0.07, 0.08, 0.12), skin, [0, 0.9, 0]);
    if (o.scarf && !app.tudung) {
      put(b, G.torus(0.13, 0.06), toon(o.scarf), [0, 0.88, 0], [PI / 2, 0, 0]);
      put(b, G.box(0.1, 0.26, 0.04), toon(o.scarf), [0.06, 0.73, 0.2], [-0.15, 0, 0.12]);
    }

    // Head
    this.head.position.set(0, 1.2, 0);
    b.add(this.head);
    const h = this.head;
    put(h, G.sphere(0.36, 22, 16), skin, [0, 0, 0], [0, 0, 0], [1, 0.95, 0.98]);
    const eye = toon(EYE_COLORS[app.eyeColor] ?? EYE_COLORS[0]);
    const white = basic(0xffffff);
    for (const s of [-1, 1]) {
      put(h, G.sphere(0.055, 12, 10), eye, [s * 0.125, -0.02, 0.31], [0, s * 0.35, 0], [0.85, 1.3, 0.5]);
      put(h, G.sphere(0.018, 8, 6), white, [s * 0.125 + 0.016, 0.03, 0.345]);
      put(h, G.sphere(0.05, 10, 8), toon(0xf5a3a3, { opacity: 0.55 }), [s * 0.2, -0.11, 0.28], [0, s * 0.6, 0], [1, 0.55, 0.3]);
    }
    put(h, G.torus(0.035, 0.009, PI, 6, 10), toon(0x9b4a4a), [0, -0.13, 0.33], [0, 0, PI]);

    const headwear = o.head;
    if (app.tudung) {
      this.addTudung(TUDUNG_COLORS[app.tudungColor] ?? TUDUNG_COLORS[0], headwear === 'hood' ? 0 : 1);
    } else if (headwear !== 'hood') {
      this.addHair(app.hairStyle, HAIR_COLORS[app.hairColor] ?? HAIR_COLORS[0]);
    }
    if (headwear === 'hood') this.addTudung(o.headColor ?? 0x333333, 1.06, true);
    if (headwear === 'witch') this.addWitchHat(o.headColor ?? 0x4a2f8a);
    if (headwear === 'goggles') this.addGoggles(o.headColor ?? 0x888888);
    if (app.hat && !(headwear === 'witch' && app.hat !== 'halo')) this.addHat(app.hat);

    // Lift the whole character so boots rest on the ground.
    b.position.y = 0.02;
  }

  private addHair(style: number, color: number): void {
    const h = this.head;
    const m = toon(color);
    put(h, G.partSphere(0.385, 0, PI * 2, 0, 1.2), m, [0, 0.015, -0.01]);
    put(h, G.partSphere(0.39, PI - 0.35, PI + 0.7, 0.9, 1.25), m, [0, 0, -0.005], [0, 0, 0], [1, 1, 1]);
    // Fringe
    for (const [x, y, rz] of [[-0.16, 0.19, 0.5], [0, 0.22, 0], [0.16, 0.19, -0.5]]) {
      put(h, G.sphere(0.13, 12, 8), m, [x, y, 0.27], [-0.5, 0, rz], [1.05, 0.62, 0.55]);
    }
    for (const s of [-1, 1]) put(h, G.capsule(0.05, 0.14), m, [s * 0.32, -0.08, 0.1], [0.1, 0, s * 0.12]);

    switch (style) {
      case 1: // Berpacak
        for (const [x, y, z, rx, rz] of [
          [0, 0.33, -0.05, -0.3, 0], [-0.18, 0.28, -0.08, -0.2, 0.7], [0.18, 0.28, -0.08, -0.2, -0.7],
          [0, 0.22, -0.3, -1.2, 0], [-0.22, 0.12, -0.25, -0.9, 0.9], [0.22, 0.12, -0.25, -0.9, -0.9],
          [-0.1, 0.36, 0.12, 0.4, 0.3], [0.1, 0.36, 0.12, 0.4, -0.3],
        ]) put(h, G.cone(0.1, 0.26, 6), m, [x, y, z], [rx, 0, rz]);
        break;
      case 2: // Panjang
        put(h, G.capsule(0.2, 0.5), m, [0, -0.38, -0.2], [0.1, 0, 0], [1.4, 1, 0.55]);
        for (const s of [-1, 1]) put(h, G.capsule(0.07, 0.4), m, [s * 0.3, -0.3, 0.08], [0.05, 0, s * 0.08]);
        break;
      case 3: // Ekor kuda
        put(h, G.sphere(0.07), toon(0xe25b7a), [0, 0.12, -0.38]);
        put(h, G.capsule(0.1, 0.38), m, [0, -0.18, -0.48], [0.45, 0, 0]);
        break;
      case 4: // Sanggul
        put(h, G.sphere(0.17), m, [0, 0.3, -0.24]);
        put(h, G.torus(0.13, 0.025), toon(0xe25b7a), [0, 0.24, -0.2], [1.0, 0, 0]);
        break;
      case 5: { // Kerinting
        const n = 16;
        for (let i = 0; i < n; i++) {
          const yv = 1 - (i / (n - 1)) * 1.3;
          const r = Math.sqrt(Math.max(0, 1 - yv * yv));
          const a = i * 2.39996;
          const z = Math.sin(a) * r;
          if (z > 0.55 && yv < 0.6) continue;
          put(h, G.sphere(0.11, 10, 8), m, [Math.cos(a) * r * 0.38, yv * 0.38, z * 0.38 - 0.02]);
        }
        break;
      }
      default:
        break;
    }
  }

  /** Tudung (or hood): head wrap with a face opening plus a shoulder drape. */
  private addTudung(color: number, scale: number, hood = false): void {
    const h = this.head;
    const m = toon(color, { side: DS });
    const r = 0.4 * scale;
    const open = hood ? 0.85 : 0.78;
    put(h, G.partSphere(r, 0, PI * 2, 0, 0.95), m, [0, 0.01, 0]);
    put(h, G.partSphere(r, PI / 2 + open, PI * 2 - open * 2, 0.95, 1.8), m, [0, 0.01, 0]);
    // Rim that frames the face
    put(h, G.torus(0.3 * scale, 0.035 * scale, PI * 2, 8, 24), toon(darken(color, 0.9)), [0, -0.03, 0.26], [0, 0, 0], [0.95, 1.18, 1]);
    // Drape over shoulders
    const drape = put(this.body, G.cyl(0.2 * scale, 0.37 * scale, 0.34, 18), m, [0, 0.8, 0]);
    drape.scale.z = 0.95;
    if (hood) {
      put(h, G.cone(0.14, 0.3, 10), toon(color), [0, 0.26, -0.3], [-1.1, 0, 0]);
    }
  }

  private addWitchHat(color: number): void {
    const g = new THREE.Group();
    g.position.set(0, 0.27, -0.02);
    g.rotation.x = -0.12;
    put(g, G.cyl(0.62, 0.62, 0.03, 28), toon(color));
    put(g, G.cone(0.31, 0.6, 18), toon(color), [0, 0.31, -0.02], [-0.2, 0, 0.08]);
    put(g, G.torus(0.3, 0.035, PI * 2, 8, 24), toon(0xd7b45a), [0, 0.05, 0], [PI / 2, 0, 0]);
    put(g, G.octa(0.06), toon(0xd7b45a, { emissive: 0x7a5a10, emissiveIntensity: 0.6 }), [0, 0.12, 0.3]);
    this.head.add(g);
  }

  private addGoggles(color: number): void {
    const h = this.head;
    put(h, G.torus(0.385, 0.025, PI * 2, 6, 28), toon(0x3a3330), [0, 0.2, 0], [PI / 2 - 0.35, 0, 0]);
    for (const s of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(s * 0.12, 0.3, 0.27);
      g.rotation.set(-0.9, 0, 0);
      put(g, G.cyl(0.085, 0.085, 0.07, 14), toon(color));
      put(g, G.cyl(0.065, 0.065, 0.075, 14), toon(0x8fd3ff, { emissive: 0x2a6a9a, emissiveIntensity: 0.4 }));
      h.add(g);
    }
  }

  private addHat(id: string): void {
    const def = HATS.find((x) => x.id === id);
    if (!def) return;
    const h = this.head;
    const m = toon(def.color);
    switch (id) {
      case 'reben': {
        const g = new THREE.Group();
        g.position.set(0.2, 0.32, 0.05);
        g.rotation.z = -0.4;
        put(g, G.cone(0.1, 0.2, 8), m, [-0.1, 0, 0], [0, 0, -PI / 2]);
        put(g, G.cone(0.1, 0.2, 8), m, [0.1, 0, 0], [0, 0, PI / 2]);
        put(g, G.sphere(0.055), m);
        h.add(g);
        break;
      }
      case 'telinga-kucing':
        for (const s of [-1, 1]) {
          put(h, G.cone(0.11, 0.22, 4), m, [s * 0.21, 0.36, -0.02], [0, PI / 4, -s * 0.35]);
          put(h, G.cone(0.06, 0.14, 4), toon(0xf2a7b5), [s * 0.205, 0.35, 0.02], [0, PI / 4, -s * 0.35]);
        }
        break;
      case 'bunga': {
        const cols = [0xf2c94c, 0xf28aa0, 0xffffff, 0xa98bd9];
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * PI * 2;
          put(h, G.sphere(0.06, 10, 8), toon(cols[i % cols.length]), [Math.cos(a) * 0.3, 0.27, Math.sin(a) * 0.3]);
        }
        break;
      }
      case 'topi-graduan': {
        const g = new THREE.Group();
        g.position.set(0, 0.36, 0);
        put(g, G.cyl(0.24, 0.26, 0.12, 16), m);
        put(g, G.box(0.6, 0.03, 0.6), m, [0, 0.07, 0], [0, PI / 4, 0]);
        put(g, G.cyl(0.008, 0.008, 0.25, 4), toon(0xe7c14a), [0.28, -0.04, 0], [0, 0, 0.1]);
        put(g, G.sphere(0.035), toon(0xe7c14a), [0.29, -0.17, 0]);
        h.add(g);
        break;
      }
      case 'mahkota': {
        const g = new THREE.Group();
        g.position.set(0, 0.38, 0);
        put(g, G.cyl(0.2, 0.22, 0.12, 12, true), toon(def.color, { side: DS }));
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * PI * 2;
          put(g, G.cone(0.04, 0.1, 4), m, [Math.cos(a) * 0.2, 0.1, Math.sin(a) * 0.2]);
        }
        put(g, G.octa(0.04), toon(0xe0533c, { emissive: 0x6a1010 }), [0, 0, 0.22]);
        h.add(g);
        break;
      }
      case 'halo':
        this.halo = put(h, G.torus(0.24, 0.03, PI * 2, 8, 28), basic(0xfff1a8), [0, 0.62, 0], [PI / 2, 0, 0]);
        break;
    }
  }

  private addWeapon(o: Outfit): void {
    const hand = (sh: THREE.Group) => {
      const g = new THREE.Group();
      g.position.set(0, -0.34, 0.02);
      sh.add(g);
      return g;
    };
    const metal = toon(0xdfe4ea);
    const wood = toon(0x7a4f2e);
    const gold = toon(0xd7b45a);
    const knife = (g: THREE.Group) => {
      g.rotation.x = PI / 2 + 0.2;
      put(g, G.box(0.045, 0.3, 0.015), metal, [0, 0.2, 0]);
      put(g, G.box(0.12, 0.03, 0.04), gold, [0, 0.05, 0]);
      put(g, G.cyl(0.02, 0.02, 0.1, 6), wood, [0, -0.01, 0]);
    };
    switch (o.weapon) {
      case 'knife':
        knife(hand(this.shoulderR));
        break;
      case 'daggers':
        knife(hand(this.shoulderR));
        knife(hand(this.shoulderL));
        break;
      case 'sword': {
        const g = hand(this.shoulderR);
        g.rotation.x = PI / 2 + 0.15;
        put(g, G.box(0.075, 0.72, 0.02), metal, [0, 0.45, 0]);
        put(g, G.box(0.26, 0.045, 0.06), gold, [0, 0.08, 0]);
        put(g, G.cyl(0.025, 0.025, 0.14, 6), wood, [0, -0.01, 0]);
        put(g, G.sphere(0.04), gold, [0, -0.09, 0]);
        break;
      }
      case 'staff-blue':
      case 'staff-purple': {
        const g = hand(this.shoulderR);
        const orb = o.weapon === 'staff-blue' ? 0x4f8fe8 : 0x9b5be8;
        put(g, G.cyl(0.022, 0.022, 1.2, 8), gold, [0, 0.35, 0]);
        put(g, G.torus(0.1, 0.02, PI * 2, 6, 16), gold, [0, 0.98, 0]);
        put(g, G.sphere(0.075), toon(orb, { emissive: orb, emissiveIntensity: 0.7 }), [0, 0.98, 0]);
        put(g, G.cone(0.03, 0.12, 6), gold, [0, 1.13, 0]);
        break;
      }
      case 'hammer': {
        const g = hand(this.shoulderR);
        put(g, G.cyl(0.025, 0.025, 0.7, 8), wood, [0, 0.22, 0]);
        put(g, G.box(0.3, 0.17, 0.17), toon(0x8a8f99), [0, 0.6, 0]);
        put(g, G.box(0.32, 0.04, 0.19), toon(0x5a5f69), [0, 0.6, 0]);
        break;
      }
      case 'bow': {
        const g = hand(this.shoulderL);
        g.rotation.set(0, 0, 0);
        put(g, G.torus(0.42, 0.022, PI * 0.9, 6, 20), wood, [0, 0, 0.05], [0, PI / 2, PI / 2 + PI * 0.05]);
        put(g, G.cyl(0.004, 0.004, 0.8, 3), basic(0xf4f1ea), [0, 0, -0.12]);
        break;
      }
    }
    if (o.shield) {
      const g = hand(this.shoulderL);
      g.position.set(-0.06, -0.3, 0.1);
      g.rotation.set(0, -0.35, 0);
      put(g, G.box(0.38, 0.48, 0.05), toon(0x2f56a6));
      put(g, G.box(0.42, 0.52, 0.03), toon(0xc9ced6), [0, 0, -0.015]);
      put(g, G.box(0.05, 0.3, 0.02), toon(0xd7b45a), [0, 0, 0.035]);
      put(g, G.box(0.22, 0.05, 0.02), toon(0xd7b45a), [0, 0.04, 0.035]);
    }
  }

  // ---------------------------------------------------------------- animation

  play(kind: Action['kind']): void {
    const dur = kind === 'attack' ? 0.45 : kind === 'cast' ? 0.7 : kind === 'hurt' ? 0.35 : 0.9;
    this.action = { kind, t: 0, dur };
  }

  setDowned(v: boolean): void {
    this.downed = v;
  }

  /** speed is 0..1 (fraction of run speed). */
  update(dt: number, speed: number): void {
    this.t += dt;
    this.walk += (Math.min(1, speed) - this.walk) * Math.min(1, dt * 10);
    const w = this.walk;
    const ph = this.t * 11;
    const swing = Math.sin(ph) * 0.65 * w;

    this.hipL.rotation.x = swing;
    this.hipR.rotation.x = -swing;
    this.shoulderL.rotation.x = -swing * 0.8;
    this.shoulderR.rotation.x = swing * 0.8;
    this.body.position.y = 0.02 + Math.abs(Math.sin(ph)) * 0.05 * w + Math.sin(this.t * 2.2) * 0.008 * (1 - w);
    this.body.rotation.x = 0.06 * w;
    this.head.rotation.z = Math.sin(this.t * 1.3) * 0.03 * (1 - w);
    if (this.cape) this.cape.rotation.x = -0.12 * w - Math.sin(ph * 0.5) * 0.04 * w;
    if (this.halo) this.halo.position.y = 0.62 + Math.sin(this.t * 2) * 0.03;
    this.body.position.x = 0;
    this.body.rotation.z = 0;

    const a = this.action;
    if (a) {
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      if (a.kind === 'attack') {
        // Wind up then slash forward
        const raise = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6;
        this.shoulderR.rotation.x = k < 0.4 ? -2.6 * raise : -2.6 + (k - 0.4) / 0.6 * 2.3;
        this.shoulderL.rotation.x = -1.2 * Math.sin(k * PI);
        this.body.rotation.x = 0.25 * Math.sin(k * PI);
      } else if (a.kind === 'cast') {
        const up = Math.sin(k * PI);
        this.shoulderR.rotation.x = -2.8 * up;
        this.shoulderL.rotation.x = -2.8 * up;
      } else if (a.kind === 'hurt') {
        this.body.position.x = Math.sin(k * PI * 6) * 0.06 * (1 - k);
        this.body.rotation.x = -0.25 * Math.sin(k * PI);
      } else if (a.kind === 'cheer') {
        this.body.position.y += Math.abs(Math.sin(k * PI * 2)) * 0.35;
        this.shoulderR.rotation.x = -2.9;
        this.shoulderL.rotation.x = -2.9 * Math.sin(k * PI);
      }
      if (a.t >= a.dur) this.action = null;
    }

    if (this.downed) {
      this.body.rotation.x = -PI / 2;
      this.body.position.y = 0.3;
      this.hipL.rotation.x = this.hipR.rotation.x = 0;
    }
  }
}
