import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { applyTheme, getSavedTheme } from '@/lib/theme';
import type { Settings, Theme } from '@/types';

const DEFAULT: Settings = {
  // Par défaut clair (le thème 'system' existe toujours en type pour les
  // anciens utilisateurs mais n'est plus proposé dans le ThemeToggle).
  theme: 'light',
  weightKcal: 2.0,
  weightMacro: 1.0,
  optimizerMode: 'normal',
  suggestComplements: true,
};

interface SettingsState extends Settings {
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (t: Theme) => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

function persist(s: Settings): Settings {
  return {
    theme: s.theme,
    weightKcal: s.weightKcal,
    weightMacro: s.weightMacro,
    optimizerMode: s.optimizerMode,
    // Bug 2026-04-22 : `suggestComplements` était absent de `persist`,
    // donc le toggle se réinitialisait à `true` au reload. Fix.
    suggestComplements: s.suggestComplements ?? true,
  };
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULT,
  theme: getSavedTheme(),
  loaded: false,

  async load() {
    const s = await storage.getSettings();
    if (s) set({ ...DEFAULT, ...s, loaded: true });
    else set({ loaded: true });
  },

  async setTheme(t) {
    applyTheme(t);
    const next = { ...get(), theme: t };
    set({ theme: t });
    await storage.saveSettings(persist(next));
  },

  async update(patch) {
    const next = { ...get(), ...patch };
    set(patch);
    await storage.saveSettings(persist(next));
  },
}));
