// Offline-first persistence in localStorage. One save file holds three character slots.
import { CharacterData } from './rpg/character';

export type Quality = 'low' | 'med' | 'high';

export interface Settings {
  sound: boolean;
  quality: Quality;
  timer: boolean;
  /** 'map' = questions follow the map's grade band; 'grade' = always the player's own grade. */
  questionMode: 'map' | 'grade';
}

export interface SaveFile {
  version: 1;
  slots: (CharacterData | null)[];
  settings: Settings;
}

const KEY = 'kembara-matematik.save.v1';
export const SLOT_COUNT = 3;

function defaultQuality(): Quality {
  const mobile = matchMedia('(pointer: coarse)').matches;
  return mobile ? 'med' : 'high';
}

function fresh(): SaveFile {
  return {
    version: 1,
    slots: Array(SLOT_COUNT).fill(null),
    settings: { sound: true, quality: defaultQuality(), timer: true, questionMode: 'map' },
  };
}

export function loadSave(): SaveFile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw) as SaveFile;
    if (data.version !== 1 || !Array.isArray(data.slots)) return fresh();
    while (data.slots.length < SLOT_COUNT) data.slots.push(null);
    data.settings = { ...fresh().settings, ...data.settings };
    return data;
  } catch {
    return fresh();
  }
}

export function writeSave(save: SaveFile): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

/** Ask the browser not to evict our data (best effort; matters for installed PWAs). */
export function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => undefined);
}
