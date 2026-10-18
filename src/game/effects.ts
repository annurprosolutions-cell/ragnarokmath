// Lightweight particle bursts (hits, heals, level up) using pooled meshes.
import * as THREE from 'three';
import { G, basic } from './materials';

interface P {
  mesh: THREE.Mesh;
  v: THREE.Vector3;
  t: number;
  life: number;
  spin: number;
  grow: number;
}

export class Effects {
  readonly group = new THREE.Group();
  private ps: P[] = [];

  burst(at: THREE.Vector3, color: number, n = 10, speed = 3, up = 2): void {
    for (let i = 0; i < n; i++) {
      const mesh = new THREE.Mesh(G.octa(0.12), basic(color, 1, true));
      mesh.position.copy(at);
      const a = Math.random() * Math.PI * 2;
      const v = new THREE.Vector3(Math.cos(a) * speed * Math.random(), up * (0.5 + Math.random()), Math.sin(a) * speed * Math.random());
      this.group.add(mesh);
      this.ps.push({ mesh, v, t: 0, life: 0.6 + Math.random() * 0.3, spin: 6, grow: 0 });
    }
  }

  ring(at: THREE.Vector3, color: number, size = 2): void {
    const mesh = new THREE.Mesh(G.torus(0.6, 0.06, Math.PI * 2, 6, 32), basic(color, 1, true));
    mesh.position.copy(at);
    mesh.rotation.x = Math.PI / 2;
    this.group.add(mesh);
    this.ps.push({ mesh, v: new THREE.Vector3(0, 1.8, 0), t: 0, life: 1.0, spin: 0, grow: size });
  }

  update(dt: number): void {
    this.ps = this.ps.filter((p) => {
      p.t += dt;
      if (p.t >= p.life) {
        this.group.remove(p.mesh);
        return false;
      }
      p.mesh.position.addScaledVector(p.v, dt);
      if (!p.grow) p.v.y -= 6 * dt;
      p.mesh.rotation.y += p.spin * dt;
      const k = p.t / p.life;
      p.mesh.scale.setScalar(p.grow ? 1 + k * p.grow : 1 - k * 0.7);
      return true;
    });
  }
}
