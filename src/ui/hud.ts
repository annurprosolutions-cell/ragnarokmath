// In-game heads-up display: status card, radar minimap, quest tracker and menu buttons.
import { GRADE_NAMES } from '../math';
import { expToNext, maxHp, maxSp } from '../rpg/character';
import { JOBS, MapDef } from '../rpg/data';
import { currentQuest } from '../rpg/quests';
import type { GameSession } from '../game/session';
import { btn, escapeHtml, h } from './dom';
import { openInventory, openLearning, openSettings, openStatus, openWorldMap } from './menus';

export type MenuId = 'inventory' | 'status' | 'learn' | 'settings' | 'map';

export class Hud {
  readonly root: HTMLElement;
  readonly joyMount: HTMLElement;
  private pf: HTMLElement;
  private nameEl: HTMLElement;
  private lvEl: HTMLElement;
  private hpBar: [HTMLElement, HTMLElement];
  private spBar: [HTMLElement, HTMLElement];
  private expBar: [HTMLElement, HTMLElement];
  private coinsEl: HTMLElement;
  private mapEl: HTMLElement;
  private questEl: HTMLElement;
  private mini: HTMLCanvasElement;
  private actBtn: HTMLButtonElement;
  private statBadge: HTMLElement;
  private t = 0;
  private lastJob = '';

  constructor(private s: GameSession) {
    const bar = (cls: string): [HTMLElement, HTMLElement] => {
      const fill = h('i');
      const txt = h('span');
      return [h('div', { class: `bar ${cls}` }, fill, txt), fill];
    };
    const [hpEl, hpFill] = bar('hp');
    const [spEl, spFill] = bar('sp');
    const [expEl, expFill] = bar('exp');
    this.hpBar = [hpEl, hpFill];
    this.spBar = [spEl, spFill];
    this.expBar = [expEl, expFill];
    this.pf = h('div', { class: 'pf' });
    this.nameEl = h('div', { class: 'pf-name' });
    this.lvEl = h('div', { class: 'pf-lv' });
    this.coinsEl = h('div', { class: 'coins' });
    this.mapEl = h('div', { class: 'map-name' });
    this.questEl = h('div', { class: 'quest' });
    this.mini = h('canvas', { class: 'minimap', attrs: { width: '240', height: '240' } });
    this.actBtn = h('button', { class: 'act', text: '⚔️', attrs: { 'aria-label': 'Serang / Cakap' }, onclick: () => s.action() });
    this.statBadge = h('em', { class: 'badge' });
    this.joyMount = h('div', { class: 'joy-mount' });

    const menuBtn = (icon: string, label: string, id: MenuId, extra?: HTMLElement) => {
      const b = btn(`<span>${icon}</span><small>${label}</small>`, () => this.open(id), 'mbtn');
      if (extra) b.append(extra);
      return b;
    };

    this.root = h('div', { class: 'hud' },
      h('div', { class: 'hud-tl card' }, this.pf, h('div', { class: 'pf-info' }, this.nameEl, this.lvEl, hpEl, spEl, expEl, this.coinsEl)),
      h('div', { class: 'hud-tr' }, this.mapEl, this.mini, this.questEl),
      h('div', { class: 'hud-menu' },
        menuBtn('🎒', 'Beg', 'inventory'),
        menuBtn('📊', 'Status', 'status', this.statBadge),
        menuBtn('📘', 'Rekod', 'learn'),
        menuBtn('🗺️', 'Peta', 'map'),
        menuBtn('⚙️', 'Tetapan', 'settings')),
      h('div', { class: 'hud-br' }, this.actBtn),
      this.joyMount,
      h('div', { class: 'hint desktop-only', html: '<b>WASD</b>/klik untuk jalan · <b>Spasi</b> serang/cakap · <b>Q/E</b> pusing kamera · roda tetikus zum' }),
    );
    document.getElementById('ui')!.append(this.root);
    this.update();
    this.updateQuest();
  }

  open(id: MenuId): void {
    if (this.s.battle || this.s.isBusy()) return;
    if (id === 'inventory') openInventory(this.s);
    else if (id === 'status') openStatus(this.s);
    else if (id === 'learn') openLearning(this.s);
    else if (id === 'map') openWorldMap(this.s);
    else openSettings(this.s);
  }

  setMap(def: MapDef): void {
    this.mapEl.innerHTML = `${escapeHtml(def.name)}${def.grades.length ? `<small>Soalan ${def.recommend}</small>` : '<small>Kawasan selamat</small>'}`;
  }

  update(): void {
    const c = this.s.char;
    const job = JOBS[c.job];
    if (this.lastJob !== c.job) {
      this.lastJob = c.job;
      this.pf.innerHTML = job.portrait ? `<img src="${job.portrait}" alt="">` : '<span>🌱</span>';
    }
    this.nameEl.innerHTML = `${escapeHtml(c.name)} <span class="job">${job.name}</span>`;
    this.lvEl.textContent = `Lv ${c.level} · ${GRADE_NAMES[c.grade]}`;
    const hpMax = maxHp(c), spMax = maxSp(c), need = expToNext(c.level);
    this.setBar(this.hpBar, c.hp / hpMax, `${Math.ceil(c.hp)}/${hpMax}`);
    this.setBar(this.spBar, c.sp / spMax, `${Math.floor(c.sp)}/${spMax}`);
    this.setBar(this.expBar, c.exp / need, `${((c.exp / need) * 100).toFixed(1)}%`);
    this.hpBar[0].classList.toggle('low', c.hp / hpMax < 0.3);
    this.coinsEl.textContent = `🪙 ${c.coins.toLocaleString('ms-MY')}`;
    this.statBadge.textContent = c.statPoints ? String(c.statPoints) : '';
    this.statBadge.style.display = c.statPoints ? '' : 'none';
  }

  private setBar([, fill]: [HTMLElement, HTMLElement], k: number, text: string): void {
    fill.style.width = `${Math.max(0, Math.min(1, k)) * 100}%`;
    (fill.nextSibling as HTMLElement).textContent = text;
  }

  updateQuest(): void {
    const c = this.s.char;
    const q = currentQuest(c);
    if (!q) {
      this.questEl.innerHTML = '<b>🏅 Semua misi selesai!</b><span>Teruskan berlatih dan kumpul topi.</span>';
      return;
    }
    const prog = q.goal > 1 ? ` <em>${Math.min(c.questProgress, q.goal)}/${q.goal}</em>` : '';
    this.questEl.innerHTML = `<b>📜 ${escapeHtml(q.title)}${prog}</b><span>${escapeHtml(q.desc(c))}</span>`;
  }

  tick(dt: number): void {
    this.t += dt;
    if (this.t < 0.2) return;
    this.t = 0;
    this.update();
    this.drawMinimap();
    // Action button reflects what is nearby
    const p = this.s.player;
    let icon = '⚔️';
    let best = 7;
    for (const n of this.s.npcs) {
      const d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d < best) [best, icon] = [d, '💬'];
    }
    for (const m of this.s.mobs) {
      const d = Math.hypot(m.x - p.x, m.z - p.z);
      if (m.alive && d < best) [best, icon] = [d, '⚔️'];
    }
    if (this.actBtn.textContent !== icon) this.actBtn.textContent = icon;
  }

  private drawMinimap(): void {
    const g = this.mini.getContext('2d')!;
    const W = this.mini.width, R = W / 2;
    const s = this.s;
    const p = s.player;
    const yaw = s.cameraYaw;
    const range = 34;
    const k = R / range;
    const rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const tr = (x: number, z: number): [number, number] => {
      const dx = x - p.x, dz = z - p.z;
      return [R + (dx * rx + dz * rz) * k, R - (dx * fx + dz * fz) * k];
    };
    g.clearRect(0, 0, W, W);
    g.save();
    g.beginPath();
    g.arc(R, R, R - 2, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = 'rgba(20, 30, 60, 0.55)';
    g.fillRect(0, 0, W, W);
    // Map boundary
    const b = s.world.bound;
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 3;
    g.beginPath();
    [[-b, -b], [b, -b], [b, b], [-b, b]].forEach(([x, z], i) => {
      const [u, v] = tr(x, z);
      if (i) g.lineTo(u, v);
      else g.moveTo(u, v);
    });
    g.closePath();
    g.stroke();
    const dot = (x: number, z: number, r: number, color: string) => {
      const [u, v] = tr(x, z);
      g.fillStyle = color;
      g.beginPath();
      g.arc(u, v, r, 0, Math.PI * 2);
      g.fill();
    };
    for (const pt of s.world.portals) dot(pt.x, pt.z, 9, '#5fe3ff');
    for (const bt of s.bots) dot(bt.x, bt.z, 4, '#ffffff');
    for (const n of s.npcs) dot(n.x, n.z, 7, '#ffd34d');
    for (const m of s.mobs) if (m.alive) dot(m.x, m.z, m.def.boss ? 9 : 5, m.def.boss ? '#c77dff' : m.def.aggressive ? '#ff5c5c' : '#ff9f80');
    // Player arrow
    g.translate(R, R);
    const rel = p.facing - Math.atan2(fx, fz);
    g.rotate(-rel + Math.PI);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#1d2440';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, -12);
    g.lineTo(9, 10);
    g.lineTo(0, 5);
    g.lineTo(-9, 10);
    g.closePath();
    g.stroke();
    g.fill();
    g.restore();
  }

  destroy(): void {
    this.root.remove();
  }
}
