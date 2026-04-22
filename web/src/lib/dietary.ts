import type { DietaryPref, Food } from '@/types';

/**
 * Filtre des aliments selon les préférences alimentaires de l'utilisateur.
 *
 * Approche : pattern matching sur le nom + groupe CIQUAL.
 * MVP simple qui couvre 95 % des cas sans nécessiter de tagger les 3010
 * aliments un par un. Faux négatifs possibles sur des cas rares
 * (ex : "pain sans gluten" sera filtré par sans-gluten à cause du pattern
 * "pain" — acceptable, l'utilisateur peut toujours l'ajouter manuellement
 * en tapant son nom directement).
 */

export interface DietaryPrefMeta {
  id: DietaryPref;
  label: string;
  emoji: string;
  description: string;
}

export const DIETARY_PREFS: DietaryPrefMeta[] = [
  {
    id: 'vegetarien',
    label: 'Végétarien',
    emoji: '🥗',
    description: 'Pas de viande ni poisson (garde œufs + laitiers)',
  },
  {
    id: 'vegan',
    label: 'Végan',
    emoji: '🌱',
    description: 'Aucun produit animal (ni miel)',
  },
  {
    id: 'sans-gluten',
    label: 'Sans gluten',
    emoji: '🌾',
    description: 'Pas de blé, seigle, orge et dérivés',
  },
  {
    id: 'sans-lactose',
    label: 'Sans lactose',
    emoji: '🥛',
    description: 'Pas de lait, yaourt, fromage',
  },
  {
    id: 'halal',
    label: 'Halal',
    emoji: '☪️',
    description: 'Pas de porc ni alcool',
  },
];

// ==========================================================================
// Patterns pour détecter les catégories d'aliments
// ==========================================================================

/** Viandes (hors œufs et poissons qui sont dans le même groupe CIQUAL). */
const VIANDE_PATTERNS = [
  /\b(poulet|dinde|poule|oie|canard|pintade)\b/i,
  /\b(bœuf|boeuf|veau|génisse|agneau|mouton|porc|cochon|lapin|cheval|lard|foie)\b/i,
  /\b(steak|escalope|côte|côtelette|rôti|gigot|entrecôte|filet mignon)\b/i,
  /\b(jambon|bacon|saucisse|saucisson|chorizo|merguez|pâté|rillette|andouille|boudin|lardon|charcuterie)\b/i,
  /\b(cuisse|aile|blanc de|carcasse|émincé|haché|abats)\b/i,
];

/** Poissons et fruits de mer. */
const POISSON_PATTERNS = [
  /\b(saumon|thon|cabillaud|colin|lieu|morue|haddock|merlu|merlan|lotte|sole|bar|dorade|daurade)\b/i,
  /\b(maquereau|sardine|anchois|hareng|rouget|truite|carpe|perche|brochet|gardon|congre|raie|espadon)\b/i,
  /\b(crevette|langoustine|gambas|homard|crabe|tourteau|moule|huître|coquille|bigorneau|bulot|ormeau)\b/i,
  /\b(calmar|poulpe|seiche|poisson|caviar|œufs de poisson|surimi|tarama)\b/i,
];

/** Produits porcins (pour halal). */
const PORC_PATTERNS = [
  /\b(porc|cochon|jambon|bacon|lardon|saucisson|chorizo|andouille|boudin|rillette|gelatine de porc|saindoux)\b/i,
];

/** Alcool. */
const ALCOOL_PATTERNS = [
  /\b(vin|bière|bière|alcool|whisky|vodka|rhum|gin|cognac|pastis|liqueur|kir|martini|apéritif|champagne|crémant|cidre|calvados|eau-de-vie)\b/i,
];

/** Céréales contenant du gluten. */
const GLUTEN_PATTERNS = [
  /\b(blé|froment|seigle|orge|épeautre|kamut|boulgour|couscous|semoule|bulgur|malt)\b/i,
  /\b(pâtes|pain|biscotte|biscuit|gâteau|brioche|croissant|crêpe|galette|pizza|tarte|quiche|cake|muesli)\b/i,
  /\b(farine de blé|farine de seigle|farine d'orge|farine d'épeautre|chapelure|gnocchi|raviolis)\b/i,
];

/** Produits laitiers (contiennent du lactose). */
const LAITIER_GROUPES = ['produits laitiers', 'fromages'];
const LAITIER_PATTERNS = [
  /\b(lait|yaourt|fromage|crème|beurre|ricotta|mozzarella|emmental|camembert|parmesan|gorgonzola|roquefort|cheddar|gouda|feta|mascarpone)\b/i,
  /\b(fromage blanc|petit suisse|lactose|glace|sorbet au lait|béchamel)\b/i,
];

/** Miel. */
const MIEL_PATTERNS = [/\bmiel\b/i];

/** Groupe des œufs (à protéger dans vegetarien mais exclure dans vegan). */
function isEgg(food: Food): boolean {
  return /\bœuf|oeuf\b/i.test(food.nom);
}

/** Appartient au groupe "viandes, œufs, poissons et assimilés" CIQUAL. */
function isAnimalProteinGroup(food: Food): boolean {
  return food.groupe.toLowerCase().includes('viandes') || food.groupe.toLowerCase().includes('poissons');
}

// ==========================================================================
// Fonction principale
// ==========================================================================

/**
 * Retourne true si l'aliment est compatible avec les préférences de
 * l'utilisateur. Si aucune pref, tout passe.
 */
export function isFoodAllowed(food: Food, prefs: DietaryPref[] | undefined): boolean {
  if (!prefs || prefs.length === 0) return true;

  const name = food.nom;

  for (const pref of prefs) {
    if (pref === 'vegetarien') {
      // Exclut viande + poisson. Garde œufs et laitiers.
      if (VIANDE_PATTERNS.some((p) => p.test(name))) return false;
      if (POISSON_PATTERNS.some((p) => p.test(name))) return false;
    }
    if (pref === 'vegan') {
      if (VIANDE_PATTERNS.some((p) => p.test(name))) return false;
      if (POISSON_PATTERNS.some((p) => p.test(name))) return false;
      if (isEgg(food)) return false;
      // Laitiers via groupe ET patterns (pour les "produits laitiers végétaux"
      // qui pourraient matcher certains patterns — on est strict côté groupe).
      if (LAITIER_GROUPES.some((g) => food.groupe.toLowerCase().includes(g))) return false;
      if (LAITIER_PATTERNS.some((p) => p.test(name))) return false;
      if (MIEL_PATTERNS.some((p) => p.test(name))) return false;
      // Animal protein group (sauf végétal comme tofu, tempeh qui ne sont pas là)
      if (isAnimalProteinGroup(food) && !isEgg(food)) return false;
    }
    if (pref === 'sans-gluten') {
      if (GLUTEN_PATTERNS.some((p) => p.test(name))) return false;
    }
    if (pref === 'sans-lactose') {
      if (LAITIER_GROUPES.some((g) => food.groupe.toLowerCase().includes(g))) return false;
      if (LAITIER_PATTERNS.some((p) => p.test(name))) return false;
    }
    if (pref === 'halal') {
      if (PORC_PATTERNS.some((p) => p.test(name))) return false;
      if (ALCOOL_PATTERNS.some((p) => p.test(name))) return false;
    }
  }

  return true;
}

/**
 * Filtre une liste d'aliments selon les préférences. Convenience wrapper.
 */
export function filterFoodsByPrefs(
  foods: Food[],
  prefs: DietaryPref[] | undefined
): Food[] {
  if (!prefs || prefs.length === 0) return foods;
  return foods.filter((f) => isFoodAllowed(f, prefs));
}

/**
 * Compte le nombre d'aliments d'une liste qui ne passent PAS les prefs.
 * Utile pour avertir l'utilisateur qu'un template contient des aliments
 * hors de ses préférences.
 */
export function countIncompatibleFoods(
  foodNames: string[],
  foodsByName: Map<string, Food>,
  prefs: DietaryPref[] | undefined
): number {
  if (!prefs || prefs.length === 0) return 0;
  let n = 0;
  for (const name of foodNames) {
    const f = foodsByName.get(name.toLowerCase());
    if (f && !isFoodAllowed(f, prefs)) n++;
  }
  return n;
}
