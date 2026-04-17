import type { Food, MealFoodItem, OptimizeResult, OptimizerMode } from '@/types';
import {
  OPTIMIZER_CONFIG,
  OPTIMIZER_MODES,
  PORTION_BOUNDS_BY_GROUPE,
  PORTION_BOUNDS_BY_NAME_PATTERN,
  QUANTITY_BOUNDS,
} from './constants';
import { isDiscreteUnit } from './units';

/**
 * Retourne les bornes réalistes (min, max en grammes) pour un aliment donné.
 * Priorité : pattern de nom > groupe CIQUAL > bornes par défaut.
 * Les overrides optionnels (UI, option globale) peuvent resserrer la borne max.
 */
export function boundsForFood(
  food: Food,
  overrides?: { min?: number; max?: number }
): { min: number; max: number } {
  let min = QUANTITY_BOUNDS.min;
  let max = QUANTITY_BOUNDS.max;

  const byGroupe = PORTION_BOUNDS_BY_GROUPE[food.groupe?.toLowerCase?.() ?? ''];
  if (byGroupe) {
    min = byGroupe.min;
    max = byGroupe.max;
  }

  for (const { pattern, bounds } of PORTION_BOUNDS_BY_NAME_PATTERN) {
    if (pattern.test(food.nom)) {
      min = bounds.min;
      max = bounds.max;
      break;
    }
  }

  if (overrides?.min != null) min = Math.max(min, overrides.min);
  if (overrides?.max != null) max = Math.min(max, overrides.max);

  // Toujours garder min < max et min >= 0
  if (min < 0) min = 0;
  if (max < min) max = min;
  return { min, max };
}

interface Line {
  item: MealFoodItem; // référence partagée, muter q écrira la quantité dans le plan
  food: Food;
  kcal100: number;
  prot100: number;
  gluc100: number;
  lip100: number;
  qmin: number;
  qmax: number;
}

interface Cibles {
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
}

function calcTotaux(lignes: Line[]) {
  let kcal = 0, prot = 0, gluc = 0, lip = 0;
  for (const l of lignes) {
    kcal += (l.item.quantite * l.kcal100) / 100;
    prot += (l.item.quantite * l.prot100) / 100;
    gluc += (l.item.quantite * l.gluc100) / 100;
    lip += (l.item.quantite * l.lip100) / 100;
  }
  return { kcal, prot, gluc, lip };
}

function erreurs(totaux: ReturnType<typeof calcTotaux>, cibles: Cibles) {
  return {
    eK: (totaux.kcal - cibles.kcal) / cibles.kcal,
    eP: (totaux.prot - cibles.prot) / cibles.prot,
    eG: (totaux.gluc - cibles.gluc) / cibles.gluc,
    eL: (totaux.lip - cibles.lip) / cibles.lip,
  };
}

function fonctionObjectif(
  lignes: Line[],
  cibles: Cibles,
  poids: { poidsKcal: number; poidsMacro: number }
): number {
  const e = erreurs(calcTotaux(lignes), cibles);
  const { poidsKcal, poidsMacro } = poids;
  return poidsKcal * e.eK * e.eK + poidsMacro * (e.eP * e.eP + e.eG * e.eG + e.eL * e.eL);
}

function gradient(
  lignes: Line[],
  cibles: Cibles,
  poids: { poidsKcal: number; poidsMacro: number }
): number[] {
  const e = erreurs(calcTotaux(lignes), cibles);
  const { poidsKcal, poidsMacro } = poids;
  const g = new Array<number>(lignes.length);
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.item.verrou) {
      g[i] = 0;
      continue;
    }
    g[i] = 2 * (
      (poidsKcal * e.eK) / cibles.kcal * (l.kcal100 / 100) +
      poidsMacro * (
        (e.eP / cibles.prot) * (l.prot100 / 100) +
        (e.eG / cibles.gluc) * (l.gluc100 / 100) +
        (e.eL / cibles.lip) * (l.lip100 / 100)
      )
    );
  }
  return g;
}

function norme(v: number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

function clampQuantities(lignes: Line[]) {
  for (const l of lignes) {
    if (l.item.verrou) continue;
    l.item.quantite = Math.max(l.qmin, Math.min(l.qmax, l.item.quantite));
  }
}

/**
 * Optimise les quantités des items pour que les totaux (kcal + macros)
 * s'approchent des cibles. Mutation en place des items.
 */
export function optimizeQuantities(
  items: MealFoodItem[],
  foodsByName: Map<string, Food>,
  cibles: Cibles,
  options?: { qmin?: number; qmax?: number; mode?: OptimizerMode }
): OptimizeResult {
  const modeConfig = OPTIMIZER_MODES[options?.mode ?? 'normal'];
  const poids = { poidsKcal: modeConfig.poidsKcal, poidsMacro: modeConfig.poidsMacro };

  // Construire les lignes à partir des items reconnus
  const lignes: Line[] = [];
  for (const item of items) {
    const food = foodsByName.get(item.nom.toLowerCase());
    if (!food) continue;
    const b = boundsForFood(food, { min: options?.qmin, max: options?.qmax });
    lignes.push({
      item,
      food,
      kcal100: food.kcal,
      prot100: food.prot,
      gluc100: food.gluc,
      lip100: food.lip,
      qmin: b.min,
      qmax: b.max,
    });
  }

  if (lignes.length === 0) {
    return {
      iterations: 0,
      converge: true,
      avant: { kcal: 0, prot: 0, gluc: 0, lip: 0 },
      apres: { kcal: 0, prot: 0, gluc: 0, lip: 0 },
      cibles,
    };
  }

  // Clamp initial
  clampQuantities(lignes);

  const avant = calcTotaux(lignes);
  let f = fonctionObjectif(lignes, cibles, poids);
  let iter = 0;
  let converge = false;

  const {
    maxIterations,
    toleranceGradient,
    pasInitial,
    pasMin,
    deplacementMaxParIter,
    lineSearchSteps,
    roundingGrams,
  } = OPTIMIZER_CONFIG;

  for (; iter < maxIterations; iter++) {
    const g = gradient(lignes, cibles, poids);
    const nG = norme(g);
    if (nG < toleranceGradient) {
      converge = true;
      break;
    }

    const qBack = lignes.map((l) => l.item.quantite);

    let alpha = pasInitial / Math.max(nG, 1e-9);
    if (alpha * nG > deplacementMaxParIter) {
      alpha = deplacementMaxParIter / nG;
    }

    let trouve = false;
    for (let ls = 0; ls < lineSearchSteps; ls++) {
      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        if (l.item.verrou) continue;
        const nv = qBack[i] - alpha * g[i];
        l.item.quantite = Math.max(l.qmin, Math.min(l.qmax, nv));
      }
      const fNew = fonctionObjectif(lignes, cibles, poids);
      if (fNew < f - 1e-12) {
        f = fNew;
        trouve = true;
        break;
      }
      alpha *= 0.5;
      if (alpha < pasMin) break;
    }

    if (!trouve) {
      for (let i = 0; i < lignes.length; i++) lignes[i].item.quantite = qBack[i];
      converge = true;
      break;
    }
  }

  // Arrondi final (sauf verrouillés). Pour les aliments dont l'unité par
  // défaut est discrète (œuf, pomme, tranche…), on aligne sur un multiple
  // entier de cette unité — sinon sur roundingGrams (5 g).
  for (const l of lignes) {
    if (l.item.verrou) continue;
    const defUnit = l.food.unites?.[0];
    if (defUnit && isDiscreteUnit(defUnit) && defUnit.g > 0) {
      const count = Math.max(1, Math.round(l.item.quantite / defUnit.g));
      l.item.quantite = count * defUnit.g;
    } else if (roundingGrams > 0) {
      l.item.quantite = Math.round(l.item.quantite / roundingGrams) * roundingGrams;
    }
    l.item.quantite = Math.max(l.qmin, Math.min(l.qmax, l.item.quantite));
  }

  const apres = calcTotaux(lignes);

  return {
    iterations: iter + 1,
    converge,
    avant,
    apres,
    cibles,
  };
}

/** Totaux (kcal + macros) pour une liste d'items. Utilisé par les vues. */
export function totalsForItems(items: MealFoodItem[], foodsByName: Map<string, Food>) {
  let kcal = 0, prot = 0, gluc = 0, lip = 0;
  for (const item of items) {
    const food = foodsByName.get(item.nom.toLowerCase());
    if (!food) continue;
    kcal += (item.quantite * food.kcal) / 100;
    prot += (item.quantite * food.prot) / 100;
    gluc += (item.quantite * food.gluc) / 100;
    lip += (item.quantite * food.lip) / 100;
  }
  return { kcal, prot, gluc, lip };
}
