import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { applyTheme, getSavedTheme } from '@/lib/theme';
import type { Settings, Theme } from '@/types';

const DEFAULT: Settings = {
  theme: 'system',
  weightKcal: 2.0,
  weightMacro: 1.0,
};

interface SettingsState extends Settings {
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (t: Theme) => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULT,
  theme: getSavedTheme(),
  loaded: false,

  async load() {
    const s = await storage.getSettings();
    if (s) set({ ...s, loaded: true });
    else set({ loaded: true });
  },

  async setTheme(t) {
    applyTheme(t);
    const next = { ...get(), theme: t };
    set({ theme: t });
    await storage.saveSettings({
      theme: t,
      weightKcal: next.weightKcal,
      weightMacro: next.weightMacro,
    });
  },

  async update(patch) {
    const next = { ...get(), ...patch };
    set(patch);
    await storage.saveSettings({
      theme: next.theme,
      weightKcal: next.weightKcal,
      weightMacro: next.weightMacro,
    });
  },
}));
