import type { Profile, Targets } from '@/types';
import {
  ACTIVITY_COEFS,
  KCAL_PER_GRAM,
  KCAL_PER_KG_FAT,
  MACRO_SPLIT_BY_SPORT,
  MIN_KCAL_FLOOR,
  OBJECTIVE_DELTA_KCAL,
} from './constants';
import { effectiveAge } from './age';

/** Métabolisme basal — formule utilisée dans le Sheet d'origine
 *  (variante Harris-Benedict avec la taille exprimée en MÈTRES) :
 *    Homme : 13.7516 × poids + 500.33 × taille(m) − 6.755 × âge + 66.473
 *    Femme :  9.5634 × poids + 184.96 × taille(m) − 4.6756 × âge + 665.0955
 *
 * Âge calculé depuis birthDate si présent (auto-updated chaque année),
 * sinon fallback sur le champ age. Voir lib/age.ts.
 */
export function calcMetabolismeBasal(profile: Profile): number {
  const { poids, taille, genre } = profile;
  const age = effectiveAge(profile);
  if (genre === 'Homme') {
    return 13.7516 * poids + 500.33 * taille - 6.755 * age + 66.473;
  }
  return 9.5634 * poids + 184.96 * taille - 4.6756 * age + 665.0955;
}

export function calcMaintenance(mb: number, profile: Profile): number {
  return mb * ACTIVITY_COEFS[profile.activite];
}

export function calcIMC(profile: Profile): number {
  return profile.poids / (profile.taille * profile.taille);
}

/**
 * Options de calcul de cible :
 *  - `extraBurnedKcal` : kcal brûlées par le sport du jour (Strava ou
 *    saisie manuelle). S'ajoute à la cible.
 *  - `useStravaAsActivitySource` : si `true`, on IGNORE le coef d'activité
 *    du profil et on utilise « sédentaire » (1.2) comme base — le sport
 *    réel vient uniquement d'`extraBurnedKcal`. C'est le comportement
 *    correct quand l'utilisateur a connecté Strava (ou saisit manuellement
 *    ses kcal) : sinon le coef d'activité + les kcal Strava compteraient
 *    le sport deux fois.
 *
 * Exemple :
 *  - Homme 75 kg, très actif (coef 1.725), Strava 800 kcal aujourd'hui
 *  - Sans fix : maintenance = MB × 1.725 + 800 = double-comptage
 *  - Avec fix : maintenance = MB × 1.2 + 800 (les 800 sont le VRAI sport)
 */
export interface TargetsOptions {
  /** kcal brûlées en sport aujourd'hui (0 par défaut). */
  extraBurnedKcal?: number;
  /**
   * Si true, force le coef d'activité à 1.2 (sédentaire) pour ne pas
   * double-compter le sport déjà capté par extraBurnedKcal. À utiliser
   * quand Strava est connecté OU que l'utilisateur a saisi manuellement
   * les kcal brûlées du jour.
   */
  useStravaAsActivitySource?: boolean;
}

// Coef sédentaire (métabolisme basal × 1.2 = MB + thermogénèse alimentaire
// + activité ultra-légère = NEAT pur, sans sport). C'est la base correcte
// quand on connaît le sport exact via tracker.
const SEDENTARY_COEF = 1.2;

/**
 * Dérive le deltaKcal quotidien à partir de poidsCible + rythmeSem.
 * Formule : direction × rythme_kg_sem × 7700 kcal/kg / 7 jours.
 *
 * Retourne null si poidsCible ou rythmeSem manquent (→ fallback sur
 * l'enum Objectif legacy).
 *
 * Si l'utilisateur a déjà dépassé sa cible (ex : visait 70 kg et pèse
 * 68 kg), la direction s'inverse naturellement (+deltaKcal pour remonter).
 */
function deriveDeltaFromTarget(profile: Profile): number | null {
  if (profile.poidsCible == null || profile.rythmeSem == null) return null;
  if (profile.poidsCible === profile.poids) return 0;
  const direction = profile.poidsCible < profile.poids ? -1 : 1;
  return (direction * profile.rythmeSem * KCAL_PER_KG_FAT) / 7;
}

export function calcTargets(profile: Profile, opts: TargetsOptions = {}): Targets {
  const mb = calcMetabolismeBasal(profile);
  const kcalMaintenance = opts.useStravaAsActivitySource
    ? mb * SEDENTARY_COEF
    : calcMaintenance(mb, profile);

  // Priorité : poids cible + rythme → deltaKcal dérivé.
  // Sinon fallback sur l'enum Objectif legacy (rétrocompat).
  const derived = deriveDeltaFromTarget(profile);
  const deltaKcal = derived ?? OBJECTIVE_DELTA_KCAL[profile.objectif];

  const extra = Math.max(0, opts.extraBurnedKcal ?? 0);
  let kcalCible = kcalMaintenance + deltaKcal + extra;

  // Plancher santé : jamais en dessous du minimum absolu selon le genre.
  // Même si la cible calculée est inférieure (ex : régime trop agressif
  // sur une petite morphologie), on plafonne par sécurité.
  const floor = MIN_KCAL_FLOOR[profile.genre];
  if (kcalCible < floor) kcalCible = floor;

  const imc = calcIMC(profile);

  // Répartition macros selon le sport principal. Fallback sur 'mixte'
  // (= répartition standard 25/50/25) si non défini.
  const sport = profile.sportPrincipal ?? 'mixte';
  const split = MACRO_SPLIT_BY_SPORT[sport];
  const prot = (kcalCible * split.protPct) / KCAL_PER_GRAM.prot;
  const gluc = (kcalCible * split.glucPct) / KCAL_PER_GRAM.gluc;
  const lip = (kcalCible * split.lipPct) / KCAL_PER_GRAM.lip;

  return {
    mb: Math.round(mb),
    kcalMaintenance: Math.round(kcalMaintenance),
    kcalCible: Math.round(kcalCible),
    deltaKcal: Math.round(deltaKcal),
    imc: Math.round(imc * 10) / 10,
    prot: Math.round(prot),
    gluc: Math.round(gluc),
    lip: Math.round(lip),
  };
}

// ===================================================================
// Helpers utilisés par le formulaire d'objectif (ProfileForm v2)
// ===================================================================

/**
 * Poids cible suggéré : IMC 22 (médian de la zone saine 18.5-25).
 * C'est un point de départ raisonnable — l'utilisateur peut toujours
 * changer. On n'affiche JAMAIS de catégorie IMC à l'utilisateur (trop
 * stigmatisant) ; on donne juste un nombre.
 */
export function recommendedTargetWeight(profile: Profile): number {
  const idealBMI = 22;
  return Math.round(idealBMI * profile.taille * profile.taille * 10) / 10;
}

/**
 * Durée estimée (en jours) pour atteindre la cible, au rythme choisi.
 * Retourne null si poidsCible ou rythmeSem manquent, ou si la cible
 * est déjà atteinte.
 */
export function estimatedDaysToTarget(profile: Profile): number | null {
  if (profile.poidsCible == null || profile.rythmeSem == null) return null;
  const dkg = Math.abs(profile.poidsCible - profile.poids);
  if (dkg < 0.1) return 0;
  return Math.round((dkg / profile.rythmeSem) * 7);
}

/** Date estimée (JS Date) d'atteinte de la cible. */
export function estimatedTargetDate(profile: Profile): Date | null {
  const days = estimatedDaysToTarget(profile);
  if (days == null) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Vérifie si une combinaison poids cible + rythme dépasse les plafonds
 * santé. Retourne la liste des warnings à afficher.
 */
export function checkTargetHealthWarnings(profile: Profile): string[] {
  const warnings: string[] = [];
  if (profile.poidsCible == null) return warnings;

  const bmi = profile.poidsCible / (profile.taille * profile.taille);
  if (bmi < 18.5) {
    warnings.push(
      `Ta cible correspond à un IMC de ${bmi.toFixed(1)} (sous-poids). Consulte un médecin avant de viser aussi bas.`
    );
  }
  if (bmi >= 30) {
    warnings.push(
      `Ta cible correspond à un IMC de ${bmi.toFixed(1)}. Un accompagnement médical est recommandé.`
    );
  }

  // Check du deltaKcal : si la cible force un déficit ou surplus > 1000 kcal/j,
  // c'est physiologiquement trop agressif.
  if (profile.rythmeSem && profile.rythmeSem >= 1) {
    const delta = (profile.rythmeSem * KCAL_PER_KG_FAT) / 7;
    if (delta >= 1000) {
      warnings.push(
        `Le rythme intense (±${delta.toFixed(0)} kcal/j) est tenable quelques semaines seulement — risque de fonte musculaire et fatigue chronique.`
      );
    }
  }

  // Check du plancher absolu : si la cible + rythme descend sous 1200/1500,
  // on prévient (calcTargets plafonne de toute façon).
  const mb = calcMetabolismeBasal({ ...profile, poids: profile.poidsCible });
  const maintenance = calcMaintenance(mb, profile);
  const derived = deriveDeltaFromTarget(profile);
  if (derived != null && derived < 0) {
    const theoretical = maintenance + derived;
    const floor = MIN_KCAL_FLOOR[profile.genre];
    if (theoretical < floor) {
      warnings.push(
        `Ta cible + rythme descendrait à ${Math.round(theoretical)} kcal/j — sous le plancher santé (${floor} kcal/j). On plafonne au plancher pour éviter les adaptations métaboliques.`
      );
    }
  }

  return warnings;
}
