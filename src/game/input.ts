// Keyboard, mouse, touch joystick and pinch/drag camera controls.

export interface InputHandlers {
  tap(x: number, y: number): void;
  action(): void;
  key(code: string): void;
}

export class Input {
  readonly keys = new Set<string>();
  /** Joystick vector, x right / y up, length ≤ 1. */
  joy = { x: 0, y: 0 };
  rotate = 0;
  zoom = 0;
  enabled = true;
  private pointers = new Map<number, { x: number; y: number; sx: number; sy: number; t: number; button: number }>();
  private pinchDist = 0;
  private cleanup: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, private handlers: InputHandlers) {
    const on = <K extends keyof WindowEventMap>(target: EventTarget, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      target.addEventListener(type, fn as EventListener, opts);
      this.cleanup.push(() => target.removeEventListener(type, fn as EventListener, opts));
    };
    on(window, 'keydown', (e) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
      this.keys.add(e.code);
      if (!e.repeat) this.handlers.key(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    on(window, 'keyup', (e) => this.keys.delete(e.code));
    on(window, 'blur', () => this.keys.clear());
    on(canvas, 'contextmenu', (e) => e.preventDefault());
    on(canvas, 'wheel', (e) => {
      this.zoom += Math.sign(e.deltaY) * 1.2;
      e.preventDefault();
    }, { passive: false });
    on(canvas, 'pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), button: e.button });
      if (this.pointers.size === 2) this.pinchDist = this.pinchDistance();
    });
    on(canvas, 'pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      p.x = e.clientX;
      p.y = e.clientY;
      if (this.pointers.size === 2) {
        const d = this.pinchDistance();
        this.zoom -= (d - this.pinchDist) * 0.05;
        this.pinchDist = d;
      } else if (p.button === 2 || e.pointerType === 'touch' || Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 12) {
        // Drag rotates the camera (right mouse, or a dragged finger / left mouse)
        this.rotate -= dx * 0.008;
      }
    });
    const up = (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (!p || !this.enabled) return;
      const moved = Math.hypot(e.clientX - p.sx, e.clientY - p.sy);
      if (p.button === 0 && moved < 12 && performance.now() - p.t < 450 && this.pointers.size === 0) this.handlers.tap(e.clientX, e.clientY);
    };
    on(canvas, 'pointerup', up);
    on(canvas, 'pointercancel', (e) => this.pointers.delete(e.pointerId));
  }

  private pinchDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** Movement intent in camera space: x right, y forward. */
  moveVector(): { x: number; y: number } {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = this.joy.x, y = this.joy.y;
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  /** Builds the on-screen joystick for touch devices. */
  mountJoystick(parent: HTMLElement): void {
    const base = document.createElement('div');
    base.className = 'joy';
    const knob = document.createElement('div');
    knob.className = 'joy-knob';
    base.append(knob);
    parent.append(base);
    let id = -1;
    const R = 46;
    const set = (cx: number, cy: number) => {
      const r = base.getBoundingClientRect();
      let dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > R) {
        dx = (dx / d) * R;
        dy = (dy / d) * R;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joy = { x: dx / R, y: -dy / R };
    };
    base.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      base.setPointerCapture(id);
      set(e.clientX, e.clientY);
    });
    base.addEventListener('pointermove', (e) => e.pointerId === id && set(e.clientX, e.clientY));
    const release = () => {
      id = -1;
      knob.style.transform = '';
      this.joy = { x: 0, y: 0 };
    };
    base.addEventListener('pointerup', release);
    base.addEventListener('pointercancel', release);
    this.cleanup.push(() => base.remove());
  }

  consumeRotate(): number {
    const r = this.rotate;
    this.rotate = 0;
    return r;
  }

  consumeZoom(): number {
    const z = this.zoom;
    this.zoom = 0;
    return z;
  }

  dispose(): void {
    this.cleanup.forEach((f) => f());
  }
}
