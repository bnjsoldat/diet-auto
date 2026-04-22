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

/**
 * Normalise une clé de lookup d'aliment. Gère les variantes d'apostrophes
 * (U+0027, U+2019, U+02BC, U+02B9) qui polluent souvent les sources
 * externes (templates avec `\u2019`, copier-coller depuis Word, etc.).
 *
 * Toutes les clés du Map `foodsByName` passent par cette fonction — donc
 * `foodsByName.get(nom.toLowerCase())` continue de marcher, et les
 * anciens callers n'ont pas besoin de modification.
 *
 * Exporté pour que le code externe (templates, favoris seedés) puisse
 * se normaliser explicitement si nécessaire.
 */
export function normalizeFoodKey(name: string): string {
  return name.toLowerCase().replace(/[\u2019\u02BC\u02B9\u02BB`´]/g, "'");
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
    // Frontière de mot : le préfixe doit être suivi d'une limite (espace,
    // virgule, début de ponctuation) pour éviter "sel" → "Selles-sur-Cher"
    // ou "noix" → "noixotte". Si le préfixe se termine déjà par un
    // séparateur (ex : "oeuf,") la vérif est contournée.
    const lastCharIsSep = /[^a-z0-9]/.test(pref.slice(-1));
    if (!lastCharIsSep && n.length > pref.length) {
      const nextChar = n[pref.length];
      if (/[a-z0-9]/.test(nextChar)) continue;
    }
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
    map.set(normalizeFoodKey(f.nom), { ...f });
  }
  for (const f of foodsExtras as Food[]) {
    map.set(normalizeFoodKey(f.nom), { ...f });
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

/** Base CIQUAL statique (figée au build). */
const CIQUAL: Food[] = mergeFoods();

/**
 * Tableau exporté de tous les aliments (CIQUAL + perso). Mutable : réassigné
 * via `registerCustomFoods` quand l'utilisateur scanne ou ajoute un aliment.
 * Les imports ES modules sont des liens live, donc les composants qui font
 * `import { foods } ...` voient automatiquement la nouvelle référence au
 * prochain render.
 */
export let foods: Food[] = CIQUAL;

/** Map nom → Food. Clés normalisées via `normalizeFoodKey` (gère apostrophes
 *  typographiques, accents, etc.). Mutée en place par `registerCustomFoods`. */
export const foodsByName: Map<string, Food> = new Map(
  foods.map((f) => [normalizeFoodKey(f.nom), f])
);

/** Index fuzzy pour la recherche rapide dans le combobox. Collection mise à jour en place. */
export const fuse = new Fuse(foods, {
  keys: ['nom', 'groupe'],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: false,
});

/** Groupes uniques triés pour filtrage éventuel. Réassigné par registerCustomFoods. */
export let groupes: string[] = Array.from(
  new Set(foods.map((f) => f.groupe).filter(Boolean))
).sort((a, b) => a.localeCompare(b, 'fr'));

export function searchFoods(query: string, limit = 25): Food[] {
  const q = query.trim();
  if (!q) return [];
  return fuse.search(q, { limit }).map((r) => r.item);
}

/**
 * Remplace la liste des aliments "perso" (scannés ou créés) et rebuild les
 * index (foods, foodsByName, fuse, groupes). À appeler quand le store
 * `useCustomFoods` change.
 */
type RebuildListener = () => void;
const rebuildListeners = new Set<RebuildListener>();

export function onFoodsRebuild(fn: RebuildListener): () => void {
  rebuildListeners.add(fn);
  return () => rebuildListeners.delete(fn);
}

export function registerCustomFoods(customs: Food[]) {
  // Vider d'abord les anciens customs (groupe 'perso') du Map
  for (const key of Array.from(foodsByName.keys())) {
    const f = foodsByName.get(key);
    if (f?.groupe === 'perso') foodsByName.delete(key);
  }
  // Ajouter les nouveaux customs
  for (const f of customs) {
    foodsByName.set(normalizeFoodKey(f.nom), { ...f, groupe: 'perso' });
  }
  // Reconstruire foods + groupes
  foods = [
    ...CIQUAL,
    ...customs.map((f) => ({ ...f, groupe: 'perso' })),
  ].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
  groupes = Array.from(new Set(foods.map((f) => f.groupe).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'fr')
  );
  fuse.setCollection(foods);
  rebuildListeners.forEach((fn) => fn());
}
