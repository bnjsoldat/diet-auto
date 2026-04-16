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
  age: number;
  genre: Genre;
  activite: Activite;
  objectif: Objectif;
  createdAt: number;
  updatedAt: number;
}

export interface Food {
  nom: string;
  groupe: string;
  kcal: number; // per 100 g
  prot: number;
  gluc: number;
  lip: number;
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

export interface OptimizeResult {
  iterations: number;
  converge: boolean;
  avant: { kcal: number; prot: number; gluc: number; lip: number };
  apres: { kcal: number; prot: number; gluc: number; lip: number };
  cibles: { kcal: number; prot: number; gluc: number; lip: number };
}

export type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  theme: Theme;
  weightKcal: number;
  weightMacro: number;
}
