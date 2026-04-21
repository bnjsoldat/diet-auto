import { create } from 'zustand';
import localforage from 'localforage';
import type { DailyActivity } from '@/lib/strava';

/**
 * Store des activités sportives journalières (Strava + saisie manuelle).
 *
 * Clé de stockage : `activities:{YYYY-MM-DD}` → DailyActivity.
 * Partagé entre tous les profils de l'appareil (le sport dépend de la
 * personne physique, pas d'un profil nutritionnel donné).
 *
 * Côté cloud : synchronisé via `user_data.activities` (même schéma :
 * Record<date, DailyActivity>).
 */
const KEY_PREFIX = 'activities:';

interface ActivityState {
  /** Activités par date, keyed by 'YYYY-MM-DD'. */
  byDate: Record<string, DailyActivity>;
  loaded: boolean;

  load: () => Promise<void>;
  getFor: (date: string) => DailyActivity | null;
  /** Remplace toutes les entrées (utilisé au pull cloud ou après sync Strava). */
  replaceAll: (byDate: Record<string, DailyActivity>) => Promise<void>;
  /** Fusionne de nouvelles entrées (conserve les dates existantes non touchées). */
  merge: (byDate: Record<string, DailyActivity>) => Promise<void>;
  /** Ajoute/remplace une entrée manuelle pour une date. */
  setManual: (date: string, kcal: number, minutes: number) => Promise<void>;
  /** Supprime l'entrée d'une date donnée. */
  remove: (date: string) => Promise<void>;
}

export const useActivity = create<ActivityState>((set, get) => ({
  byDate: {},
  loaded: false,

  async load() {
    const byDate: Record<string, DailyActivity> = {};
    await localforage.iterate<unknown, void>((value, key) => {
      if (key.startsWith(KEY_PREFIX) && value && typeof value === 'object') {
        const date = key.slice(KEY_PREFIX.length);
        byDate[date] = value as DailyActivity;
      }
    });
    set({ byDate, loaded: true });
  },

  getFor(date) {
    return get().byDate[date] ?? null;
  },

  async replaceAll(byDate) {
    // Purge d'abord les anciennes clés activities:* puis écrit les nouvelles.
    const keys = await localforage.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith(KEY_PREFIX)).map((k) => localforage.removeItem(k))
    );
    await Promise.all(
      Object.entries(byDate).map(([date, entry]) =>
        localforage.setItem(KEY_PREFIX + date, entry)
      )
    );
    set({ byDate });
  },

  async merge(incoming) {
    const current = get().byDate;
    const merged = { ...current, ...incoming };
    await Promise.all(
      Object.entries(incoming).map(([date, entry]) =>
        localforage.setItem(KEY_PREFIX + date, entry)
      )
    );
    set({ byDate: merged });
  },

  async setManual(date, kcal, minutes) {
    const entry: DailyActivity = {
      kcal: Math.max(0, Math.round(kcal)),
      minutes: Math.max(0, Math.round(minutes)),
      source: 'manual',
    };
    if (entry.kcal === 0) {
      // kcal = 0 → on supprime l'entrée
      return get().remove(date);
    }
    await localforage.setItem(KEY_PREFIX + date, entry);
    set({ byDate: { ...get().byDate, [date]: entry } });
  },

  async remove(date) {
    await localforage.removeItem(KEY_PREFIX + date);
    const next = { ...get().byDate };
    delete next[date];
    set({ byDate: next });
  },
}));
