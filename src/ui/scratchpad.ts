// "Kertas conteng": a quick drawing pad for working out answers on a phone.
import { btn, h } from './dom';

let open: HTMLElement | null = null;

export function openScratchpad(): void {
  if (open) {
    open.remove();
    open = null;
    return;
  }
  const canvas = h('canvas', { class: 'pad-canvas' });
  const wrap = h('div', { class: 'pad' },
    h('div', { class: 'pad-bar' },
      h('span', { text: '✏️ Kertas Conteng' }),
      btn('Padam', () => ctx.clearRect(0, 0, canvas.width, canvas.height), 'btn small ghost'),
      btn('Tutup', () => (wrap.remove(), (open = null)), 'btn small')),
    canvas);
  document.body.append(wrap);
  open = wrap;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2b3a67';
  let drawing = false;
  canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });
  const stop = () => (drawing = false);
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

export function closeScratchpad(): void {
  open?.remove();
  open = null;
}
