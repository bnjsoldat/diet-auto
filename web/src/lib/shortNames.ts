/**
 * Raccourcit les noms CIQUAL imbuvables pour l'affichage.
 *
 * CIQUAL utilise un format "aliment, partie, préparation" (ex : "Oeuf, cru",
 * "Banane, pulpe, crue") pratique pour la taxonomie mais peu digeste pour
 * l'utilisateur. Ce module applique des règles simples pour obtenir des
 * noms plus parlants, tout en gardant un comportement déterministe.
 *
 * Le nom CIQUAL original reste la source de vérité en base de données et
 * pour les recherches ; seule la couche d'affichage est modifiée.
 */

// ============================================================================
// Règles de nettoyage (appliquées dans l'ordre)
// ============================================================================

/** Parties d'aliment systématiquement à retirer (la "pulpe" d'une banane
    n'apporte aucune info à l'utilisateur). */
const NOISE_PARTS = new Set([
  'pulpe',
  'pulpe et peau',
  'chair',
  'chair et peau',
  'sans peau',
  'sans pépin',
  'avec peau',
  'avec pépin',
  'entier',
  'entière',
  'pulpe crue',
  'aliment moyen',
]);

/** Mots-clés de préparation qu'on garde mais reformule en adjectif simple. */
const PREPARATION_REWRITE: Record<string, string> = {
  'cru': '',
  'crue': '',
  'crus': '',
  'crues': '',
  'cuit': 'cuit',
  'cuite': 'cuite',
  'cuits': 'cuits',
  'cuites': 'cuites',
  'cuit à l\u2019eau': 'cuit',
  'cuit à l\u2019eau, sans sel': 'cuit',
  'cuite à l\u2019eau': 'cuite',
  'cuite à l\u2019eau, sans sel': 'cuite',
  'cuites à l\u2019eau': 'cuites',
  'cuites à l\u2019eau, non salées': 'cuites',
  'cuites, non salées': 'cuites',
  'bouilli/cuit à l\u2019eau': 'cuit',
  'bouillie/cuite à l\u2019eau': 'cuite',
  'bouilli/cuit à l\u2019eau, croquant': 'cuit croquant',
  'bouillie/cuite à l\u2019eau, croquante': 'cuite croquante',
  'grillé': 'grillé',
  'grillée': 'grillée',
  'rôti': 'rôti',
  'rôtie': 'rôtie',
  'rôtis': 'rôtis',
  'rôties': 'rôties',
  'fumé': 'fumé',
  'fumée': 'fumée',
  'appertisé': 'en conserve',
  'appertisée': 'en conserve',
  'appertisés': 'en conserve',
  'appertisées': 'en conserve',
  'appertisé, égoutté': 'en conserve, égoutté',
  'appertisée, égoutté': 'en conserve, égoutté',
  'au naturel, appertisé': 'au naturel',
  'au naturel, appertisée': 'au naturel',
  'au naturel, appertisé, égoutté': 'au naturel, égoutté',
  'à la vapeur': 'vapeur',
};

/** Reformulations complètes au niveau du nom entier (le plus efficace). */
const FULL_REWRITE: Record<string, string> = {
  'Oeuf, cru': 'Œuf',
  'Oeuf, entier, cru': 'Œuf',
  'Oeuf, blanc, cru': 'Blanc d\u2019œuf',
  'Oeuf, jaune, cru': 'Jaune d\u2019œuf',
  'Banane, pulpe, crue': 'Banane',
  'Banane, pulpe, sèche': 'Banane séchée',
  'Pomme, crue, pulpe et peau': 'Pomme',
  'Pomme, crue, pulpe': 'Pomme',
  'Poire, crue, pulpe et peau': 'Poire',
  'Poire, crue, pulpe': 'Poire',
  'Pêche, crue, pulpe et peau': 'Pêche',
  'Abricot, pulpe, cru': 'Abricot',
  'Fraise, crue': 'Fraise',
  'Framboise, crue': 'Framboise',
  'Myrtille, crue': 'Myrtille',
  'Cassis, cru': 'Cassis',
  'Raisin, cru': 'Raisin',
  'Raisin sec': 'Raisin sec',
  'Orange, pulpe, crue': 'Orange',
  'Clémentine, pulpe, crue': 'Clémentine',
  'Mandarine, pulpe, crue': 'Mandarine',
  'Citron, pulpe, cru': 'Citron',
  'Kiwi, pulpe, cru': 'Kiwi',
  'Tomate, crue': 'Tomate',
  'Tomate, pelée, appertisée': 'Tomate en conserve',
  'Courgette, crue': 'Courgette',
  'Aubergine, crue': 'Aubergine',
  'Carotte, crue': 'Carotte crue',
  'Carotte, bouillie/cuite à l\u2019eau, croquante': 'Carotte cuite',
  'Brocoli, bouilli/cuit à l\u2019eau, croquant': 'Brocoli cuit',
  'Chou-fleur, bouilli/cuit à l\u2019eau': 'Chou-fleur cuit',
  'Haricot vert, appertisé, égoutté': 'Haricots verts (en conserve)',
  'Haricot vert, bouilli/cuit à l\u2019eau': 'Haricots verts cuits',
  'Épinard, bouilli/cuit à l\u2019eau': 'Épinards cuits',
  'Riz basmati, cuit, non salé': 'Riz basmati cuit',
  'Riz blanc, cuit, non salé': 'Riz blanc cuit',
  'Riz complet, cuit, non salé': 'Riz complet cuit',
  'Pâtes alimentaires, cuites, non salées': 'Pâtes (cuites)',
  'Pâtes alimentaires, complètes, cuites': 'Pâtes complètes cuites',
  'Quinoa, cuit, non salé': 'Quinoa cuit',
  'Boulgour, cuit, non salé': 'Boulgour cuit',
  'Semoule, cuite, non salée': 'Semoule cuite',
  'Pain blanc, baguette courante': 'Pain (baguette)',
  'Pain complet': 'Pain complet',
  'Pain de mie, complet': 'Pain de mie complet',
  'Pain de mie, blanc': 'Pain de mie blanc',
  'Poulet, filet, grillé': 'Poulet grillé',
  'Poulet, filet, cru': 'Poulet cru',
  'Poulet, blanc, rôti': 'Poulet rôti',
  'Poulet, cuisse, rôtie': 'Cuisse de poulet rôtie',
  'Dinde, filet, grillé': 'Dinde grillée',
  'Saumon, atlantique, cuit': 'Saumon cuit',
  'Saumon, atlantique, cru': 'Saumon cru',
  'Saumon fumé': 'Saumon fumé',
  'Thon, cru': 'Thon cru',
  'Thon albacore ou thon jaune, au naturel, appertisé, égoutté': 'Thon au naturel (boîte)',
  'Thon à l\u2019huile, appertisé, égoutté': 'Thon à l\u2019huile (boîte)',
  'Sardine, à l\u2019huile, appertisée, égouttée': 'Sardines à l\u2019huile (boîte)',
  'Maquereau, cuit': 'Maquereau cuit',
  'Crevette, cuite': 'Crevettes cuites',
  'Jambon cuit, choix': 'Jambon blanc',
  'Jambon cru, sec': 'Jambon cru',
  'Boeuf, steak haché, 5% MG, cuit': 'Steak haché 5%',
  'Boeuf, steak haché, 15% MG, cuit': 'Steak haché 15%',
  'Lait de vache, demi-écrémé, UHT': 'Lait demi-écrémé',
  'Lait de vache, entier, UHT': 'Lait entier',
  'Lait de vache, écrémé, UHT': 'Lait écrémé',
  'Yaourt nature': 'Yaourt nature',
  'Yaourt à la grecque, nature': 'Yaourt grec nature',
  'Yaourt à boire, aromatisé ou aux fruits': 'Yaourt à boire',
  'Fromage blanc nature ou aux fruits (aliment moyen)': 'Fromage blanc',
  'Fromage blanc à 0% MG, nature': 'Fromage blanc 0%',
  'Fromage blanc à 3% MG, nature': 'Fromage blanc 3%',
  'Huile d\u2019olive vierge extra': 'Huile d\u2019olive',
  'Huile de tournesol': 'Huile de tournesol',
  'Huile de colza': 'Huile de colza',
  'Beurre doux': 'Beurre',
  'Beurre demi-sel': 'Beurre demi-sel',
  'Flocon d\u2019avoine': 'Flocons d\u2019avoine',
  'Muesli (aliment moyen)': 'Muesli',
  'Amande (avec peau)': 'Amandes',
  'Amande, grillée': 'Amandes grillées',
  'Noix de cajou, grillée, salée': 'Noix de cajou (salées)',
  'Noix, séchée, cerneau': 'Noix',
  'Noisette': 'Noisettes',
  'Pistache, grillée, salée': 'Pistaches',
  'Avocat, pulpe, cru': 'Avocat',
  'Pommes de terre, cuites à l\u2019eau, sans sel': 'Pommes de terre cuites',
  'Pommes de terre, au four, avec peau': 'Pommes de terre au four',
  'Pommes de terre, frites, surgelées, cuites': 'Frites',
  'Lentille verte, bouillie/cuite à l\u2019eau': 'Lentilles cuites',
  'Lentille blonde, bouillie/cuite à l\u2019eau': 'Lentilles blondes cuites',
  'Pois chiche, bouilli/cuit à l\u2019eau': 'Pois chiches cuits',
  'Haricot blanc, bouilli/cuit à l\u2019eau': 'Haricots blancs cuits',
  'Haricot rouge, bouilli/cuit à l\u2019eau': 'Haricots rouges cuits',
  'Miel': 'Miel',
  'Sucre blanc': 'Sucre',
  'Confiture (aliment moyen)': 'Confiture',
  'Chocolat noir à 40% de cacao minimum, à pâtisser, tablette': 'Chocolat noir',
  'Chocolat noir à 70% de cacao minimum': 'Chocolat noir 70%',
};

// ============================================================================
// Fonction principale
// ============================================================================

/**
 * Retourne le nom d'affichage raccourci pour un aliment CIQUAL.
 * Si aucune règle ne matche, retourne le nom original tel quel.
 *
 * Performance : cache mémoire (beaucoup d'appels avec les mêmes noms).
 */
const cache = new Map<string, string>();

export function shortName(fullName: string): string {
  if (!fullName) return fullName;
  const cached = cache.get(fullName);
  if (cached !== undefined) return cached;

  const result = computeShortName(fullName);
  cache.set(fullName, result);
  return result;
}

function computeShortName(fullName: string): string {
  // 1) Lookup direct dans FULL_REWRITE (le plus efficace)
  if (FULL_REWRITE[fullName]) return FULL_REWRITE[fullName];

  // 2) Retirer les parenthèses de type "(aliment moyen)"
  const noisyParen = /\s*\((aliment moyen|pulpe crue|avec peau|sans peau|moyenne|grosse|petite)\)\s*/gi;
  let name = fullName.replace(noisyParen, ' ').trim();

  // 3) Split par virgule, retirer les parties "bruit" (pulpe, chair…)
  const parts = name.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return name;

  const [head, ...rest] = parts;
  const kept: string[] = [];
  for (const p of rest) {
    const lower = p.toLowerCase();
    if (NOISE_PARTS.has(lower)) continue;
    // Préparation : on l'applique en reformulation si elle est connue,
    // sinon on la garde brute
    if (PREPARATION_REWRITE[lower] !== undefined) {
      const rewritten = PREPARATION_REWRITE[lower];
      if (rewritten) kept.push(rewritten);
    } else {
      kept.push(p);
    }
  }

  if (kept.length === 0) return head;
  // On met la préparation sous forme d'adjectif : "Poulet grillé", pas
  // "Poulet, grillé".
  return `${head} ${kept.join(' ')}`.trim();
}

/**
 * Vide le cache (utile en tests ou après un hot reload qui change les règles).
 */
export function clearShortNameCache(): void {
  cache.clear();
}
