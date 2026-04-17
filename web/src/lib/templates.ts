import type { Meal, MealFoodItem } from '@/types';
import { uid } from './utils';

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
      const found = foodsByName.get(nom.toLowerCase());
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
