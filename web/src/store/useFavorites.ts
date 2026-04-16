import { create } from 'zustand';
import { storage } from '@/lib/storage';

interface FavState {
  profileId: string | null;
  favorites: string[]; // noms d'aliments
  loaded: boolean;
  load: (profileId: string) => Promise<void>;
  toggle: (nom: string) => Promise<void>;
  isFav: (nom: string) => boolean;
}

export const useFavorites = create<FavState>((set, get) => ({
  profileId: null,
  favorites: [],
  loaded: false,

  async load(profileId) {
    const favorites = await storage.getFavorites(profileId);
    set({ profileId, favorites, loaded: true });
  },

  async toggle(nom) {
    const { profileId, favorites } = get();
    if (!profileId) return;
    const next = favorites.includes(nom)
      ? favorites.filter((n) => n !== nom)
      : [...favorites, nom];
    set({ favorites: next });
    await storage.saveFavorites(profileId, next);
  },

  isFav(nom) {
    return get().favorites.includes(nom);
  },
}));
