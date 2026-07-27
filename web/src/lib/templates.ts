import type { Meal, MealFoodItem } from '@/types';
import { uid } from './utils';
import { normalizeFoodKey } from './foods';

/**
 * Templates de plans journaliers pré-composés. Quantités volontairement
 * moyennes — l'utilisateur fera tourner l'optimiseur pour les ajuster
 * à son profil. Chaque repas liste les aliments sous forme de tuples
 * [nomCIQUAL, grammes].
 */
export interface PlanTemplate {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** Mode d'optimiseur conseillé pour ce template. */
  mode?: 'strict' | 'normal' | 'souple';
  meals: { nom: string; items: [string, number][] }[];
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'classique',
    label: 'Équilibré classique',
    emoji: '🍱',
    description: 'Petit-déj + déjeuner + collation + dîner. Viande/poisson, féculents, légumes.',
    mode: 'normal',
    meals: [
      {
        nom: 'Petit-déjeuner',
        items: [
          ['Yaourt nature', 125],
          ['Flocon d\u2019avoine', 40],
          ['Banane, pulpe, crue', 100],
          ['Miel', 10],
        ],
      },
      {
        nom: 'Déjeuner',
        items: [
          ['Poulet, filet, grillé', 150],
          ['Riz basmati, cuit, non salé', 180],
          ['Brocoli, bouilli/cuit à l\u2019eau, croquant', 150],
          ['Huile d\u2019olive vierge extra', 10],
        ],
      },
      {
        nom: 'Collation',
        items: [
          ['Pomme, crue, pulpe et peau', 150],
          ['Amande, grillée', 20],
        ],
      },
      {
        nom: 'Dîner',
        items: [
          ['Saumon, atlantique, cuit', 130],
          ['Pâtes alimentaires, cuites, non salées', 180],
          ['Courgette, crue', 150],
          ['Huile d\u2019olive vierge extra', 8],
        ],
      },
    ],
  },
  {
    id: 'sportif',
    label: 'Sportif / prise de masse',
    emoji: '💪',
    description: '5 prises par jour, glucides et protéines élevés, pour sportif ou prise de masse.',
    mode: 'normal',
    meals: [
      {
        nom: 'Petit-déjeuner',
        items: [
          ['Oeuf, cru', 120],
          ['Pain complet', 80],
          ['Avocat, pulpe, cru', 60],
          ['Yaourt nature', 200],
          ['Miel', 15],
          // Beurre doux pour les œufs brouillés / à la poêle — réaliste
          // pour un cuisinier normal. 5 g = 1 petite noisette.
          ['Beurre à 82% MG, doux', 5],
        ],
      },
      {
        nom: 'Déjeuner',
        items: [
          ['Poulet, filet, grillé', 180],
          ['Riz basmati, cuit, non salé', 250],
          ['Brocoli, bouilli/cuit à l\u2019eau, croquant', 200],
          ['Huile d\u2019olive vierge extra', 10],
        ],
      },
      {
        nom: 'Collation',
        items: [
          ['Banane, pulpe, crue', 120],
          ['Amande, grillée', 30],
        ],
      },
      {
        nom: 'Dîner',
        items: [
          ['Saumon, atlantique, cuit', 180],
          ['Pâtes alimentaires, cuites, non salées', 220],
          ['Épinard, bouilli/cuit à l\u2019eau', 180],
          // Ajout d'huile pour la cuisson réaliste (saumon à la poêle,
          // pâtes, épinards). Même si le saumon a du gras naturel, tout
          // cuisinier met un peu d'huile. 10g = 2 c. à café.
          ['Huile d\u2019olive vierge extra', 10],
        ],
      },
      {
        nom: 'Collation du soir',
        items: [
          ['Fromage blanc nature ou aux fruits (aliment moyen)', 200],
          ['Chocolat noir à 40% de cacao minimum, à pâtisser, tablette', 20],
        ],
      },
    ],
  },
  {
    id: 'perte',
    label: 'Perte de poids',
    emoji: '🥗',
    description: 'Portions mesurées, légumes à volonté, protéines maigres, peu de matières grasses.',
    mode: 'strict',
    meals: [
      {
        nom: 'Petit-déjeuner',
        items: [
          ['Oeuf, cru', 120],
          ['Pain complet', 40],
          ['Tomate, crue', 100],
        ],
      },
      {
        nom: 'Déjeuner',
        items: [
          ['Thon albacore ou thon jaune, au naturel, appertisé, égoutté', 120],
          ['Lentille verte, bouillie/cuite à l\u2019eau', 120],
          ['Épinard, bouilli/cuit à l\u2019eau', 150],
          ['Huile d\u2019olive vierge extra', 5],
        ],
      },
      {
        nom: 'Collation',
        items: [
          ['Pomme, crue, pulpe et peau', 150],
        ],
      },
      {
        nom: 'Dîner',
        items: [
          ['Poulet, filet, grillé', 130],
          ['Courgette, crue', 200],
          ['Carotte, bouillie/cuite à l\u2019eau, croquante', 150],
          ['Huile d\u2019olive vierge extra', 5],
        ],
      },
    ],
  },
  {
    id: 'vege',
    label: 'Végétarien équilibré',
    emoji: '🌱',
    description: 'Sans viande ni poisson. Protéines via œufs, légumineuses, laitiers et céréales.',
    mode: 'normal',
    meals: [
      {
        nom: 'Petit-déjeuner',
        items: [
          ['Yaourt nature', 150],
          ['Muesli (aliment moyen)', 60],
          ['Banane, pulpe, crue', 100],
          ['Miel', 10],
        ],
      },
      {
        nom: 'Déjeuner',
        items: [
          ['Oeuf, cru', 120],
          ['Pois chiche, bouilli/cuit à l\u2019eau', 150],
          ['Riz basmati, cuit, non salé', 150],
          ['Tomate, crue', 150],
          ['Huile d\u2019olive vierge extra', 8],
        ],
      },
      {
        nom: 'Collation',
        items: [
          ['Pomme, crue, pulpe et peau', 150],
          ['Amande, grillée', 20],
        ],
      },
      {
        nom: 'Dîner',
        items: [
          ['Lentille verte, bouillie/cuite à l\u2019eau', 200],
          ['Courgette, crue', 150],
          ['Pain complet', 60],
          ['Emmental', 30],
          ['Huile d\u2019olive vierge extra', 8],
        ],
      },
    ],
  },
  {
    id: 'mediterraneen',
    label: 'M\u00e9diterran\u00e9en',
    emoji: '\u{1FAD2}',
    description: 'Poisson, huile d\u2019olive, l\u00e9gumes, l\u00e9gumineuses. Le r\u00e9gime aux meilleurs r\u00e9sultats sant\u00e9.',
    mode: 'normal',
    meals: [
      {
        nom: 'Petit-d\u00e9jeuner',
        items: [
          ['Yaourt \u00e0 la grecque, nature', 150],
          ['Miel', 10],
          ['Noix', 15],
          ['Pain complet', 50],
          ['Huile d\u2019olive vierge extra', 5],
          ['Tomate, crue', 80],
        ],
      },
      {
        nom: 'D\u00e9jeuner',
        items: [
          ['Sardine, \u00e0 l\u2019huile d\u2019olive, appertis\u00e9e, \u00e9goutt\u00e9e', 100],
          ['Pois chiche, bouilli/cuit \u00e0 l\u2019eau', 150],
          ['Tomate, crue', 120],
          ['Concombre, pulpe et peau, cru', 100],
          ['Feta AOP', 40],
          ['Huile d\u2019olive vierge extra', 12],
          ['Pain complet', 50],
        ],
      },
      {
        nom: 'Collation',
        items: [
          ['Orange, pulpe, crue', 150],
          ['Amande (avec peau)', 20],
        ],
      },
      {
        nom: 'D\u00eener',
        items: [
          ['Saumon, atlantique, cuit', 130],
          ['Riz complet, cuit', 150],
          ['Courgette, crue', 150],
          ['Poivron rouge, cru', 80],
          ['Huile d\u2019olive vierge extra', 12],
        ],
      },
    ],
  },
  {
    id: 'petit-mangeur',
    label: 'Petit mangeur',
    emoji: '\u{1F37D}\ufe0f',
    description: '~1400-1600 kcal. Portions l\u00e9g\u00e8res. Pour petits gabarits ou faibles app\u00e9tits.',
    mode: 'souple',
    meals: [
      {
        nom: 'Petit-d\u00e9jeuner',
        items: [
          ['Yaourt nature', 125],
          ['Flocon d\u2019avoine', 25],
          ['Banane, pulpe, crue', 80],
          ['Miel', 5],
        ],
      },
      {
        nom: 'D\u00e9jeuner',
        items: [
          ['Poulet, filet, grill\u00e9', 100],
          ['Riz basmati, cuit, non sal\u00e9', 120],
          ['Haricot vert, bouilli/cuit \u00e0 l\u2019eau', 150],
          ['Huile d\u2019olive vierge extra', 7],
        ],
      },
      {
        nom: 'Collation',
        items: [
          ['Pomme, crue, pulpe et peau', 120],
          ['Amande, grill\u00e9e', 10],
        ],
      },
      {
        nom: 'D\u00eener',
        items: [
          ['Cabillaud, cuit \u00e0 la vapeur', 110],
          ['Pomme de terre de conservation, sans peau, bouillie/cuite \u00e0 l\u2019eau', 130],
          ['Courgette, crue', 150],
          ['Huile d\u2019olive vierge extra', 7],
        ],
      },
    ],
  },
  {
    id: 'low-carb',
    label: 'Low-carb',
    emoji: '\u{1F969}',
    description: 'Glucides r\u00e9duits (~100 g/j), prot\u00e9ines et bons lipides \u00e9lev\u00e9s. Sati\u00e9t\u00e9 maximale, id\u00e9al s\u00e8che.',
    mode: 'normal',
    meals: [
      {
        nom: 'Petit-d\u00e9jeuner',
        items: [
          ['Oeuf, entier, cru', 120],
          ['Avocat, pulpe, cru', 80],
          ['Tomate, crue', 100],
          ['Beurre \u00e0 82% MG, doux', 5],
        ],
      },
      {
        nom: 'D\u00e9jeuner',
        items: [
          ['Poulet, filet, grill\u00e9', 160],
          ['Brocoli, bouilli/cuit \u00e0 l\u2019eau, croquant', 200],
          ['Avocat, pulpe, cru', 60],
          ['Huile d\u2019olive vierge extra', 12],
          ['Emmental', 25],
        ],
      },
      {
        nom: 'Collation',
        items: [
          ['Fromage blanc nature ou aux fruits (aliment moyen)', 150],
          ['Noix', 20],
        ],
      },
      {
        nom: 'D\u00eener',
        items: [
          ['Saumon, atlantique, cuit', 150],
          ['\u00c9pinard, bouilli/cuit \u00e0 l\u2019eau', 200],
          ['Champignon de Paris ou champignon de couche, bouilli/cuit \u00e0 l\u2019eau', 100],
          ['Huile d\u2019olive vierge extra', 10],
          ['Amande, grill\u00e9e', 15],
        ],
      },
    ],
  },
];

/**
 * Matérialise un template en `Meal[]` prêt à injecter dans un plan.
 * Ignore les aliments dont le nom n'existe pas dans la base (garantit
 * que le plan reste valide même si un nom CIQUAL change).
 */
export function buildMealsFromTemplate(
  tpl: PlanTemplate,
  foodsByName: Map<string, { nom: string }>
): Meal[] {
  return tpl.meals.map((m) => {
    const items: MealFoodItem[] = [];
    for (const [nom, qty] of m.items) {
      // normalizeFoodKey gère les apostrophes typographiques `’` qui
      // polluaient silencieusement certains items des templates (bug
      // trouvé 2026-04-22 : "Flocon d’avoine" ne matchait pas la DB).
      const found = foodsByName.get(normalizeFoodKey(nom));
      if (!found) continue;
      items.push({
        id: uid('itm'),
        nom: found.nom, // canonical casing
        quantite: qty,
        verrou: false,
      });
    }
    return { id: uid('meal'), nom: m.nom, items };
  });
}
