import type { Food, Unite } from '@/types';

/**
 * Unités "discrètes" : un aliment ne se coupe pas en 2,3 (ex : œuf, pomme,
 * tranche, noisette, morceau, pot, yaourt…). Pour celles-ci, on affiche
 * toujours des entiers et on aligne la quantité en grammes sur un multiple
 * exact du poids unitaire. À l'inverse, les unités de mesure (c. à soupe,
 * pincée, filet) peuvent rester fractionnaires.
 */
// "noisette" ici désigne la FORME de beurre ("une noisette de beurre"), pas
// le fruit à coque — on le garde dans la liste mais les fruits à coque
// unitaires (noix, amande, cerneau…) sont retirés car on les mange par
// poignée et non par pièce : 12 amandes ≈ 14 g, mais afficher "12 amandes"
// n'est pas plus intuitif que "15 g d'amandes".
const DISCRETE_UNIT_LABELS = [
  'œuf', 'oeuf', 'pomme', 'orange', 'banane', 'poire', 'kiwi', 'abricot',
  'pêche', 'peche', 'prune', 'clémentine', 'clementine', 'mandarine',
  'tomate', 'tranche', 'rondelle', 'morceau', 'carré', 'carre',
  'noisette', 'yaourt', 'pot', 'biscuit', 'galette', 'crêpe', 'crepe',
  'gaufre', 'muffin', 'croissant', 'pain au chocolat', 'viennoiserie',
  'steak', 'escalope', 'filet', 'saucisse', 'knack', 'merguez',
  'gousse', 'portion',
];

/**
 * Noms d'aliments pour lesquels la première unité est ambiguë avec la
 * liste discrète mais devrait rester "par poids" (ex : fruits à coque).
 */
const NON_DISCRETE_FOODS_PATTERN = /^(amande|noix|noisette|cerneau|pistache|cajou|graine|grain)s?\b/i;

export function isDiscreteUnit(u: Unite | null | undefined, food?: Food | null): boolean {
  if (!u) return false;
  // Les fruits à coque se mangent par poids, pas par pièce, même si on a
  // défini une unité "noisette" (confusion possible avec la forme de beurre).
  if (food && NON_DISCRETE_FOODS_PATTERN.test(food.nom)) return false;
  const lc = u.label.toLowerCase();
  return DISCRETE_UNIT_LABELS.some((d) => lc === d || lc.startsWith(d + ' ') || lc.startsWith(d + 's'));
}

/**
 * Pour une quantité en grammes, trouve la meilleure unité parmi celles
 * définies pour l'aliment. Critère : celle qui donne un nombre le plus
 * proche d'un entier ≥ 1 (avec tolérance 0.2).
 */
export function bestUnitForGrams(food: Food, grams: number): Unite | null {
  if (!food.unites || food.unites.length === 0 || grams <= 0) return null;
  // Privilégier la première unité (par défaut) si raisonnable (0.5 ≤ count ≤ 20)
  const def = food.unites[0];
  const defCount = grams / def.g;
  if (defCount >= 0.5 && defCount <= 20) return def;

  // Sinon, chercher l'unité qui donne le count le plus proche d'un entier entre 1 et 10
  let best: Unite | null = null;
  let bestScore = Infinity;
  for (const u of food.unites) {
    const c = grams / u.g;
    if (c < 0.25 || c > 50) continue;
    // Écart à l'entier le plus proche (normalisé) + pénalité si trop petit/grand
    const nearest = Math.round(c);
    const penalty = nearest < 1 ? 2 : nearest > 15 ? 1 : 0;
    const score = Math.abs(c - nearest) / Math.max(1, nearest) + penalty;
    if (score < bestScore) {
      bestScore = score;
      best = u;
    }
  }
  return best ?? food.unites[0];
}

/** Formatte un nombre d'unités : 1 → "1", 1.5 → "1,5", 2 → "2". */
export function formatCount(count: number, discrete = false): string {
  if (discrete) return String(Math.max(1, Math.round(count)));
  if (count === Math.round(count)) return String(count);
  // 1 décimale, sauf si proche d'un entier (tolérance 0.05)
  const r1 = Math.round(count * 10) / 10;
  if (Math.abs(r1 - Math.round(r1)) < 0.01) return String(Math.round(r1));
  return r1.toFixed(1).replace('.', ',');
}

/**
 * Aligne une quantité en grammes sur un multiple entier de l'unité
 * "discrète" par défaut de l'aliment. Renvoie les grammes inchangés si
 * l'aliment n'a pas d'unité discrète.
 */
export function snapToDiscreteUnit(food: Food, grams: number): number {
  if (!food.unites || food.unites.length === 0) return grams;
  const def = food.unites[0];
  if (!isDiscreteUnit(def, food) || def.g <= 0) return grams;
  const count = Math.max(1, Math.round(grams / def.g));
  return count * def.g;
}

/**
 * Retourne une chaîne descriptive comme "2 œufs" ou "1,5 c. à soupe".
 * Si l'aliment n'a pas d'unités pratiques, retourne null.
 */
export function describeQuantity(food: Food, grams: number): string | null {
  const u = bestUnitForGrams(food, grams);
  if (!u) return null;
  const count = grams / u.g;
  const discrete = isDiscreteUnit(u, food);
  const displayCount = discrete ? Math.max(1, Math.round(count)) : count;
  return `${formatCount(count, discrete)} ${pluralize(u.label, displayCount)}`;
}

/**
 * Pluralise une unité selon le compte. Gère le français basique :
 * "œuf" → "œufs", "pomme moyenne" → "pommes moyennes",
 * "c. à soupe" → "c. à soupe" (invariable), "pot (125 g)" → "pots (125 g)".
 */
export function pluralize(label: string, count: number): string {
  if (count < 1.5) return label;

  // Séparer une éventuelle parenthèse à la fin (à conserver telle quelle)
  const parenMatch = label.match(/^(.+?)\s*(\(.+\))$/);
  const base = parenMatch ? parenMatch[1].trim() : label;
  const paren = parenMatch ? ' ' + parenMatch[2] : '';

  // Abréviations et locutions invariables
  if (/^c\.\s?à/i.test(base)) return label; // "c. à soupe", "c. à café"
  if (/^\d/.test(base)) return label; // commence par un chiffre (ex: "1/2 avocat")

  // Pluraliser chaque mot éligible
  const pluralized = base
    .split(/\s+/)
    .map((w) => pluralizeWord(w))
    .join(' ');

  return pluralized + paren;
}

function pluralizeWord(w: string): string {
  if (!w) return w;
  // Déjà en s/x/z → invariable
  if (/[sxz]$/i.test(w)) return w;
  // "au", "eu" → -x
  if (/(eau|au|eu)$/i.test(w)) return w + 'x';
  // -al → -aux (la plupart)
  if (/al$/i.test(w)) return w.slice(0, -2) + 'aux';
  // Mots courts < 2 chars ou abréviations avec "." → invariable
  if (w.length < 2 || /\./.test(w)) return w;
  return w + 's';
}
