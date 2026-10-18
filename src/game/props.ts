// Instanced scenery kits. Each kit is a list of parts that get stamped many times
// through InstancedMesh so a forest costs a handful of draw calls.
import * as THREE from 'three';
import { G, basic, toon } from './materials';

export interface Part {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  m: THREE.Matrix4;
}

function part(geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]): Part {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
  return { geo, mat, m };
}

export class Batch {
  private mats: THREE.Matrix4[] = [];
  private colors: (THREE.Color | null)[] = [];
  constructor(private parts: Part[], private tintPart = -1) {}

  add(x: number, y: number, z: number, rotY = 0, s = 1, tint?: number): void {
    this.mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(s, s, s)));
    this.colors.push(tint !== undefined ? new THREE.Color(tint) : null);
  }

  get count(): number {
    return this.mats.length;
  }

  build(parent: THREE.Object3D): void {
    if (!this.mats.length) return;
    const tmp = new THREE.Matrix4();
    this.parts.forEach((p, pi) => {
      const mesh = new THREE.InstancedMesh(p.geo, p.mat, this.mats.length);
      this.mats.forEach((m, i) => {
        mesh.setMatrixAt(i, tmp.multiplyMatrices(m, p.m));
        if (pi === this.tintPart && this.colors[i]) mesh.setColorAt(i, this.colors[i]!);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      parent.add(mesh);
    });
  }
}

const PI = Math.PI;

export const KITS = {
  roundTree: (leaf = 0x5fae4e) => new Batch([
    part(G.cyl(0.18, 0.26, 1.6, 7), toon(0x7a4f2e), [0, 0.8, 0]),
    part(G.ico(1.1, 1), toon(leaf), [0, 2.2, 0], [0, 0, 0], [1, 0.9, 1]),
    part(G.ico(0.75, 1), toon(leaf), [0.55, 1.9, 0.3]),
    part(G.ico(0.7, 1), toon(leaf), [-0.5, 2.0, -0.3]),
  ]),
  pine: (leaf = 0x2f7a4a, snow = false) => new Batch([
    part(G.cyl(0.15, 0.22, 1.0, 6), toon(0x6b4128), [0, 0.5, 0]),
    part(G.cone(1.2, 1.5, 8), toon(leaf), [0, 1.5, 0]),
    part(G.cone(0.95, 1.3, 8), toon(leaf), [0, 2.3, 0]),
    part(G.cone(0.65, 1.1, 8), toon(snow ? 0xffffff : leaf), [0, 3.0, 0]),
  ]),
  bush: (c = 0x4f9a42) => new Batch([part(G.ico(0.6, 1), toon(c), [0, 0.35, 0], [0, 0, 0], [1.2, 0.8, 1])]),
  flower: () => new Batch([
    part(G.cyl(0.02, 0.02, 0.3, 4), toon(0x3f8a3e), [0, 0.15, 0]),
    part(G.sphere(0.09, 6, 5), toon(0xffffff), [0, 0.32, 0]),
  ], 1),
  rock: (c = 0x9a9aa2) => new Batch([part(G.dodeca(0.7), toon(c), [0, 0.3, 0], [0.3, 0, 0.2], [1.2, 0.8, 1])]),
  mushroomDeco: () => new Batch([
    part(G.cyl(0.12, 0.16, 0.5, 8), toon(0xfff3e0), [0, 0.25, 0]),
    part(G.partSphere(0.4, 0, PI * 2, 0, PI / 2, 12, 6), toon(0xe0533c), [0, 0.48, 0], [0, 0, 0], [1, 0.7, 1]),
  ], 1),
  log: () => new Batch([part(G.cyl(0.3, 0.3, 2.2, 8), toon(0x7a4f2e), [0, 0.3, 0], [0, 0, PI / 2])]),
  palm: () => new Batch([
    part(G.cyl(0.14, 0.2, 1.4, 6), toon(0x9a6b3e), [0, 0.7, 0], [0, 0, 0.08]),
    part(G.cyl(0.12, 0.15, 1.4, 6), toon(0x9a6b3e), [0.15, 2.0, 0], [0, 0, 0.18]),
    part(G.cyl(0.1, 0.12, 1.2, 6), toon(0x9a6b3e), [0.4, 3.2, 0], [0, 0, 0.3]),
    ...[0, 1, 2, 3, 4, 5].map((i) => part(G.box(0.5, 0.06, 1.9), toon(0x4fa64a), [0.5 + Math.cos((i * PI) / 3) * 0.75, 3.75, Math.sin((i * PI) / 3) * 0.75], [0.35, -(i * PI) / 3 + PI / 2, 0])),
    part(G.sphere(0.13, 6, 5), toon(0x6b4128), [0.45, 3.65, 0.15]),
  ]),
  shell: () => new Batch([part(G.partSphere(0.14, 0, PI * 2, 0, PI / 2, 8, 4), toon(0xffffff), [0, 0, 0], [0, 0, 0], [1, 0.5, 1.2])], 0),
  umbrella: () => new Batch([
    part(G.cyl(0.04, 0.04, 2.2, 6), toon(0xffffff), [0, 1.1, 0]),
    part(G.cone(1.4, 0.6, 8), toon(0xffffff), [0, 2.3, 0]),
  ], 1),
  cactus: () => new Batch([
    part(G.capsule(0.28, 1.4), toon(0x4c9b48), [0, 0.95, 0]),
    part(G.capsule(0.15, 0.5), toon(0x4c9b48), [0.5, 1.3, 0]),
    part(G.capsule(0.13, 0.35), toon(0x4c9b48), [0.32, 0.95, 0], [0, 0, PI / 2]),
    part(G.capsule(0.15, 0.4), toon(0x4c9b48), [-0.5, 1.6, 0]),
    part(G.capsule(0.13, 0.3), toon(0x4c9b48), [-0.32, 1.3, 0], [0, 0, PI / 2]),
  ]),
  sandRock: () => new Batch([part(G.dodeca(1), toon(0xc9955a), [0, 0.5, 0], [0.2, 0, 0.1], [1.4, 0.9, 1.1])]),
  pyramid: () => new Batch([part(G.cone(14, 12, 4), toon(0xe2b56a), [0, 6, 0], [0, PI / 4, 0])]),
  stalagmite: (c = 0x5a4d70) => new Batch([part(G.cone(0.5, 2.2, 6), toon(c), [0, 1.1, 0])]),
  crystalDeco: (c: number) => new Batch([
    part(G.octa(0.5), toon(c, { emissive: c, emissiveIntensity: 0.45 }), [0, 0.8, 0], [0, 0, 0], [0.6, 1.6, 0.6]),
    part(G.octa(0.3), toon(c, { emissive: c, emissiveIntensity: 0.45 }), [0.45, 0.45, 0.1], [0, 0, 0.5], [0.6, 1.4, 0.6]),
  ]),
  iceRock: () => new Batch([part(G.dodeca(0.9), toon(0xcfe9f5), [0, 0.4, 0], [0.2, 0, 0.3], [1.2, 0.9, 1])]),
  snowman: () => new Batch([
    part(G.sphere(0.55, 12, 10), toon(0xffffff), [0, 0.5, 0]),
    part(G.sphere(0.38, 12, 10), toon(0xffffff), [0, 1.25, 0]),
    part(G.cone(0.06, 0.3, 6), toon(0xe08a2b), [0, 1.25, 0.45], [PI / 2, 0, 0]),
    part(G.cyl(0.3, 0.3, 0.35, 10), toon(0x22232a), [0, 1.75, 0]),
  ]),
  house: (roof: number) => new Batch([
    part(G.box(5, 3.2, 4.5), toon(0xf4ead6), [0, 1.6, 0]),
    part(G.cone(4.1, 2.4, 4), toon(roof), [0, 4.4, 0], [0, PI / 4, 0], [1, 1, 0.85]),
    part(G.box(1.1, 1.9, 0.12), toon(0x7a4f2e), [0, 0.95, 2.27]),
    part(G.box(0.9, 0.8, 0.12), toon(0x9fd3ff), [-1.6, 1.9, 2.27]),
    part(G.box(0.9, 0.8, 0.12), toon(0x9fd3ff), [1.6, 1.9, 2.27]),
    part(G.box(0.5, 1.2, 0.5), toon(0xb07a5a), [1.4, 5.0, -0.5]),
  ]),
  lamp: () => new Batch([
    part(G.cyl(0.07, 0.1, 2.6, 6), toon(0x3a3540), [0, 1.3, 0]),
    part(G.sphere(0.22, 10, 8), toon(0xfff1a8, { emissive: 0xffd36a, emissiveIntensity: 0.8 }), [0, 2.75, 0]),
    part(G.cone(0.3, 0.25, 6), toon(0x3a3540), [0, 3.0, 0]),
  ]),
  wall: () => new Batch([
    part(G.box(4, 1.2, 0.8), toon(0xbfb5a5), [0, 0.6, 0]),
    part(G.box(4.1, 0.2, 0.9), toon(0xa39885), [0, 1.25, 0]),
  ]),
  fencePost: () => new Batch([part(G.box(0.15, 1, 0.15), toon(0x8b5a2b), [0, 0.5, 0]), part(G.box(0.08, 0.08, 2), toon(0x8b5a2b), [0, 0.7, 1])]),
  cloud: () => new Batch([
    part(G.sphere(2, 10, 8), basic(0xffffff, 0.9), [0, 0, 0], [0, 0, 0], [1.4, 0.7, 1]),
    part(G.sphere(1.6, 10, 8), basic(0xffffff, 0.9), [2, -0.2, 0.3], [0, 0, 0], [1.2, 0.7, 1]),
    part(G.sphere(1.5, 10, 8), basic(0xffffff, 0.9), [-2, -0.3, -0.2], [0, 0, 0], [1.2, 0.7, 1]),
  ]),
};
