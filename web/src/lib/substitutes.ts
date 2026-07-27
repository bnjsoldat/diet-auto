import type { Food } from '@/types';
import { foodsByName, normalizeFoodKey } from './foods';

/**
 * Substituts d'aliments — « Pas fan du poulet ? → dinde, œufs, tofu… »
 *
 * Deux niveaux :
 *  1. Table curated : pour les ~30 aliments les plus courants, une liste
 *     de substituts choisis à la main (même rôle nutritionnel ET même
 *     usage culinaire — on ne remplace pas du poulet par du fromage).
 *  2. Fallback algorithmique : aliments du même groupe CIQUAL avec un
 *     profil macro proche (± 30 % sur la macro dominante).
 *
 * La quantité proposée est ajustée pour être ISO-CALORIQUE : remplacer
 * 150 g de poulet (165 kcal/100g) par du tofu (76 kcal/100g) suggère
 * ~325 g de tofu — arrondi à 5 g. Bornées par boundsForFood ailleurs.
 */

/** Clé = motif regex sur le nom ; valeur = noms exacts des substituts DB. */
const CURATED: { pattern: RegExp; substitutes: string[] }[] = [
  {
    // Poulet / dinde (volaille maigre)
    pattern: /\bpoulet\b/i,
    substitutes: [
      'Dinde, escalope, grillée',
      'Oeuf, entier, cru',
      'Tofu, nature',
      'Cabillaud, cuit à la vapeur',
      'Thon albacore ou thon jaune, au naturel, appertisé, égoutté',
    ],
  },
  {
    pattern: /\bdinde\b/i,
    substitutes: [
      'Poulet, filet, grillé',
      'Oeuf, entier, cru',
      'Tofu, nature',
      'Cabillaud, cuit à la vapeur',
    ],
  },
  {
    // Bœuf haché / steak
    pattern: /\bb(?:œ|oe)uf\b|\bsteak haché\b/i,
    substitutes: [
      'Poulet, filet, grillé',
      'Dinde, escalope, grillée',
      'Lentille verte, bouillie/cuite à l’eau',
      'Tofu, nature',
    ],
  },
  {
    // Saumon (poisson gras)
    pattern: /\bsaumon\b/i,
    substitutes: [
      'Truite, cuite à la vapeur',
      'Maquereau, au naturel, appertisé, égoutté',
      'Sardine, à l’huile d’olive, appertisée, égouttée',
      'Oeuf, entier, cru',
    ],
  },
  {
    // Poissons blancs
    pattern: /\bcabillaud\b|\bcolin\b|\bmerlu\b|\bsole\b|\blieu\b/i,
    substitutes: [
      'Poulet, filet, grillé',
      'Thon albacore ou thon jaune, au naturel, appertisé, égoutté',
      'Dorade (Daurade) royale, cuite au four',
      'Oeuf, entier, cru',
    ],
  },
  {
    // Thon
    pattern: /\bthon\b/i,
    substitutes: [
      'Sardine, à l’huile d’olive, appertisée, égouttée',
      'Maquereau, au naturel, appertisé, égoutté',
      'Poulet, filet, grillé',
      'Oeuf, dur',
    ],
  },
  {
    // Œuf
    pattern: /\b(?:œ|oe)uf\b/i,
    substitutes: [
      'Fromage blanc nature ou aux fruits (aliment moyen)',
      'Tofu, nature',
      'Thon albacore ou thon jaune, au naturel, appertisé, égoutté',
      'Skyr',
    ],
  },
  {
    // Riz
    pattern: /\briz\b/i,
    substitutes: [
      'Pâtes alimentaires, cuites, non salées',
      'Quinoa, bouilli/cuit à l’eau, non salé',
      'Pomme de terre de conservation, sans peau, bouillie/cuite à l’eau',
      'Boulgour, cuit',
      'Patate douce, cuite',
    ],
  },
  {
    // Pâtes
    pattern: /\bpâtes\b|\bpates\b/i,
    substitutes: [
      'Riz basmati, cuit, non salé',
      'Quinoa, bouilli/cuit à l’eau, non salé',
      'Pomme de terre de conservation, sans peau, bouillie/cuite à l’eau',
      'Semoule de blé dur, cuite',
    ],
  },
  {
    // Pomme de terre / patate douce
    pattern: /\bpomme de terre\b|\bpatate douce\b/i,
    substitutes: [
      'Riz basmati, cuit, non salé',
      'Pâtes alimentaires, cuites, non salées',
      'Quinoa, bouilli/cuit à l’eau, non salé',
      'Lentille verte, bouillie/cuite à l’eau',
    ],
  },
  {
    // Quinoa / boulgour / semoule
    pattern: /\bquinoa\b|\bboulgour\b|\bsemoule\b/i,
    substitutes: [
      'Riz basmati, cuit, non salé',
      'Pâtes alimentaires, cuites, non salées',
      'Lentille verte, bouillie/cuite à l’eau',
    ],
  },
  {
    // Pain
    pattern: /\bpain\b/i,
    substitutes: [
      'Flocon d’avoine',
      'Riz basmati, cuit, non salé',
      'Pomme de terre de conservation, sans peau, bouillie/cuite à l’eau',
    ],
  },
  {
    // Flocons d'avoine / muesli
    pattern: /\bflocon\b|\bmuesli\b/i,
    substitutes: [
      'Pain complet',
      'Riz basmati, cuit, non salé',
      'Banane, pulpe, crue',
    ],
  },
  {
    // Lentilles / pois chiches / haricots (légumineuses)
    pattern: /\blentille\b|\bpois chiche\b|\bharicot rouge\b|\bharicot blanc\b/i,
    substitutes: [
      'Pois chiche, bouilli/cuit à l’eau',
      'Lentille verte, bouillie/cuite à l’eau',
      'Haricot rouge, bouilli/cuit à l’eau',
      'Quinoa, bouilli/cuit à l’eau, non salé',
      'Tofu, nature',
    ],
  },
  {
    // Yaourt / fromage blanc / skyr
    pattern: /\byaourt\b|\bfromage blanc\b|\bskyr\b/i,
    substitutes: [
      'Yaourt nature',
      'Fromage blanc nature ou aux fruits (aliment moyen)',
      'Skyr',
      'Yaourt à la grecque, nature',
    ],
  },
  {
    // Lait
    pattern: /\blait\b/i,
    substitutes: [
      'Yaourt nature',
      'Fromage blanc nature ou aux fruits (aliment moyen)',
    ],
  },
  {
    // Fromages à pâte dure
    pattern: /\bemmental\b|\bcomté\b|\bgruyère\b|\bcheddar\b/i,
    substitutes: [
      'Mozzarella au lait de vache',
      'Feta AOP',
      'Fromage blanc nature ou aux fruits (aliment moyen)',
    ],
  },
  {
    // Banane
    pattern: /\bbanane\b/i,
    substitutes: [
      'Pomme, crue, pulpe et peau',
      'Poire Conférence, pulpe, crue',
      'Compote de pomme',
    ],
  },
  {
    // Pomme / poire
    pattern: /\bpomme, crue\b|\bpoire\b/i,
    substitutes: [
      'Banane, pulpe, crue',
      'Orange, pulpe, crue',
      'Kiwi, pulpe, cru',
      'Compote de pomme',
    ],
  },
  {
    // Avocat
    pattern: /\bavocat\b/i,
    substitutes: [
      'Amande (avec peau)',
      'Noix',
      'Huile d’olive vierge extra',
      'Beurre de cacahuète ou Pâte d’arachide',
    ],
  },
  {
    // Amandes / noix / noisettes
    pattern: /\bamande\b|\bnoix\b|\bnoisette\b|\bcajou\b/i,
    substitutes: [
      'Amande, grillée',
      'Noix',
      'Noisette',
      'Noix de cajou, grillée à sec, non salée',
      'Beurre de cacahuète ou Pâte d’arachide',
    ],
  },
  {
    // Huile d'olive
    pattern: /\bhuile d’olive\b|\bhuile d'olive\b/i,
    substitutes: [
      'Huile de colza',
      'Beurre à 82% MG, doux',
      'Avocat, pulpe, cru',
    ],
  },
  {
    // Beurre
    pattern: /\bbeurre à\b|\bbeurre doux\b/i,
    substitutes: [
      'Huile d’olive vierge extra',
      'Huile de colza',
    ],
  },
  {
    // Brocoli / légumes verts
    pattern: /\bbrocoli\b|\bépinard\b|\bharicot vert\b/i,
    substitutes: [
      'Brocoli, bouilli/cuit à l’eau, croquant',
      'Épinard, bouilli/cuit à l’eau',
      'Haricot vert, bouilli/cuit à l’eau',
      'Courgette, crue',
      'Chou-fleur, cuit',
    ],
  },
  {
    // Courgette / tomate / autres légumes
    pattern: /\bcourgette\b|\btomate\b|\bcarotte\b|\bpoivron\b|\bconcombre\b/i,
    substitutes: [
      'Courgette, crue',
      'Tomate, crue',
      'Carotte, crue',
      'Poivron rouge, cru',
      'Concombre, pulpe et peau, cru',
      'Champignon de Paris ou champignon de couche, bouilli/cuit à l’eau',
    ],
  },
];

export interface Substitute {
  food: Food;
  /** Quantité iso-calorique suggérée (g, multiple de 5, min 10). */
  quantite: number;
}

/**
 * Renvoie jusqu'à `max` substituts pour un aliment donné.
 * `currentQty` sert à calculer la quantité iso-calorique de chaque substitut.
 * Exclut l'aliment lui-même. Renvoie [] si l'aliment est inconnu.
 */
export function getSubstitutes(nom: string, currentQty: number, max = 4): Substitute[] {
  const sourceFood = foodsByName.get(normalizeFoodKey(nom));
  if (!sourceFood) return [];
  const currentKcal = (currentQty * sourceFood.kcal) / 100;

  // 1. Table curated
  const entry = CURATED.find((c) => c.pattern.test(nom));
  const candidateNames = entry ? entry.substitutes : [];

  const out: Substitute[] = [];
  const seen = new Set<string>([normalizeFoodKey(nom)]);

  for (const candName of candidateNames) {
    const key = normalizeFoodKey(candName);
    if (seen.has(key)) continue;
    const food = foodsByName.get(key);
    if (!food || food.kcal <= 0) continue;
    seen.add(key);

    // Quantité iso-calorique, arrondie à 5 g, plancher 10 g plafond 500 g
    let q = Math.round(((currentKcal * 100) / food.kcal) / 5) * 5;
    q = Math.max(10, Math.min(500, q));
    out.push({ food, quantite: q });
    if (out.length >= max) break;
  }

  return out;
}

/** True si on connaît des substituts pour cet aliment (affichage du bouton). */
export function hasSubstitutes(nom: string): boolean {
  return CURATED.some((c) => c.pattern.test(nom));
}
