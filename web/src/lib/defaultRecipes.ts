import type { RecipeIngredient } from '@/types';

/**
 * 40 recettes pré-composées à importer en un clic depuis la page Recettes.
 *
 * Principes de conception :
 *  - Ingrédients CIQUAL / extras (noms vérifiés existants)
 *  - Quantités réalistes pour 1 personne (on peut scaler après)
 *  - Étapes simples, 3-6 étapes par recette
 *  - Recettes familières et saines (smoothies, bowls, plats classiques)
 *  - Réparties : 10 petit-déj, 10 collations, 10 déjeuners, 10 dîners
 *
 * Import via le bouton « Importer les recettes populaires » sur /recipes.
 * L'utilisateur peut les modifier/supprimer après import.
 */

export interface DefaultRecipe {
  nom: string;
  /** Catégorie pour regroupement visuel dans l'importateur. */
  categorie: 'petit-dej' | 'collation' | 'dejeuner' | 'diner';
  /** Emoji pour identifier visuellement. */
  emoji: string;
  /** Portion standard (1 personne). */
  ingredients: RecipeIngredient[];
  /** Étapes de préparation (3-6 étapes courtes). */
  etapes: string[];
}

export const DEFAULT_RECIPES: DefaultRecipe[] = [
  // ═════════════════════════════ PETIT-DÉJEUNERS (10) ═════════════════════════════
  {
    nom: 'Smoothie banane-avoine',
    categorie: 'petit-dej',
    emoji: '🥤',
    ingredients: [
      { nom: 'Banane, pulpe, crue', quantite: 120 },
      { nom: "Flocon d'avoine", quantite: 30 },
      { nom: 'Lait demi-écrémé, UHT', quantite: 200 },
      { nom: 'Miel', quantite: 10 },
    ],
    etapes: [
      "Éplucher la banane et la couper en morceaux.",
      "Mettre tous les ingrédients dans un blender.",
      "Mixer 30 secondes jusqu'à obtenir une texture lisse.",
      "Servir frais. Peut se préparer la veille et se conserver 24 h au frigo.",
    ],
  },
  {
    nom: 'Porridge flocons d\'avoine au lait',
    categorie: 'petit-dej',
    emoji: '🥣',
    ingredients: [
      { nom: "Flocon d'avoine", quantite: 60 },
      { nom: 'Lait demi-écrémé, UHT', quantite: 250 },
      { nom: 'Banane, pulpe, crue', quantite: 100 },
      { nom: 'Miel', quantite: 10 },
      { nom: 'Amande, grillée', quantite: 10 },
    ],
    etapes: [
      "Verser les flocons d'avoine et le lait dans une casserole.",
      "Porter à ébullition douce à feu moyen, puis baisser à feu doux.",
      "Cuire 5 min en remuant jusqu'à texture crémeuse.",
      "Verser dans un bol, ajouter la banane en rondelles, le miel et les amandes.",
    ],
  },
  {
    nom: 'Tartines avocat + œuf poché',
    categorie: 'petit-dej',
    emoji: '🥑',
    ingredients: [
      { nom: 'Pain complet', quantite: 60 },
      { nom: 'Avocat, pulpe, cru', quantite: 80 },
      { nom: 'Oeuf, entier, cru', quantite: 60 },
      { nom: "Huile d'olive vierge extra", quantite: 5 },
      { nom: 'Tomate, crue', quantite: 50 },
    ],
    etapes: [
      "Griller les tranches de pain complet au grille-pain.",
      "Pocher l'œuf : porter 1 L d'eau à frémissement avec 1 c.s. de vinaigre, casser l'œuf dans une louche, verser doucement, cuire 3 min.",
      "Écraser l'avocat à la fourchette avec sel, poivre et un filet d'huile d'olive.",
      "Tartiner le pain d'avocat écrasé, déposer l'œuf poché et la tomate coupée.",
    ],
  },
  {
    nom: 'Bowl yaourt grec + miel + flocons',
    categorie: 'petit-dej',
    emoji: '🍯',
    ingredients: [
      { nom: 'Yaourt à la grecque, nature', quantite: 200 },
      { nom: "Flocon d'avoine", quantite: 30 },
      { nom: 'Miel', quantite: 15 },
      { nom: 'Myrtille, crue', quantite: 50 },
      { nom: 'Amande, grillée', quantite: 15 },
    ],
    etapes: [
      "Verser le yaourt grec dans un grand bol.",
      "Ajouter les flocons d'avoine (crus ou légèrement grillés à sec 2 min à la poêle).",
      "Répartir les myrtilles sur le dessus.",
      "Concasser les amandes et les saupoudrer.",
      "Arroser de miel juste avant de servir.",
    ],
  },
  {
    nom: 'Œufs brouillés + pain complet',
    categorie: 'petit-dej',
    emoji: '🍳',
    ingredients: [
      { nom: 'Oeuf, entier, cru', quantite: 120 },
      { nom: 'Pain complet', quantite: 60 },
      { nom: 'Beurre à 82% MG, doux', quantite: 5 },
      { nom: 'Tomate, crue', quantite: 80 },
      { nom: 'Emmental', quantite: 15 },
    ],
    etapes: [
      "Battre les œufs dans un bol avec sel et poivre.",
      "Faire fondre le beurre à feu doux dans une poêle anti-adhésive.",
      "Verser les œufs et remuer constamment à la spatule pour obtenir une texture crémeuse (2-3 min).",
      "Ajouter l'emmental râpé en fin de cuisson.",
      "Servir avec les tranches de pain grillées et la tomate en dés.",
    ],
  },
  {
    nom: 'Bowl fromage blanc + muesli + pomme',
    categorie: 'petit-dej',
    emoji: '🥝',
    ingredients: [
      { nom: 'Fromage blanc nature ou aux fruits (aliment moyen)', quantite: 200 },
      { nom: 'Muesli (aliment moyen)', quantite: 40 },
      { nom: 'Pomme, crue, pulpe et peau', quantite: 100 },
      { nom: 'Miel', quantite: 10 },
      { nom: 'Noix', quantite: 10 },
    ],
    etapes: [
      "Verser le fromage blanc dans un bol.",
      "Couper la pomme en petits dés (avec la peau pour les fibres).",
      "Saupoudrer de muesli, ajouter les dés de pomme et les noix concassées.",
      "Arroser de miel. À manger tout de suite pour garder le croustillant.",
    ],
  },
  {
    nom: 'Omelette aux légumes',
    categorie: 'petit-dej',
    emoji: '🍳',
    ingredients: [
      { nom: 'Oeuf, entier, cru', quantite: 150 },
      { nom: 'Tomate, crue', quantite: 60 },
      { nom: "Épinard, bouilli/cuit à l'eau", quantite: 50 },
      { nom: 'Champignon de Paris ou champignon de couche, bouilli/cuit à l\'eau', quantite: 40 },
      { nom: 'Emmental', quantite: 20 },
      { nom: "Huile d'olive vierge extra", quantite: 5 },
    ],
    etapes: [
      "Battre les œufs dans un bol avec sel, poivre et un trait d'eau.",
      "Faire revenir les champignons émincés dans l'huile d'olive 3 min à feu moyen.",
      "Ajouter la tomate en dés et les épinards, cuire 2 min.",
      "Verser les œufs battus, laisser prendre 2 min.",
      "Saupoudrer d'emmental râpé, plier en deux, cuire encore 1 min.",
    ],
  },
  {
    nom: 'Tartine pain + beurre + miel + œuf dur',
    categorie: 'petit-dej',
    emoji: '🍞',
    ingredients: [
      { nom: 'Pain complet', quantite: 60 },
      { nom: 'Beurre à 82% MG, doux', quantite: 10 },
      { nom: 'Miel', quantite: 15 },
      { nom: 'Oeuf, entier, cru', quantite: 60 },
      { nom: 'Banane, pulpe, crue', quantite: 100 },
    ],
    etapes: [
      "Faire cuire l'œuf dur : plonger dans l'eau bouillante 9 min puis eau froide.",
      "Griller le pain.",
      "Tartiner le pain avec le beurre puis le miel.",
      "Écaler l'œuf, le couper en deux et le poser à côté.",
      "Servir avec la banane coupée en rondelles.",
    ],
  },
  {
    nom: 'Smoothie pomme-épinards-amande',
    categorie: 'petit-dej',
    emoji: '🥬',
    ingredients: [
      { nom: 'Pomme, crue, pulpe et peau', quantite: 150 },
      { nom: "Épinard, bouilli/cuit à l'eau", quantite: 30 },
      { nom: 'Lait demi-écrémé, UHT', quantite: 200 },
      { nom: 'Amande, grillée', quantite: 15 },
      { nom: 'Miel', quantite: 10 },
    ],
    etapes: [
      "Laver les épinards (frais) ou utiliser les épinards cuits égouttés.",
      "Éplucher et épépiner la pomme, la couper en morceaux.",
      "Verser tous les ingrédients dans le blender.",
      "Mixer 45 secondes jusqu'à obtenir une couleur verte uniforme.",
      "Boire tout de suite pour préserver les vitamines.",
    ],
  },
  {
    nom: 'Skyr + fruits rouges + flocons',
    categorie: 'petit-dej',
    emoji: '🫐',
    ingredients: [
      { nom: 'Skyr', quantite: 150 },
      { nom: 'Myrtille, crue', quantite: 50 },
      { nom: 'Fraise, crue', quantite: 50 },
      { nom: "Flocon d'avoine", quantite: 30 },
      { nom: 'Miel', quantite: 10 },
    ],
    etapes: [
      "Verser le skyr dans un bol (texture épaisse, riche en protéines).",
      "Laver et couper les fraises en quartiers.",
      "Disposer les fruits rouges et les flocons sur le dessus.",
      "Arroser de miel. Mélanger juste avant de déguster.",
    ],
  },

  // ═════════════════════════════ COLLATIONS (10) ═════════════════════════════
  {
    nom: 'Pomme + amandes',
    categorie: 'collation',
    emoji: '🍎',
    ingredients: [
      { nom: 'Pomme, crue, pulpe et peau', quantite: 150 },
      { nom: 'Amande, grillée', quantite: 20 },
    ],
    etapes: [
      "Laver la pomme, la couper en quartiers (garder la peau pour les fibres).",
      "Servir avec les amandes à côté.",
      "Classique équilibré : protéines + lipides + fibres en 200 kcal.",
    ],
  },
  {
    nom: 'Yaourt + miel + myrtilles',
    categorie: 'collation',
    emoji: '🍯',
    ingredients: [
      { nom: 'Yaourt nature', quantite: 125 },
      { nom: 'Miel', quantite: 10 },
      { nom: 'Myrtille, crue', quantite: 50 },
    ],
    etapes: [
      "Verser le yaourt dans un bol.",
      "Ajouter les myrtilles sur le dessus.",
      "Arroser de miel. Prêt en 30 secondes.",
    ],
  },
  {
    nom: 'Banane + beurre de cacahuète',
    categorie: 'collation',
    emoji: '🍌',
    ingredients: [
      { nom: 'Banane, pulpe, crue', quantite: 120 },
      { nom: "Beurre de cacahuète ou Pâte d'arachide", quantite: 20 },
    ],
    etapes: [
      "Éplucher la banane.",
      "La couper en rondelles ou manger à la main avec le beurre de cacahuète à côté.",
      "Variante sportive : tartiner sur du pain complet pour un snack pré-entraînement.",
    ],
  },
  {
    nom: 'Fromage blanc + noix + chocolat',
    categorie: 'collation',
    emoji: '🍫',
    ingredients: [
      { nom: 'Fromage blanc nature ou aux fruits (aliment moyen)', quantite: 150 },
      { nom: 'Noix', quantite: 15 },
      { nom: 'Chocolat noir à 40% de cacao minimum, à pâtisser, tablette', quantite: 15 },
    ],
    etapes: [
      "Verser le fromage blanc dans un ramequin.",
      "Concasser les noix au couteau ou à la main.",
      "Râper / émietter le chocolat noir.",
      "Mélanger le tout. Sain et gourmand en même temps.",
    ],
  },
  {
    nom: 'Toast avocat + œuf dur',
    categorie: 'collation',
    emoji: '🥑',
    ingredients: [
      { nom: 'Pain complet', quantite: 40 },
      { nom: 'Avocat, pulpe, cru', quantite: 60 },
      { nom: 'Oeuf, entier, cru', quantite: 60 },
      { nom: 'Tomate, crue', quantite: 40 },
    ],
    etapes: [
      "Cuire l'œuf dur 9 min dans l'eau bouillante.",
      "Griller le pain.",
      "Écraser l'avocat avec sel et poivre.",
      "Tartiner, poser les tranches d'œuf dur et les rondelles de tomate.",
    ],
  },
  {
    nom: 'Mix noisettes + pomme',
    categorie: 'collation',
    emoji: '🌰',
    ingredients: [
      { nom: 'Noisette', quantite: 20 },
      { nom: 'Pomme, crue, pulpe et peau', quantite: 130 },
    ],
    etapes: [
      "Couper la pomme en quartiers.",
      "Ajouter les noisettes entières.",
      "Idéal en encas de sport : magnésium + glucides lents.",
    ],
  },
  {
    nom: 'Skyr + fraises + amandes',
    categorie: 'collation',
    emoji: '🍓',
    ingredients: [
      { nom: 'Skyr', quantite: 150 },
      { nom: 'Fraise, crue', quantite: 80 },
      { nom: 'Amande, grillée', quantite: 10 },
    ],
    etapes: [
      "Verser le skyr (ultra protéiné, 11 g prot / 100 g).",
      "Laver et équeuter les fraises, les couper en deux.",
      "Concasser les amandes et saupoudrer.",
    ],
  },
  {
    nom: 'Œuf dur + carotte + pain',
    categorie: 'collation',
    emoji: '🥕',
    ingredients: [
      { nom: 'Oeuf, entier, cru', quantite: 60 },
      { nom: 'Carotte, crue', quantite: 100 },
      { nom: 'Pain complet', quantite: 30 },
    ],
    etapes: [
      "Cuire l'œuf dur 9 min.",
      "Éplucher la carotte et la tailler en bâtonnets.",
      "Servir avec une tranche de pain complet.",
      "Collation protéinée + fibres, parfaite avant ou après une séance.",
    ],
  },
  {
    nom: 'Tartine beurre de cacahuète + banane',
    categorie: 'collation',
    emoji: '🥜',
    ingredients: [
      { nom: 'Pain complet', quantite: 40 },
      { nom: "Beurre de cacahuète ou Pâte d'arachide", quantite: 15 },
      { nom: 'Banane, pulpe, crue', quantite: 100 },
      { nom: 'Miel', quantite: 5 },
    ],
    etapes: [
      "Griller le pain.",
      "Tartiner généreusement de beurre de cacahuète.",
      "Disposer les rondelles de banane par-dessus.",
      "Ajouter un filet de miel. Parfait avant séance.",
    ],
  },
  {
    nom: 'Bowl fromage blanc + fruits',
    categorie: 'collation',
    emoji: '🍇',
    ingredients: [
      { nom: 'Fromage blanc nature ou aux fruits (aliment moyen)', quantite: 200 },
      { nom: 'Myrtille, crue', quantite: 40 },
      { nom: 'Fraise, crue', quantite: 40 },
      { nom: 'Miel', quantite: 10 },
    ],
    etapes: [
      "Verser le fromage blanc dans un bol.",
      "Ajouter les fruits rouges frais ou surgelés.",
      "Arroser de miel. Servir bien frais.",
    ],
  },

  // ═════════════════════════════ DÉJEUNERS (10) ═════════════════════════════
  {
    nom: 'Poulet grillé + riz + brocoli',
    categorie: 'dejeuner',
    emoji: '🍗',
    ingredients: [
      { nom: 'Poulet, filet, grillé', quantite: 150 },
      { nom: 'Riz basmati, cuit, non salé', quantite: 200 },
      { nom: "Brocoli, bouilli/cuit à l'eau, croquant", quantite: 200 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
    ],
    etapes: [
      "Cuire le riz dans l'eau salée (10-12 min) selon l'emballage.",
      "Découper les fleurettes de brocoli, les cuire 5 min à la vapeur pour garder le croquant.",
      "Saler et poivrer le filet de poulet, le griller 5 min par face à feu moyen.",
      "Dresser : riz, brocoli, poulet tranché, filet d'huile d'olive en finition.",
    ],
  },
  {
    nom: 'Saumon + quinoa + épinards',
    categorie: 'dejeuner',
    emoji: '🐟',
    ingredients: [
      { nom: 'Saumon, atlantique, cuit', quantite: 150 },
      { nom: "Quinoa, bouilli/cuit à l'eau, non salé", quantite: 200 },
      { nom: "Épinard, bouilli/cuit à l'eau", quantite: 150 },
      { nom: 'Huile d\'olive vierge extra', quantite: 10 },
    ],
    etapes: [
      "Rincer le quinoa sous l'eau froide, cuire 15 min dans 2x son volume d'eau.",
      "Faire cuire les épinards 5 min à la poêle avec un trait d'huile.",
      "Cuire le saumon 4 min par face à la poêle (peau en dessous d'abord).",
      "Dresser et arroser d'un filet d'huile d'olive + jus de citron.",
    ],
  },
  {
    nom: 'Pâtes sauce tomate + bœuf haché',
    categorie: 'dejeuner',
    emoji: '🍝',
    ingredients: [
      { nom: 'Pâtes alimentaires, cuites, non salées', quantite: 200 },
      { nom: 'Boeuf, steak haché 10% MG, cuit', quantite: 120 },
      { nom: 'Sauce tomate à la viande ou Sauce bolognaise, préemballée', quantite: 100 },
      { nom: 'Courgette, crue', quantite: 100 },
      { nom: 'Emmental', quantite: 20 },
    ],
    etapes: [
      "Cuire les pâtes al dente (selon l'emballage).",
      "Faire revenir le bœuf haché 5 min dans une poêle, égoutter la graisse.",
      "Râper la courgette, l'ajouter au bœuf pour apporter des légumes cachés.",
      "Verser la sauce tomate, laisser mijoter 5 min.",
      "Servir sur les pâtes, parsemer d'emmental râpé.",
    ],
  },
  {
    nom: 'Salade poulet-avocat-œuf',
    categorie: 'dejeuner',
    emoji: '🥗',
    ingredients: [
      { nom: 'Poulet, filet, grillé', quantite: 130 },
      { nom: 'Avocat, pulpe, cru', quantite: 80 },
      { nom: 'Oeuf, entier, cru', quantite: 60 },
      { nom: 'Tomate, crue', quantite: 100 },
      { nom: 'Concombre, pulpe et peau, cru', quantite: 80 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
    ],
    etapes: [
      "Cuire l'œuf dur 9 min.",
      "Faire griller le filet de poulet 5 min par face, le trancher fin.",
      "Couper la tomate, le concombre et l'avocat en morceaux.",
      "Dresser la salade dans un grand bol.",
      "Assaisonner avec l'huile d'olive, sel, poivre, jus de citron.",
    ],
  },
  {
    nom: 'Thon + lentilles + tomate',
    categorie: 'dejeuner',
    emoji: '🐟',
    ingredients: [
      { nom: 'Thon albacore ou thon jaune, au naturel, appertisé, égoutté', quantite: 120 },
      { nom: "Lentille verte, bouillie/cuite à l'eau", quantite: 180 },
      { nom: 'Tomate, crue', quantite: 100 },
      { nom: "Huile d'olive vierge extra", quantite: 8 },
    ],
    etapes: [
      "Égoutter les lentilles et le thon.",
      "Couper la tomate en petits dés.",
      "Mélanger tout dans un saladier.",
      "Assaisonner avec l'huile d'olive, sel, poivre, vinaigre balsamique.",
      "Salade complète protéines + glucides lents, idéale en batch-cooking.",
    ],
  },
  {
    nom: 'Bowl saumon-riz-avocat (poke)',
    categorie: 'dejeuner',
    emoji: '🍣',
    ingredients: [
      { nom: 'Saumon, atlantique, cuit', quantite: 130 },
      { nom: 'Riz basmati, cuit, non salé', quantite: 200 },
      { nom: 'Avocat, pulpe, cru', quantite: 80 },
      { nom: 'Concombre, pulpe et peau, cru', quantite: 60 },
      { nom: 'Carotte, crue', quantite: 50 },
      { nom: "Huile d'olive vierge extra", quantite: 5 },
    ],
    etapes: [
      "Cuire le riz basmati.",
      "Cuire le saumon à la poêle ou le manger cru (qualité sashimi uniquement).",
      "Émincer le concombre et râper la carotte.",
      "Dresser dans un bowl : riz au fond, saumon, avocat, concombre, carotte.",
      "Arroser d'un peu de sauce soja + huile d'olive (optionnel : sésame grillé).",
    ],
  },
  {
    nom: 'Pâtes pesto + poulet',
    categorie: 'dejeuner',
    emoji: '🌿',
    ingredients: [
      { nom: 'Pâtes alimentaires, cuites, non salées', quantite: 200 },
      { nom: 'Poulet, filet, grillé', quantite: 130 },
      { nom: 'Sauce pesto, préemballée', quantite: 30 },
      { nom: 'Tomate, crue', quantite: 100 },
      { nom: 'Emmental', quantite: 15 },
    ],
    etapes: [
      "Cuire les pâtes al dente.",
      "Couper le poulet grillé en lamelles, les couper les tomates en deux.",
      "Égoutter les pâtes, les mélanger avec le pesto.",
      "Ajouter le poulet et les tomates, parsemer d'emmental.",
    ],
  },
  {
    nom: 'Omelette + salade verte',
    categorie: 'dejeuner',
    emoji: '🍳',
    ingredients: [
      { nom: 'Oeuf, entier, cru', quantite: 180 },
      { nom: 'Emmental', quantite: 25 },
      { nom: 'Tomate, crue', quantite: 100 },
      { nom: 'Pain complet', quantite: 60 },
      { nom: "Huile d'olive vierge extra", quantite: 8 },
    ],
    etapes: [
      "Battre les œufs avec sel, poivre et l'emmental râpé.",
      "Cuire l'omelette à feu moyen dans une poêle huilée 3-4 min.",
      "Plier en deux, servir avec la tomate en quartiers et le pain.",
      "Assaisonner la salade d'huile d'olive et jus de citron.",
    ],
  },
  {
    nom: 'Steak haché + patate douce + épinards',
    categorie: 'dejeuner',
    emoji: '🥩',
    ingredients: [
      { nom: 'Boeuf, steak haché 10% MG, cuit', quantite: 130 },
      { nom: 'Patate douce, cuite', quantite: 200 },
      { nom: "Épinard, bouilli/cuit à l'eau", quantite: 150 },
      { nom: "Huile d'olive vierge extra", quantite: 8 },
    ],
    etapes: [
      "Laver la patate douce, la piquer et la cuire au four à 200 °C pendant 40 min (ou micro-ondes 8 min).",
      "Cuire le steak haché 3-4 min par face à la poêle.",
      "Faire revenir les épinards 3 min avec l'huile d'olive + ail écrasé.",
      "Couper la patate douce en deux, servir avec le steak et les épinards.",
    ],
  },
  {
    nom: 'Poulet curry + riz + haricots verts',
    categorie: 'dejeuner',
    emoji: '🌶️',
    ingredients: [
      { nom: 'Poulet, filet, grillé', quantite: 150 },
      { nom: 'Riz basmati, cuit, non salé', quantite: 180 },
      { nom: "Haricot vert, bouilli/cuit à l'eau", quantite: 150 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
    ],
    etapes: [
      "Couper le poulet en dés, le saler et l'enrober de curry en poudre.",
      "Faire revenir 6-8 min dans une poêle avec l'huile d'olive.",
      "Cuire le riz et les haricots verts à la vapeur.",
      "Dresser : riz, haricots verts, poulet curry. Filet de jus de citron.",
    ],
  },

  // ═════════════════════════════ DÎNERS (10) ═════════════════════════════
  {
    nom: 'Cabillaud + pommes de terre + courgettes',
    categorie: 'diner',
    emoji: '🐟',
    ingredients: [
      { nom: 'Cabillaud, cuit à la vapeur', quantite: 150 },
      { nom: "Pomme de terre de conservation, sans peau, bouillie/cuite à l'eau", quantite: 200 },
      { nom: 'Courgette, crue', quantite: 150 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
    ],
    etapes: [
      "Éplucher les pommes de terre, les cuire 20 min à l'eau salée.",
      "Émincer la courgette en rondelles, la faire sauter 5 min à l'huile d'olive avec ail.",
      "Cuire le cabillaud à la vapeur 8-10 min.",
      "Dresser, arroser d'un filet de citron et d'huile d'olive.",
    ],
  },
  {
    nom: 'Dorade au four + haricots verts',
    categorie: 'diner',
    emoji: '🐠',
    ingredients: [
      { nom: 'Dorade (Daurade) royale, cuite au four', quantite: 180 },
      { nom: "Haricot vert, bouilli/cuit à l'eau", quantite: 180 },
      { nom: 'Patate douce, cuite', quantite: 150 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
    ],
    etapes: [
      "Préchauffer le four à 200 °C.",
      "Enrober la dorade d'huile d'olive, sel, thym. Cuire 20 min.",
      "Cuire les haricots verts 8 min à l'eau bouillante.",
      "Cuire la patate douce au four en même temps que la dorade.",
      "Dresser et arroser de jus de citron.",
    ],
  },
  {
    nom: 'Salade grecque complète',
    categorie: 'diner',
    emoji: '🥗',
    ingredients: [
      { nom: 'Tomate, crue', quantite: 200 },
      { nom: 'Concombre, pulpe et peau, cru', quantite: 150 },
      { nom: 'Feta AOP', quantite: 60 },
      { nom: 'Olive noire (aliment moyen)', quantite: 30 },
      { nom: 'Pain complet', quantite: 60 },
      { nom: "Huile d'olive vierge extra", quantite: 15 },
    ],
    etapes: [
      "Couper la tomate en quartiers et le concombre en demi-rondelles.",
      "Émietter la feta en gros morceaux.",
      "Mélanger avec les olives dans un saladier.",
      "Assaisonner généreusement d'huile d'olive, origan, sel, poivre.",
      "Servir avec le pain complet pour saucer.",
    ],
  },
  {
    nom: 'Poulet au four + carottes + brocoli',
    categorie: 'diner',
    emoji: '🍗',
    ingredients: [
      { nom: 'Poulet, filet, grillé', quantite: 140 },
      { nom: 'Carotte, crue', quantite: 150 },
      { nom: "Brocoli, bouilli/cuit à l'eau, croquant", quantite: 150 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
    ],
    etapes: [
      "Préchauffer le four à 190 °C.",
      "Éplucher les carottes et les couper en bâtonnets, découper le brocoli.",
      "Disposer les légumes sur une plaque, arroser d'huile d'olive, sel, thym.",
      "Cuire le poulet sur la même plaque 20-25 min.",
      "Servir avec un filet de citron.",
    ],
  },
  {
    nom: 'Truite + quinoa + courgette',
    categorie: 'diner',
    emoji: '🐟',
    ingredients: [
      { nom: 'Truite, cuite à la vapeur', quantite: 150 },
      { nom: "Quinoa, bouilli/cuit à l'eau, non salé", quantite: 180 },
      { nom: 'Courgette, crue', quantite: 150 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
      { nom: 'Amande, grillée', quantite: 10 },
    ],
    etapes: [
      "Rincer et cuire le quinoa 15 min.",
      "Émincer la courgette, la faire dorer 5 min à la poêle avec l'huile d'olive.",
      "Cuire la truite à la vapeur 10-12 min (ou en papillote au four 15 min).",
      "Dresser et parsemer d'amandes concassées.",
    ],
  },
  {
    nom: 'Omelette aux champignons + salade',
    categorie: 'diner',
    emoji: '🍄',
    ingredients: [
      { nom: 'Oeuf, entier, cru', quantite: 180 },
      { nom: "Champignon de Paris ou champignon de couche, bouilli/cuit à l'eau", quantite: 100 },
      { nom: 'Emmental', quantite: 25 },
      { nom: 'Pain complet', quantite: 60 },
      { nom: "Huile d'olive vierge extra", quantite: 8 },
      { nom: 'Tomate, crue', quantite: 80 },
    ],
    etapes: [
      "Faire revenir les champignons émincés 5 min avec l'huile d'olive.",
      "Battre les œufs avec sel, poivre, persil.",
      "Verser sur les champignons, parsemer d'emmental, cuire 4 min.",
      "Plier en deux et servir avec la tomate et le pain.",
    ],
  },
  {
    nom: 'Saumon + pâtes + épinards',
    categorie: 'diner',
    emoji: '🐟',
    ingredients: [
      { nom: 'Saumon, atlantique, cuit', quantite: 150 },
      { nom: 'Pâtes alimentaires, cuites, non salées', quantite: 180 },
      { nom: "Épinard, bouilli/cuit à l'eau", quantite: 150 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
      { nom: 'Fromage blanc nature ou aux fruits (aliment moyen)', quantite: 50 },
    ],
    etapes: [
      "Cuire les pâtes al dente.",
      "Faire fondre les épinards à la poêle 5 min avec l'huile d'olive + ail.",
      "Ajouter le fromage blanc pour créer une sauce crémeuse légère.",
      "Mélanger pâtes + sauce épinards, dresser avec le saumon tranché.",
    ],
  },
  {
    nom: 'Dinde + riz + poêlée de légumes',
    categorie: 'diner',
    emoji: '🦃',
    ingredients: [
      { nom: 'Dinde, escalope, grillée', quantite: 140 },
      { nom: 'Riz basmati, cuit, non salé', quantite: 180 },
      { nom: 'Courgette, crue', quantite: 100 },
      { nom: 'Tomate, crue', quantite: 80 },
      { nom: "Huile d'olive vierge extra", quantite: 10 },
    ],
    etapes: [
      "Cuire le riz.",
      "Couper la courgette et la tomate en dés, faire sauter à la poêle 5 min.",
      "Griller l'escalope 3 min par face dans la même poêle.",
      "Dresser et arroser d'un filet de citron.",
    ],
  },
  {
    nom: 'Pois chiches + légumes rôtis',
    categorie: 'diner',
    emoji: '🫘',
    ingredients: [
      { nom: "Pois chiche, bouilli/cuit à l'eau", quantite: 180 },
      { nom: 'Courgette, crue', quantite: 120 },
      { nom: 'Carotte, crue', quantite: 100 },
      { nom: 'Tomate, crue', quantite: 100 },
      { nom: 'Feta AOP', quantite: 40 },
      { nom: "Huile d'olive vierge extra", quantite: 12 },
    ],
    etapes: [
      "Préchauffer le four à 200 °C.",
      "Couper courgette et carotte en dés, tomate en quartiers.",
      "Mélanger avec les pois chiches, arroser d'huile d'olive + épices (cumin, paprika).",
      "Enfourner 25 min.",
      "Sortir, émietter la feta par-dessus. Servir chaud.",
    ],
  },
  {
    nom: 'Soupe de légumes + œuf + pain',
    categorie: 'diner',
    emoji: '🍲',
    ingredients: [
      { nom: 'Courgette, crue', quantite: 200 },
      { nom: 'Carotte, crue', quantite: 100 },
      { nom: 'Tomate, crue', quantite: 100 },
      { nom: 'Oeuf, entier, cru', quantite: 60 },
      { nom: 'Pain complet', quantite: 60 },
      { nom: 'Emmental', quantite: 20 },
      { nom: "Huile d'olive vierge extra", quantite: 8 },
    ],
    etapes: [
      "Éplucher carotte et courgette, couper en dés. Peler la tomate.",
      "Faire revenir 2 min dans une casserole avec l'huile d'olive.",
      "Couvrir d'eau, saler, cuire 20 min.",
      "Mixer finement. Pocher l'œuf directement dans la soupe chaude 3 min.",
      "Servir avec du pain et de l'emmental râpé sur le dessus.",
    ],
  },
];
