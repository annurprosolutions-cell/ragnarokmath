// Screen-space DOM labels (names, HP bars, damage numbers) pinned to 3D positions.
import * as THREE from 'three';

interface Label {
  el: HTMLElement;
  pos: () => THREE.Vector3;
  maxDist: number;
}

const tmp = new THREE.Vector3();

export class LabelLayer {
  private labels = new Set<Label>();
  private floats: { el: HTMLElement; world: THREE.Vector3; t: number; life: number }[] = [];

  constructor(private root: HTMLElement) {}

  add(el: HTMLElement, pos: () => THREE.Vector3, maxDist = 30): () => void {
    const l: Label = { el, pos, maxDist };
    this.root.append(el);
    this.labels.add(l);
    return () => {
      el.remove();
      this.labels.delete(l);
    };
  }

  /** A short-lived floating text (damage numbers, +EXP). */
  float(html: string, world: THREE.Vector3, cls = '', life = 1.1): void {
    const el = document.createElement('div');
    el.className = 'float ' + cls;
    el.innerHTML = html;
    this.root.append(el);
    this.floats.push({ el, world: world.clone(), t: 0, life });
  }

  update(camera: THREE.Camera, dt: number): void {
    const w = innerWidth, h = innerHeight;
    const camPos = camera.position;
    for (const l of this.labels) {
      const p = l.pos();
      const dist = p.distanceTo(camPos);
      tmp.copy(p).project(camera);
      const visible = tmp.z < 1 && dist < l.maxDist + 20 && Math.abs(tmp.x) < 1.2 && Math.abs(tmp.y) < 1.2;
      if (!visible) {
        if (l.el.style.display !== 'none') l.el.style.display = 'none';
        continue;
      }
      if (l.el.style.display === 'none') l.el.style.display = '';
      l.el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px) translate(-50%, -100%)`;
    }
    this.floats = this.floats.filter((f) => {
      f.t += dt;
      const k = f.t / f.life;
      if (k >= 1) {
        f.el.remove();
        return false;
      }
      tmp.copy(f.world).project(camera);
      const x = ((tmp.x + 1) / 2) * w;
      const y = ((1 - tmp.y) / 2) * h - k * 60;
      f.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1 + Math.max(0, 0.3 - k) * 1.5})`;
      f.el.style.opacity = String(k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3);
      return true;
    });
  }

  clear(): void {
    for (const l of this.labels) l.el.remove();
    this.labels.clear();
    for (const f of this.floats) f.el.remove();
    this.floats = [];
  }
}
