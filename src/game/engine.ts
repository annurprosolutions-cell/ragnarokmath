// Renderer, camera and the frame loop.
import * as THREE from 'three';
import { Quality } from '../save';

export type FrameFn = (dt: number, t: number) => void;

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  scene: THREE.Scene | null = null;
  private frameFns = new Set<FrameFn>();
  private last = performance.now();
  private t = 0;
  private quality: Quality;

  constructor(readonly canvas: HTMLCanvasElement, quality: Quality) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.applyQuality();
    addEventListener('resize', () => this.resize());
    this.resize();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!document.hidden) {
        this.t += dt;
        for (const f of this.frameFns) f(dt, this.t);
        if (this.scene) this.renderer.render(this.scene, this.camera);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  setQuality(q: Quality): void {
    this.quality = q;
    this.applyQuality();
  }

  private applyQuality(): void {
    const dpr = devicePixelRatio || 1;
    this.renderer.setPixelRatio(this.quality === 'low' ? Math.min(dpr, 1) : this.quality === 'med' ? Math.min(dpr, 1.5) : Math.min(dpr, 2));
    this.resize();
  }

  resize(): void {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Portrait phones need a wider view to keep the action visible.
    this.camera.fov = w < h ? 52 : 38;
    this.camera.updateProjectionMatrix();
  }

  onFrame(f: FrameFn): () => void {
    this.frameFns.add(f);
    return () => this.frameFns.delete(f);
  }
}
