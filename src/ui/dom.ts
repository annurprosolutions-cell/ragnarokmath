// Tiny DOM helper so UI code stays readable without a framework.

type Child = Node | string | number | null | undefined | false;

export interface Props {
  class?: string;
  text?: string;
  html?: string;
  style?: string;
  title?: string;
  onclick?: (e: MouseEvent) => void;
  attrs?: Record<string, string>;
}

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.html !== undefined) el.innerHTML = props.html;
  if (props.style) el.setAttribute('style', props.style);
  if (props.title) el.title = props.title;
  if (props.onclick) { const fn = props.onclick; el.addEventListener('click', (e) => fn(e as MouseEvent)); }
  if (props.attrs) for (const [k, v] of Object.entries(props.attrs)) el.setAttribute(k, v);
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export function btn(label: string, onclick: () => void, cls = 'btn'): HTMLButtonElement {
  return h('button', { class: cls, html: label, onclick: () => onclick() });
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}

/** Root element for overlay UI. */
export function uiRoot(): HTMLElement {
  return document.getElementById('ui')!;
}

/** Modal window in the RO-style blue title bar look. Returns the body element and a close function. */
export function openWindow(title: string, opts: { wide?: boolean; onClose?: () => void; closable?: boolean } = {}): { win: HTMLElement; body: HTMLElement; close: () => void } {
  const backdrop = h('div', { class: 'backdrop' });
  const body = h('div', { class: 'win-body' });
  const close = () => {
    backdrop.remove();
    opts.onClose?.();
  };
  const head = h('div', { class: 'win-head' }, h('span', { text: title }));
  if (opts.closable !== false) head.append(h('button', { class: 'win-x', text: '✕', attrs: { 'aria-label': 'Tutup' }, onclick: close }));
  const win = h('div', { class: 'win' + (opts.wide ? ' wide' : '') }, head, body);
  backdrop.append(win);
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop && opts.closable !== false) close();
  });
  uiRoot().append(backdrop);
  return { win, body, close };
}

let toastBox: HTMLElement | null = null;

export function toast(msg: string, kind: 'info' | 'good' | 'bad' | 'gold' = 'info'): void {
  if (!toastBox || !toastBox.isConnected) {
    toastBox = h('div', { class: 'toasts' });
    document.body.append(toastBox);
  }
  const t = h('div', { class: `toast ${kind}`, html: msg });
  toastBox.append(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
  while (toastBox.children.length > 4) toastBox.firstChild?.remove();
}

export function confirmBox(text: string, yes: string, onYes: () => void): void {
  const w = openWindow('Pengesahan');
  w.body.append(
    h('p', { html: text }),
    h('div', { class: 'row end' }, btn('Batal', w.close, 'btn ghost'), btn(yes, () => (w.close(), onYes()), 'btn danger')),
  );
}
