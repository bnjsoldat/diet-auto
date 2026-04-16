import foodsRaw from '@/data/foods.json';
import Fuse from 'fuse.js';
import type { Food } from '@/types';

export const foods: Food[] = foodsRaw as Food[];

/** Map lowercase -> Food, utilisée pour lookup O(1) par nom canonique */
export const foodsByName = new Map<string, Food>(
  foods.map((f) => [f.nom.toLowerCase(), f])
);

/** Index fuzzy pour la recherche rapide dans le combobox */
export const fuse = new Fuse(foods, {
  keys: ['nom', 'groupe'],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: false,
});

/** Groupes uniques triés pour filtrage éventuel */
export const groupes: string[] = Array.from(
  new Set(foods.map((f) => f.groupe).filter(Boolean))
).sort((a, b) => a.localeCompare(b, 'fr'));

export function searchFoods(query: string, limit = 25): Food[] {
  const q = query.trim();
  if (!q) return [];
  return fuse.search(q, { limit }).map((r) => r.item);
}
