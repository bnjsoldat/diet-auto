import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { uid } from '@/lib/utils';
import type { Recipe, RecipeIngredient } from '@/types';

interface RecipeState {
  profileId: string | null;
  recipes: Recipe[];
  loaded: boolean;

  load: (profileId: string) => Promise<void>;
  create: (nom: string, ingredients: RecipeIngredient[]) => Recipe;
  update: (id: string, patch: Partial<Recipe>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => Recipe | null;
}

function computePortion(ingredients: RecipeIngredient[]): number {
  return ingredients.reduce((sum, i) => sum + (i.quantite || 0), 0);
}

export const useRecipes = create<RecipeState>((set, get) => ({
  profileId: null,
  recipes: [],
  loaded: false,

  async load(profileId) {
    const recipes = await storage.getRecipes<Recipe>(profileId);
    recipes.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    set({ profileId, recipes, loaded: true });
  },

  create(nom, ingredients) {
    const { profileId, recipes } = get();
    const now = Date.now();
    const recipe: Recipe = {
      id: uid('rec'),
      nom: nom.trim(),
      ingredients,
      portionG: computePortion(ingredients),
      createdAt: now,
      updatedAt: now,
    };
    const next = [...recipes, recipe].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    set({ recipes: next });
    if (profileId) storage.saveRecipes(profileId, next);
    return recipe;
  },

  update(id, patch) {
    const { profileId, recipes } = get();
    const next = recipes.map((r) => {
      if (r.id !== id) return r;
      const merged: Recipe = { ...r, ...patch, updatedAt: Date.now() };
      merged.portionG = computePortion(merged.ingredients);
      return merged;
    });
    next.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    set({ recipes: next });
    if (profileId) storage.saveRecipes(profileId, next);
  },

  remove(id) {
    const { profileId, recipes } = get();
    const next = recipes.filter((r) => r.id !== id);
    set({ recipes: next });
    if (profileId) storage.saveRecipes(profileId, next);
  },

  duplicate(id) {
    const r = get().recipes.find((x) => x.id === id);
    if (!r) return null;
    return get().create(`${r.nom} (copie)`, r.ingredients.map((i) => ({ ...i })));
  },
}));
