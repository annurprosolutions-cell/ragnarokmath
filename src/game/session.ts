// One play session: owns the current map, actors, camera, battles and saving.
import * as THREE from 'three';
import { sfx } from '../audio/sfx';
import { Rng } from '../math';
import { CharacterData, addItem, gainExp, maxHp, maxSp } from '../rpg/character';
import { ITEMS, JOBS, MAPS, MONSTERS, MapId } from '../rpg/data';
import { QuestEvent, currentQuest } from '../rpg/quests';
import { SaveFile, writeSave } from '../save';
import { escapeHtml, toast } from '../ui/dom';
import { Hud } from '../ui/hud';
import { talkTo } from '../ui/npc';
import { closeScratchpad } from '../ui/scratchpad';
import { Battle } from './battle';
import { Effects } from './effects';
import { Engine } from './engine';
import { Bot, Mob, Npc, PlayerEntity } from './entities';
import { Input } from './input';
import { LabelLayer } from './labels';
import { G, basic } from './materials';
import { BOT_LINES, TOWN_BOTS, TOWN_NPCS } from './npcs';
import { World } from './world';

export type BattleResult = 'win' | 'lose' | 'flee';

export class GameSession {
  readonly scene = new THREE.Scene();
  world!: World;
  readonly player: PlayerEntity;
  mobs: Mob[] = [];
  npcs: Npc[] = [];
  bots: Bot[] = [];
  readonly labels: LabelLayer;
  readonly effects = new Effects();
  readonly input: Input;
  readonly hud: Hud;
  battle: Battle | null = null;
  private cam = { yaw: 0.6, dist: 17, tx: 0, ty: 0, tz: 0, ox: 0, oy: 0 };
  private rng = new Rng();
  private safeT = 2;
  private saveT = 0;
  private transitioning = false;
  private unFrame: () => void;
  private marker: THREE.Mesh;
  private markerT = 0;
  private raycaster = new THREE.Raycaster();
  private disposers: (() => void)[] = [];

  constructor(readonly engine: Engine, readonly save: SaveFile, readonly slot: number, private onQuit: () => void) {
    const c = this.char;
    this.labels = new LabelLayer(document.getElementById('labels')!);
    this.player = new PlayerEntity(c.appearance, c.job, c.name);
    this.scene.add(this.effects.group);
    this.marker = new THREE.Mesh(G.torus(0.45, 0.05, Math.PI * 2, 6, 24), basic(0xffffff, 0.9, true));
    this.marker.rotation.x = Math.PI / 2;
    this.marker.visible = false;
    this.scene.add(this.marker);

    this.input = new Input(engine.canvas, {
      tap: (x, y) => this.tap(x, y),
      action: () => this.action(),
      key: (code) => this.key(code),
    });
    this.hud = new Hud(this);
    if (matchMedia('(pointer: coarse)').matches) this.input.mountJoystick(this.hud.joyMount);

    this.loadMap(c.map, c.pos);
    engine.scene = this.scene;
    this.unFrame = engine.onFrame((dt, t) => this.update(dt, t));
    const onHide = () => document.hidden && this.persist();
    document.addEventListener('visibilitychange', onHide);
    this.disposers.push(() => document.removeEventListener('visibilitychange', onHide));
    this.refreshNpcMarks();
  }

  get char(): CharacterData {
    return this.save.slots[this.slot]!;
  }

  isBusy(): boolean {
    return !!document.querySelector('.backdrop, .dialog');
  }

  // ---------------------------------------------------------------- map loading

  loadMap(id: MapId, pos?: [number, number]): void {
    const c = this.char;
    const def = MAPS[id];
    if (this.world) {
      this.scene.remove(this.world.group);
      this.world.dispose();
    }
    for (const a of [...this.mobs, ...this.npcs, ...this.bots]) this.scene.remove(a.group);
    this.mobs = [];
    this.npcs = [];
    this.bots = [];
    this.labels.clear();

    this.world = new World(def, this.save.settings.quality);
    this.scene.add(this.world.group);
    const far = this.save.settings.quality === 'low' ? def.fogFar * 0.8 : def.fogFar;
    this.scene.fog = new THREE.Fog(def.fog, def.fogNear, far);
    this.scene.background = new THREE.Color(def.fog);

    c.map = id;
    if (!c.visited.includes(id)) c.visited.push(id);
    let [px, pz] = pos ?? def.spawn;
    if (this.world.blocked(px, pz, 0.3)) [px, pz] = def.spawn;
    this.player.place(px, pz, this.world.heightAt(px, pz));
    this.player.target = null;
    this.scene.add(this.player.group);
    this.labels.add(this.player.labelEl, () => this.player.head(), 40);
    this.cam.tx = px;
    this.cam.tz = pz;
    this.cam.ty = this.player.y;

    for (const spec of def.monsters) {
      const mdef = MONSTERS[spec.id];
      for (let i = 0; i < spec.count; i++) {
        const mob = new Mob(mdef);
        let x: number, z: number;
        if (mdef.shape === 'dummy') [x, z] = [[-22, -3], [-24.5, 2], [-20, 3]][i % 3];
        else if (mdef.boss) [x, z] = this.farSpot(def.spawn, 30);
        else [x, z] = this.farSpot(def.spawn, 9);
        mob.setHome(x, z);
        mob.place(x, z, this.world.heightAt(x, z));
        mob.facing = this.rng.range(0, Math.PI * 2);
        mob.refreshHp();
        this.scene.add(mob.group);
        this.labels.add(mob.labelEl, () => mob.head(), 26);
        this.mobs.push(mob);
      }
    }

    if (def.theme === 'town') {
      for (const nd of TOWN_NPCS) {
        const npc = new Npc(nd);
        npc.place(nd.pos[0], nd.pos[1], this.world.heightAt(...nd.pos));
        this.scene.add(npc.group);
        this.labels.add(npc.labelEl, () => npc.head(), 32);
        this.npcs.push(npc);
      }
      TOWN_BOTS.forEach((bd, i) => {
        const bot = new Bot(bd.name, bd.appearance, bd.job, BOT_LINES);
        const [x, z] = this.townSpot();
        bot.place(x, z, 0);
        bot.facing = i;
        this.scene.add(bot.group);
        this.labels.add(bot.labelEl, () => bot.head(), 30);
        this.bots.push(bot);
      });
      this.refreshNpcMarks();
    }

    this.safeT = 2.5;
    this.hud?.setMap(def);
    this.questEvent({ type: 'map' });
    this.persist();
  }

  private farSpot(from: [number, number], minDist: number): [number, number] {
    for (let i = 0; i < 40; i++) {
      const p = this.world.randomSpot(this.rng);
      if (Math.hypot(p[0] - from[0], p[1] - from[1]) > minDist) return p;
    }
    return this.world.randomSpot(this.rng);
  }

  private townSpot(): [number, number] {
    for (let i = 0; i < 30; i++) {
      const a = this.rng.range(0, Math.PI * 2), r = this.rng.range(4, 16);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!this.world.blocked(x, z, 0.6)) return [x, z];
    }
    return [0, 8];
  }

  travel(to: MapId, pos?: [number, number]): void {
    if (this.transitioning) return;
    this.transitioning = true;
    sfx.portal();
    closeScratchpad();
    const fade = document.getElementById('fade')!;
    fade.classList.add('on');
    setTimeout(() => {
      this.loadMap(to, pos);
      fade.classList.remove('on');
      this.transitioning = false;
      const def = MAPS[to];
      toast(`📍 ${def.name}${def.grades.length ? ` · Soalan ${def.recommend}` : ''}`, 'info');
    }, 380);
  }

  // ---------------------------------------------------------------- frame update

  private update(dt: number, t: number): void {
    const c = this.char;
    c.playTime += dt;
    const busy = this.isBusy();
    this.input.enabled = !busy && !this.battle && !this.transitioning;
    this.safeT -= dt;
    this.world.update(t, dt);
    this.updatePlayer(dt);
    this.updateMobs(dt, busy);
    for (const npc of this.npcs) {
      npc.model.update(dt, 0);
      if (Math.hypot(npc.x - this.player.x, npc.z - this.player.z) < 5) npc.faceTowards(this.player.x, this.player.z, dt);
      else npc.turnTo(npc.def.facing, dt, 2);
    }
    for (const bot of this.bots) bot.update(dt, () => this.townSpot(), (x, z) => this.world.resolve(x, z, 0.4), (x, z) => this.world.heightAt(x, z));
    this.effects.update(dt);
    this.battle?.update(dt);
    this.updateCamera(dt);
    this.labels.update(this.engine.camera, dt);
    this.world.follow(this.player.x, this.player.z);

    if (this.markerT > 0) {
      this.markerT -= dt;
      this.marker.scale.setScalar(1 + (1 - this.markerT) * 0.6);
      (this.marker.material as THREE.MeshBasicMaterial).opacity = Math.max(0, this.markerT);
      this.marker.visible = this.markerT > 0;
    }

    if (!this.battle && c.hp > 0) {
      const regen = JOBS[c.job].id === 'priest' ? 2 : 1;
      c.hp = Math.min(maxHp(c), c.hp + maxHp(c) * 0.012 * regen * dt);
      c.sp = Math.min(maxSp(c), c.sp + maxSp(c) * 0.02 * dt);
    }

    if (!this.battle && !this.transitioning) {
      for (const p of this.world.portals) {
        if (Math.hypot(p.x - this.player.x, p.z - this.player.z) < 1.3) {
          this.travel(p.def.to, p.def.arrive);
          break;
        }
      }
    }

    this.saveT += dt;
    if (this.saveT > 15) this.persist();
    this.hud.tick(dt);
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    const c = this.char;
    if (this.battle || c.hp <= 0) {
      if (this.battle) p.faceTowards(this.battle.mob.x, this.battle.mob.z, dt);
      p.model.update(dt, 0);
      return;
    }
    const mv = this.input.moveVector();
    let dx = 0, dz = 0, speed = 0;
    if (mv.x || mv.y) {
      p.target = null;
      const yaw = this.cam.yaw;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      dx = rx * mv.x + fx * mv.y;
      dz = rz * mv.x + fz * mv.y;
      speed = Math.hypot(mv.x, mv.y);
      const l = Math.hypot(dx, dz);
      dx /= l;
      dz /= l;
    } else if (p.target && this.input.enabled) {
      const t = p.target;
      let tx: number, tz: number, reach: number;
      if (t.kind === 'point') [tx, tz, reach] = [t.x, t.z, 0.25];
      else if (t.kind === 'mob') [tx, tz, reach] = [t.mob.x, t.mob.z, 1.3 + t.mob.radius];
      else [tx, tz, reach] = [t.npc.x, t.npc.z, 2.2];
      if (t.kind === 'mob' && !t.mob.alive) p.target = null;
      else {
        const d = Math.hypot(tx - p.x, tz - p.z);
        if (d <= reach) {
          p.target = null;
          if (t.kind === 'mob') this.startBattle(t.mob, false);
          else if (t.kind === 'npc') this.talk(t.npc);
        } else {
          dx = (tx - p.x) / d;
          dz = (tz - p.z) / d;
          speed = 1;
        }
      }
    }
    if (speed > 0) {
      const step = p.speed * speed * dt;
      let nx = p.x + dx * step, nz = p.z + dz * step;
      if (this.world.isWater(nx, nz)) {
        if (!this.world.isWater(nx, p.z)) nz = p.z;
        else if (!this.world.isWater(p.x, nz)) nx = p.x;
        else [nx, nz] = [p.x, p.z];
      }
      [nx, nz] = this.world.resolve(nx, nz, 0.4);
      for (const npc of this.npcs) {
        const ddx = nx - npc.x, ddz = nz - npc.z, d = Math.hypot(ddx, ddz);
        if (d < 0.9 && d > 1e-4) [nx, nz] = [npc.x + (ddx / d) * 0.9, npc.z + (ddz / d) * 0.9];
      }
      const moved = Math.hypot(nx - p.x, nz - p.z);
      if (p.target?.kind === 'point' && moved < step * 0.2) p.target = null;
      p.place(nx, nz, this.world.heightAt(nx, nz));
      p.turnTo(Math.atan2(dx, dz), dt);
    }
    p.model.update(dt, Math.min(1, speed));
  }

  private updateMobs(dt: number, busy: boolean): void {
    const p = this.player;
    const c = this.char;
    for (const m of this.mobs) {
      if (!m.alive) {
        if (m.group.visible && !m.model.update(dt, 0)) {
          m.group.visible = false;
          m.labelEl.style.visibility = 'hidden';
        }
        m.respawnT -= dt;
        if (m.respawnT <= 0) this.respawnMob(m);
        continue;
      }
      if (m.inBattle) {
        m.faceTowards(p.x, p.z, dt);
        m.model.update(dt, 0);
        continue;
      }
      if (m.def.shape === 'dummy') {
        m.model.update(dt, 0);
        continue;
      }
      let dx = 0, dz = 0, moving = 0;
      const dP = Math.hypot(p.x - m.x, p.z - m.z);
      if (m.def.aggressive && !this.battle && !busy && this.safeT <= 0 && c.hp > 0 && dP < 5.5) {
        if (dP < 1.2 + m.radius) {
          this.startBattle(m, true);
          continue;
        }
        const sp = 3.3 * dt;
        dx = ((p.x - m.x) / dP) * sp;
        dz = ((p.z - m.z) / dP) * sp;
        moving = 1;
      } else {
        const w = m.wander(dt, (x, z) => this.world.blocked(x, z, m.radius));
        dx = w.dx;
        dz = w.dz;
        moving = dx || dz ? 0.6 : 0;
      }
      if (dx || dz) {
        let [nx, nz] = this.world.resolve(m.x + dx, m.z + dz, m.radius);
        if (this.world.isWater(nx, nz)) [nx, nz] = [m.x, m.z];
        m.place(nx, nz, this.world.heightAt(nx, nz));
        m.turnTo(Math.atan2(dx, dz), dt, 6);
      }
      m.model.update(dt, moving);
    }
  }

  private respawnMob(m: Mob): void {
    let x = m.homeX, z = m.homeZ;
    if (m.def.shape !== 'dummy' && !m.def.boss) [x, z] = this.farSpot([this.player.x, this.player.z], 12);
    m.place(x, z, this.world.heightAt(x, z));
    m.setHome(x, z);
    m.hp = m.def.hp;
    m.alive = true;
    m.model.reset();
    m.group.visible = true;
    m.labelEl.style.visibility = '';
    m.refreshHp();
  }

  private updateCamera(dt: number): void {
    const cam = this.cam;
    cam.yaw += this.input.consumeRotate();
    if (this.input.enabled) {
      if (this.input.keys.has('KeyQ')) cam.yaw += dt * 2;
      if (this.input.keys.has('KeyE')) cam.yaw -= dt * 2;
    }
    cam.dist = Math.max(8, Math.min(28, cam.dist + this.input.consumeZoom()));
    let fx = this.player.x, fz = this.player.z, dist = cam.dist;
    let ox = 0, oy = 0;
    if (this.battle) {
      const m = this.battle.mob;
      fx = (fx + m.x) / 2;
      fz = (fz + m.z) / 2;
      dist = Math.min(dist, 12);
      const W = innerWidth, H = innerHeight;
      if (W > H && H < 560) ox = 0.24;
      else oy = W > H ? 0.2 : 0.26;
    }
    const k = 1 - Math.exp(-dt * 6);
    cam.tx += (fx - cam.tx) * k;
    cam.tz += (fz - cam.tz) * k;
    cam.ty += (this.player.y - cam.ty) * k;
    cam.ox += (ox - cam.ox) * k;
    cam.oy += (oy - cam.oy) * k;
    const el = 0.82;
    const camera = this.engine.camera;
    camera.position.set(
      cam.tx + Math.sin(cam.yaw) * Math.cos(el) * dist,
      cam.ty + Math.sin(el) * dist,
      cam.tz + Math.cos(cam.yaw) * Math.cos(el) * dist,
    );
    camera.lookAt(cam.tx, cam.ty + 0.9, cam.tz);
    if (Math.abs(cam.ox) > 0.002 || Math.abs(cam.oy) > 0.002) {
      const W = innerWidth, H = innerHeight;
      camera.setViewOffset(W, H, cam.ox * W, cam.oy * H, W, H);
    } else if (camera.view?.enabled) camera.clearViewOffset();
  }

  // ---------------------------------------------------------------- interaction

  private pick(sx: number, sy: number): Mob | Npc | null {
    const camera = this.engine.camera;
    const v = new THREE.Vector3();
    let best: Mob | Npc | null = null;
    let bestD = Infinity;
    const W = innerWidth, H = innerHeight;
    const consider = (a: Mob | Npc, radiusPx: number) => {
      v.set(a.x, a.y + a.height * 0.5, a.z).project(camera);
      if (v.z > 1) return;
      const px = ((v.x + 1) / 2) * W, py = ((1 - v.y) / 2) * H;
      const d = Math.hypot(px - sx, py - sy);
      if (d < radiusPx && d < bestD) {
        bestD = d;
        best = a;
      }
    };
    for (const m of this.mobs) if (m.alive) consider(m, 55 * Math.max(1, m.def.scale * 0.8));
    for (const n of this.npcs) consider(n, 55);
    return best;
  }

  private tap(sx: number, sy: number): void {
    if (this.battle || this.isBusy()) return;
    const hit = this.pick(sx, sy);
    if (hit instanceof Mob) {
      this.player.target = { kind: 'mob', mob: hit };
      return;
    }
    if (hit instanceof Npc) {
      this.player.target = { kind: 'npc', npc: hit };
      return;
    }
    const ndc = new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.engine.camera);
    const [g] = this.raycaster.intersectObject(this.world.ground, false);
    if (!g) return;
    this.player.target = { kind: 'point', x: g.point.x, z: g.point.z };
    this.marker.position.set(g.point.x, g.point.y + 0.08, g.point.z);
    this.marker.visible = true;
    this.markerT = 1;
  }

  /** Space / action button: fight or talk to whatever is closest. */
  action(): void {
    if (this.battle || this.isBusy()) return;
    const p = this.player;
    let best: Mob | Npc | null = null;
    let bestD = 7;
    for (const m of this.mobs) {
      const d = Math.hypot(m.x - p.x, m.z - p.z);
      if (m.alive && d < bestD) [best, bestD] = [m, d];
    }
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d < bestD) [best, bestD] = [n, d];
    }
    if (best instanceof Mob) p.target = { kind: 'mob', mob: best };
    else if (best instanceof Npc) p.target = { kind: 'npc', npc: best };
    else toast('Tiada sesiapa berdekatan. Cari raksasa di padang!');
  }

  private key(code: string): void {
    if (this.battle) return;
    if (code === 'Space' || code === 'KeyF') this.action();
    else if (code === 'KeyI' || code === 'KeyB') this.hud.open('inventory');
    else if (code === 'KeyC') this.hud.open('status');
    else if (code === 'KeyL') this.hud.open('learn');
    else if (code === 'Escape') this.hud.open('settings');
  }

  talk(npc: Npc): void {
    this.questEvent({ type: 'talk', npc: npc.def.id });
    talkTo(this, npc);
  }

  // ---------------------------------------------------------------- battle

  startBattle(mob: Mob, ambush: boolean): void {
    if (this.battle || !mob.alive || this.transitioning) return;
    const p = this.player;
    p.target = null;
    mob.inBattle = true;
    // Stand a short distance apart, facing each other.
    const d = Math.hypot(p.x - mob.x, p.z - mob.z) || 1;
    const want = 1.6 + mob.radius;
    let [nx, nz] = [mob.x + ((p.x - mob.x) / d) * want, mob.z + ((p.z - mob.z) / d) * want];
    [nx, nz] = this.world.resolve(nx, nz, 0.4);
    if (!this.world.isWater(nx, nz)) p.place(nx, nz, this.world.heightAt(nx, nz));
    this.battle = new Battle(this, mob, ambush);
    this.hud.update();
  }

  endBattle(result: BattleResult): void {
    const b = this.battle;
    if (!b) return;
    b.close();
    closeScratchpad();
    this.battle = null;
    const mob = b.mob;
    mob.inBattle = false;
    const c = this.char;
    if (result === 'win') {
      mob.alive = false;
      mob.respawnT = mob.def.boss ? 90 : mob.def.shape === 'dummy' ? 3 : 14 + Math.random() * 10;
    } else {
      mob.hp = mob.def.hp;
      mob.refreshHp();
    }
    if (result === 'lose') {
      c.hp = Math.round(maxHp(c) * 0.5);
      this.player.model.setDowned(false);
      this.travel('kota', MAPS.kota.spawn);
    }
    this.safeT = result === 'flee' ? 4 : 2;
    this.hud.update();
    this.persist();
  }

  onLevelUp(levels: number): void {
    const c = this.char;
    const p = this.player;
    sfx.levelUp();
    p.model.play('cheer');
    const at = new THREE.Vector3(p.x, p.y + 0.2, p.z);
    this.effects.ring(at, 0xffd34d, 3);
    this.effects.burst(at.clone().setY(p.y + 1.5), 0xffd34d, 20, 2, 4);
    this.labels.float('LEVEL UP!', at.clone().setY(p.y + 2.4), 'lvl', 2);
    toast(`⭐ Level ${c.level}! +${levels * 3} mata status (buka Status)`, 'gold');
    this.questEvent({ type: 'level' });
    this.hud.update();
  }

  // ---------------------------------------------------------------- items, quests, saving

  useItem(id: string): boolean {
    const c = this.char;
    const item = ITEMS[id];
    if (!item?.use || !((c.inventory[id] ?? 0) > 0)) return false;
    const u = item.use;
    if (u.warpHome) {
      if (this.battle) {
        toast('Tak boleh guna semasa bertarung.');
        return false;
      }
      addItem(c, id, -1);
      this.travel('kota', MAPS.kota.spawn);
      return true;
    }
    const hpMax = maxHp(c), spMax = maxSp(c);
    if ((u.hp || u.hpPct) && c.hp >= hpMax && !u.sp) return toast('HP kau sudah penuh.'), false;
    if (u.sp && c.sp >= spMax) return toast('SP kau sudah penuh.'), false;
    const hpGain = Math.round(u.hp ?? (u.hpPct ? hpMax * u.hpPct : 0));
    c.hp = Math.min(hpMax, c.hp + hpGain);
    c.sp = Math.min(spMax, c.sp + (u.sp ?? 0));
    addItem(c, id, -1);
    const at = new THREE.Vector3(this.player.x, this.player.y + 1.3, this.player.z);
    this.labels.float(hpGain ? `+${hpGain} HP` : `+${u.sp} SP`, at, hpGain ? 'heal' : 'sp');
    this.effects.burst(at, hpGain ? 0x7dff9a : 0x7dc8ff, 10, 1.2, 3);
    sfx.heal();
    this.hud.update();
    return true;
  }

  questEvent(e: QuestEvent | null): void {
    const c = this.char;
    for (let guard = 0; guard < QUEST_GUARD; guard++) {
      const q = currentQuest(c);
      if (!q) break;
      c.questProgress = q.progress(c, guard === 0 ? e : null);
      if (c.questProgress < q.goal) break;
      const r = q.reward;
      c.coins += r.coins ?? 0;
      for (const [id, n] of Object.entries(r.items ?? {})) addItem(c, id, n);
      const bits = [r.exp ? `+${r.exp} EXP` : '', r.coins ? `+${r.coins} syiling` : '', ...Object.entries(r.items ?? {}).map(([id, n]) => `${ITEMS[id].icon}×${n}`)].filter(Boolean);
      toast(`🎉 Misi selesai: <b>${escapeHtml(q.title)}</b><br>${bits.join(' · ')}`, 'gold');
      sfx.victory();
      c.quest++;
      c.questProgress = 0;
      if (r.exp) {
        const lv = gainExp(c, r.exp);
        if (lv) this.onLevelUp(lv);
      }
    }
    this.refreshNpcMarks();
    this.hud?.updateQuest();
  }

  refreshNpcMarks(): void {
    const c = this.char;
    for (const n of this.npcs) {
      const id = n.def.id;
      n.setMarked((id === 'cikgu' && c.quest === 0) || (id === 'job' && c.job === 'novice' && c.level >= 10) || (id === 'warp' && c.quest === 2));
    }
  }

  persist(): void {
    const c = this.char;
    c.pos = [this.player.x, this.player.z];
    this.saveT = 0;
    if (!writeSave(this.save)) toast('Gagal menyimpan. Storan penuh?', 'bad');
  }

  quit(): void {
    this.persist();
    this.dispose();
    this.onQuit();
  }

  dispose(): void {
    this.battle?.close();
    this.battle = null;
    this.unFrame();
    this.input.dispose();
    this.labels.clear();
    this.hud.destroy();
    this.world?.dispose();
    this.disposers.forEach((f) => f());
    document.body.classList.remove('in-battle');
    this.engine.camera.clearViewOffset();
  }
}

const QUEST_GUARD = 8;
