import { create } from 'zustand';
import { storage } from '@/lib/storage';
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
 * Import dynamique de `@/lib/foods` — évite de tirer les 479 KB de JSON
 * CIQUAL dans le chunk principal. Appelé à la 1re mutation (load /
 * addOrUpdate / remove / clear) ; une fois résolue, la Map et l'index
 * Fuse sont en mémoire et partagés avec le reste de l'app.
 */
async function lazyRegister(customs: Food[]) {
  const { registerCustomFoods } = await import('@/lib/foods');
  registerCustomFoods(customs);
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
    await lazyRegister(customs);
    set({ customs, loaded: true });
  },

  addOrUpdate(food) {
    const { customs } = get();
    const nomLC = food.nom.toLowerCase();
    const filtered = customs.filter((f) => f.nom.toLowerCase() !== nomLC);
    const next = [...filtered, { ...food, groupe: 'perso' }];
    next.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
    set({ customs: next });
    lazyRegister(next);
    storage.saveCustomFoods(next);
  },

  remove(nom) {
    const { customs } = get();
    const next = customs.filter((f) => f.nom.toLowerCase() !== nom.toLowerCase());
    set({ customs: next });
    lazyRegister(next);
    storage.saveCustomFoods(next);
  },

  clear() {
    set({ customs: [] });
    lazyRegister([]);
    storage.saveCustomFoods([]);
  },
}));
