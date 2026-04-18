import { create } from 'zustand';
import localforage from 'localforage';

/**
 * Suivi minimal de l'hydratation journalière. 1 verre = 250 mL, objectif
 * par défaut 8 verres (= 2 L). Clé de stockage par profil + date :
 * `water:{profileId}:{YYYY-MM-DD}` → nombre de verres.
 *
 * Stocké dans IndexedDB via localforage, synchronisé automatiquement au
 * cloud via les abonnements Zustand dans App.tsx (comme les autres
 * stores).
 */
const KEY_PREFIX = 'water:';

interface WaterState {
  /** Nombre de verres pris pour chaque couple profil/date. */
  counts: Record<string, number>;
  loaded: boolean;
  goal: number;

  load: () => Promise<void>;
  setGoal: (glasses: number) => void;
  getFor: (profileId: string, date: string) => number;
  increment: (profileId: string, date: string) => void;
  decrement: (profileId: string, date: string) => void;
  setFor: (profileId: string, date: string, glasses: number) => void;
}

function cellKey(profileId: string, date: string): string {
  return `${KEY_PREFIX}${profileId}:${date}`;
}

export const useWater = create<WaterState>((set, get) => ({
  counts: {},
  loaded: false,
  goal: 8,

  async load() {
    const counts: Record<string, number> = {};
    let goal = 8;
    await localforage.iterate<unknown, void>((value, key) => {
      if (key === 'water:goal' && typeof value === 'number') {
        goal = value;
      } else if (key.startsWith(KEY_PREFIX) && typeof value === 'number') {
        counts[key] = value;
      }
    });
    set({ counts, loaded: true, goal });
  },

  setGoal(glasses) {
    const g = Math.max(1, Math.min(20, Math.round(glasses)));
    set({ goal: g });
    void localforage.setItem('water:goal', g);
  },

  getFor(profileId, date) {
    return get().counts[cellKey(profileId, date)] ?? 0;
  },

  increment(profileId, date) {
    const key = cellKey(profileId, date);
    const next = { ...get().counts, [key]: (get().counts[key] ?? 0) + 1 };
    set({ counts: next });
    void localforage.setItem(key, next[key]);
  },

  decrement(profileId, date) {
    const key = cellKey(profileId, date);
    const current = get().counts[key] ?? 0;
    if (current <= 0) return;
    const nextValue = current - 1;
    const next = { ...get().counts };
    if (nextValue === 0) {
      delete next[key];
      void localforage.removeItem(key);
    } else {
      next[key] = nextValue;
      void localforage.setItem(key, nextValue);
    }
    set({ counts: next });
  },

  setFor(profileId, date, glasses) {
    const key = cellKey(profileId, date);
    const g = Math.max(0, Math.min(30, Math.round(glasses)));
    const next = { ...get().counts };
    if (g === 0) {
      delete next[key];
      void localforage.removeItem(key);
    } else {
      next[key] = g;
      void localforage.setItem(key, g);
    }
    set({ counts: next });
  },
}));
