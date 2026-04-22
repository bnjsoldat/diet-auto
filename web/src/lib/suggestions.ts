import type { DayPlan, Food, MealFoodItem } from '@/types';
import { boundsForFood } from './optimizer';
import { categorieOfFood } from './categories';
import { isDiscreteUnit } from './units';
import { isCommonFood } from './commonFoods';

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

/**
 * Aliments à ne JAMAIS proposer en suggestion car :
 * - condiments (ail, échalote, oignon crus en portions absurdes),
 * - plantes sauvages / légumes très rares (crosne, bourrache, pissenlit),
 * - céréales/légumineuses "crues" ou "sèches" (se mangent cuites),
 * - produits techniques (amidon, gluten pur, plasma, gélatine, son brut),
 * - snacks / junk food (pop-corn, chips, bonbons) — pas de sens nutritionnel,
 * - alcools et liqueurs (vin, bière, « crème de cassis », etc.) — suggestion
 *   absurde dans un plan alimentaire.
 *
 * Élargi 2026-04-22 après feedback user : l'app suggérait « Crème de cassis »
 * (un alcool) et « Pop-corn au caramel » — catégorisation CIQUAL trompeuse
 * (« boissons » pour alcool, « céréales » pour pop-corn) qu'il faut bloquer.
 */
const SUGGEST_NEVER_PATTERN = new RegExp(
  // Condiments, plantes sauvages, produits techniques, ingrédients bruts
  '(?:^|[^a-zA-ZÀ-ÿ])' +
    '(?:ail|ails|échalote|échalotes|oignon|oignons|gingembre|raifort|' +
    'crosne|bourrache|pissenlit|ortie|pourpier|mauve|' +
    'amidon|gluten|plasma|gélatine|lécithine|présure|son de|germe de|' +
    'fructose|glucose|saccharose|maltodextrine|sirop de glucose|' +
    'levain|pain azyme|farine|semoule|fécule|tapioca|' +
    'gâteau de riz|galette de riz|galettes de riz|' +
    'vermicelle|perles du japon)' +
    '(?:$|[^a-zA-ZÀ-ÿ])' +
    // Céréales/légumineuses crues ou sèches (on mange cuit)
    '|\\b(?:cru|crue|crus|crues|sec|sèche|sèches|séché|séchée)\\b.*\\b(?:riz|pâtes|pates|quinoa|boulgour|lentille|pois|haricot|flocon|avoine|orge|millet|sarrasin|épeautre)\\b' +
    '|\\b(?:riz|pâtes|pates|quinoa|boulgour|lentille|pois chiche|haricot|flocon|avoine|orge|millet|sarrasin|épeautre)\\b.*\\b(?:cru|crue|sec|sèche|séchée)\\b' +
    // Fruits/légumes séchés atypiques
    '|\\babricot\\b.*\\bsec\\b|\\bbanane\\b.*\\bsèche\\b|\\btomate\\b.*\\bséchée\\b' +
    // Snacks / junk food : pop-corn, chips, bonbons, barres chocolatées de marque
    '|\\b(?:pop-?corn|ma[iï]s éclaté|chips|bretzel|crackers?|cacahuètes? salées?|biscuit apéritif|biscuit salé)\\b' +
    '|\\b(?:bonbon|sucette|chewing-?gum|pâte de fruit|guimauve|nougat|caramel|barre chocolatée|barre céréales?)\\b' +
    // Galettes soufflées / crackers light (peu rassasiants, profils
    // nutritionnels absurdes pour une suggestion).
    '|\\bgalette(?:s)? (?:multicéréales? )?soufflée?s?\\b' +
    '|\\bgalette(?:s)? de ma[iï]s\\b' +
    // Alcools et liqueurs (vin, bière, spiritueux, « crème de » liqueur)
    '|\\b(?:vin|bi[èe]re|cidre|champagne|crémant|cr[èe]me de (?:cassis|menthe|framboise|mûre|pêche|cacao|whisky))\\b' +
    '|\\b(?:whisky|vodka|rhum|gin|cognac|pastis|liqueur|kir|martini|apéritif|eau-de-vie|calvados|digestif)\\b' +
    // Vins fortifiés (même catégorie « boissons » que eau/thé dans CIQUAL
    // → pas détectés par le filtre vin générique). Marsala, Porto, etc.
    '|\\b(?:marsala|porto|madère|xérès|sherry|vermouth|muscat|banyuls|maury|rivesaltes|pineau|ratafia|sangria)\\b',
  'i'
);

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
    // Écarte condiments, plantes sauvages et céréales/légumineuses crues.
    if (SUGGEST_NEVER_PATTERN.test(food.nom)) continue;
    // Écarte les formes CRUES/SÈCHES des féculents et des fruits : on
    // consomme ces aliments cuits (riz cuit ≈ 120 kcal/100g vs cru ≈ 350).
    // On matche simplement sur la présence des mots "cru", "crue", "sec",
    // "sèche", "séché" dans le nom, pour les catégories concernées.
    if ((cat === 'cereales' || cat === 'legumineuses' || cat === 'fruits' || cat === 'plats')
        && /\b(cru|crue|crus|crues|sec|sèche|sèches|séché|séchée|moelleux)\b/i.test(food.nom)) continue;
    // Fruits/légumes atypiques ou exotiques souvent proposés à tort
    if (/\b(shi.?také|shiitaké|shii?take|lentin|pleurote|melonnette|courge\s+melo|manioc|topinambour|rutabaga)\b/i.test(food.nom)) continue;
    // Légumes ou fruits à l'état cru nécessitant cuisson (maïs, patate douce,
    // céleri-rave, panais, citrouille, potiron…)
    if (/\b(maïs|mais\b|patate douce|céleri-rave|panais|citrouille|potiron|courge)\b.*\bcru/i.test(food.nom)) continue;
    // Banane plantain n'est pas un fruit courant en France : on préfère
    // la banane "pulpe, crue" classique. Mais pour la suggestion on bloque
    // carrément "plantain" qui nécessite cuisson.
    if (/\bplantain\b/i.test(food.nom)) continue;

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
    // Note : JS \b ne fonctionne pas autour des lettres accentuées (é, è, à).
    // On utilise des lookarounds explicites (début/fin/séparateur non-lettre).
    const nonWord = '(?:^|[^a-zA-ZÀ-ÿ])';
    const endWord = '(?:$|[^a-zA-ZÀ-ÿ])';
    const blockWords = [
      'café', 'thé', 'tisane', 'infusion', 'poudre', 'cacao', 'levure',
      'bouillon', 'épice', 'épices', 'aromates', 'paprika', 'curry',
      'cumin', 'cannelle', 'muscade',
    ];
    const blockRe = new RegExp(
      nonWord + '(?:' + blockWords.join('|') + ')' + endWord + '|à reconstituer|herbes? sèches?',
      'i'
    );
    if (blockRe.test(food.nom)) continue;

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
    let q: number;
    const defUnit = food.unites?.[0];
    if (defUnit && isDiscreteUnit(defUnit, food) && defUnit.g > 0) {
      // Aliment discret (œuf, pomme, tranche…) : aligner sur un multiple
      // entier de l'unité par défaut.
      const count = Math.max(1, Math.round(qRaw / defUnit.g));
      q = Math.max(b.min, Math.min(suggestMax, count * defUnit.g));
    } else {
      q = Math.max(b.min, Math.min(suggestMax, Math.round(qRaw / 5) * 5));
    }

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

    // BIG BONUS pour les aliments « courants » (top-50 INCA 3 ANSES).
    // C'est le signal le plus fort : si un aliment familier (œuf, poulet,
    // pâtes…) comble le déficit, on le propose AVANT une obscurité CIQUAL
    // (« Marsala », « Galette multicéréales soufflée »). ×3 pour écraser
    // tous les autres bonus.
    if (isCommonFood(food.nom)) bonus *= 3;

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
