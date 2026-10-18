// Shared toon materials and geometry caches so hundreds of meshes reuse a handful of GPU objects.
import * as THREE from 'three';

let gradient: THREE.DataTexture | null = null;

function gradientMap(): THREE.DataTexture {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([110, 185, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = THREE.NearestFilter;
    gradient.magFilter = THREE.NearestFilter;
    gradient.needsUpdate = true;
  }
  return gradient;
}

export interface MatOpts {
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
  side?: THREE.Side;
  flat?: boolean;
}

const mats = new Map<string, THREE.Material>();

export function toon(color: number, opts: MatOpts = {}): THREE.MeshToonMaterial {
  const key = `t:${color}:${opts.emissive ?? ''}:${opts.emissiveIntensity ?? ''}:${opts.opacity ?? ''}:${opts.side ?? ''}`;
  let m = mats.get(key) as THREE.MeshToonMaterial | undefined;
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() });
    if (opts.emissive !== undefined) {
      m.emissive.setHex(opts.emissive);
      m.emissiveIntensity = opts.emissiveIntensity ?? 1;
    }
    if (opts.opacity !== undefined) {
      m.transparent = true;
      m.opacity = opts.opacity;
      m.depthWrite = false;
    }
    if (opts.side !== undefined) m.side = opts.side;
    mats.set(key, m);
  }
  return m;
}

/** Unlit material for glows, water and effects. */
export function basic(color: number, opacity = 1, additive = false): THREE.MeshBasicMaterial {
  const key = `b:${color}:${opacity}:${additive}`;
  let m = mats.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1 || additive, opacity, depthWrite: !(opacity < 1 || additive) });
    if (additive) m.blending = THREE.AdditiveBlending;
    mats.set(key, m);
  }
  return m;
}

const geos = new Map<string, THREE.BufferGeometry>();

export function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geos.get(key) as T | undefined;
  if (!g) {
    g = make();
    geos.set(key, g);
  }
  return g;
}

export const G = {
  sphere: (r: number, w = 16, h = 12) => geo(`sph:${r}:${w}:${h}`, () => new THREE.SphereGeometry(r, w, h)),
  partSphere: (r: number, phiStart: number, phiLen: number, thetaStart: number, thetaLen: number, w = 20, h = 14) =>
    geo(`psph:${r}:${phiStart}:${phiLen}:${thetaStart}:${thetaLen}`, () => new THREE.SphereGeometry(r, w, h, phiStart, phiLen, thetaStart, thetaLen)),
  capsule: (r: number, len: number) => geo(`cap:${r}:${len}`, () => new THREE.CapsuleGeometry(r, len, 4, 10)),
  cyl: (rt: number, rb: number, h: number, seg = 14, open = false) => geo(`cyl:${rt}:${rb}:${h}:${seg}:${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)),
  arcCyl: (rt: number, rb: number, h: number, start: number, len: number) =>
    geo(`acyl:${rt}:${rb}:${h}:${start}:${len}`, () => new THREE.CylinderGeometry(rt, rb, h, 14, 1, true, start, len)),
  cone: (r: number, h: number, seg = 12) => geo(`cone:${r}:${h}:${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
  box: (x: number, y: number, z: number) => geo(`box:${x}:${y}:${z}`, () => new THREE.BoxGeometry(x, y, z)),
  torus: (r: number, t: number, arc = Math.PI * 2, rs = 8, ts = 20) => geo(`tor:${r}:${t}:${arc}:${rs}:${ts}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)),
  ico: (r: number, d = 0) => geo(`ico:${r}:${d}`, () => new THREE.IcosahedronGeometry(r, d)),
  octa: (r: number) => geo(`oct:${r}`, () => new THREE.OctahedronGeometry(r, 0)),
  dodeca: (r: number) => geo(`dod:${r}`, () => new THREE.DodecahedronGeometry(r, 0)),
  plane: (w: number, h: number) => geo(`pln:${w}:${h}`, () => new THREE.PlaneGeometry(w, h)),
};

/** Add a mesh to a parent at a position, with optional rotation and scale. */
export function put(
  parent: THREE.Object3D,
  g: THREE.BufferGeometry,
  m: THREE.Material,
  pos: [number, number, number] = [0, 0, 0],
  rot: [number, number, number] = [0, 0, 0],
  scale: number | [number, number, number] = 1,
): THREE.Mesh {
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  if (typeof scale === 'number') mesh.scale.setScalar(scale);
  else mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

let shadowTex: THREE.Texture | null = null;

/** Soft round blob shadow, RO style. */
export function blobShadow(radius: number): THREE.Mesh {
  if (!shadowTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.45)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    shadowTex = new THREE.CanvasTexture(c);
  }
  const mat = (mats.get('shadow') as THREE.MeshBasicMaterial) ?? new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  mats.set('shadow', mat);
  const mesh = new THREE.Mesh(G.plane(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.setScalar(radius * 2);
  mesh.renderOrder = 1;
  return mesh;
}

export function darken(hex: number, f: number): number {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return c.getHex();
}
