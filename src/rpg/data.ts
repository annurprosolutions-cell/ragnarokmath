// Static game data: jobs, items, hats, monsters and maps.
import type { GradeId } from '../math';

// ------------------------------------------------------------ appearance palettes

export const SKIN_TONES = [0xffe0c7, 0xf6cfa8, 0xe2b086, 0xc68b5f, 0x8d5a3b];
export const HAIR_COLORS = [0x3b2a20, 0x6b4128, 0x111111, 0xb07a3c, 0xd9b26c, 0x8e3b3b, 0x5a6fae];
export const EYE_COLORS = [0x3b2416, 0x2a3f7a, 0x2f6b3c, 0x6b2f7a, 0x7a4a1f];
export const CLOTH_COLORS = [0x2f56a6, 0x9b2335, 0x5d7a45, 0x5b3fa0, 0xd77a2b, 0x2b8c8c, 0xe7a1b6, 0x6b3f2a, 0xf4f1ea, 0x3a3540];
export const TUDUNG_COLORS = [0xf4f1ea, 0x2f56a6, 0x9b2335, 0x5b3fa0, 0xb84a6a, 0x5d7a45, 0x3a3540, 0xd9b26c, 0x6fa8c7, 0xe7a1b6];

export const HAIR_STYLES = ['Pendek', 'Berpacak', 'Panjang', 'Ekor kuda', 'Sanggul', 'Kerinting'];

// ------------------------------------------------------------ jobs

export type JobId = 'novice' | 'priest' | 'knight' | 'assassin' | 'mage' | 'hunter' | 'blacksmith';

export type SkillEffect = 'firstaid' | 'heal' | 'bash' | 'sonic' | 'hint' | 'strafe' | 'stun';

export interface SkillDef {
  name: string;
  sp: number;
  effect: SkillEffect;
  desc: string;
}

export type WeaponKind = 'knife' | 'staff-blue' | 'staff-purple' | 'sword' | 'daggers' | 'bow' | 'hammer';

export interface Outfit {
  top: number;
  trim: number;
  panel?: number;
  pants: number;
  boots: number;
  belt: number;
  robe?: number; // long skirt / robe colour
  cape?: number;
  scarf?: number;
  armor?: number;
  head?: 'hood' | 'witch' | 'goggles';
  headColor?: number;
  weapon: WeaponKind;
  shield?: boolean;
}

export interface JobDef {
  id: JobId;
  name: string;
  motto: string;
  desc: string;
  passive: string;
  portrait?: string;
  hpMul: number;
  spMul: number;
  atkMul: number;
  /** Fraction of incoming damage blocked. */
  guard: number;
  crit: number;
  timeBonus: number;
  speedBonus: number;
  coinMul: number;
  skill: SkillDef;
  outfit: Outfit;
}

const GOLD = 0xd7b45a;

export const JOBS: Record<JobId, JobDef> = {
  novice: {
    id: 'novice', name: 'Novice', motto: 'Setiap pakar bermula sebagai pemula.',
    desc: 'Pengembara baru. Capai Level 10 dan jumpa Guru Job untuk memilih kerjaya.',
    passive: 'Tiada',
    hpMul: 1, spMul: 1, atkMul: 1, guard: 0, crit: 0, timeBonus: 0, speedBonus: 0.5, coinMul: 1,
    skill: { name: 'Rawatan Asas', sp: 3, effect: 'firstaid', desc: 'Pulihkan 15% HP.' },
    outfit: { top: 0xd77a2b, trim: 0xf4f1ea, pants: 0x6b4128, boots: 0x5a3a24, belt: 0x6b4128, weapon: 'knife' },
  },
  priest: {
    id: 'priest', name: 'Priest', motto: 'Doa adalah kekuatan sejati.', portrait: 'portraits/priest.webp',
    desc: 'Penyembuh yang tabah. Boleh memulihkan HP banyak semasa bertarung.',
    passive: 'SP +40%, HP pulih lebih cepat',
    hpMul: 1.05, spMul: 1.4, atkMul: 0.95, guard: 0.05, crit: 0, timeBonus: 5, speedBonus: 0.5, coinMul: 1,
    skill: { name: 'Heal', sp: 10, effect: 'heal', desc: 'Pulihkan 45% HP.' },
    outfit: { top: 0xf4f1ea, trim: GOLD, panel: 0x2f56a6, pants: 0xf4f1ea, boots: 0x3a3540, belt: 0x2f56a6, robe: 0xf4f1ea, weapon: 'staff-blue' },
  },
  knight: {
    id: 'knight', name: 'Knight', motto: 'Melindungi yang lemah.', portrait: 'portraits/knight.webp',
    desc: 'Pahlawan berperisai. Paling tahan lasak dan pukulan kuat.',
    passive: 'HP +30%, kurang 25% kecederaan',
    hpMul: 1.3, spMul: 0.9, atkMul: 1.1, guard: 0.25, crit: 0, timeBonus: 0, speedBonus: 0.5, coinMul: 1,
    skill: { name: 'Bash', sp: 8, effect: 'bash', desc: 'Jawapan betul seterusnya beri damage ×2.5.' },
    outfit: { top: 0x2f56a6, trim: GOLD, pants: 0x2f56a6, boots: 0xc9ced6, belt: 0x6b4128, cape: 0x2f56a6, scarf: 0x2f56a6, armor: 0xc9ced6, weapon: 'sword', shield: true },
  },
  assassin: {
    id: 'assassin', name: 'Assassin', motto: 'Bayangan yang tak pernah terlihat.', portrait: 'portraits/assassin.webp',
    desc: 'Pantas dan senyap. Peluang serangan kritikal sangat tinggi.',
    passive: 'Peluang kritikal +20%',
    hpMul: 0.95, spMul: 1, atkMul: 1.15, guard: 0.05, crit: 0.2, timeBonus: 0, speedBonus: 0.6, coinMul: 1,
    skill: { name: 'Sonic Blow', sp: 14, effect: 'sonic', desc: 'Jawapan betul seterusnya beri damage ×3.5.' },
    outfit: { top: 0x3a3540, trim: 0x9b2335, pants: 0x2a262e, boots: 0x6b4128, belt: 0x6b4128, cape: 0x9b2335, scarf: 0x9b2335, head: 'hood', headColor: 0x332e38, weapon: 'daggers' },
  },
  mage: {
    id: 'mage', name: 'Mage', motto: 'Ilmu pengetahuan adalah cahaya.', portrait: 'portraits/mage.webp',
    desc: 'Pakar ilmu. Boleh membuang dua pilihan jawapan yang salah.',
    passive: 'SP +60%, masa menjawab +5 saat',
    hpMul: 0.9, spMul: 1.6, atkMul: 1.05, guard: 0, crit: 0.05, timeBonus: 5, speedBonus: 0.5, coinMul: 1,
    skill: { name: 'Petunjuk Ilmu', sp: 6, effect: 'hint', desc: 'Buang 2 pilihan jawapan yang salah.' },
    outfit: { top: 0x5b3fa0, trim: GOLD, pants: 0x3a2a6a, boots: 0x2a262e, belt: 0x6b4128, robe: 0x5b3fa0, scarf: 0x3a2a6a, head: 'witch', headColor: 0x4a2f8a, weapon: 'staff-purple' },
  },
  hunter: {
    id: 'hunter', name: 'Hunter', motto: 'Alam adalah rumah kami.', portrait: 'portraits/hunter.webp',
    desc: 'Pemanah tepat. Lebih masa dan bonus besar jika menjawab dengan pantas.',
    passive: 'Masa +10 saat, bonus laju lebih besar',
    hpMul: 1, spMul: 1, atkMul: 1.05, guard: 0.05, crit: 0.08, timeBonus: 10, speedBonus: 0.9, coinMul: 1,
    skill: { name: 'Double Strafe', sp: 6, effect: 'strafe', desc: 'Jawapan betul seterusnya menembak dua kali (×2).' },
    outfit: { top: 0x7a4f2e, trim: 0xd9b26c, pants: 0x3a3330, boots: 0x6b4128, belt: 0x5a3a24, cape: 0x5d7a45, scarf: 0x5d7a45, weapon: 'bow' },
  },
  blacksmith: {
    id: 'blacksmith', name: 'Blacksmith', motto: 'Kekuatan lahir dari ketekunan.', portrait: 'portraits/blacksmith.webp',
    desc: 'Tukang besi yang kuat. Dapat lebih banyak syiling daripada setiap raksasa.',
    passive: 'Syiling +50%, ATK +10%',
    hpMul: 1.15, spMul: 0.9, atkMul: 1.1, guard: 0.1, crit: 0.03, timeBonus: 0, speedBonus: 0.5, coinMul: 1.5,
    skill: { name: 'Hammerfall', sp: 8, effect: 'stun', desc: 'Pengsankan raksasa: jawapan salah seterusnya tidak mencederakan kau.' },
    outfit: { top: 0xefe6d6, trim: 0xb8873a, panel: 0x6b3f2a, pants: 0x3a3330, boots: 0x5a3a24, belt: 0x5a3a24, robe: 0x7b2f3f, head: 'goggles', headColor: 0x8a8f99, weapon: 'hammer' },
  },
};

export const ADVANCED_JOBS: JobId[] = ['priest', 'knight', 'assassin', 'mage', 'hunter', 'blacksmith'];
export const JOB_CHANGE_LEVEL = 10;

// ------------------------------------------------------------ items & hats

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  price: number; // buy price; sell = 50%
  use?: { hp?: number; sp?: number; hpPct?: number; warpHome?: boolean };
  buyable?: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  'potion-merah': { id: 'potion-merah', name: 'Potion Merah', icon: '🧪', desc: 'Pulihkan 60 HP.', price: 15, use: { hp: 60 }, buyable: true },
  'potion-oren': { id: 'potion-oren', name: 'Potion Oren', icon: '🍊', desc: 'Pulihkan 180 HP.', price: 45, use: { hp: 180 }, buyable: true },
  'potion-putih': { id: 'potion-putih', name: 'Potion Putih', icon: '🥛', desc: 'Pulihkan 50% HP.', price: 120, use: { hpPct: 0.5 }, buyable: true },
  'potion-biru': { id: 'potion-biru', name: 'Potion Biru', icon: '💧', desc: 'Pulihkan 30 SP.', price: 40, use: { sp: 30 }, buyable: true },
  'sayap-pulang': { id: 'sayap-pulang', name: 'Sayap Pulang', icon: '🪽', desc: 'Terbang pulang ke Kota Permulaan.', price: 25, use: { warpHome: true }, buyable: true },
  jeli: { id: 'jeli', name: 'Jeli Lekit', icon: '🟢', desc: 'Bahan dari Jeli. Boleh dijual.', price: 6 },
  bulu: { id: 'bulu', name: 'Bulu Lembut', icon: '🪶', desc: 'Bulu arnab yang gebu.', price: 10 },
  spora: { id: 'spora', name: 'Spora Cendawan', icon: '🍄', desc: 'Spora bercahaya.', price: 14 },
  cangkerang: { id: 'cangkerang', name: 'Cangkerang', icon: '🐚', desc: 'Cangkerang berkilat dari pantai.', price: 24 },
  madu: { id: 'madu', name: 'Madu Hutan', icon: '🍯', desc: 'Madu manis dari lebah.', price: 20 },
  pasir: { id: 'pasir', name: 'Pasir Emas', icon: '✨', desc: 'Butiran pasir bergemerlapan.', price: 40 },
  kristal: { id: 'kristal', name: 'Serpihan Kristal', icon: '💎', desc: 'Kristal geometri yang sempurna.', price: 60 },
  ais: { id: 'ais', name: 'Ais Abadi', icon: '❄️', desc: 'Ais yang tidak pernah cair.', price: 80 },
  sisik: { id: 'sisik', name: 'Sisik Naga', icon: '🐉', desc: 'Sisik naga yang sangat jarang.', price: 250 },
};

export interface HatDef {
  id: string;
  name: string;
  price: number;
  color: number;
}

export const HATS: HatDef[] = [
  { id: 'reben', name: 'Reben Comel', price: 120, color: 0xe25b7a },
  { id: 'telinga-kucing', name: 'Telinga Kucing', price: 200, color: 0x3a3540 },
  { id: 'bunga', name: 'Mahkota Bunga', price: 260, color: 0xf2c94c },
  { id: 'topi-graduan', name: 'Topi Graduan', price: 400, color: 0x22232a },
  { id: 'mahkota', name: 'Mahkota Kecil', price: 800, color: 0xe7c14a },
  { id: 'halo', name: 'Halo Cahaya', price: 1500, color: 0xfff1a8 },
];

// ------------------------------------------------------------ monsters

export type MonsterShape =
  | 'slime' | 'bunny' | 'mushroom' | 'beetle' | 'stump' | 'bee' | 'crab' | 'turtle'
  | 'cactus' | 'scorpion' | 'golem' | 'bat' | 'crystal' | 'ghost' | 'yeti' | 'dragon' | 'dummy';

export interface MonsterDef {
  id: string;
  name: string;
  shape: MonsterShape;
  color: number;
  color2: number;
  level: number;
  hp: number;
  atk: number;
  exp: number;
  coins: number;
  scale: number;
  aggressive?: boolean;
  drop?: { item: string; chance: number };
  boss?: boolean;
}

function mon(id: string, name: string, shape: MonsterShape, color: number, color2: number, level: number, opts: Partial<MonsterDef> = {}): MonsterDef {
  return {
    id, name, shape, color, color2, level,
    hp: Math.round(30 + level * 9 + level * level * 0.35),
    atk: Math.round(6 + level * 1.6),
    exp: Math.round(8 + level ** 1.45 * 4),
    coins: Math.round(3 + level * 1.2),
    scale: 1,
    ...opts,
  };
}

function boss(def: MonsterDef): MonsterDef {
  return { ...def, boss: true, hp: def.hp * 4, atk: Math.round(def.atk * 1.3), exp: def.exp * 6, coins: def.coins * 8, scale: def.scale * 1.9, aggressive: false };
}

export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(
  [
    mon('patung', 'Patung Latihan', 'dummy', 0xc9a26b, 0x9b2335, 1, { hp: 30, atk: 0, exp: 12, coins: 2 }),
    // Padang Nombor (Tahun 1–2)
    mon('jeli-merah', 'Jeli Merah', 'slime', 0xf28aa0, 0xffffff, 2, { drop: { item: 'jeli', chance: 0.6 } }),
    mon('arnab', 'Arnab Kapas', 'bunny', 0xf7efe6, 0xf2a7b5, 4, { drop: { item: 'bulu', chance: 0.5 } }),
    mon('cendawan', 'Cendawan Comel', 'mushroom', 0xe0533c, 0xfff3e0, 6, { drop: { item: 'spora', chance: 0.5 } }),
    boss(mon('raja-jeli', 'Raja Jeli', 'slime', 0xf2c94c, 0xffffff, 10, { drop: { item: 'jeli', chance: 1 } })),
    // Hutan Sifir (Tahun 3–4)
    mon('cendawan-ungu', 'Cendawan Ungu', 'mushroom', 0x8e5bd6, 0xf3e8ff, 9, { drop: { item: 'spora', chance: 0.6 } }),
    mon('kumbang', 'Kumbang Hijau', 'beetle', 0x3f9b5a, 0x234d33, 11, { drop: { item: 'bulu', chance: 0.4 } }),
    mon('tunggul', 'Tunggul Hidup', 'stump', 0x8b5a2b, 0x5d9b3a, 13, { aggressive: true }),
    mon('lebah', 'Lebah Madu', 'bee', 0xf2c230, 0x2a2420, 15, { aggressive: true, drop: { item: 'madu', chance: 0.5 } }),
    boss(mon('kumbang-raksasa', 'Kumbang Gergasi', 'beetle', 0x2f5fa8, 0x1a2a4a, 20, { drop: { item: 'madu', chance: 1 } })),
    // Pantai Pecahan (Tahun 5–6)
    mon('ketam', 'Ketam Merah', 'crab', 0xe0533c, 0xfff3e0, 17, { drop: { item: 'cangkerang', chance: 0.5 } }),
    mon('jeli-biru', 'Jeli Laut', 'slime', 0x5fb7e8, 0xffffff, 19, { drop: { item: 'jeli', chance: 0.7 } }),
    mon('penyu', 'Penyu Bijak', 'turtle', 0x4f9b6e, 0x8b6a3e, 22, { drop: { item: 'cangkerang', chance: 0.5 } }),
    boss(mon('raja-ketam', 'Raja Ketam', 'crab', 0xb8323a, 0xffd27a, 30, { drop: { item: 'cangkerang', chance: 1 } })),
    // Gurun Algebra (Tingkatan 1–2)
    mon('kaktus', 'Kaktus Berduri', 'cactus', 0x4c9b48, 0xf28aa0, 27, { drop: { item: 'pasir', chance: 0.4 } }),
    mon('kala', 'Kala Jengking', 'scorpion', 0xc0873a, 0x5a3a1a, 30, { aggressive: true, drop: { item: 'pasir', chance: 0.5 } }),
    mon('golem-pasir', 'Golem Pasir', 'golem', 0xd9b26c, 0xa8834a, 34, { aggressive: true, drop: { item: 'pasir', chance: 0.6 } }),
    boss(mon('firaun-golem', 'Golem Firaun', 'golem', 0xe7c14a, 0x2f56a6, 42, { drop: { item: 'pasir', chance: 1 } })),
    // Gua Geometri (Tingkatan 3)
    mon('kelawar', 'Kelawar Gua', 'bat', 0x4a3a6a, 0xd06a8a, 38, { aggressive: true, drop: { item: 'kristal', chance: 0.3 } }),
    mon('kristal', 'Kristal Hidup', 'crystal', 0x7ad3e8, 0xc9f2ff, 41, { drop: { item: 'kristal', chance: 0.6 } }),
    mon('hantu', 'Hantu Kecil', 'ghost', 0xeef2ff, 0x6a6aa8, 44, { aggressive: true, drop: { item: 'kristal', chance: 0.4 } }),
    boss(mon('naga-kristal', 'Naga Kristal', 'dragon', 0x7ad3e8, 0x3a6a9b, 50, { drop: { item: 'kristal', chance: 1 } })),
    // Puncak Ilmu (Tingkatan 4–5)
    mon('yeti', 'Yeti Kecil', 'yeti', 0xf4f6fb, 0x6fa8c7, 47, { drop: { item: 'ais', chance: 0.5 } }),
    mon('golem-ais', 'Golem Ais', 'golem', 0xbfe3f2, 0x6fa8c7, 52, { aggressive: true, drop: { item: 'ais', chance: 0.6 } }),
    mon('naga-kecil', 'Naga Kecil', 'dragon', 0xe0533c, 0xf2c94c, 57, { aggressive: true, drop: { item: 'sisik', chance: 0.2 } }),
    boss(mon('naga-ilmu', 'Naga Ilmu', 'dragon', 0x5b3fa0, 0xf2c94c, 65, { drop: { item: 'sisik', chance: 1 } })),
  ].map((m) => [m.id, m]),
);

// ------------------------------------------------------------ maps

export type MapId = 'kota' | 'padang' | 'hutan' | 'pantai' | 'gurun' | 'gua' | 'puncak';

export type Theme = 'town' | 'meadow' | 'forest' | 'beach' | 'desert' | 'cave' | 'peak';

export interface PortalDef {
  to: MapId;
  pos: [number, number];
  /** Where the player appears in the destination map. */
  arrive: [number, number];
}

export interface MapDef {
  id: MapId;
  name: string;
  grades: GradeId[];
  theme: Theme;
  size: number;
  sky: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  ground: [number, number, number];
  hill: number;
  monsters: { id: string; count: number }[];
  portals: PortalDef[];
  spawn: [number, number];
  recommend: string;
}

export const MAPS: Record<MapId, MapDef> = {
  kota: {
    id: 'kota', name: 'Kota Permulaan', grades: [], theme: 'town', size: 34,
    sky: 0x9fd3ff, fog: 0xcfe8ff, fogNear: 40, fogFar: 110, ground: [0x7cc36a, 0x68b05a, 0x93cf7a], hill: 0,
    monsters: [{ id: 'patung', count: 3 }],
    portals: [{ to: 'padang', pos: [31, 0], arrive: [-28, 0] }],
    spawn: [0, 6], recommend: 'Semua',
  },
  padang: {
    id: 'padang', name: 'Padang Nombor', grades: ['T1', 'T2'], theme: 'meadow', size: 42,
    sky: 0x8fd0ff, fog: 0xd6efff, fogNear: 35, fogFar: 100, ground: [0x82c96b, 0x6cb85a, 0xa6d77a], hill: 1.2,
    monsters: [{ id: 'jeli-merah', count: 7 }, { id: 'arnab', count: 5 }, { id: 'cendawan', count: 4 }, { id: 'raja-jeli', count: 1 }],
    portals: [{ to: 'kota', pos: [-38, 0], arrive: [27, 0] }, { to: 'hutan', pos: [38, 0], arrive: [-36, 0] }],
    spawn: [-28, 0], recommend: 'Tahun 1–2',
  },
  hutan: {
    id: 'hutan', name: 'Hutan Sifir', grades: ['T3', 'T4'], theme: 'forest', size: 42,
    sky: 0x7fbf9a, fog: 0x9fd1b0, fogNear: 25, fogFar: 85, ground: [0x4f9a4a, 0x3f8a3e, 0x6aa85a], hill: 1.6,
    monsters: [{ id: 'cendawan-ungu', count: 5 }, { id: 'kumbang', count: 5 }, { id: 'tunggul', count: 4 }, { id: 'lebah', count: 4 }, { id: 'kumbang-raksasa', count: 1 }],
    portals: [{ to: 'padang', pos: [-38, 0], arrive: [34, 0] }, { to: 'pantai', pos: [38, 0], arrive: [-36, 0] }],
    spawn: [-36, 0], recommend: 'Tahun 3–4',
  },
  pantai: {
    id: 'pantai', name: 'Pantai Pecahan', grades: ['T5', 'T6'], theme: 'beach', size: 42,
    sky: 0x7fd4ff, fog: 0xd8f4ff, fogNear: 40, fogFar: 120, ground: [0xf0dca0, 0xe6cd8a, 0xf7e7b8], hill: 0.7,
    monsters: [{ id: 'ketam', count: 7 }, { id: 'jeli-biru', count: 6 }, { id: 'penyu', count: 5 }, { id: 'raja-ketam', count: 1 }],
    portals: [{ to: 'hutan', pos: [-38, 0], arrive: [34, 0] }, { to: 'gurun', pos: [38, 0], arrive: [-36, 0] }],
    spawn: [-36, 0], recommend: 'Tahun 5–6',
  },
  gurun: {
    id: 'gurun', name: 'Gurun Algebra', grades: ['F1', 'F2'], theme: 'desert', size: 44,
    sky: 0xffd9a0, fog: 0xf7dcb0, fogNear: 35, fogFar: 110, ground: [0xe9c27a, 0xdcae62, 0xf2d496], hill: 2.2,
    monsters: [{ id: 'kaktus', count: 6 }, { id: 'kala', count: 6 }, { id: 'golem-pasir', count: 4 }, { id: 'firaun-golem', count: 1 }],
    portals: [{ to: 'pantai', pos: [-40, 0], arrive: [34, 0] }, { to: 'gua', pos: [40, 0], arrive: [-34, 0] }],
    spawn: [-36, 0], recommend: 'Tingkatan 1–2',
  },
  gua: {
    id: 'gua', name: 'Gua Geometri', grades: ['F3'], theme: 'cave', size: 38,
    sky: 0x1b1530, fog: 0x231a3d, fogNear: 12, fogFar: 60, ground: [0x4a3f5e, 0x3c3350, 0x5a4d70], hill: 1.0,
    monsters: [{ id: 'kelawar', count: 6 }, { id: 'kristal', count: 6 }, { id: 'hantu', count: 5 }, { id: 'naga-kristal', count: 1 }],
    portals: [{ to: 'gurun', pos: [-34, 0], arrive: [36, 0] }, { to: 'puncak', pos: [34, 0], arrive: [-38, 0] }],
    spawn: [-30, 0], recommend: 'Tingkatan 3',
  },
  puncak: {
    id: 'puncak', name: 'Puncak Ilmu', grades: ['F4', 'F5'], theme: 'peak', size: 44,
    sky: 0xb9d7ef, fog: 0xe8f1fa, fogNear: 30, fogFar: 100, ground: [0xf2f6fb, 0xdfe8f2, 0xffffff], hill: 2.6,
    monsters: [{ id: 'yeti', count: 7 }, { id: 'golem-ais', count: 5 }, { id: 'naga-kecil', count: 5 }, { id: 'naga-ilmu', count: 1 }],
    portals: [{ to: 'gua', pos: [-40, 0], arrive: [30, 0] }],
    spawn: [-36, 0], recommend: 'Tingkatan 4–5',
  },
};

export const MAP_ORDER: MapId[] = ['kota', 'padang', 'hutan', 'pantai', 'gurun', 'gua', 'puncak'];

/** The field map whose questions match a school grade. */
export function mapForGrade(g: GradeId): MapId {
  return (MAP_ORDER.find((m) => MAPS[m].grades.includes(g)) ?? 'padang') as MapId;
}
