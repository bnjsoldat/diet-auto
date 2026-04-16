import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { WeightEntry } from '@/types';

interface WeightState {
  profileId: string | null;
  entries: WeightEntry[];
  loaded: boolean;

  load: (profileId: string) => Promise<void>;
  addOrUpdate: (entry: WeightEntry) => void;
  remove: (date: string) => void;
  clear: () => void;
}

export const useWeight = create<WeightState>((set, get) => ({
  profileId: null,
  entries: [],
  loaded: false,

  async load(profileId) {
    const entries = await storage.getWeights(profileId);
    entries.sort((a, b) => a.date.localeCompare(b.date));
    set({ profileId, entries, loaded: true });
  },

  addOrUpdate(entry) {
    const { profileId, entries } = get();
    if (!profileId) return;
    const idx = entries.findIndex((e) => e.date === entry.date);
    const next = [...entries];
    if (idx >= 0) next[idx] = entry;
    else next.push(entry);
    next.sort((a, b) => a.date.localeCompare(b.date));
    set({ entries: next });
    storage.saveWeights(profileId, next);
  },

  remove(date) {
    const { profileId, entries } = get();
    if (!profileId) return;
    const next = entries.filter((e) => e.date !== date);
    set({ entries: next });
    storage.saveWeights(profileId, next);
  },

  clear() {
    const { profileId } = get();
    if (!profileId) return;
    set({ entries: [] });
    storage.saveWeights(profileId, []);
  },
}));
