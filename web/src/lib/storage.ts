import localforage from 'localforage';
import type { DayPlan, Food, Profile, Reminder, Settings, WeightEntry } from '@/types';
import type { PlanTemplate } from './templates';

localforage.config({
  name: 'diet-auto',
  storeName: 'main',
  description: 'Ma Diét - données utilisateur',
});

const K = {
  profiles: 'profiles',
  activeProfileId: 'activeProfileId',
  dayPlans: (profileId: string) => `dayPlans:${profileId}`,
  favorites: (profileId: string) => `favorites:${profileId}`,
  settings: 'settings',
  weights: (profileId: string) => `weights:${profileId}`,
  recipes: (profileId: string) => `recipes:${profileId}`,
  customFoods: 'customFoods',
  reminders: 'reminders',
  customTemplates: 'customTemplates',
};

export const storage = {
  async getProfiles(): Promise<Profile[]> {
    return (await localforage.getItem<Profile[]>(K.profiles)) ?? [];
  },
  async saveProfiles(list: Profile[]) {
    await localforage.setItem(K.profiles, list);
  },

  async getActiveProfileId(): Promise<string | null> {
    return (await localforage.getItem<string>(K.activeProfileId)) ?? null;
  },
  async setActiveProfileId(id: string | null) {
    await localforage.setItem(K.activeProfileId, id);
  },

  async getDayPlans(profileId: string): Promise<Record<string, DayPlan>> {
    return (await localforage.getItem<Record<string, DayPlan>>(K.dayPlans(profileId))) ?? {};
  },
  async saveDayPlans(profileId: string, plans: Record<string, DayPlan>) {
    await localforage.setItem(K.dayPlans(profileId), plans);
  },

  async getFavorites(profileId: string): Promise<string[]> {
    return (await localforage.getItem<string[]>(K.favorites(profileId))) ?? [];
  },
  async saveFavorites(profileId: string, favs: string[]) {
    await localforage.setItem(K.favorites(profileId), favs);
  },

  async getSettings(): Promise<Settings | null> {
    return (await localforage.getItem<Settings>(K.settings)) ?? null;
  },
  async saveSettings(s: Settings) {
    await localforage.setItem(K.settings, s);
  },

  async getWeights(profileId: string): Promise<WeightEntry[]> {
    return (await localforage.getItem<WeightEntry[]>(K.weights(profileId))) ?? [];
  },
  async saveWeights(profileId: string, entries: WeightEntry[]) {
    await localforage.setItem(K.weights(profileId), entries);
  },

  async getRecipes<T = unknown>(profileId: string): Promise<T[]> {
    return (await localforage.getItem<T[]>(K.recipes(profileId))) ?? [];
  },
  async saveRecipes<T = unknown>(profileId: string, list: T[]) {
    await localforage.setItem(K.recipes(profileId), list);
  },

  async getCustomFoods(): Promise<Food[]> {
    return (await localforage.getItem<Food[]>(K.customFoods)) ?? [];
  },
  async saveCustomFoods(list: Food[]) {
    await localforage.setItem(K.customFoods, list);
  },

  async getReminders(): Promise<Reminder[]> {
    return (await localforage.getItem<Reminder[]>(K.reminders)) ?? [];
  },
  async saveReminders(list: Reminder[]) {
    await localforage.setItem(K.reminders, list);
  },

  async getCustomTemplates(): Promise<PlanTemplate[]> {
    return (await localforage.getItem<PlanTemplate[]>(K.customTemplates)) ?? [];
  },
  async saveCustomTemplates(list: PlanTemplate[]) {
    await localforage.setItem(K.customTemplates, list);
  },
};
