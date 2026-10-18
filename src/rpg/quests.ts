// Linear main quest that guides a new Novice through the game.
import { GRADE_NAMES } from '../math';
import { CharacterData } from './character';
import { MAPS, MONSTERS, mapForGrade } from './data';

export type QuestEvent =
  | { type: 'talk'; npc: string }
  | { type: 'kill'; monster: string; boss: boolean }
  | { type: 'map' }
  | { type: 'level' }
  | { type: 'job' };

export interface QuestDef {
  title: string;
  desc: (c: CharacterData) => string;
  goal: number;
  /** Returns the new progress value for this quest after an event (or the current state). */
  progress: (c: CharacterData, e: QuestEvent | null) => number;
  reward: { exp?: number; coins?: number; items?: Record<string, number> };
}

function bossFor(c: CharacterData): string {
  const map = MAPS[mapForGrade(c.grade)];
  return map.monsters.map((m) => MONSTERS[m.id]).find((m) => m.boss)!.id;
}

export const QUESTS: QuestDef[] = [
  {
    title: 'Selamat Datang',
    desc: () => 'Bercakap dengan Cikgu Ana di tengah kota.',
    goal: 1,
    progress: (c, e) => (e?.type === 'talk' && e.npc === 'cikgu' ? 1 : c.questProgress),
    reward: { items: { 'potion-merah': 3 } },
  },
  {
    title: 'Latihan Novice',
    desc: () => 'Kalahkan 3 Patung Latihan di padang latihan (barat kota).',
    goal: 3,
    progress: (c, e) => c.questProgress + (e?.type === 'kill' && e.monster === 'patung' ? 1 : 0),
    reward: { exp: 60, coins: 30 },
  },
  {
    title: 'Kembara Pertama',
    desc: (c) => `Pergi ke ${MAPS[mapForGrade(c.grade)].name} (sesuai untuk ${GRADE_NAMES[c.grade]}). Guna portal di timur kota atau Pak Warp.`,
    goal: 1,
    progress: (c) => (c.visited.includes(mapForGrade(c.grade)) ? 1 : 0),
    reward: { exp: 50, items: { 'potion-merah': 3 } },
  },
  {
    title: 'Pemburu Muda',
    desc: () => 'Kalahkan 10 raksasa di mana-mana padang.',
    goal: 10,
    progress: (c, e) => c.questProgress + (e?.type === 'kill' && e.monster !== 'patung' ? 1 : 0),
    reward: { exp: 150, coins: 80, items: { 'potion-oren': 2 } },
  },
  {
    title: 'Jalan Kerjaya',
    desc: () => 'Capai Level 10.',
    goal: 10,
    progress: (c) => Math.min(10, c.level),
    reward: { coins: 100, items: { 'potion-biru': 2 } },
  },
  {
    title: 'Pilih Job',
    desc: () => 'Jumpa Guru Job di kota dan pilih kerjaya kau.',
    goal: 1,
    progress: (c) => (c.job !== 'novice' ? 1 : 0),
    reward: { exp: 300, coins: 200 },
  },
  {
    title: 'Penakluk',
    desc: (c) => `Kalahkan ${MONSTERS[bossFor(c)].name} di ${MAPS[mapForGrade(c.grade)].name}.`,
    goal: 1,
    progress: (c) => (c.bosses.includes(bossFor(c)) ? 1 : 0),
    reward: { exp: 1000, coins: 500, items: { 'potion-putih': 3 } },
  },
  {
    title: 'Pengembara Sejati',
    desc: () => 'Kalahkan 100 raksasa secara keseluruhan.',
    goal: 100,
    progress: (c) => Math.min(100, c.kills),
    reward: { coins: 1000 },
  },
];

export function currentQuest(c: CharacterData): QuestDef | null {
  return QUESTS[c.quest] ?? null;
}
