// Pre-game screens: title (with the live town behind it), save slots and character creation.
import * as THREE from 'three';
import { sfx } from '../audio/sfx';
import { Bot } from '../game/entities';
import { Engine } from '../game/engine';
import { CharacterModel } from '../game/models/character';
import { G, toon } from '../game/materials';
import { BOT_LINES, TOWN_BOTS } from '../game/npcs';
import { World } from '../game/world';
import { GRADES, GRADE_NAMES, GradeId } from '../math';
import { Appearance, CharacterData, newCharacter } from '../rpg/character';
import { ADVANCED_JOBS, JOBS, JobId, MAPS } from '../rpg/data';
import { SaveFile, writeSave } from '../save';
import { appearanceEditor, randomAppearance } from './appearance';
import { btn, clear, confirmBox, escapeHtml, h, openWindow, toast, uiRoot } from './dom';
import { openHelp } from './menus';


// ---------------------------------------------------------------- 3D backdrops

export class TitleStage {
  readonly scene = new THREE.Scene();
  private world: World;
  private bots: Bot[] = [];
  private t = 0;

  constructor(private engine: Engine, save: SaveFile) {
    this.world = new World(MAPS.kota, save.settings.quality);
    this.scene.add(this.world.group);
    this.scene.fog = new THREE.Fog(MAPS.kota.fog, 40, 120);
    this.scene.background = new THREE.Color(MAPS.kota.fog);
    TOWN_BOTS.forEach((b, i) => {
      const bot = new Bot(b.name, b.appearance, b.job, BOT_LINES);
      const a = (i / TOWN_BOTS.length) * Math.PI * 2;
      bot.place(Math.cos(a) * 6, Math.sin(a) * 6, 0.05);
      this.scene.add(bot.group);
      this.bots.push(bot);
    });
  }

  update(dt: number): void {
    this.t += dt;
    this.world.update(this.t, dt);
    const pick = (): [number, number] => {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 9;
      return [Math.cos(a) * r, Math.sin(a) * r];
    };
    for (const b of this.bots) b.update(dt, pick, (x, z) => this.world.resolve(x, z, 0.4), (x, z) => this.world.heightAt(x, z));
    const a = this.t * 0.05;
    const cam = this.engine.camera;
    cam.position.set(Math.cos(a) * 24, 11, Math.sin(a) * 24);
    cam.lookAt(0, 2, 0);
  }

  dispose(): void {
    this.world.dispose();
  }
}

export class PreviewStage {
  readonly scene = new THREE.Scene();
  private model: CharacterModel | null = null;
  private holder = new THREE.Group();
  private spin = 0.4;
  private dragging = false;
  private lastX = 0;
  private cleanup: () => void;

  constructor(private engine: Engine) {
    this.scene.background = new THREE.Color(0xe9dfcc);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8a6a, 1.6));
    const sun = new THREE.DirectionalLight(0xfff3df, 2.2);
    sun.position.set(3, 6, 5);
    this.scene.add(sun);
    const ped = new THREE.Mesh(G.cyl(1.1, 1.25, 0.25, 32), toon(0xb9a27a));
    ped.position.y = -0.13;
    this.scene.add(ped);
    const rim = new THREE.Mesh(G.torus(1.12, 0.04, Math.PI * 2, 6, 48), toon(0xd7b45a));
    rim.rotation.x = Math.PI / 2;
    this.scene.add(rim);
    this.scene.add(this.holder);
    const canvas = engine.canvas;
    const down = (e: PointerEvent) => ((this.dragging = true), (this.lastX = e.clientX));
    const move = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.holder.rotation.y += (e.clientX - this.lastX) * 0.012;
      this.lastX = e.clientX;
      this.spin = 0;
    };
    const up = () => (this.dragging = false);
    canvas.addEventListener('pointerdown', down);
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    this.cleanup = () => {
      canvas.removeEventListener('pointerdown', down);
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
    };
  }

  show(app: Appearance, job: JobId): void {
    if (this.model) this.holder.remove(this.model.root);
    this.model = new CharacterModel(app, job);
    this.holder.add(this.model.root);
  }

  cheer(): void {
    this.model?.play('cheer');
  }

  update(dt: number): void {
    this.holder.rotation.y += this.spin * dt;
    this.model?.update(dt, 0);
    const cam = this.engine.camera;
    const W = innerWidth, H = innerHeight;
    const landscape = W > H;
    cam.position.set(0, 1.6, landscape ? 6.4 : 8.6);
    cam.lookAt(0, 0.8, 0);
    // Keep the model inside the preview area (left half on wide screens, top on phones).
    if (landscape) cam.setViewOffset(W, H, W * 0.24, 0, W, H);
    else cam.setViewOffset(W, H, 0, H * 0.29, W, H);
  }

  dispose(): void {
    this.cleanup();
    this.engine.camera.clearViewOffset();
  }
}

// ---------------------------------------------------------------- PWA install

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

let installEvent: InstallPromptEvent | null = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e as InstallPromptEvent;
  document.querySelector('.install-btn')?.classList.remove('hidden');
});

function isStandalone(): boolean {
  return matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function installApp(): void {
  if (installEvent) {
    void installEvent.prompt();
    installEvent = null;
    return;
  }
  const w = openWindow('Pasang sebagai App');
  w.body.innerHTML = `
    <p><b>iPhone / iPad (Safari):</b> tekan butang <b>Share</b> ⬆️ dan pilih <b>Add to Home Screen</b>.</p>
    <p><b>Android (Chrome):</b> tekan menu ⋮ dan pilih <b>Install app</b> atau <b>Add to Home screen</b>.</p>
    <p><b>Komputer (Chrome/Edge):</b> tekan ikon pasang ⊕ di bar alamat.</p>
    <p class="muted">Selepas dipasang, game boleh dimain tanpa internet.</p>`;
}

// ---------------------------------------------------------------- title & slots

export interface ScreenActions {
  play(slot: number): void;
  create(slot: number): void;
}

export function renderTitle(save: SaveFile, actions: ScreenActions, view: 'main' | 'slots' = 'main'): void {
  const ui = uiRoot();
  clear(ui);
  const portraits = h('div', { class: 'portraits' }, ...ADVANCED_JOBS.map((id) => h('figure', {},
    h('img', { attrs: { src: JOBS[id].portrait!, alt: JOBS[id].name, loading: 'lazy' } }),
    h('figcaption', { text: JOBS[id].name }))));
  const logo = h('div', { class: 'logo' },
    h('h1', { html: 'Kembara<span>Matematik</span>' }),
    h('p', { text: 'RPG 3D Matematik · Tahun 1 hingga Tingkatan 5' }));
  const screen = h('div', { class: 'screen title' }, logo);
  if (view === 'main') {
    const installBtn = btn('📲 Pasang App', installApp, 'btn ghost install-btn' + (isStandalone() ? ' hidden' : ''));
    screen.append(
      portraits,
      h('div', { class: 'title-actions' },
        btn('▶ Main', () => (sfx.click(), renderTitle(save, actions, 'slots')), 'btn primary big'),
        installBtn,
        btn('❓ Cara Bermain', () => openHelp(), 'btn ghost')),
      h('footer', { text: 'Boleh main offline · Simpan automatik dalam peranti · Tiada iklan' }));
  } else {
    const slots = h('div', { class: 'slots' });
    save.slots.forEach((c, i) => slots.append(slotCard(save, c, i, actions)));
    screen.append(
      h('h2', { class: 'slots-title', text: 'Pilih Watak' }),
      slots,
      h('div', { class: 'title-actions' },
        btn('← Kembali', () => renderTitle(save, actions, 'main'), 'btn ghost'),
        btn('📂 Import simpanan', () => importSave(save, actions), 'btn ghost')));
  }
  ui.append(screen);
}

function slotCard(save: SaveFile, c: CharacterData | null, i: number, actions: ScreenActions): HTMLElement {
  if (!c) {
    return h('button', { class: 'slot empty', onclick: () => (sfx.click(), actions.create(i)) }, h('span', { text: '＋' }), h('b', { text: 'Cipta Watak Baru' }), h('small', { text: `Slot ${i + 1}` }));
  }
  const job = JOBS[c.job];
  return h('div', { class: 'slot' },
    job.portrait ? h('img', { attrs: { src: job.portrait, alt: job.name } }) : h('div', { class: 'slot-novice', text: '🌱' }),
    h('div', { class: 'slot-info' },
      h('b', { text: c.name }),
      h('span', { text: `${job.name} · Lv ${c.level}` }),
      h('small', { text: `${GRADE_NAMES[c.grade]} · ${MAPS[c.map].name}` }),
      h('small', { text: `${Math.floor(c.playTime / 60)} minit dimain` })),
    h('div', { class: 'slot-btns' },
      btn('Main ▶', () => (sfx.click(), actions.play(i)), 'btn primary'),
      btn('🗑', () => confirmBox(`Padam watak <b>${escapeHtml(c.name)}</b>? Semua progress akan hilang.`, 'Padam', () => {
        save.slots[i] = null;
        writeSave(save);
        renderTitle(save, actions, 'slots');
      }), 'btn ghost small')));
}

function importSave(save: SaveFile, actions: ScreenActions): void {
  const input = h('input', { attrs: { type: 'file', accept: 'application/json,.json' } });
  input.onchange = async () => {
    const f = input.files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as CharacterData;
      if (!data.name || !data.appearance || !data.job || !data.level) throw new Error('bad');
      const slot = save.slots.findIndex((x) => !x);
      if (slot < 0) return toast('Semua slot penuh. Padam satu watak dahulu.', 'bad');
      save.slots[slot] = data;
      writeSave(save);
      toast(`Watak ${escapeHtml(data.name)} diimport.`, 'good');
      renderTitle(save, actions, 'slots');
    } catch {
      toast('Fail simpanan tidak sah.', 'bad');
    }
  };
  input.click();
}

// ---------------------------------------------------------------- character creation

export function renderCreate(stage: PreviewStage, onDone: (name: string, grade: GradeId, app: Appearance) => void, onBack: () => void): void {
  const ui = uiRoot();
  clear(ui);
  const app = randomAppearance();
  let grade: GradeId = 'T1';
  let previewJob: JobId = 'novice';
  const refresh = () => stage.show(app, previewJob);
  refresh();

  const name = h('input', { class: 'name-input', attrs: { maxlength: '12', placeholder: 'Nama watak', autocomplete: 'off', enterkeyhint: 'done' } });
  const gradeChips = h('div', { class: 'chips grades' });
  GRADES.forEach((g) => {
    const b = h('button', { class: 'chip' + (g === grade ? ' on' : ''), text: GRADE_NAMES[g].replace('Tingkatan', 'Ting.') });
    b.onclick = () => {
      grade = g;
      [...gradeChips.children].forEach((x) => x.classList.toggle('on', x === b));
    };
    gradeChips.append(b);
  });

  const editorBox = h('div');
  const mountEditor = () => {
    clear(editorBox);
    editorBox.append(appearanceEditor(app, refresh));
  };
  mountEditor();

  const jobChips = h('div', { class: 'chips job-preview' });
  (['novice', ...ADVANCED_JOBS] as JobId[]).forEach((j) => {
    const b = h('button', { class: 'chip' + (j === previewJob ? ' on' : ''), text: JOBS[j].name });
    b.onclick = () => {
      previewJob = j;
      [...jobChips.children].forEach((x) => x.classList.toggle('on', x === b));
      refresh();
      stage.cheer();
    };
    jobChips.append(b);
  });

  const start = () => {
    const n = name.value.trim().replace(/\s+/g, ' ');
    if (n.length < 2) {
      toast('Nama perlu sekurang-kurangnya 2 huruf.', 'bad');
      name.focus();
      return;
    }
    if (!/^[\p{L}\p{N} '._-]+$/u.test(n)) {
      toast('Nama hanya boleh ada huruf dan nombor.', 'bad');
      return;
    }
    sfx.levelUp();
    onDone(n, grade, { ...app });
  };

  ui.append(h('div', { class: 'screen create' },
    h('div', { class: 'create-preview' },
      h('div', { class: 'preview-label', html: 'Pratonton job <small>(leret untuk pusing)</small>' }),
      jobChips),
    h('div', { class: 'create-panel card' },
      h('h2', { text: 'Cipta Watak' }),
      h('p', { class: 'muted', text: 'Semua bermula sebagai Novice. Pada Level 10 kau boleh pilih job.' }),
      h('div', { class: 'field' }, h('label', { text: 'Nama' }), name),
      h('div', { class: 'field' }, h('label', { text: 'Tahap sekolah sekarang' }), gradeChips),
      editorBox,
      h('div', { class: 'row between sticky-actions' },
        btn('← Kembali', onBack, 'btn ghost'),
        btn('🎲 Rawak', () => {
          Object.assign(app, randomAppearance());
          mountEditor();
          refresh();
        }, 'btn ghost'),
        btn('Mula Kembara ✔', start, 'btn primary')))));
}

export function createCharacter(save: SaveFile, slot: number, name: string, grade: GradeId, app: Appearance): void {
  save.slots[slot] = newCharacter(name, grade, app);
  writeSave(save);
}
