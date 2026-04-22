import type { Activite, Genre, MealDistribution, Objectif, OptimizerMode, Rythme, Sport } from '@/types';

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

/** Répartition macros historique (conservée pour rétrocompat tests). */
export const MACRO_SPLIT = {
  protPct: 0.25,
  glucPct: 0.50,
  lipPct: 0.25,
};

/**
 * Protéines cibles en GRAMMES PAR KG de poids corporel, selon le sport.
 *
 * Sources scientifiques :
 *  - ACSM 2020 Position Stand (Sports Nutrition)
 *  - ISSN Protein Position Stand (Jäger et al. 2017)
 *  - Helms et al. 2014 (Evidence-based recommendations for natural bodybuilding)
 *  - Longland et al. 2016 (Higher compared with lower dietary protein during
 *    an energy deficit)
 *
 * Valeurs prudentes au sein des fourchettes recommandées :
 *  - aucun sport   : 1.0 g/kg (recommandation ANSES/OMS, sédentaire)
 *  - mixte         : 1.4 g/kg (sportif recréatif, ACSM 1.2-1.4)
 *  - endurance     : 1.4 g/kg (coureur/cycliste, ACSM 1.2-1.4)
 *  - musculation   : 1.8 g/kg (prise/maintien masse, ACSM 1.6-2.2)
 *
 * Multiplicateur en perte de poids : ×1.3 pour préserver la masse
 * musculaire pendant le déficit (Helms 2014, Longland 2016).
 */
export const PROTEIN_G_PER_KG: Record<Sport, number> = {
  aucun:     1.0,
  mixte:     1.4,
  endurance: 1.4,
  muscu:     1.8,
};

/** Boost protéines en perte de poids (protection masse maigre). */
export const PROTEIN_LOSS_MULTIPLIER = 1.3;

/** Plancher absolu (risque atrophie musculaire sous 0.8 g/kg). */
export const PROTEIN_MIN_G_PER_KG = 0.8;

/** Plafond absolu (au-delà, aucun bénéfice supplémentaire). */
export const PROTEIN_MAX_G_PER_KG = 2.5;

/**
 * Lipides : % des kcal totales, selon le sport.
 *
 * Sources : ANSES ANC 2010 (35 % max), ACSM 2020 (20-35 %),
 * Academy of Nutrition and Dietetics 2016.
 *
 * Valeurs :
 *  - aucun sport   : 30 % (standard ANSES 30-35 %)
 *  - mixte         : 28 %
 *  - endurance     : 22 % (glucides prioritaires pour l'effort)
 *  - musculation   : 25 % (protéines + glucides privilégiés)
 *
 * Avec plancher en g/kg (hormones stéroïdiennes, vitamines liposolubles,
 * acides gras essentiels oméga 3/6).
 */
export const LIPID_PCT: Record<Sport, number> = {
  aucun:     0.30,
  mixte:     0.28,
  endurance: 0.22,
  muscu:     0.25,
};

/** Plancher lipides en g/kg (santé hormonale). */
export const LIPID_MIN_G_PER_KG = 0.8;

/** Calories par gramme (Atwater) */
export const KCAL_PER_GRAM = {
  prot: 4,
  gluc: 4,
  lip: 9,
};

/**
 * Équivalent énergétique de 1 kg de graisse corporelle (approx.).
 * Utilisé pour dériver le deltaKcal journalier depuis le rythme kg/semaine.
 * Référence : Wishnofsky 1958, révisée — ~7700 kcal/kg est la valeur
 * standard en nutrition sportive.
 */
export const KCAL_PER_KG_FAT = 7700;

/**
 * Plancher kcal absolu par genre (santé).
 * En dessous, le corps réduit son métabolisme basal et déclenche des
 * adaptations hormonales (thyroïde, cortisol) qui ruinent la perte.
 * Recommandations OMS / nutritionnistes sportifs.
 */
export const MIN_KCAL_FLOOR: Record<Genre, number> = {
  Homme: 1500,
  Femme: 1200,
};

/**
 * Libellés et descriptions des rythmes (slider dans le ProfileForm).
 */
export const RYTHME_LABELS: Record<
  Rythme,
  { label: string; description: string; kcalApprox: number }
> = {
  0.25: {
    label: 'Doux',
    description: 'Tenable long terme, faible sensation de restriction',
    kcalApprox: Math.round((0.25 * KCAL_PER_KG_FAT) / 7),
  },
  0.5: {
    label: 'Modéré',
    description: 'Recommandé — bon compromis vitesse/confort',
    kcalApprox: Math.round((0.5 * KCAL_PER_KG_FAT) / 7),
  },
  0.75: {
    label: 'Soutenu',
    description: 'Demande de la rigueur, surveille la fatigue',
    kcalApprox: Math.round((0.75 * KCAL_PER_KG_FAT) / 7),
  },
  1: {
    label: 'Intense',
    description: 'Court terme uniquement, risque de fonte musculaire',
    kcalApprox: Math.round((1 * KCAL_PER_KG_FAT) / 7),
  },
};

/**
 * Libellés sport principal (pour les 4 boutons du ProfileForm).
 * Descriptions basées sur les g/kg ACSM 2020 plutôt que sur un %
 * arbitraire (les % découlent des g/kg, pas l'inverse).
 */
export const SPORT_LABELS: Record<
  Sport,
  { label: string; emoji: string; description: string }
> = {
  muscu: {
    label: 'Musculation',
    emoji: '💪',
    description: 'Protéines à 1.8 g/kg (prise/maintien masse)',
  },
  endurance: {
    label: 'Endurance',
    emoji: '🏃',
    description: 'Glucides privilégiés (marathon, vélo, trail)',
  },
  mixte: {
    label: 'Mixte',
    emoji: '🔥',
    description: 'Protéines à 1.4 g/kg (muscu + cardio)',
  },
  aucun: {
    label: 'Pas de sport',
    emoji: '🧘',
    description: 'Protéines à 1.0 g/kg (recommandation ANSES)',
  },
};

/** Bornes de quantité par défaut (g) si aucune borne spécifique ne s'applique. */
export const QUANTITY_BOUNDS = {
  min: 10,
  max: 400,
};

/**
 * Bornes réalistes par groupe CIQUAL (g pour une portion raisonnable dans un repas).
 * Empêche l'optimiseur de pondre des portions délirantes (ex : 150 g de miel).
 * min bas = on accepte une petite quantité ; max = plafond d'une portion humaine normale.
 *
 * Valeurs resserrées 2026-04-22 après feedback utilisateur : l'optimiseur
 * avait tendance à concentrer les kcal sur les aliments à grande borne
 * (pain à 350 g → 8-10 tranches, pas réaliste).
 */
export const PORTION_BOUNDS_BY_GROUPE: Record<string, { min: number; max: number }> = {
  // Protéines : plancher 60 g pour garantir une vraie portion de viande/poisson
  // quand l'aliment est la source principale de protéines du repas.
  'viandes, œufs, poissons et assimilés': { min: 60, max: 300 },
  'produits laitiers': { min: 20, max: 300 },  // 300g = 1 pot de fromage blanc / 2 yaourts
  'fromages': { min: 10, max: 80 },
  // Céréales/féculents : plafonds resserrés. 250 g de pâtes cuites = grosse
  // portion pour sportif, au-delà c'est un bol d'allumé.
  'céréales et produits à base de céréales': { min: 15, max: 250 },
  'féculents': { min: 30, max: 350 },
  'plats composés': { min: 50, max: 500 },
  'légumes': { min: 20, max: 400 },
  'fruits': { min: 30, max: 250 },  // 1-2 fruits max par repas
  'légumineuses': { min: 20, max: 250 },
  'fruits à coque': { min: 5, max: 50 },
  'matières grasses': { min: 2, max: 30 },
  'sucres et produits sucrés': { min: 2, max: 30 },
  'boissons': { min: 50, max: 750 },
  'sauces et condiments': { min: 2, max: 50 },
  'compléments': { min: 1, max: 30 },
  'perso': { min: 5, max: 400 },
};

/**
 * Surcharges par motif de nom — s'applique si le nom (lowercased) contient la clé.
 * Utile pour les aliments très concentrés ou très légers dont la portion diffère
 * nettement du reste de leur groupe.
 */
export const PORTION_BOUNDS_BY_NAME_PATTERN: { pattern: RegExp; bounds: { min: number; max: number } }[] = [
  // Sucres/sirops purs : de 1 c. à café à 2-3 c. à soupe max
  { pattern: /\b(miel|sirop|confiture|mélasse|sucre)\b/i, bounds: { min: 2, max: 35 } },
  // Huiles : 1 c. à café (~5 g) à 2 c. à soupe (~25 g)
  { pattern: /\bhuile\b/i, bounds: { min: 2, max: 25 } },
  // Beurre, margarine, saindoux
  { pattern: /\b(beurre|margarine|saindoux)\b/i, bounds: { min: 2, max: 30 } },
  // Sel, épices, poivre (on n'en met jamais plus d'une pincée)
  { pattern: /\b(sel|poivre|épice|épices|cannelle|cumin|curry|paprika|muscade)\b/i, bounds: { min: 0.5, max: 10 } },
  // Vinaigres, jus de citron
  { pattern: /\b(vinaigre|jus de citron)\b/i, bounds: { min: 2, max: 30 } },
  // Moutardes, mayos, ketchups
  { pattern: /\b(moutarde|mayonnaise|ketchup|sauce tomate)\b/i, bounds: { min: 2, max: 40 } },
  // Extraits / concentrés
  { pattern: /\b(extrait|concentré|cube|bouillon)\b/i, bounds: { min: 0.5, max: 15 } },
  // Café, thé (infusés) — le poids reste raisonnable
  { pattern: /\b(café\b|thé\b|tisane|infusion)/i, bounds: { min: 100, max: 500 } },
  // Eau, boissons très diluées
  { pattern: /\beau\b/i, bounds: { min: 100, max: 1000 } },
  // Alcools forts
  { pattern: /\b(whisky|vodka|rhum|gin|cognac|liqueur|eau-de-vie)\b/i, bounds: { min: 5, max: 50 } },
  // Vins
  { pattern: /\bvin\b/i, bounds: { min: 50, max: 200 } },
  // (œuf bound déplacé plus bas pour cohérence groupée avec autres aliments du petit-déj)
  // Fromages très gras ou à pâte dure
  { pattern: /\b(parmesan|roquefort|comté|beaufort|mimolette|bleu)\b/i, bounds: { min: 5, max: 50 } },
  // Charcuteries grasses
  { pattern: /\b(lardon|lard|chorizo|saucisson|rillette|foie gras)\b/i, bounds: { min: 10, max: 80 } },
  // Pain (toutes variantes) : 1 tranche ~ 30 g. 3-4 tranches max par repas
  // réaliste (même pour muscu au petit-déj).
  { pattern: /\bpain\b/i, bounds: { min: 10, max: 120 } },
  // Pain panini / bagel / sandwich : plus dense, 1 portion = ~60 g
  { pattern: /\b(pain panini|panini|bagel|ciabatta|focaccia)\b/i, bounds: { min: 30, max: 100 } },
  // Flocons / muesli : portion typique 40-80 g. Plafond 100 g au-delà c'est un saladier.
  { pattern: /\b(flocon|muesli|granola|céréales? petit[- ]déjeuner)\b/i, bounds: { min: 15, max: 100 } },
  // Avocat : 1 avocat entier (pulpe) ~ 120-150 g. Plafond 150 g = 1 avocat.
  { pattern: /\bavocat\b/i, bounds: { min: 30, max: 150 } },
  // Banane : 1 banane moyenne ~ 120 g. 2 bananes max par portion.
  { pattern: /\bbanane\b/i, bounds: { min: 50, max: 200 } },
  // Pomme / poire / orange : 1-2 fruits par portion, 120-200 g chacun.
  { pattern: /\b(pomme|poire|orange|pêche|nectarine|kiwi)\b/i, bounds: { min: 50, max: 250 } },
  // Fruits séchés (pruneau, abricot sec, raisin sec, datte) : très caloriques,
  // portion typique 20-30 g. Plafond 40 g pour éviter les surdosages.
  { pattern: /\b(pruneau|raisin sec|abricot sec|datte|figue séchée|fruit sec|fruits séchés)\b/i, bounds: { min: 5, max: 40 } },
  // Œuf : min 30 g (demi-œuf), max 240 g (4 œufs standards pour bodybuilder
  // au petit-déj). Élargi de 180 → 240 suite au feedback 2026-04-22
  // (user rapporte qu'en muscu on mange 2-4 œufs normalement).
  { pattern: /\bœuf\b/i, bounds: { min: 60, max: 240 } },
  // Yaourt : 1 pot = 125 g. Plafond 2 pots (250 g) par repas.
  { pattern: /\byaourt\b/i, bounds: { min: 60, max: 250 } },
  // Fromage blanc / petit suisse : portion 100-200 g. Plafond 300 g.
  { pattern: /\b(fromage blanc|petit suisse|skyr)\b/i, bounds: { min: 50, max: 300 } },
  // Beurre : 1 c. à café = 5 g, 1 c. à soupe = ~15 g. Plafond 30 g.
  { pattern: /\bbeurre\b/i, bounds: { min: 2, max: 30 } },
];

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

/**
 * Profils de tolérance pour l'optimiseur.
 * - tolKcal / tolMacro : écart relatif acceptable vs cible (pour l'affichage).
 * - poidsKcal / poidsMacro : poids dans la fonction de coût (plus élevé = plus contraignant).
 */
export const OPTIMIZER_MODES: Record<
  OptimizerMode,
  {
    label: string;
    description: string;
    tolKcal: number;
    tolMacro: number;
    poidsKcal: number;
    poidsMacro: number;
  }
> = {
  strict: {
    label: 'Strict',
    description: 'Précis : ±3 % kcal, ±5 % macros. Pour sèche ou prépa.',
    tolKcal: 0.03,
    tolMacro: 0.05,
    poidsKcal: 3.0,
    poidsMacro: 1.5,
  },
  normal: {
    label: 'Normal',
    description: 'Équilibré : ±5 % kcal, ±10 % macros. Recommandé.',
    tolKcal: 0.05,
    tolMacro: 0.1,
    poidsKcal: 2.0,
    poidsMacro: 1.0,
  },
  souple: {
    label: 'Souple',
    description: 'Bien-être : ±10 % kcal, ±15 % macros. Débutant.',
    tolKcal: 0.1,
    tolMacro: 0.15,
    poidsKcal: 1.5,
    poidsMacro: 0.8,
  },
};

/** Repas par défaut (nouveau plan) */
export const DEFAULT_MEALS = [
  'Repas 1 (matin)',
  'Collation 1',
  'Repas 2 (midi)',
  'Collation 2',
  'Repas 3 (soir)',
];

/**
 * Presets de répartition des kcal par repas (% du total quotidien).
 *
 * Chaque preset correspond à un pattern nutritionnel réel basé sur la
 * littérature scientifique ou la culture culinaire. Le tableau `shares`
 * représente, dans l'ordre des repas du plan : petit-déj, collation 1,
 * déjeuner, collation 2, dîner, (collation soir si existe).
 *
 * Ref :
 *  - ANSES ANC 2010 (répartition classique FR)
 *  - Delabos 2002 (chrono-nutrition)
 *  - Patterson 2015 / Varady 2021 (intermittent fasting 16:8)
 */
export const MEAL_DISTRIBUTION_PRESETS: Record<
  MealDistribution,
  {
    label: string;
    emoji: string;
    description: string;
    shares: number[]; // total = 100, dans l'ordre des repas
  }
> = {
  equilibre: {
    label: 'Équilibré',
    emoji: '⚖️',
    description: 'Réparti sur la journée — recommandation ANSES.',
    shares: [25, 10, 30, 10, 25],
  },
  'petit-dej-copieux': {
    label: 'Petit-déj copieux',
    emoji: '🌅',
    description: 'Chrono-nutrition Delabos : matin dense, soir léger.',
    shares: [35, 10, 25, 10, 20],
  },
  'dejeuner-copieux': {
    label: 'Déjeuner copieux',
    emoji: '🍽️',
    description: 'Tradition française : midi principal, reste modéré.',
    shares: [20, 5, 40, 10, 25],
  },
  'diner-copieux': {
    label: 'Dîner copieux',
    emoji: '🌙',
    description: 'Pattern anglo-américain : soir principal.',
    shares: [15, 10, 25, 10, 40],
  },
  'jeune-16-8': {
    label: 'Jeûne 16/8',
    emoji: '⏱️',
    description: 'Intermittent : 0 petit-déj, repas midi-soir (fenêtre 8h).',
    shares: [0, 0, 50, 20, 30],
  },
};

/**
 * Favoris par défaut seedés à la création d'un nouveau profil.
 * Sélection des ~25 aliments les plus consommés en France (source :
 * INCA 3 - Anses, rapport de consommation alimentaire). Noms conformes
 * à CIQUAL 2020 (la base de données utilisée).
 *
 * Couvre :
 *  - céréales (pain, riz, pâtes, flocons)
 *  - protéines animales (poulet, œuf, poisson)
 *  - laitiers (yaourt, fromage blanc, emmental)
 *  - fruits courants (banane, pomme)
 *  - légumes faciles (tomate, courgette, carotte, brocoli)
 *  - matières grasses (huile d'olive, beurre, amandes)
 *  - sucres rapides (miel, chocolat)
 *  - boissons (eau)
 *
 * L'utilisateur peut décocher au fil de l'eau. L'objectif : ne pas
 * démarrer avec une page Favoris vide, ce qui tue l'adoption.
 */
export const DEFAULT_FAVORITES: string[] = [
  // Céréales / féculents
  'Pain complet',
  'Pâtes alimentaires, cuites, non salées',
  'Riz basmati, cuit, non salé',
  'Flocon d\u2019avoine',
  // Protéines animales
  'Poulet, filet, grillé',
  'Oeuf, cru',
  'Saumon, atlantique, cuit',
  'Thon albacore ou thon jaune, au naturel, appertisé, égoutté',
  // Laitiers
  'Yaourt nature',
  'Fromage blanc nature ou aux fruits (aliment moyen)',
  'Emmental',
  // Fruits
  'Banane, pulpe, crue',
  'Pomme, crue, pulpe et peau',
  // Légumes
  'Tomate, crue',
  'Courgette, crue',
  'Carotte, crue',
  'Brocoli, bouilli/cuit à l\u2019eau, croquant',
  'Épinard, bouilli/cuit à l\u2019eau',
  // Matières grasses et fruits à coque
  'Huile d\u2019olive vierge extra',
  'Amande, grillée',
  'Avocat, pulpe, cru',
  // Sucres / plaisir
  'Miel',
  'Chocolat noir à 40% de cacao minimum, à pâtisser, tablette',
  // Légumineuses
  'Lentille verte, bouillie/cuite à l\u2019eau',
];
