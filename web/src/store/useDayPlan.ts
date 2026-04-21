import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { DayPlan, Food, Meal, MealFoodItem, Recipe } from '@/types';
import { DEFAULT_MEALS } from '@/lib/constants';
import { debounce, todayKey, uid } from '@/lib/utils';

/**
 * Map d'aliments chargée dynamiquement — évite de tirer les 479 KB de JSON
 * CIQUAL dans le chunk principal. Au 1er appel d'`addFood`, si la Map n'est
 * pas encore prête, on défaut silencieusement à 100 g (comportement correct
 * pour les aliments sans `unites`). En pratique Today/MealSection ont déjà
 * résolu l'import statique avant que l'utilisateur clique sur "Ajouter".
 */
let _foodsByName: Map<string, Food> = new Map();
import('@/lib/foods').then((mod) => {
  _foodsByName = mod.foodsByName;
});

interface DayPlanState {
  profileId: string | null;
  date: string;
  plans: Record<string, DayPlan>; // keyed by date
  loaded: boolean;

  load: (profileId: string) => Promise<void>;
  switchDate: (date: string) => void;
  ensurePlan: () => DayPlan;
  current: () => DayPlan | null;

  addFood: (mealId: string, nomFood: string, quantite?: number | null) => void;
  addRecipe: (mealId: string, recipe: Recipe, portionRatio?: number) => void;
  updateItem: (mealId: string, itemId: string, patch: Partial<MealFoodItem>) => void;
  removeItem: (mealId: string, itemId: string) => void;
  renameMeal: (mealId: string, nom: string) => void;
  addMeal: (nom: string) => void;
  removeMeal: (mealId: string) => void;

  replaceCurrentPlan: (plan: DayPlan) => void;

  /** Duplique un repas au sein du plan courant (quantités et verrous préservés). */
  duplicateMeal: (mealId: string) => void;
  /** Remplace le plan du jour par un clone des repas d'une autre date. */
  duplicateFromDate: (sourceDate: string) => void;
  /** Réordonne les repas du plan courant. */
  reorderMeals: (orderedIds: string[]) => void;
  /** Supprime complètement le plan d'une date donnée (action destructive). */
  removePlanForDate: (date: string) => void;
  /** Réinsère un snapshot de plan (utilisé par l'undo toast). */
  restorePlan: (plan: DayPlan) => void;
  /** Duplique le plan courant sur plusieurs dates en même temps (ex : toute la semaine). */
  duplicateToDates: (targetDates: string[]) => void;
}

function makeEmptyPlan(date: string, profileId: string): DayPlan {
  return {
    date,
    profileId,
    meals: DEFAULT_MEALS.map((nom) => ({ id: uid('meal'), nom, items: [] })),
    updatedAt: Date.now(),
  };
}

let _persist: (() => void) | null = null;

export const useDayPlan = create<DayPlanState>((set, get) => {
  const persistNow = async () => {
    const { profileId, plans } = get();
    if (!profileId) return;
    await storage.saveDayPlans(profileId, plans);
  };
  _persist = debounce(persistNow, 400);

  return {
    profileId: null,
    date: todayKey(),
    plans: {},
    loaded: false,

    async load(profileId) {
      const plans = await storage.getDayPlans(profileId);
      set({ profileId, plans, loaded: true });
    },

    switchDate(date) {
      set({ date });
    },

    ensurePlan() {
      const { profileId, date, plans } = get();
      if (!profileId) throw new Error('No active profile');
      let plan = plans[date];
      if (!plan) {
        plan = makeEmptyPlan(date, profileId);
        set({ plans: { ...plans, [date]: plan } });
        _persist?.();
      }
      return plan;
    },

    current() {
      const { date, plans } = get();
      return plans[date] ?? null;
    },

    addFood(mealId, nomFood, quantite) {
      const plan = get().ensurePlan();
      // Quantité par défaut : 1 unité si l'aliment en a une, sinon 100 g
      let qDefault = quantite;
      if (qDefault == null) {
        const food = _foodsByName.get(nomFood.toLowerCase());
        qDefault = food?.unites?.[0] ? food.unites[0].g : 100;
      }
      const item: MealFoodItem = {
        id: uid('itm'),
        nom: nomFood,
        quantite: qDefault,
        verrou: false,
      };
      const meals = plan.meals.map((m) =>
        m.id === mealId ? { ...m, items: [...m.items, item] } : m
      );
      const updated: DayPlan = { ...plan, meals, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    addRecipe(mealId, recipe, portionRatio = 1) {
      const plan = get().ensurePlan();
      const newItems: MealFoodItem[] = recipe.ingredients.map((ing) => ({
        id: uid('itm'),
        nom: ing.nom,
        quantite: Math.max(1, Math.round(ing.quantite * portionRatio)),
        verrou: false,
      }));
      const meals = plan.meals.map((m) =>
        m.id === mealId ? { ...m, items: [...m.items, ...newItems] } : m
      );
      const updated: DayPlan = { ...plan, meals, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    updateItem(mealId, itemId, patch) {
      const plan = get().ensurePlan();
      const meals = plan.meals.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : m
      );
      const updated: DayPlan = { ...plan, meals, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    removeItem(mealId, itemId) {
      const plan = get().ensurePlan();
      const meals = plan.meals.map((m) =>
        m.id === mealId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m
      );
      const updated: DayPlan = { ...plan, meals, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    renameMeal(mealId, nom) {
      const plan = get().ensurePlan();
      const meals = plan.meals.map((m) => (m.id === mealId ? { ...m, nom } : m));
      const updated: DayPlan = { ...plan, meals, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    addMeal(nom) {
      const plan = get().ensurePlan();
      const newMeal: Meal = { id: uid('meal'), nom, items: [] };
      const updated: DayPlan = { ...plan, meals: [...plan.meals, newMeal], updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    removeMeal(mealId) {
      const plan = get().ensurePlan();
      const meals = plan.meals.filter((m) => m.id !== mealId);
      const updated: DayPlan = { ...plan, meals, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    replaceCurrentPlan(plan) {
      set({ plans: { ...get().plans, [plan.date]: plan } });
      _persist?.();
    },

    duplicateMeal(mealId) {
      const plan = get().ensurePlan();
      const src = plan.meals.find((m) => m.id === mealId);
      if (!src) return;
      const copy: Meal = {
        id: uid('meal'),
        nom: `${src.nom} (copie)`,
        items: src.items.map((it) => ({ ...it, id: uid('itm') })),
      };
      // Insère la copie juste après la source pour rester visuellement proche.
      const idx = plan.meals.findIndex((m) => m.id === mealId);
      const meals = [...plan.meals.slice(0, idx + 1), copy, ...plan.meals.slice(idx + 1)];
      const updated: DayPlan = { ...plan, meals, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    reorderMeals(orderedIds) {
      const plan = get().ensurePlan();
      const map = new Map(plan.meals.map((m) => [m.id, m]));
      const next: typeof plan.meals = [];
      // D'abord on place les repas dans l'ordre passé, puis on ajoute ceux
      // oubliés à la fin pour rester défensif (si l'UI envoie une liste partielle).
      for (const id of orderedIds) {
        const m = map.get(id);
        if (m) {
          next.push(m);
          map.delete(id);
        }
      }
      for (const m of map.values()) next.push(m);
      const updated: DayPlan = { ...plan, meals: next, updatedAt: Date.now() };
      set({ plans: { ...get().plans, [plan.date]: updated } });
      _persist?.();
    },

    removePlanForDate(date) {
      const { plans } = get();
      if (!plans[date]) return;
      const next = { ...plans };
      delete next[date];
      set({ plans: next });
      _persist?.();
    },

    restorePlan(plan) {
      const { plans } = get();
      set({ plans: { ...plans, [plan.date]: plan } });
      _persist?.();
    },

    duplicateToDates(targetDates) {
      const { date: currentDate, plans, profileId } = get();
      if (!profileId) return;
      const src = plans[currentDate];
      if (!src) return;
      const next = { ...plans };
      for (const d of targetDates) {
        if (d === currentDate) continue;
        next[d] = {
          date: d,
          profileId,
          meals: src.meals.map((m) => ({
            id: uid('meal'),
            nom: m.nom,
            items: m.items.map((it) => ({ ...it, id: uid('itm') })),
          })),
          updatedAt: Date.now(),
        };
      }
      set({ plans: next });
      _persist?.();
    },

    duplicateFromDate(sourceDate) {
      const { date, plans, profileId } = get();
      if (!profileId) return;
      const src = plans[sourceDate];
      if (!src) return;
      const cloned: DayPlan = {
        date,
        profileId,
        meals: src.meals.map((m) => ({
          id: uid('meal'),
          nom: m.nom,
          items: m.items.map((it) => ({ ...it, id: uid('itm') })),
        })),
        updatedAt: Date.now(),
      };
      set({ plans: { ...plans, [date]: cloned } });
      _persist?.();
    },
  };
});
