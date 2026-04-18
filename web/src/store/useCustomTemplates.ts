import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { PlanTemplate } from '@/lib/templates';

/**
 * Modèles de plans créés par l'utilisateur à partir d'un plan existant.
 * Conservés globalement (pas par profil) pour qu'un parent puisse partager
 * ses modèles avec les autres profils du foyer.
 */
interface State {
  templates: PlanTemplate[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (tpl: PlanTemplate) => Promise<void>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, label: string) => Promise<void>;
}

export const useCustomTemplates = create<State>((set, get) => ({
  templates: [],
  loaded: false,

  async load() {
    const list = await storage.getCustomTemplates();
    set({ templates: list, loaded: true });
  },

  async add(tpl) {
    const next = [...get().templates, tpl];
    set({ templates: next });
    await storage.saveCustomTemplates(next);
  },

  async remove(id) {
    const next = get().templates.filter((t) => t.id !== id);
    set({ templates: next });
    await storage.saveCustomTemplates(next);
  },

  async rename(id, label) {
    const next = get().templates.map((t) => (t.id === id ? { ...t, label } : t));
    set({ templates: next });
    await storage.saveCustomTemplates(next);
  },
}));
