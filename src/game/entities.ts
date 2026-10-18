// World actors: the player, monsters, town NPCs and wandering adventurers.
import * as THREE from 'three';
import { Appearance } from '../rpg/character';
import { JobId, MonsterDef } from '../rpg/data';
import { escapeHtml, h } from '../ui/dom';
import { blobShadow } from './materials';
import { CharacterModel } from './models/character';
import { MonsterModel } from './models/monster';

export class Actor {
  readonly group = new THREE.Group();
  x = 0;
  z = 0;
  y = 0;
  facing = 0;
  /** Approximate height used for label placement and tap picking. */
  height = 1.7;
  private labelPos = new THREE.Vector3();

  constructor(shadowRadius: number) {
    const s = blobShadow(shadowRadius);
    s.position.y = 0.03;
    this.group.add(s);
  }

  place(x: number, z: number, y: number): void {
    this.x = x;
    this.z = z;
    this.y = y;
    this.group.position.set(x, y, z);
  }

  /** Smoothly turn towards an angle. */
  turnTo(angle: number, dt: number, speed = 12): void {
    let d = angle - this.facing;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.facing += d * Math.min(1, dt * speed);
    this.group.rotation.y = this.facing;
  }

  faceTowards(x: number, z: number, dt: number): void {
    this.turnTo(Math.atan2(x - this.x, z - this.z), dt);
  }

  head(): THREE.Vector3 {
    return this.labelPos.set(this.x, this.y + this.height + 0.25, this.z);
  }
}

export class PlayerEntity extends Actor {
  model: CharacterModel;
  target: { kind: 'point'; x: number; z: number } | { kind: 'mob'; mob: Mob } | { kind: 'npc'; npc: Npc } | null = null;
  readonly speed = 6;
  labelEl: HTMLElement;

  constructor(app: Appearance, job: JobId, name: string) {
    super(0.45);
    this.model = new CharacterModel(app, job);
    this.group.add(this.model.root);
    this.labelEl = h('div', { class: 'tag player', text: name });
  }

  rebuild(app: Appearance, job: JobId): void {
    this.group.remove(this.model.root);
    this.model = new CharacterModel(app, job);
    this.group.add(this.model.root);
  }
}

export class Mob extends Actor {
  model: MonsterModel;
  hp: number;
  alive = true;
  inBattle = false;
  respawnT = 0;
  homeX = 0;
  homeZ = 0;
  private tx = 0;
  private tz = 0;
  private idleT = Math.random() * 3;
  labelEl: HTMLElement;
  private hpFill: HTMLElement;
  moving = 0;

  constructor(readonly def: MonsterDef) {
    super(0.55 * def.scale);
    this.model = new MonsterModel(def);
    this.group.add(this.model.root);
    this.height = this.model.height;
    this.hp = def.hp;
    this.hpFill = h('i');
    this.labelEl = h('div', { class: 'tag mob' + (def.boss ? ' boss' : '') },
      h('span', { html: `${def.boss ? '👑 ' : ''}${escapeHtml(def.name)} <small>Lv ${def.level}</small>` }),
      h('b', { class: 'mini-hp' }, this.hpFill));
  }

  get radius(): number {
    return 0.55 * this.def.scale;
  }

  setHome(x: number, z: number): void {
    this.homeX = this.tx = x;
    this.homeZ = this.tz = z;
  }

  refreshHp(): void {
    this.hpFill.style.width = `${Math.max(0, (this.hp / this.def.hp) * 100)}%`;
    this.labelEl.classList.toggle('hurt', this.hp < this.def.hp);
  }

  /** Simple wander AI around the spawn point. Returns the desired step. */
  wander(dt: number, blocked: (x: number, z: number) => boolean): { dx: number; dz: number } {
    if (this.idleT > 0) {
      this.idleT -= dt;
      return { dx: 0, dz: 0 };
    }
    const dx = this.tx - this.x, dz = this.tz - this.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.3) {
      this.idleT = 1.5 + Math.random() * 3.5;
      const range = this.def.boss ? 3 : 7;
      for (let i = 0; i < 6; i++) {
        const nx = this.homeX + (Math.random() - 0.5) * range * 2;
        const nz = this.homeZ + (Math.random() - 0.5) * range * 2;
        if (!blocked(nx, nz)) {
          this.tx = nx;
          this.tz = nz;
          break;
        }
      }
      return { dx: 0, dz: 0 };
    }
    const sp = 1.4 * dt;
    return { dx: (dx / d) * sp, dz: (dz / d) * sp };
  }
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  icon: string;
  job: JobId;
  appearance: Appearance;
  pos: [number, number];
  facing: number;
}

export class Npc extends Actor {
  model: CharacterModel;
  labelEl: HTMLElement;
  private markEl: HTMLElement;

  constructor(readonly def: NpcDef) {
    super(0.45);
    this.model = new CharacterModel(def.appearance, def.job);
    this.group.add(this.model.root);
    this.facing = def.facing;
    this.group.rotation.y = def.facing;
    this.markEl = h('em', { class: 'mark', text: '!' });
    this.labelEl = h('div', { class: 'tag npc' }, this.markEl, h('span', { html: `${def.icon} ${escapeHtml(def.name)}` }), h('small', { text: def.title }));
  }

  setMarked(v: boolean): void {
    this.markEl.style.display = v ? '' : 'none';
  }
}

export class Bot extends Actor {
  model: CharacterModel;
  labelEl: HTMLElement;
  private bubble: HTMLElement;
  private tx = 0;
  private tz = 0;
  private idle = Math.random() * 4;
  private chatT = 5 + Math.random() * 15;

  constructor(readonly name: string, app: Appearance, job: JobId, private lines: string[]) {
    super(0.45);
    this.model = new CharacterModel(app, job);
    this.group.add(this.model.root);
    this.bubble = h('div', { class: 'bubble' });
    this.labelEl = h('div', { class: 'tag bot' }, this.bubble, h('span', { text: name }));
  }

  update(dt: number, pick: () => [number, number], resolve: (x: number, z: number) => [number, number], ground: (x: number, z: number) => number): void {
    this.chatT -= dt;
    if (this.chatT < 0) {
      this.bubble.textContent = this.lines[Math.floor(Math.random() * this.lines.length)];
      this.bubble.classList.add('show');
      setTimeout(() => this.bubble.classList.remove('show'), 3500);
      this.chatT = 12 + Math.random() * 20;
    }
    let speed = 0;
    if (this.idle > 0) this.idle -= dt;
    else {
      const dx = this.tx - this.x, dz = this.tz - this.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.4) {
        [this.tx, this.tz] = pick();
        this.idle = 2 + Math.random() * 5;
      } else {
        const step = Math.min(d, 3.2 * dt);
        const [nx, nz] = resolve(this.x + (dx / d) * step, this.z + (dz / d) * step);
        if (Math.hypot(nx - this.x, nz - this.z) < step * 0.3) {
          // Stuck against scenery: choose somewhere else
          [this.tx, this.tz] = pick();
          this.idle = 0.5;
        }
        this.place(nx, nz, ground(nx, nz));
        this.turnTo(Math.atan2(dx, dz), dt, 8);
        speed = 0.55;
      }
    }
    this.model.update(dt, speed);
  }
}
