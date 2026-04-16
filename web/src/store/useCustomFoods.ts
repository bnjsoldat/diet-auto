import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { registerCustomFoods } from '@/lib/foods';
import type { Food } from '@/types';

interface CustomFoodsState {
  customs: Food[];
  loaded: boolean;

  load: () => Promise<void>;
  addOrUpdate: (food: Food) => void;
  remove: (nom: string) => void;
  clear: () => void;
}

/**
 * Aliments "perso" : créés manuellement ou importés depuis un scan de
 * code-barres (Open Food Facts). Stockés globalement (pas par profil) car ils
 * représentent des produits industriels partagés entre tous les profils de
 * l'appareil. Fusionnés dans `foods` via `registerCustomFoods` à chaque
 * changement.
 */
export const useCustomFoods = create<CustomFoodsState>((set, get) => ({
  customs: [],
  loaded: false,

  async load() {
    const customs = await storage.getCustomFoods();
    registerCustomFoods(customs);
    set({ customs, loaded: true });
  },

  addOrUpdate(food) {
    const { customs } = get();
    const nomLC = food.nom.toLowerCase();
    const filtered = customs.filter((f) => f.nom.toLowerCase() !== nomLC);
    const next = [...filtered, { ...food, groupe: 'perso' }];
    next.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
    set({ customs: next });
    registerCustomFoods(next);
    storage.saveCustomFoods(next);
  },

  remove(nom) {
    const { customs } = get();
    const next = customs.filter((f) => f.nom.toLowerCase() !== nom.toLowerCase());
    set({ customs: next });
    registerCustomFoods(next);
    storage.saveCustomFoods(next);
  },

  clear() {
    set({ customs: [] });
    registerCustomFoods([]);
    storage.saveCustomFoods([]);
  },
}));
