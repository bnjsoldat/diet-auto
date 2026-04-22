import type { MealSlot } from './constants';

/**
 * Liste « aliments familiers » — ceux qu'un Français moyen consomme
 * régulièrement. Utilisée pour booster leur score dans les suggestions
 * de l'optimiseur. Sourcée de INCA 3 (ANSES 2017) sur les consommations
 * alimentaires courantes.
 *
 * Noms normalisés à la CIQUAL (apostrophe simple `'`). Le matching est
 * case-insensitive via `isCommonFood()`.
 *
 * But : éviter que l'optimiseur propose des trucs comme « Marsala » ou
 * « Galette multicéréales soufflée » alors qu'il existe « Œuf » ou
 * « Pain complet » qui comblent le même déficit.
 */
export const COMMON_FOODS: string[] = [
  // --- Céréales / féculents (très consommés) ---
  'Pain complet',
  'Pain de mie, grillé',
  'Pain, baguette',
  'Pâtes alimentaires, cuites, non salées',
  'Riz basmati, cuit, non salé',
  'Riz, blanc, cuit, non salé',
  'Flocon d\'avoine',
  'Pomme de terre, cuite',
  'Semoule, cuite',
  'Quinoa, cuit',
  'Boulgour, cuit',

  // --- Protéines animales ---
  'Poulet, filet, grillé',
  'Poulet, filet, sans peau, cru',
  'Dinde, escalope, cuite',
  'Bœuf, steak haché, 5% MG, cuit',
  'Bœuf, steak haché, 15% MG, cuit',
  'Saumon, atlantique, cuit',
  'Thon albacore ou thon jaune, au naturel, appertisé, égoutté',
  'Cabillaud, cuit',
  'Oeuf, cru',
  'Oeuf, cuit dur',
  'Jambon, cuit, dégraissé',
  'Jambon de dinde ou de poulet',

  // --- Laitiers ---
  'Yaourt nature',
  'Yaourt nature au lait entier',
  'Fromage blanc nature ou aux fruits (aliment moyen)',
  'Fromage blanc à 0% MG',
  'Emmental',
  'Comté',
  'Mozzarella',
  'Camembert',
  'Feta',
  'Lait demi-écrémé, UHT',
  'Skyr nature',

  // --- Fruits courants ---
  'Banane, pulpe, crue',
  'Pomme, crue, pulpe et peau',
  'Orange, pulpe, crue',
  'Poire, crue, pulpe et peau',
  'Fraise, crue',
  'Kiwi, pulpe, cru',
  'Mandarine, crue',
  'Abricot, cru',
  'Raisin, cru',
  'Myrtille, crue',

  // --- Légumes ---
  'Tomate, crue',
  'Carotte, crue',
  'Courgette, crue',
  'Brocoli, bouilli/cuit à l\'eau, croquant',
  'Épinard, bouilli/cuit à l\'eau',
  'Haricot vert, bouilli/cuit à l\'eau',
  'Salade verte, crue',
  'Concombre, cru',
  'Poivron, cru',
  'Champignon de Paris, cru',

  // --- Légumineuses ---
  'Lentille verte, bouillie/cuite à l\'eau',
  'Pois chiche, bouilli/cuit à l\'eau',
  'Haricot rouge, bouilli/cuit à l\'eau',

  // --- Fruits à coque / oléagineux ---
  'Amande, grillée',
  'Amande (avec peau)',
  'Noisette',
  'Noix',
  'Cacahuète, grillée, salée',
  'Avocat, pulpe, cru',

  // --- Matières grasses ---
  'Huile d\'olive vierge extra',
  'Huile de colza',
  'Beurre à 82% MG, doux',

  // --- Sucres / plaisir ---
  'Miel',
  'Confiture, fruits rouges (aliment moyen)',
  'Chocolat noir à 40% de cacao minimum, à pâtisser, tablette',
  'Chocolat au lait (aliment moyen)',
];

/**
 * Set lowercase pour lookup O(1). Normalise les apostrophes.
 */
const COMMON_SET = new Set(COMMON_FOODS.map((n) => n.toLowerCase().replace(/['\u2019\u02BC]/g, "'")));

/** True si l'aliment fait partie du top-50 des aliments familiers français. */
export function isCommonFood(nom: string): boolean {
  return COMMON_SET.has(nom.toLowerCase().replace(/['\u2019\u02BC]/g, "'"));
}

/**
 * Contexte de repas : quels types d'aliments sont pertinents selon l'heure.
 *
 * Utilisé pour filtrer les suggestions : si l'utilisateur a un déficit
 * protéique et le repas ciblé est un « petit-déj », on privilégie œufs,
 * yaourt, fromage blanc plutôt que poulet ou saumon.
 *
 * Chaque slot liste les MOTS-CLÉS qui identifient des aliments pertinents
 * à ce moment. Si un aliment ne match aucun mot-clé de son slot destination,
 * il reçoit un malus (pas un blocage — juste une dé-priorisation).
 */
export const MEAL_SLOT_CONTEXT: Record<MealSlot, { keywords: RegExp; label: string }> = {
  'petit-dej': {
    label: 'petit-déjeuner',
    // Petit-déj français type : œufs, pain, yaourt, fromage blanc, fruits,
    // flocons, miel, confiture, beurre, amandes, avocat, fromage.
    keywords: /\b(œuf|oeuf|pain|yaourt|fromage blanc|skyr|banane|pomme|orange|poire|kiwi|fraise|flocon|muesli|granola|miel|confiture|beurre|amande|noisette|noix|avocat|fromage|lait|jus de|granola|céréale)/i,
  },
  'collation-matin': {
    label: 'collation du matin',
    // Collation matin : fruit, amande, yaourt, fromage blanc, pain + miel,
    // barre de céréales maison, fruit sec (pas snack emballé).
    keywords: /\b(fruit|pomme|banane|poire|orange|fraise|kiwi|raisin|abricot|myrtille|mandarine|clémentine|amande|noisette|noix|cacahuète|yaourt|fromage blanc|skyr|pain|miel)/i,
  },
  'dejeuner': {
    label: 'déjeuner',
    // Plat principal : protéine + féculent + légumes + matière grasse.
    keywords: /\b(poulet|dinde|bœuf|veau|agneau|porc|jambon|saumon|thon|cabillaud|colin|truite|sole|crevette|œuf|oeuf|tofu|riz|pâte|pates|quinoa|boulgour|semoule|pomme de terre|lentille|pois chiche|haricot|brocoli|courgette|carotte|épinard|tomate|salade|concombre|poivron|champignon|huile|fromage)/i,
  },
  'collation-aprem': {
    label: 'collation après-midi',
    keywords: /\b(fruit|pomme|banane|poire|orange|fraise|kiwi|raisin|abricot|myrtille|mandarine|clémentine|amande|noisette|noix|cacahuète|yaourt|fromage blanc|skyr|pain|miel|chocolat)/i,
  },
  'diner': {
    label: 'dîner',
    // Similaire au déjeuner, peut être plus léger (poisson, légumes, soupe).
    keywords: /\b(poulet|dinde|bœuf|veau|jambon|saumon|thon|cabillaud|colin|truite|sole|crevette|œuf|oeuf|tofu|riz|pâte|pates|quinoa|boulgour|semoule|pomme de terre|lentille|pois chiche|haricot|brocoli|courgette|carotte|épinard|tomate|salade|concombre|poivron|champignon|huile|fromage|soupe)/i,
  },
  'collation-soir': {
    label: 'collation du soir',
    // Plus léger : laitier, fruit, amande. Éviter sucre rapide.
    keywords: /\b(yaourt|fromage blanc|skyr|amande|noix|noisette|fruit|pomme|banane|kiwi|tisane|chocolat noir)/i,
  },
};

/**
 * Vérifie si un aliment est cohérent avec le contexte d'un repas donné.
 * Retourne un score de 0 à 1 :
 *  - 1.0 : aliment très cohérent avec le repas (œuf au petit-déj)
 *  - 0.5 : aliment neutre (passable)
 *  - 0.0 : aliment hors contexte (poulet au petit-déj)
 */
export function mealContextScore(nom: string, slot: MealSlot): number {
  const ctx = MEAL_SLOT_CONTEXT[slot];
  return ctx.keywords.test(nom) ? 1.0 : 0.3;
}
