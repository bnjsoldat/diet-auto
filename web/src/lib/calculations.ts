import type { Profile, Targets } from '@/types';
import { ACTIVITY_COEFS, KCAL_PER_GRAM, MACRO_SPLIT, OBJECTIVE_DELTA_KCAL } from './constants';
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

export function calcTargets(profile: Profile, opts: TargetsOptions = {}): Targets {
  const mb = calcMetabolismeBasal(profile);
  const kcalMaintenance = opts.useStravaAsActivitySource
    ? mb * SEDENTARY_COEF
    : calcMaintenance(mb, profile);
  const deltaKcal = OBJECTIVE_DELTA_KCAL[profile.objectif];
  const extra = Math.max(0, opts.extraBurnedKcal ?? 0);
  const kcalCible = kcalMaintenance + deltaKcal + extra;
  const imc = calcIMC(profile);

  // Répartition macros à partir de la cible finale (pas de la maintenance)
  const prot = (kcalCible * MACRO_SPLIT.protPct) / KCAL_PER_GRAM.prot;
  const gluc = (kcalCible * MACRO_SPLIT.glucPct) / KCAL_PER_GRAM.gluc;
  const lip = (kcalCible * MACRO_SPLIT.lipPct) / KCAL_PER_GRAM.lip;

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
