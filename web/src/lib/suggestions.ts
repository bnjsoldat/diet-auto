import type { DayPlan, Food, MealFoodItem } from '@/types';
import { boundsForFood } from './optimizer';
import { categorieOfFood } from './categories';

export interface Totals {
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
}

export interface Cibles {
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
}

export interface Suggestion {
  food: Food;
  /** Quantité suggérée en grammes (arrondie au multiple de 5). */
  quantite: number;
  /** Macro principale que cet aliment comble : 'kcal' | 'prot' | 'gluc' | 'lip'. */
  comble: 'kcal' | 'prot' | 'gluc' | 'lip';
  /** Score de pertinence (plus élevé = meilleur). */
  score: number;
}

/**
 * Écart relatif par macro entre les totaux actuels et les cibles.
 * Positif = déficit (il faut ajouter), négatif = excès.
 */
export function gapRatios(totals: Totals, cibles: Cibles) {
  return {
    kcal: (cibles.kcal - totals.kcal) / cibles.kcal,
    prot: (cibles.prot - totals.prot) / cibles.prot,
    gluc: (cibles.gluc - totals.gluc) / cibles.gluc,
    lip: (cibles.lip - totals.lip) / cibles.lip,
  };
}

/**
 * Catégories considérées "risquées" si le repas n'en contient pas déjà :
 * proposer du miel dans un repas de poulet-légumes n'aurait pas de sens.
 * On les filtre sauf si une catégorie similaire est déjà présente.
 */
const RISKY_STANDALONE = new Set([
  'sucres',
  'fruits-coque',
  'matieres-grasses',
  'sauces',
  'complements',
]);

/**
 * Plafond de portion suggérée par catégorie (en g), plus serré que les bornes
 * globales de l'optimiseur : une suggestion doit représenter une portion
 * réaliste, pas un plafond théorique.
 */
const SUGGEST_SERVING_CAP: Record<string, number> = {
  proteines: 150,
  laitiers: 200,
  fromages: 40,
  cereales: 80,
  plats: 300,
  legumes: 200,
  fruits: 150,
  legumineuses: 100,
  'fruits-coque': 30,
  'matieres-grasses': 15,
  sucres: 20,
  boissons: 300,
  sauces: 20,
  complements: 10,
  perso: 150,
};

/**
 * Certaines entrées CIQUAL sont des prélèvements régionaux / variétés exotiques
 * peu pertinentes comme suggestion générique. On les écarte du pool de
 * suggestions sans les retirer de la base.
 */
const SUGGEST_BLOCKLIST_PATTERN =
  /\b(prélevé|martinique|guadeloupe|réunion|guyane|mayotte|pays\b|reconstitué|reconstitution|fortifié|enrichi|échantillon|aromatisé à|déshydraté)/i;

/** Catégories qui évoquent clairement un plat salé/cuisiné. */
const SAVORY_CATS = new Set(['proteines', 'legumes', 'cereales', 'legumineuses']);

/** Catégories qui évoquent un contexte sucré/petit-déj. */
const SWEET_CATS = new Set(['fruits', 'sucres', 'laitiers']);

function isSavoryContext(presentCats: Set<string>): boolean {
  return Array.from(presentCats).some((c) => SAVORY_CATS.has(c));
}
function isSweetContext(presentCats: Set<string>): boolean {
  // On considère sucré seulement si PAS de salé dominant
  return Array.from(presentCats).some((c) => SWEET_CATS.has(c));
}

/**
 * Calcule la réduction de l'erreur quadratique si on ajoutait cet aliment
 * à la quantité donnée. Plus le score est élevé, meilleure est la suggestion.
 */
function scoreFood(
  food: Food,
  q: number,
  totals: Totals,
  cibles: Cibles,
  poids: { kcal: number; macro: number }
): number {
  const contrib = {
    kcal: (q * food.kcal) / 100,
    prot: (q * food.prot) / 100,
    gluc: (q * food.gluc) / 100,
    lip: (q * food.lip) / 100,
  };
  const errBefore =
    poids.kcal * ((cibles.kcal - totals.kcal) / cibles.kcal) ** 2 +
    poids.macro * (
      ((cibles.prot - totals.prot) / cibles.prot) ** 2 +
      ((cibles.gluc - totals.gluc) / cibles.gluc) ** 2 +
      ((cibles.lip - totals.lip) / cibles.lip) ** 2
    );
  const errAfter =
    poids.kcal * ((cibles.kcal - totals.kcal - contrib.kcal) / cibles.kcal) ** 2 +
    poids.macro * (
      ((cibles.prot - totals.prot - contrib.prot) / cibles.prot) ** 2 +
      ((cibles.gluc - totals.gluc - contrib.gluc) / cibles.gluc) ** 2 +
      ((cibles.lip - totals.lip - contrib.lip) / cibles.lip) ** 2
    );
  return errBefore - errAfter;
}

/**
 * Renvoie les aliments qui comblent le mieux les déficits du plan,
 * en restant cohérents avec les catégories déjà choisies par l'utilisateur.
 */
export function suggestComplements(opts: {
  plan: DayPlan;
  totals: Totals;
  cibles: Cibles;
  foods: Food[];
  poids?: { kcal: number; macro: number };
  /** Écart toléré : en-dessous de ce % absolu, pas besoin de suggestion. */
  tolerance?: { kcal: number; macro: number };
  max?: number;
}): Suggestion[] {
  const poids = opts.poids ?? { kcal: 2, macro: 1 };
  const tol = opts.tolerance ?? { kcal: 0.05, macro: 0.1 };
  const max = opts.max ?? 3;

  const gaps = gapRatios(opts.totals, opts.cibles);

  // Si tous les écarts sont dans la tolérance, aucune suggestion nécessaire.
  if (
    Math.abs(gaps.kcal) < tol.kcal &&
    Math.abs(gaps.prot) < tol.macro &&
    Math.abs(gaps.gluc) < tol.macro &&
    Math.abs(gaps.lip) < tol.macro
  ) {
    return [];
  }

  // On ne suggère que si le manque est un déficit (gap > 0). Les excès se
  // règlent en retirant des aliments, pas en en ajoutant.
  const needKcal = gaps.kcal > tol.kcal;
  const needProt = gaps.prot > tol.macro;
  const needGluc = gaps.gluc > tol.macro;
  const needLip = gaps.lip > tol.macro;
  if (!needKcal && !needProt && !needGluc && !needLip) return [];

  // Catégories présentes dans le plan (pour la cohérence de contexte)
  const existingNames = new Set<string>();
  const existingCats = new Set<string>();
  for (const meal of opts.plan.meals) {
    for (const item of meal.items) {
      existingNames.add(item.nom.toLowerCase());
      const f = opts.foods.find((x) => x.nom.toLowerCase() === item.nom.toLowerCase());
      if (f) {
        const c = categorieOfFood(f);
        if (c) existingCats.add(c);
      }
    }
  }
  const savory = isSavoryContext(existingCats);
  const sweet = isSweetContext(existingCats);

  // Dominant déficit (macro le plus en retard)
  const dominantGap = Math.max(
    needProt ? gaps.prot : 0,
    needGluc ? gaps.gluc : 0,
    needLip ? gaps.lip : 0,
    needKcal ? gaps.kcal : 0
  );
  const dominantMacro: 'prot' | 'gluc' | 'lip' | 'kcal' =
    dominantGap === gaps.prot && needProt ? 'prot'
      : dominantGap === gaps.gluc && needGluc ? 'gluc'
      : dominantGap === gaps.lip && needLip ? 'lip'
      : 'kcal';

  // Évalue chaque aliment à une quantité raisonnable (milieu de la fourchette).
  const candidates: Suggestion[] = [];
  for (const food of opts.foods) {
    const nameLc = food.nom.toLowerCase();
    if (existingNames.has(nameLc)) continue;

    const cat = categorieOfFood(food);
    if (!cat) continue;

    // Écarte les variétés régionales / libellés marginaux pour rester sur
    // des aliments courants et reconnus.
    if (SUGGEST_BLOCKLIST_PATTERN.test(food.nom)) continue;

    // Filtrage cohérence : si c'est une catégorie "à risque" et qu'aucune
    // catégorie de ce type n'est déjà présente, on l'exclut.
    if (RISKY_STANDALONE.has(cat) && !existingCats.has(cat)) continue;

    // Filtrage contexte sucré/salé : éviter les fruits dans un repas très salé
    // (viande + légumes) et éviter la viande dans un contexte petit-déj sucré.
    if (savory && !sweet && cat === 'fruits') continue;
    if (sweet && !savory && cat === 'proteines') continue;

    // Filtre de pertinence : l'aliment doit réellement apporter la macro
    // manquante en quantité significative (au moins 5 g / 100 g pour P/G,
    // 3 g / 100 g pour L). Évite de proposer du café pour combler des lipides.
    if (dominantMacro === 'prot' && food.prot < 5) continue;
    if (dominantMacro === 'gluc' && food.gluc < 5) continue;
    if (dominantMacro === 'lip' && food.lip < 3) continue;
    if (dominantMacro === 'kcal' && food.kcal < 50) continue;

    // Les produits "secs" à reconstituer (café moulu/soluble, thé, cacao
    // en poudre, lait en poudre, levures, épices, bouillons) ne se
    // consomment jamais tels quels en quantité suggérée. On les écarte.
    if (/café|thé\b|tisane|infusion|poudre|cacao|levure|bouillon|épices?\b|herbes? sèches?|aromates|paprika|curry|cumin|cannelle|muscade|à reconstituer/i.test(food.nom)) continue;

    const b = boundsForFood(food);
    // Plafond "portion suggérée" spécifique aux suggestions : plus serré que
    // les bornes optimiseur pour éviter de proposer 250 g d'un aliment dense.
    const servingCap = SUGGEST_SERVING_CAP[cat] ?? 150;
    const suggestMax = Math.min(b.max, servingCap);

    // Quantité calibrée sur le déficit : on vise à combler ~60 % du déficit
    // dominant avec cet aliment (on ne veut pas qu'une seule suggestion
    // sature la cible — l'utilisateur en accepte plusieurs).
    let qRaw: number;
    const gapKcal = opts.cibles.kcal - opts.totals.kcal;
    const gapProt = opts.cibles.prot - opts.totals.prot;
    const gapGluc = opts.cibles.gluc - opts.totals.gluc;
    const gapLip = opts.cibles.lip - opts.totals.lip;
    const safeDensity = (v: number) => (v > 0.1 ? v : 0.1);
    if (dominantMacro === 'prot') {
      qRaw = (gapProt * 0.6 * 100) / safeDensity(food.prot);
    } else if (dominantMacro === 'gluc') {
      qRaw = (gapGluc * 0.6 * 100) / safeDensity(food.gluc);
    } else if (dominantMacro === 'lip') {
      qRaw = (gapLip * 0.6 * 100) / safeDensity(food.lip);
    } else {
      qRaw = (gapKcal * 0.6 * 100) / safeDensity(food.kcal);
    }
    // Filet de sécurité : pas plus qu'une portion réaliste, jamais sous le min.
    qRaw = Math.max(b.min, Math.min(suggestMax, qRaw));
    const q = Math.max(b.min, Math.min(suggestMax, Math.round(qRaw / 5) * 5));

    const s = scoreFood(food, q, opts.totals, opts.cibles, poids);
    if (s <= 0) continue;

    // Bonus si la catégorie de l'aliment est déjà présente dans le plan
    // (cohérence avec ce que mange déjà l'utilisateur).
    let bonus = 1;
    if (existingCats.has(cat)) bonus *= 1.3;

    // Bonus si l'aliment est "dense" dans la macro manquante
    const kcal100 = food.kcal || 1;
    if (dominantMacro === 'prot' && food.prot / kcal100 > 0.05) bonus *= 1.4;
    if (dominantMacro === 'gluc' && food.gluc / kcal100 > 0.05) bonus *= 1.2;
    if (dominantMacro === 'lip' && food.lip / kcal100 > 0.04) bonus *= 1.2;

    candidates.push({ food, quantite: q, comble: dominantMacro, score: s * bonus });
  }

  candidates.sort((a, b) => b.score - a.score);

  // Dédup par catégorie : au lieu de 3 viandes différentes, on montre des types variés.
  const seenCat = new Set<string>();
  const out: Suggestion[] = [];
  for (const c of candidates) {
    const cat = categorieOfFood(c.food) ?? 'autre';
    if (seenCat.has(cat)) continue;
    seenCat.add(cat);
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Helper pour recomposer la liste des items d'un plan à partir de ses repas
 * (utile pour le calcul de totaux avant un appel à suggestComplements).
 */
export function flatItems(plan: DayPlan): MealFoodItem[] {
  return plan.meals.flatMap((m) => m.items);
}
