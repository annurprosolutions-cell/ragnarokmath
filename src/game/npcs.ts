// Town NPCs and the wandering adventurers that make the town feel alive.
import { Appearance } from '../rpg/character';
import { JobId } from '../rpg/data';
import { NpcDef } from './entities';

const app = (a: Partial<Appearance>): Appearance => ({
  gender: 'P', skin: 1, hairStyle: 0, hairColor: 1, tudung: false, tudungColor: 0, eyeColor: 0, outfitColor: 0, hat: null, ...a,
});

export const TOWN_NPCS: NpcDef[] = [
  { id: 'cikgu', name: 'Cikgu Ana', title: 'Pemandu Novice', icon: '📘', job: 'priest', appearance: app({ tudung: true, tudungColor: 0, skin: 1 }), pos: [-3.5, 4.5], facing: 0.5 },
  { id: 'warp', name: 'Pak Warp', title: 'Pegawai Warp', icon: '🌀', job: 'mage', appearance: app({ gender: 'L', hairStyle: 0, hairColor: 2, skin: 2 }), pos: [5, -5], facing: -0.6 },
  { id: 'job', name: 'Guru Job', title: 'Tukar Kerjaya', icon: '🎓', job: 'knight', appearance: app({ gender: 'L', hairStyle: 1, hairColor: 1, skin: 2 }), pos: [-6, -5.5], facing: 0.8 },
  { id: 'kedai', name: 'Mak Cik Kedai', title: 'Kedai Runcit', icon: '🛒', job: 'blacksmith', appearance: app({ tudung: true, tudungColor: 4, skin: 2 }), pos: [12, 3.8], facing: 0 },
  { id: 'gaya', name: 'Kak Gaya', title: 'Kedai Gaya & Topi', icon: '🎀', job: 'novice', appearance: app({ tudung: true, tudungColor: 9, outfitColor: 6, hat: 'bunga', skin: 0 }), pos: [-12, 3.6], facing: 0 },
];

export interface BotDef {
  name: string;
  job: JobId;
  appearance: Appearance;
}

export const TOWN_BOTS: BotDef[] = [
  { name: 'Hafiz', job: 'knight', appearance: app({ gender: 'L', hairStyle: 1, hairColor: 0, skin: 2 }) },
  { name: 'Mei Ling', job: 'mage', appearance: app({ hairStyle: 3, hairColor: 2, skin: 0 }) },
  { name: 'Aisyah', job: 'assassin', appearance: app({ tudung: true, tudungColor: 6, skin: 1 }) },
  { name: 'Ravi', job: 'hunter', appearance: app({ gender: 'L', hairStyle: 5, hairColor: 2, skin: 4 }) },
  { name: 'Nurul', job: 'novice', appearance: app({ tudung: true, tudungColor: 1, outfitColor: 5, skin: 1 }) },
  { name: 'Adam', job: 'blacksmith', appearance: app({ gender: 'L', hairStyle: 0, hairColor: 3, skin: 3 }) },
];

export const BOT_LINES = [
  'Siapa nak latih sifir sama-sama?',
  'Aku baru dapat Level 15!',
  'Pecahan tu senang je kalau faham.',
  'Jom pergi Hutan Sifir!',
  'Jangan lupa beli potion dulu.',
  'Raja Jeli tu kuat gila...',
  'Mak cik kedai jual Sayap Pulang.',
  'Soalan Tingkatan 2 makin mencabar!',
  'Kak Gaya ada topi baru.',
];
