import foodsRaw from '@/data/foods.json';
import foodsExtras from '@/data/foods-extras.json';
import foodsUnits from '@/data/foods-units.json';
import foodsUnitPatterns from '@/data/foods-unit-patterns.json';
import Fuse from 'fuse.js';
import type { Food, Unite } from '@/types';

const UNITS = foodsUnits as Record<string, Unite[]>;

interface UnitPattern {
  prefix: string;
  excludes?: string[];
  unites: Unite[];
}
const UNIT_PATTERNS = foodsUnitPatterns as UnitPattern[];

/** Normalise un nom pour le matching : minuscules, sans accents, espaces compactés. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Tri des patterns par longueur de préfixe décroissante pour privilégier le plus spécifique. */
const SORTED_PATTERNS = [...UNIT_PATTERNS].sort(
  (a, b) => normalize(b.prefix).length - normalize(a.prefix).length
);

function findUnitsByPattern(nom: string): Unite[] | null {
  const n = normalize(nom);
  for (const p of SORTED_PATTERNS) {
    const pref = normalize(p.prefix);
    if (!n.startsWith(pref)) continue;
    if (p.excludes && p.excludes.some((ex) => n.includes(normalize(ex)))) continue;
    return p.unites;
  }
  return null;
}

// Merge CIQUAL export + extras curated (legumes, fruits, cereals, etc.),
// dédupliqué par nom. Les entrées extras gagnent sur les doublons, et les
// unités pratiques (foods-units.json + patterns) viennent décorer les
// aliments éligibles.
function mergeFoods(): Food[] {
  const map = new Map<string, Food>();
  for (const f of foodsRaw as Food[]) {
    map.set(f.nom.toLowerCase(), { ...f });
  }
  for (const f of foodsExtras as Food[]) {
    map.set(f.nom.toLowerCase(), { ...f });
  }
  // Appliquer les unités : 1) exact match, 2) pattern fallback
  for (const f of map.values()) {
    if (f.unites) continue;
    const exact = UNITS[f.nom];
    if (exact) {
      f.unites = exact;
      continue;
    }
    const byPattern = findUnitsByPattern(f.nom);
    if (byPattern) f.unites = byPattern;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
  );
}

export const foods: Food[] = mergeFoods();

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
