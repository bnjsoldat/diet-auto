import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { DayPlan, Meal, MealFoodItem } from '@/types';
import { DEFAULT_MEALS } from '@/lib/constants';
import { debounce, todayKey, uid } from '@/lib/utils';
import { foodsByName } from '@/lib/foods';

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
  updateItem: (mealId: string, itemId: string, patch: Partial<MealFoodItem>) => void;
  removeItem: (mealId: string, itemId: string) => void;
  renameMeal: (mealId: string, nom: string) => void;
  addMeal: (nom: string) => void;
  removeMeal: (mealId: string) => void;

  replaceCurrentPlan: (plan: DayPlan) => void;
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
        const food = foodsByName.get(nomFood.toLowerCase());
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
  };
});
