// Turn-based quiz battle: every correct answer is an attack, every wrong answer lets the monster strike.
import * as THREE from 'three';
import { sfx } from '../audio/sfx';
import { GRADE_NAMES, GradeId, Question, Rng, makeQuestion } from '../math';
import {
  addItem, gainExp, maxHp, maxSp, monsterDamage, playerDamage, recordAnswer, timeLimit, topicAccuracy,
} from '../rpg/character';
import { ITEMS, JOBS } from '../rpg/data';
import { btn, clear, escapeHtml, h, toast, uiRoot } from '../ui/dom';
import { openScratchpad } from '../ui/scratchpad';
import type { Mob } from './entities';
import type { GameSession } from './session';

type State = 'question' | 'feedback' | 'over';

const LETTERS = ['A', 'B', 'C', 'D'];

export class Battle {
  private el: HTMLElement;
  private promptEl: HTMLElement;
  private choicesEl: HTMLElement;
  private feedbackEl: HTMLElement;
  private timerFill: HTMLElement;
  private mobHpFill: HTMLElement;
  private mobHpText: HTMLElement;
  private skillBtn: HTMLButtonElement;
  private hpPotBtn: HTMLButtonElement;
  private spPotBtn: HTMLButtonElement;
  private q: Question | null = null;
  private state: State = 'question';
  private limit = 30;
  private left = 30;
  private armed: { mul: number; hits: number } | null = null;
  private stunned = false;
  private lastTopic = '';
  private rng = new Rng();
  private keyHandler: (e: KeyboardEvent) => void;
  private timers: number[] = [];

  constructor(private s: GameSession, readonly mob: Mob, ambush: boolean) {
    const def = mob.def;
    this.mobHpFill = h('i');
    this.mobHpText = h('span');
    this.promptEl = h('div', { class: 'q-prompt' });
    this.choicesEl = h('div', { class: 'q-choices' });
    this.feedbackEl = h('div', { class: 'q-feedback' });
    this.timerFill = h('i');
    this.skillBtn = h('button', { class: 'btn skill', onclick: () => this.useSkill() });
    this.hpPotBtn = h('button', { class: 'btn small', onclick: () => this.usePotion('hp') });
    this.spPotBtn = h('button', { class: 'btn small', onclick: () => this.usePotion('sp') });

    const gradesLabel = this.grades().map((g) => GRADE_NAMES[g]).join(' / ');
    this.el = h('div', { class: 'battle' },
      h('div', { class: 'b-head' },
        h('div', { class: 'b-mob' },
          h('div', { class: 'b-name', html: `${def.boss ? '👑 ' : ''}${escapeHtml(def.name)} <small>Lv ${def.level}</small>` }),
          h('div', { class: 'bar hp' }, this.mobHpFill, this.mobHpText)),
        h('div', { class: 'b-grade', text: gradesLabel }),
        btn('🏃 Lari', () => this.flee(), 'btn ghost small')),
      h('div', { class: 'timer' }, this.timerFill),
      this.promptEl,
      this.choicesEl,
      this.feedbackEl,
      h('div', { class: 'b-tools' }, this.skillBtn, this.hpPotBtn, this.spPotBtn, btn('✏️ Conteng', () => openScratchpad(), 'btn small ghost')),
    );
    uiRoot().append(this.el);
    document.body.classList.add('in-battle');

    this.keyHandler = (e) => {
      if (this.state === 'question') {
        const k = e.key.toUpperCase();
        const i = ['1', '2', '3', '4'].indexOf(k) >= 0 ? ['1', '2', '3', '4'].indexOf(k) : LETTERS.indexOf(k);
        if (i >= 0 && this.q && i < this.q.choices.length) this.answer(i);
      } else if (this.state === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.next();
      }
    };
    addEventListener('keydown', this.keyHandler);

    this.refreshMob();
    this.refreshTools();
    if (ambush) toast(`${escapeHtml(def.name)} menyerang kau!`, 'bad');
    this.nextQuestion();
  }

  private grades(): GradeId[] {
    const s = this.s;
    if (this.mob.def.id === 'patung' || s.save.settings.questionMode === 'grade' || !s.world.def.grades.length) return [s.char.grade];
    return s.world.def.grades;
  }

  private later(ms: number, f: () => void): void {
    this.timers.push(window.setTimeout(f, ms));
  }

  private nextQuestion(): void {
    const c = this.s.char;
    let q = makeQuestion(this.grades(), this.rng, (id) => topicAccuracy(c, id));
    for (let i = 0; i < 3 && q.topicId === this.lastTopic; i++) q = makeQuestion(this.grades(), this.rng, (id) => topicAccuracy(c, id));
    this.q = q;
    this.lastTopic = q.topicId;
    this.state = 'question';
    this.limit = timeLimit(c, q.grade);
    this.left = this.limit;
    this.promptEl.innerHTML = `<div class="q-topic">${escapeHtml(q.topicName)} · ${GRADE_NAMES[q.grade]}</div>${q.prompt}`;
    clear(this.choicesEl);
    q.choices.forEach((choice, i) => {
      const b = h('button', { class: 'choice', onclick: () => this.answer(i) }, h('b', { text: LETTERS[i] }), h('span', { html: choice }));
      this.choicesEl.append(b);
    });
    clear(this.feedbackEl);
    this.el.classList.remove('show-feedback');
    this.timerFill.parentElement!.style.visibility = this.s.save.settings.timer ? '' : 'hidden';
    this.refreshTools();
  }

  update(dt: number): void {
    if (this.state !== 'question' || !this.s.save.settings.timer) return;
    this.left -= dt;
    const k = Math.max(0, this.left / this.limit);
    this.timerFill.style.width = `${k * 100}%`;
    this.timerFill.classList.toggle('low', k < 0.25);
    if (this.left <= 0) this.answer(-1);
  }

  private answer(i: number): void {
    if (this.state !== 'question' || !this.q) return;
    const q = this.q;
    const c = this.s.char;
    const correct = i === q.answer;
    recordAnswer(c, q.topicId, correct);
    const buttons = [...this.choicesEl.children] as HTMLButtonElement[];
    buttons.forEach((b, j) => {
      b.disabled = true;
      if (j === q.answer) b.classList.add('right');
      else if (j === i) b.classList.add('wrong');
    });

    if (correct) {
      this.state = 'feedback';
      sfx.correct();
      const timeFrac = this.s.save.settings.timer ? this.left / this.limit : 0.5;
      const mul = this.armed?.mul ?? 1;
      const hits = this.armed?.hits ?? 1;
      this.armed = null;
      this.feedbackEl.innerHTML = `<div class="fb good">✔ Betul! ${timeFrac > 0.66 ? '<span class="fast">Pantas!</span>' : ''}</div>`;
      this.el.classList.add('show-feedback');
      this.s.player.model.play('attack');
      for (let k = 0; k < hits; k++) {
        this.later(220 + k * 260, () => {
          if (this.state === 'over') return;
          const dmg = playerDamage(c, this.mob.def, timeFrac, mul);
          this.mob.hp -= dmg.amount;
          this.mob.model.hurt();
          const at = new THREE.Vector3(this.mob.x, this.mob.y + this.mob.height * 0.6, this.mob.z);
          this.s.labels.float(`${dmg.amount}${dmg.crit ? '!' : ''}`, at, dmg.crit ? 'dmg crit' : 'dmg');
          this.s.effects.burst(at, dmg.crit ? 0xffd34d : 0xffffff, dmg.crit ? 16 : 9);
          if (dmg.crit) sfx.crit();
          else sfx.hit();
          this.refreshMob();
          if (this.mob.hp <= 0) this.victory();
        });
      }
      this.later(400 + hits * 280, () => {
        if (this.state === 'feedback' && this.mob.hp > 0) this.nextQuestion();
      });
      return;
    }

    this.state = 'feedback';
    sfx.wrong();
    const reason = i < 0 ? '⏰ Masa tamat!' : '✘ Kurang tepat.';
    const answer = q.choices[q.answer];
    this.feedbackEl.innerHTML = '';
    this.feedbackEl.append(
      h('div', { class: 'fb bad', html: `${reason} Jawapan: <b>${answer}</b>` }),
      h('div', { class: 'explain', html: `💡 ${q.explain}` }),
      btn('Seterusnya ➜', () => this.next(), 'btn primary'),
    );
    this.el.classList.add('show-feedback');

    if (this.stunned) {
      this.stunned = false;
      toast(`${escapeHtml(this.mob.def.name)} masih pening. Tiada serangan!`, 'good');
      return;
    }
    this.mob.model.attack();
    this.later(250, () => {
      const dmg = monsterDamage(c, this.mob.def);
      if (dmg <= 0) return;
      c.hp = Math.max(0, c.hp - dmg);
      sfx.hurt();
      this.s.player.model.play('hurt');
      const at = new THREE.Vector3(this.s.player.x, this.s.player.y + 1.4, this.s.player.z);
      this.s.labels.float(`−${dmg}`, at, 'dmg taken');
      this.s.effects.burst(at, 0xff6a6a, 8);
      this.s.hud.update();
      if (c.hp <= 0) this.defeat();
    });
  }

  private next(): void {
    if (this.state !== 'feedback') return;
    this.nextQuestion();
  }

  private refreshMob(): void {
    const k = Math.max(0, this.mob.hp / this.mob.def.hp);
    this.mobHpFill.style.width = `${k * 100}%`;
    this.mobHpText.textContent = `${Math.max(0, Math.round(this.mob.hp))} / ${this.mob.def.hp}`;
    this.mob.refreshHp();
  }

  private refreshTools(): void {
    const c = this.s.char;
    const sk = JOBS[c.job].skill;
    this.skillBtn.innerHTML = `✨ ${sk.name} <small>${sk.sp} SP</small>`;
    this.skillBtn.title = sk.desc;
    this.skillBtn.disabled = c.sp < sk.sp || (sk.effect === 'hint' && this.state !== 'question');
    this.skillBtn.classList.toggle('armed', !!this.armed || this.stunned);
    const hpPot = this.bestPotion('hp');
    this.hpPotBtn.innerHTML = hpPot ? `${ITEMS[hpPot].icon} ${c.inventory[hpPot]}` : '🧪 0';
    this.hpPotBtn.title = hpPot ? ITEMS[hpPot].name : 'Tiada potion HP';
    this.hpPotBtn.disabled = !hpPot || c.hp >= maxHp(c);
    const sp = c.inventory['potion-biru'] ?? 0;
    this.spPotBtn.innerHTML = `💧 ${sp}`;
    this.spPotBtn.title = 'Potion Biru';
    this.spPotBtn.disabled = !sp || c.sp >= maxSp(c);
  }

  private bestPotion(kind: 'hp' | 'sp'): string | null {
    const inv = this.s.char.inventory;
    const order = kind === 'hp' ? ['potion-merah', 'potion-oren', 'potion-putih'] : ['potion-biru'];
    return order.find((id) => (inv[id] ?? 0) > 0) ?? null;
  }

  private usePotion(kind: 'hp' | 'sp'): void {
    const id = this.bestPotion(kind);
    if (!id || this.state === 'over') return;
    this.s.useItem(id);
    this.refreshTools();
  }

  private useSkill(): void {
    const c = this.s.char;
    const sk = JOBS[c.job].skill;
    if (c.sp < sk.sp || this.state === 'over') return;
    if ((sk.effect === 'bash' || sk.effect === 'sonic' || sk.effect === 'strafe') && this.armed) return toast('Skill sudah aktif.');
    if (sk.effect === 'stun' && this.stunned) return toast('Raksasa sudah pening.');
    if ((sk.effect === 'heal' || sk.effect === 'firstaid') && c.hp >= maxHp(c)) return toast('HP kau sudah penuh.');
    c.sp -= sk.sp;
    this.s.player.model.play('cast');
    const at = new THREE.Vector3(this.s.player.x, this.s.player.y + 1, this.s.player.z);
    switch (sk.effect) {
      case 'firstaid':
      case 'heal': {
        const amt = Math.round(maxHp(c) * (sk.effect === 'heal' ? 0.45 : 0.15));
        c.hp = Math.min(maxHp(c), c.hp + amt);
        this.s.labels.float(`+${amt}`, at, 'heal');
        this.s.effects.burst(at, 0x7dff9a, 14, 1.5, 3);
        sfx.heal();
        break;
      }
      case 'bash':
        this.armed = { mul: 2.5, hits: 1 };
        this.s.effects.ring(at, 0xffb34d);
        break;
      case 'sonic':
        this.armed = { mul: 3.5, hits: 1 };
        this.s.effects.ring(at, 0xff4d6a);
        break;
      case 'strafe':
        this.armed = { mul: 1, hits: 2 };
        this.s.effects.ring(at, 0x9dff6a);
        break;
      case 'stun':
        this.stunned = true;
        this.mob.model.hurt();
        this.s.effects.burst(new THREE.Vector3(this.mob.x, this.mob.y + this.mob.height, this.mob.z), 0xffe066, 12);
        break;
      case 'hint': {
        const q = this.q;
        if (!q) break;
        const wrong = [...this.choicesEl.children].map((_, i) => i).filter((i) => i !== q.answer);
        for (const i of this.rng.sample(wrong, Math.min(2, wrong.length))) {
          const b = this.choicesEl.children[i] as HTMLButtonElement;
          b.disabled = true;
          b.classList.add('struck');
        }
        this.s.effects.burst(at, 0xb48cff, 12, 1.5, 3);
        break;
      }
    }
    toast(`✨ ${sk.name}!`, 'gold');
    this.s.hud.update();
    this.refreshTools();
  }

  private victory(): void {
    if (this.state === 'over') return;
    this.state = 'over';
    const s = this.s;
    const c = s.char;
    const def = this.mob.def;
    sfx.victory();
    this.mob.model.die();
    const coins = Math.round(def.coins * JOBS[c.job].coinMul * (0.8 + Math.random() * 0.4));
    c.coins += coins;
    c.kills += def.id === 'patung' ? 0 : 1;
    if (def.boss && !c.bosses.includes(def.id)) c.bosses.push(def.id);
    const at = new THREE.Vector3(this.mob.x, this.mob.y + this.mob.height, this.mob.z);
    s.labels.float(`+${def.exp} EXP`, at, 'exp', 1.6);
    this.later(350, () => s.labels.float(`+${coins} 🪙`, at.clone().add(new THREE.Vector3(0, -0.5, 0)), 'coin', 1.6));
    let dropMsg = '';
    if (def.drop && Math.random() < def.drop.chance) {
      addItem(c, def.drop.item);
      dropMsg = ` · Dapat ${ITEMS[def.drop.item].icon} ${ITEMS[def.drop.item].name}`;
    }
    const levels = gainExp(c, def.exp);
    toast(`Menang! +${def.exp} EXP, +${coins} syiling${dropMsg}`, 'good');
    if (levels) s.onLevelUp(levels);
    s.questEvent({ type: 'kill', monster: def.id, boss: !!def.boss });
    this.feedbackEl.innerHTML = `<div class="fb good">🏆 ${escapeHtml(def.name)} dikalahkan!</div>`;
    this.el.classList.add('show-feedback');
    this.later(1300, () => s.endBattle('win'));
  }

  private defeat(): void {
    if (this.state === 'over') return;
    this.state = 'over';
    sfx.defeat();
    this.s.player.model.setDowned(true);
    clear(this.feedbackEl);
    this.feedbackEl.append(
      h('div', { class: 'fb bad', html: '😵 Kau pengsan! Jangan risau, cuba lagi.' }),
      btn('Kembali ke Kota Permulaan', () => this.s.endBattle('lose'), 'btn primary'),
    );
    this.el.classList.add('show-feedback');
    clear(this.choicesEl);
  }

  private flee(): void {
    if (this.state === 'over') return;
    this.state = 'over';
    this.mob.hp = this.mob.def.hp;
    this.refreshMob();
    toast('Kau melarikan diri.');
    this.s.endBattle('flee');
  }

  close(): void {
    this.timers.forEach((t) => clearTimeout(t));
    removeEventListener('keydown', this.keyHandler);
    this.el.remove();
    document.body.classList.remove('in-battle');
  }
}
