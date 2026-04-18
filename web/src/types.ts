export type Genre = 'Homme' | 'Femme';

export type Activite =
  | 'Sédentaire'
  | 'Légèrement actif'
  | 'Actif'
  | 'Très actif'
  | 'Extrêmement actif';

export type Objectif =
  | 'Perte de poids rapide'
  | 'Perte de poids'
  | 'Maintien'
  | 'Prise de masse'
  | 'Prise de masse rapide';

export interface Profile {
  id: string;
  nom: string;
  poids: number; // kg
  taille: number; // m
  /** Âge numérique (dérivé de birthDate si présent, sinon valeur libre). */
  age: number;
  /** Date de naissance au format ISO 'YYYY-MM-DD'. Si présent, l'âge
   *  est recalculé automatiquement au fil du temps (anniversaire). */
  birthDate?: string;
  genre: Genre;
  activite: Activite;
  objectif: Objectif;
  createdAt: number;
  updatedAt: number;
}

export interface Unite {
  /** Étiquette affichée (ex: "œuf", "c. à soupe", "pomme moyenne") */
  label: string;
  /** Poids en grammes pour 1 unité (ex: 60 pour un œuf moyen) */
  g: number;
}

export interface Food {
  nom: string;
  groupe: string;
  kcal: number; // per 100 g
  prot: number;
  gluc: number;
  lip: number;
  /**
   * Unités pratiques en plus des grammes (œuf, cuillère, pomme, tranche…).
   * La première unité est l'unité par défaut à l'ajout.
   */
  unites?: Unite[];
}

export interface MealFoodItem {
  id: string; // local uuid
  nom: string; // canonical name (matches foods.json)
  quantite: number; // g
  verrou: boolean;
}

export interface Meal {
  id: string;
  nom: string; // "Petit-déj", "Repas 2", etc.
  items: MealFoodItem[];
}

export interface Targets {
  kcalMaintenance: number;
  kcalCible: number; // maintenance + delta objectif
  deltaKcal: number; // - pour perte, + pour prise
  mb: number; // métabolisme basal
  imc: number;
  prot: number; // g
  gluc: number; // g
  lip: number; // g
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  profileId: string;
  meals: Meal[];
  updatedAt: number;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  kg: number;
  note?: string;
}

export interface Reminder {
  id: string;
  label: string; // "Petit-déj", "Déjeuner"…
  time: string; // "HH:MM" (24h)
  enabled: boolean;
  message?: string; // message perso affiché dans la notification
}

export interface RecipeIngredient {
  nom: string; // nom d'aliment (CIQUAL ou custom)
  quantite: number; // g
}

/**
 * Recette composée : liste d'ingrédients + portion par défaut + étapes
 * de préparation optionnelles. Quand on l'ajoute à un repas, elle est
 * "explosée" en items individuels proportionnels à la portion demandée.
 */
export interface Recipe {
  id: string;
  nom: string;
  ingredients: RecipeIngredient[];
  /** Étapes numérotées de préparation (optionnel). */
  etapes?: string[];
  /** Portion standard totale en grammes (somme des quantités par défaut). Calculé à partir des ingrédients. */
  portionG: number;
  createdAt: number;
  updatedAt: number;
}

export interface OptimizeResult {
  iterations: number;
  converge: boolean;
  avant: { kcal: number; prot: number; gluc: number; lip: number };
  apres: { kcal: number; prot: number; gluc: number; lip: number };
  cibles: { kcal: number; prot: number; gluc: number; lip: number };
}

export type Theme = 'light' | 'dark' | 'pastel' | 'system';

/**
 * Mode d'optimisation : resserre ou relâche la tolérance d'écart à la cible.
 * - strict : pour un suivi précis (athlète, sèche). Plafond d'écart acceptable ±3 % kcal.
 * - normal : par défaut, ±5 % kcal.
 * - souple : objectif bien-être, ±10 % kcal.
 */
export type OptimizerMode = 'strict' | 'normal' | 'souple';

export interface Settings {
  theme: Theme;
  weightKcal: number;
  weightMacro: number;
  optimizerMode: OptimizerMode;
}
