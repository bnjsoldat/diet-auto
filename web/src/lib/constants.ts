import type { Activite, Objectif } from '@/types';

/** Multiplicateur du métabolisme basal selon le niveau d'activité */
export const ACTIVITY_COEFS: Record<Activite, number> = {
  'Sédentaire': 1.2,
  'Légèrement actif': 1.375,
  'Actif': 1.55,
  'Très actif': 1.725,
  'Extrêmement actif': 1.9,
};

/** Delta calorique appliqué à la maintenance selon l'objectif (kcal/jour) */
export const OBJECTIVE_DELTA_KCAL: Record<Objectif, number> = {
  'Perte de poids rapide': -750,
  'Perte de poids': -400,
  'Maintien': 0,
  'Prise de masse': +400,
  'Prise de masse rapide': +750,
};

/** Description textuelle des niveaux d'activité */
export const ACTIVITY_DESCRIPTIONS: Record<Activite, string> = {
  'Sédentaire': 'Presque aucun exercice (travail de bureau)',
  'Légèrement actif': 'Exercice léger 1 à 3 jours/semaine',
  'Actif': 'Exercice modéré 3 à 5 jours/semaine',
  'Très actif': 'Exercice soutenu 6 à 7 jours/semaine',
  'Extrêmement actif': 'Athlète / travail physique + sport quotidien',
};

/** Répartition macros : % protéines / glucides / lipides (total = 100) */
export const MACRO_SPLIT = {
  protPct: 0.25,
  glucPct: 0.50,
  lipPct: 0.25,
};

/** Calories par gramme (Atwater) */
export const KCAL_PER_GRAM = {
  prot: 4,
  gluc: 4,
  lip: 9,
};

/** Bornes de quantité par défaut (g) */
export const QUANTITY_BOUNDS = {
  min: 10,
  max: 400,
};

/** Paramètres de l'optimiseur */
export const OPTIMIZER_CONFIG = {
  maxIterations: 500,
  toleranceGradient: 1e-6,
  pasInitial: 20,
  pasMin: 1e-4,
  deplacementMaxParIter: 50,
  lineSearchSteps: 25,
  roundingGrams: 5,
  poidsKcal: 2.0,
  poidsMacro: 1.0,
};

/** Repas par défaut (nouveau plan) */
export const DEFAULT_MEALS = [
  'Repas 1 (matin)',
  'Collation 1',
  'Repas 2 (midi)',
  'Collation 2',
  'Repas 3 (soir)',
];
