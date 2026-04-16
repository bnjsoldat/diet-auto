import type { Food } from '@/types';
import { foods, onFoodsRebuild } from './foods';

/** Catégorie d'affichage (libellé court + emoji) avec la liste de "groupes" CIQUAL qui y correspondent. */
export interface Categorie {
  id: string;
  label: string;
  emoji: string;
  groupes: string[];
}

/**
 * Ordre d'affichage des catégories dans les pickers.
 * Les groupes CIQUAL originaux (italique dans la base) sont mappés vers des
 * labels plus lisibles. L'ordre est optimisé pour la recherche typique :
 * protéines en haut (plat principal), puis accompagnements, puis extras.
 */
export const CATEGORIES: Categorie[] = [
  {
    id: 'proteines',
    label: 'Protéines',
    emoji: '🍗',
    groupes: ['viandes, œufs, poissons et assimilés'],
  },
  {
    id: 'laitiers',
    label: 'Produits laitiers',
    emoji: '🥛',
    groupes: ['produits laitiers', 'fromages'],
  },
  {
    id: 'cereales',
    label: 'Céréales & féculents',
    emoji: '🌾',
    groupes: ['céréales et produits à base de céréales', 'féculents'],
  },
  {
    id: 'plats',
    label: 'Plats composés',
    emoji: '🍱',
    groupes: ['plats composés'],
  },
  {
    id: 'legumes',
    label: 'Légumes',
    emoji: '🥦',
    groupes: ['légumes'],
  },
  {
    id: 'fruits',
    label: 'Fruits',
    emoji: '🍎',
    groupes: ['fruits'],
  },
  {
    id: 'legumineuses',
    label: 'Légumineuses',
    emoji: '🫘',
    groupes: ['légumineuses'],
  },
  {
    id: 'fruits-coque',
    label: 'Fruits à coque',
    emoji: '🥜',
    groupes: ['fruits à coque'],
  },
  {
    id: 'matieres-grasses',
    label: 'Matières grasses',
    emoji: '🧈',
    groupes: ['matières grasses'],
  },
  {
    id: 'sucres',
    label: 'Sucres',
    emoji: '🍯',
    groupes: ['sucres et produits sucrés'],
  },
  {
    id: 'boissons',
    label: 'Boissons',
    emoji: '🥤',
    groupes: ['boissons'],
  },
  {
    id: 'sauces',
    label: 'Sauces & condiments',
    emoji: '🫙',
    groupes: ['sauces et condiments'],
  },
  {
    id: 'complements',
    label: 'Compléments',
    emoji: '💊',
    groupes: ['compléments'],
  },
  {
    id: 'perso',
    label: 'Mes aliments',
    emoji: '📦',
    groupes: ['perso'],
  },
];

/** Map groupe CIQUAL → id de catégorie. */
const GROUPE_TO_CAT = new Map<string, string>();
for (const c of CATEGORIES) {
  for (const g of c.groupes) GROUPE_TO_CAT.set(g.toLowerCase(), c.id);
}

/** Retourne l'id de catégorie d'un aliment, ou null. */
export function categorieOfFood(food: Food): string | null {
  if (!food.groupe) return null;
  return GROUPE_TO_CAT.get(food.groupe.toLowerCase()) ?? null;
}

/** Aliments groupés par catégorie. Muté en place quand les customs changent. */
export const foodsByCategorie: Record<string, Food[]> = (() => {
  const acc: Record<string, Food[]> = {};
  for (const c of CATEGORIES) acc[c.id] = [];
  for (const f of foods) {
    const cat = categorieOfFood(f);
    if (cat) acc[cat].push(f);
  }
  return acc;
})();

function rebuildFoodsByCategorie() {
  for (const c of CATEGORIES) foodsByCategorie[c.id] = [];
  for (const f of foods) {
    const cat = categorieOfFood(f);
    if (cat) foodsByCategorie[cat].push(f);
  }
}

// Re-trier les catégories dès que la base est modifiée (scan, ajout, suppr).
onFoodsRebuild(rebuildFoodsByCategorie);
