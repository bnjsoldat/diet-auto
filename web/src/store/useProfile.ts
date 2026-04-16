import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Profile } from '@/types';
import { uid } from '@/lib/utils';

interface ProfileState {
  profiles: Profile[];
  activeId: string | null;
  loaded: boolean;

  load: () => Promise<void>;
  createProfile: (data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Profile>;
  updateProfile: (id: string, patch: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActive: (id: string) => Promise<void>;
  getActive: () => Profile | null;
}

async function persist(state: { profiles: Profile[]; activeId: string | null }) {
  await storage.saveProfiles(state.profiles);
  await storage.setActiveProfileId(state.activeId);
}

export const useProfile = create<ProfileState>((set, get) => ({
  profiles: [],
  activeId: null,
  loaded: false,

  async load() {
    const profiles = await storage.getProfiles();
    let activeId = await storage.getActiveProfileId();
    if (!activeId && profiles[0]) activeId = profiles[0].id;
    set({ profiles, activeId, loaded: true });
  },

  async createProfile(data) {
    const now = Date.now();
    const profile: Profile = { ...data, id: uid('prof'), createdAt: now, updatedAt: now };
    const profiles = [...get().profiles, profile];
    const activeId = profile.id;
    set({ profiles, activeId });
    await persist({ profiles, activeId });
    return profile;
  },

  async updateProfile(id, patch) {
    const profiles = get().profiles.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
    );
    set({ profiles });
    await persist({ profiles, activeId: get().activeId });
  },

  async deleteProfile(id) {
    const profiles = get().profiles.filter((p) => p.id !== id);
    let activeId = get().activeId;
    if (activeId === id) activeId = profiles[0]?.id ?? null;
    set({ profiles, activeId });
    await persist({ profiles, activeId });
  },

  async setActive(id) {
    set({ activeId: id });
    await persist({ profiles: get().profiles, activeId: id });
  },

  getActive() {
    const { profiles, activeId } = get();
    return profiles.find((p) => p.id === activeId) ?? null;
  },
}));
