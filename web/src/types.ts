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

/**
 * Intention haut niveau de l'utilisateur (nouveau modèle v2).
 * Sert de catégorisation pour les 3 boutons visuels du ProfileForm.
 */
export type ObjectifType = 'perdre' | 'maintien' | 'prendre';

/**
 * Rythme de perte/prise en kg/semaine. Le delta kcal journalier est
 * dérivé via : rythme × 7700 kcal/kg / 7 jours.
 *  - 0.25 = Doux   (environ -275/+275 kcal/j)
 *  - 0.5  = Modéré (environ -550/+550)  ← recommandé
 *  - 0.75 = Soutenu(environ -825/+825)
 *  - 1    = Intense(environ -1100/+1100)
 */
export type Rythme = 0.25 | 0.5 | 0.75 | 1;

/**
 * Sport principal — ajuste la répartition macros.
 *  - muscu : protéines boostées (30 %)
 *  - endurance : glucides boostés (55 %)
 *  - mixte : répartition équilibrée 25/50/25 (défaut)
 *  - aucun : idem mixte
 */
export type Sport = 'muscu' | 'endurance' | 'mixte' | 'aucun';

/**
 * Préférences alimentaires — filtrent les aliments suggérés dans la
 * recherche et les templates. Multi-select (ex : sans-gluten + sans-lactose).
 *
 *  - vegetarien   : pas de viande ni poisson (garde œufs + laitiers)
 *  - vegan        : pas de produits animaux du tout (ni miel)
 *  - sans-gluten  : pas de blé/seigle/orge et dérivés
 *  - sans-lactose : pas de lait/fromages/yaourts
 *  - halal        : pas de porc ni alcool
 */
export type DietaryPref =
  | 'vegetarien'
  | 'vegan'
  | 'sans-gluten'
  | 'sans-lactose'
  | 'halal';

/**
 * Préférence de répartition des calories entre les repas. Chaque preset
 * est basé sur une recommandation scientifique ou culturelle réelle.
 *
 *  - equilibre        : 25/10/30/10/25 — recommandation ANSES, classique français
 *  - petit-dej-copieux: 35/10/25/10/20 — chrono-nutrition (Delabos)
 *  - dejeuner-copieux : 20/5/40/10/25 — tradition française / méditerranéenne
 *  - diner-copieux    : 15/10/25/10/40 — pattern anglo-américain
 *  - jeune-16-8       : 0/0/50/20/30 — intermittent fasting 16:8
 *
 * Ordre des repas : petit-déj / collation matin / déjeuner / collation
 * après-midi / dîner (+ collation soir si elle existe dans le plan).
 */
export type MealDistribution =
  | 'equilibre'
  | 'petit-dej-copieux'
  | 'dejeuner-copieux'
  | 'diner-copieux'
  | 'jeune-16-8';

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

  /**
   * Nouveaux champs objectif v2 (optionnels, rétrocompat garantie).
   *
   * Si `poidsCible` + `rythmeSem` sont présents, `calcTargets` les utilise
   * PRIORITAIREMENT pour dériver le deltaKcal du jour (au lieu de retomber
   * sur `objectif` legacy). Le `sportPrincipal` change la répartition macros.
   *
   * Les profils existants (pré-v2) continuent à fonctionner via le fallback
   * sur `objectif` → OBJECTIVE_DELTA_KCAL.
   */
  objectifType?: ObjectifType;
  poidsCible?: number;
  rythmeSem?: Rythme;
  sportPrincipal?: Sport;
  /** Préférences alimentaires — filtre la recherche + suggère templates compatibles. */
  dietaryPrefs?: DietaryPref[];
  /** Preset de répartition des kcal entre repas (défaut : 'equilibre'). */
  mealDistribution?: MealDistribution;

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
  /** Fibres alimentaires (g / 100 g). Absent si inconnu de CIQUAL. */
  fib?: number;
  /** Sucres totaux (g / 100 g). Inclus dans gluc, mais affiché séparément pour repérer les sucres rapides. */
  suc?: number;
  /** Sel chlorure de sodium (g / 100 g). Repère pour limiter à ~6 g/jour adulte. */
  sel?: number;
  /** Acides gras saturés (g / 100 g). Inclus dans lip, à limiter à ~22 g/jour adulte. */
  ags?: number;
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
  /** Si true (défaut), l'optimiseur propose des aliments complémentaires
   *  quand le plan est incomplet. Si false, il ne fait qu'ajuster les
   *  quantités des aliments déjà présents. */
  suggestComplements?: boolean;
}
