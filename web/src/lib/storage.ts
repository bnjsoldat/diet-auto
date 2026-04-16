import localforage from 'localforage';
import type { DayPlan, Profile, Settings } from '@/types';

localforage.config({
  name: 'diet-auto',
  storeName: 'main',
  description: 'Diét Auto - données utilisateur',
});

const K = {
  profiles: 'profiles',
  activeProfileId: 'activeProfileId',
  dayPlans: (profileId: string) => `dayPlans:${profileId}`,
  favorites: (profileId: string) => `favorites:${profileId}`,
  settings: 'settings',
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
};
