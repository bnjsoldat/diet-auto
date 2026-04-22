import type { MealDistribution, Profile, Targets } from '@/types';
import {
  ACTIVITY_COEFS,
  KCAL_PER_GRAM,
  KCAL_PER_KG_FAT,
  LIPID_MIN_G_PER_KG,
  LIPID_PCT,
  MEAL_DISTRIBUTION_PRESETS,
  MIN_KCAL_FLOOR,
  OBJECTIVE_DELTA_KCAL,
  PROTEIN_G_PER_KG,
  PROTEIN_LOSS_MULTIPLIER,
  PROTEIN_MAX_G_PER_KG,
  PROTEIN_MIN_G_PER_KG,
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

  // Répartition macros — modèle scientifique (ACSM 2020 / ISSN 2017) :
  //  1. Protéines en GRAMMES/KG de poids corporel, boostées si perte.
  //  2. Lipides en % des kcal totales, avec plancher g/kg (santé hormonale).
  //  3. Glucides = reste des kcal (énergie principale).
  const macros = computeMacros(profile, kcalCible);

  return {
    mb: Math.round(mb),
    kcalMaintenance: Math.round(kcalMaintenance),
    kcalCible: Math.round(kcalCible),
    deltaKcal: Math.round(deltaKcal),
    imc: Math.round(imc * 10) / 10,
    prot: Math.round(macros.prot),
    gluc: Math.round(macros.gluc),
    lip: Math.round(macros.lip),
  };
}

/**
 * Calcule la répartition macros en grammes pour une cible kcal donnée.
 *
 * Algorithme (scientifiquement sourcé) :
 *  1. Protéines = g/kg × poids corporel
 *     - g/kg selon sport (1.0 à 1.8)
 *     - ×1.3 si perte de poids (préservation masse maigre, Helms 2014)
 *     - bornes : [0.8 ; 2.5] g/kg
 *  2. Lipides = % × kcalCible, avec plancher 0.8 g/kg × poids
 *     - % selon sport (22 % endurance → 30 % aucun)
 *     - plancher pour hormones stéroïdiennes, vit liposolubles
 *  3. Glucides = (kcalCible - prot×4 - lip×9) / 4
 *     - toujours ≥ 0, sinon on ré-ajuste (cas extrêmes de cible très basse)
 */
/** Plafond physiologique : protéines au-dessus de 35 % des kcal n'apportent
 *  aucun bénéfice (turnover hépatique limité, gluconéogenèse coûteuse). */
const PROTEIN_MAX_PCT_KCAL = 0.35;

function computeMacros(profile: Profile, kcalCible: number): {
  prot: number;
  gluc: number;
  lip: number;
} {
  const sport = profile.sportPrincipal ?? 'mixte';

  // 1. Protéines en g/kg, avec boost perte + bornes g/kg
  let protPerKg = PROTEIN_G_PER_KG[sport];
  if (profile.objectifType === 'perdre') {
    protPerKg *= PROTEIN_LOSS_MULTIPLIER;
  }
  protPerKg = Math.min(
    PROTEIN_MAX_G_PER_KG,
    Math.max(PROTEIN_MIN_G_PER_KG, protPerKg)
  );
  let prot = protPerKg * profile.poids;

  // Plafond physiologique : max 35 % des kcal totales (évite les cas
  // absurdes type "femme 90 kg à 1200 kcal" où 1.82 g/kg donnerait 55 %
  // de prot — le corps ne les utilise pas au-delà de 35 %).
  const protKcalMax = kcalCible * PROTEIN_MAX_PCT_KCAL;
  if (prot * KCAL_PER_GRAM.prot > protKcalMax) {
    prot = protKcalMax / KCAL_PER_GRAM.prot;
  }

  // 2. Lipides en % des kcal totales, avec plancher absolu en g/kg (santé
  // hormonale, vit liposolubles, AGE).
  const lipPct = LIPID_PCT[sport];
  const lipFromPct = (kcalCible * lipPct) / KCAL_PER_GRAM.lip;
  const lipMinG = LIPID_MIN_G_PER_KG * profile.poids;
  let lip = Math.max(lipFromPct, lipMinG);

  // 3. Glucides = reste
  let gluc = (kcalCible - prot * KCAL_PER_GRAM.prot - lip * KCAL_PER_GRAM.lip) / KCAL_PER_GRAM.gluc;

  // Cas extrême : prot (capée à 35 %) + lip min > kcalCible (obésité sévère
  // au plancher 1200 kcal). On garde le plancher lipides (priorité santé
  // hormonale), on rabote les protéines pour équilibrer, glucides à 0.
  if (gluc < 0) {
    gluc = 0;
    const kcalForProt = Math.max(0, kcalCible - lipMinG * KCAL_PER_GRAM.lip);
    prot = kcalForProt / KCAL_PER_GRAM.prot;
    lip = lipMinG;
  }

  return { prot, gluc, lip };
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
 * Retourne les kcal cible par repas selon le preset de distribution
 * choisi par l'utilisateur et le nombre de repas du plan.
 *
 * Algorithme :
 *  1. Prend le preset (défaut 'equilibre').
 *  2. Adapte les `shares` au nombre réel de repas :
 *     - Si le plan a N repas et le preset en a M :
 *       - Si N === M : applique tel quel
 *       - Si N > M : distribue le reste (proportionnel)
 *       - Si N < M : somme les excédents sur les principaux
 *  3. Multiplie par kcalCible pour obtenir les kcal par repas.
 *
 * Exemple : kcalCible = 2878, preset = 'equilibre', 5 repas
 *  → [720, 288, 864, 288, 720] (25%/10%/30%/10%/25%)
 */
export function kcalPerMeal(
  kcalCible: number,
  nbMeals: number,
  distribution?: MealDistribution
): number[] {
  const preset = MEAL_DISTRIBUTION_PRESETS[distribution ?? 'equilibre'];
  let shares = [...preset.shares];

  // Adapter le tableau de shares au nombre réel de repas
  if (nbMeals > shares.length) {
    // Extra repas : on ajoute 10 % chacun et on renormalise à 100
    while (shares.length < nbMeals) shares.push(10);
  } else if (nbMeals < shares.length) {
    // Moins de repas : on fusionne les derniers dans le dernier conservé
    const extra = shares.slice(nbMeals).reduce((a, b) => a + b, 0);
    shares = shares.slice(0, nbMeals);
    shares[shares.length - 1] += extra;
  }

  // Renormaliser à 100 (peut être imparfait après adaptations)
  const total = shares.reduce((a, b) => a + b, 0);
  if (total > 0 && total !== 100) {
    shares = shares.map((s) => (s * 100) / total);
  }

  return shares.map((s) => Math.round((s / 100) * kcalCible));
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
