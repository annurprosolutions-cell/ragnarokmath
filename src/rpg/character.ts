// Character save data and the RPG formulas that act on it.
import { GradeId, gradeIndex } from '../math';
import { JOBS, JobId, MapId, MAPS, MonsterDef } from './data';

export interface Appearance {
  gender: 'L' | 'P';
  skin: number;
  hairStyle: number;
  hairColor: number;
  tudung: boolean;
  tudungColor: number;
  eyeColor: number;
  outfitColor: number;
  hat: string | null;
}

export interface Stats {
  str: number;
  vit: number;
  int: number;
  agi: number;
}

export interface LearnStat {
  c: number;
  t: number;
}

export interface CharacterData {
  id: string;
  name: string;
  created: number;
  grade: GradeId;
  appearance: Appearance;
  job: JobId;
  level: number;
  exp: number;
  hp: number;
  sp: number;
  stats: Stats;
  statPoints: number;
  coins: number;
  inventory: Record<string, number>;
  ownedHats: string[];
  map: MapId;
  pos: [number, number];
  visited: MapId[];
  quest: number;
  questProgress: number;
  learn: Record<string, LearnStat>;
  kills: number;
  bosses: string[];
  playTime: number;
}

export const MAX_LEVEL = 99;
export const STAT_POINTS_PER_LEVEL = 3;
export const STAT_LABELS: Record<keyof Stats, { name: string; desc: string }> = {
  str: { name: 'KUAT', desc: 'Tambah damage serangan.' },
  vit: { name: 'TAHAN', desc: 'Tambah HP maksimum dan kurangkan kecederaan.' },
  int: { name: 'BIJAK', desc: 'Tambah SP dan masa menjawab.' },
  agi: { name: 'TANGKAS', desc: 'Tambah peluang kritikal.' },
};

export function newCharacter(name: string, grade: GradeId, appearance: Appearance): CharacterData {
  const c: CharacterData = {
    id: Math.random().toString(36).slice(2, 10),
    name,
    created: Date.now(),
    grade,
    appearance,
    job: 'novice',
    level: 1,
    exp: 0,
    hp: 1,
    sp: 1,
    stats: { str: 1, vit: 1, int: 1, agi: 1 },
    statPoints: 0,
    coins: 50,
    inventory: { 'potion-merah': 5, 'sayap-pulang': 1 },
    ownedHats: [],
    map: 'kota',
    pos: [...MAPS.kota.spawn],
    visited: ['kota'],
    quest: 0,
    questProgress: 0,
    learn: {},
    kills: 0,
    bosses: [],
    playTime: 0,
  };
  c.hp = maxHp(c);
  c.sp = maxSp(c);
  return c;
}

export function expToNext(level: number): number {
  return Math.round(20 * level ** 1.5);
}

export function maxHp(c: CharacterData): number {
  return Math.round((80 + c.level * 14 + c.stats.vit * 8) * JOBS[c.job].hpMul);
}

export function maxSp(c: CharacterData): number {
  return Math.round((15 + c.level * 3 + c.stats.int * 3) * JOBS[c.job].spMul);
}

export function attackPower(c: CharacterData): number {
  const L = c.level;
  return Math.round((10 + 3 * L + 0.03 * L * L + 2.5 * c.stats.str) * JOBS[c.job].atkMul);
}

export function critChance(c: CharacterData): number {
  return Math.min(0.6, 0.05 + c.stats.agi * 0.006 + JOBS[c.job].crit);
}

/** Fraction of incoming damage removed by job guard and TAHAN. */
export function guard(c: CharacterData): number {
  return Math.min(0.5, JOBS[c.job].guard + c.stats.vit * 0.004);
}

/** Seconds allowed per question. Older syllabus gets more time for working. */
export function timeLimit(c: CharacterData, grade: GradeId): number {
  const g = gradeIndex(grade);
  const base = g <= 2 ? 35 : g <= 5 ? 45 : g <= 8 ? 60 : 75;
  return Math.round(base + JOBS[c.job].timeBonus + Math.min(15, c.stats.int * 0.4));
}

export interface DamageResult {
  amount: number;
  crit: boolean;
}

/**
 * Damage for a correct answer. Answering fast adds up to +50% (Hunter more),
 * and every correct answer deals at least 20% of the monster's max HP so a
 * strong student is never stuck grinding.
 */
export function playerDamage(c: CharacterData, m: MonsterDef, timeFrac: number, skillMul: number, rand = Math.random): DamageResult {
  const speed = 1 + JOBS[c.job].speedBonus * Math.max(0, Math.min(1, timeFrac));
  const crit = rand() < critChance(c);
  const variance = 0.9 + rand() * 0.2;
  let dmg = attackPower(c) * speed * variance * (crit ? 1.8 : 1);
  dmg = Math.max(dmg, m.hp * 0.2);
  return { amount: Math.round(dmg * skillMul), crit };
}

export function monsterDamage(c: CharacterData, m: MonsterDef, rand = Math.random): number {
  if (m.atk <= 0) return 0;
  const raw = m.atk * (0.9 + rand() * 0.2) * (1 - guard(c));
  return Math.max(1, Math.round(Math.min(raw, maxHp(c) * 0.35)));
}

/** Adds EXP and handles level-ups. Returns the number of levels gained. */
export function gainExp(c: CharacterData, amount: number): number {
  let gained = 0;
  c.exp += amount;
  while (c.level < MAX_LEVEL && c.exp >= expToNext(c.level)) {
    c.exp -= expToNext(c.level);
    c.level++;
    c.statPoints += STAT_POINTS_PER_LEVEL;
    gained++;
  }
  if (c.level >= MAX_LEVEL) c.exp = 0;
  if (gained) {
    c.hp = maxHp(c);
    c.sp = maxSp(c);
  }
  return gained;
}

export function recordAnswer(c: CharacterData, topicId: string, correct: boolean): void {
  const s = c.learn[topicId] ?? { c: 0, t: 0 };
  s.t++;
  if (correct) s.c++;
  c.learn[topicId] = s;
}

export function topicAccuracy(c: CharacterData, topicId: string): number | undefined {
  const s = c.learn[topicId];
  return s && s.t >= 3 ? s.c / s.t : undefined;
}

export function addItem(c: CharacterData, id: string, qty = 1): void {
  c.inventory[id] = (c.inventory[id] ?? 0) + qty;
  if (c.inventory[id] <= 0) delete c.inventory[id];
}
