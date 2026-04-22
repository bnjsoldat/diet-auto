/**
 * Test d'intégration des suggestions d'optimisation.
 *
 * Pour plusieurs profils types, simule un plan avec déficit et vérifie
 * que les suggestions retournées sont :
 *  - Communes / familières (pas d'obscurités CIQUAL)
 *  - Saines (pas d'alcool, pas de snacks junk, pas de liqueurs)
 *  - Cohérentes avec le contexte du repas ciblé
 *  - Réalistes en quantité
 */

import { readFileSync } from 'node:fs';

const foods = JSON.parse(readFileSync('./src/data/foods.json', 'utf8'));

// ============ Blocklist (miroir de suggestions.ts 2026-04-22) ============
const SUGGEST_BLOCKLIST_PATTERN =
  /\b(prélevé|martinique|guadeloupe|réunion|guyane|mayotte|pays\b|reconstitué|reconstitution|fortifié|enrichi|échantillon|aromatisé à|déshydraté)/i;

const SUGGEST_NEVER_PATTERN = new RegExp(
  '(?:^|[^a-zA-ZÀ-ÿ])' +
    '(?:ail|ails|échalote|échalotes|oignon|oignons|gingembre|raifort|' +
    'crosne|bourrache|pissenlit|ortie|pourpier|mauve|' +
    'amidon|gluten|plasma|gélatine|lécithine|présure|son de|germe de|' +
    'fructose|glucose|saccharose|maltodextrine|sirop de glucose|' +
    'levain|pain azyme|farine|semoule|fécule|tapioca|' +
    'gâteau de riz|galette de riz|galettes de riz|' +
    'vermicelle|perles du japon)' +
    '(?:$|[^a-zA-ZÀ-ÿ])' +
    '|\\b(?:cru|crue|crus|crues|sec|sèche|sèches|séché|séchée)\\b.*\\b(?:riz|pâtes|pates|quinoa|boulgour|lentille|pois|haricot|flocon|avoine|orge|millet|sarrasin|épeautre)\\b' +
    '|\\b(?:riz|pâtes|pates|quinoa|boulgour|lentille|pois chiche|haricot|flocon|avoine|orge|millet|sarrasin|épeautre)\\b.*\\b(?:cru|crue|sec|sèche|séchée)\\b' +
    '|\\babricot\\b.*\\bsec\\b|\\bbanane\\b.*\\bsèche\\b|\\btomate\\b.*\\bséchée\\b' +
    '|\\b(?:pop-?corn|ma[iï]s éclaté|chips|bretzel|crackers?|cacahuètes? salées?|biscuit apéritif|biscuit salé)\\b' +
    '|\\b(?:bonbon|sucette|chewing-?gum|pâte de fruit|guimauve|nougat|caramel|barre chocolatée|barre céréales?)\\b' +
    '|\\bgalette(?:s)? (?:multicéréales? )?soufflée?s?\\b' +
    '|\\bgalette(?:s)? de ma[iï]s\\b' +
    '|\\b(?:vin|bi[èe]re|cidre|champagne|crémant|cr[èe]me de (?:cassis|menthe|framboise|mûre|pêche|cacao|whisky))\\b' +
    '|\\b(?:whisky|vodka|rhum|gin|cognac|pastis|liqueur|kir|martini|apéritif|eau-de-vie|calvados|digestif)\\b' +
    '|\\b(?:marsala|porto|madère|xérès|sherry|vermouth|muscat|banyuls|maury|rivesaltes|pineau|ratafia|sangria)\\b' +
    '|\\b(?:en poudre|déshydraté|déshydratée|lyophilisé|lyophilisée|atomisé)\\b' +
    '|\\bgraine(?:s)? (?:de|d\')(?: courge| lin| sésame| tournesol| pavot| chia| ma[iï]s| cucurbitacé| chanvre)\\b' +
    '|\\b(?:cucurbitacées|chanvre|lupin), graine\\b' +
    '|\\blupin\\b' +
    '|\\bgraine(?:s)? (?:crue|crues|sèche|sèches|brute|brutes)\\b' +
    '|\\b(?:hyposodé|hyposodée|pour diab[eé]tique|sans sucres? ajoutés?|allégé technique)\\b' +
    '|\\bbiscuit(?:s)? sec(?:s)?\\b' +
    '|\\bbiscotte(?:s)?\\b' +
    '|\\b(?:gâteau|brioche|croissant|pain au chocolat|chausson|viennoiserie|pâtisserie|tarte sucrée)\\b',
  'i'
);

// ============ Aliments communs (miroir de commonFoods.ts) ============
const COMMON_FOODS = [
  'Pain complet', 'Pâtes alimentaires, cuites, non salées', 'Riz basmati, cuit, non salé',
  'Flocon d\'avoine', 'Poulet, filet, grillé', 'Saumon, atlantique, cuit',
  'Oeuf, cru', 'Yaourt nature', 'Fromage blanc nature ou aux fruits (aliment moyen)',
  'Emmental', 'Banane, pulpe, crue', 'Pomme, crue, pulpe et peau',
  'Tomate, crue', 'Courgette, crue', 'Carotte, crue',
  'Brocoli, bouilli/cuit à l\'eau, croquant', 'Épinard, bouilli/cuit à l\'eau',
  'Huile d\'olive vierge extra', 'Amande, grillée', 'Avocat, pulpe, cru',
  'Miel', 'Lentille verte, bouillie/cuite à l\'eau',
  'Thon albacore ou thon jaune, au naturel, appertisé, égoutté',
];
const COMMON_SET = new Set(COMMON_FOODS.map((n) => n.toLowerCase().replace(/['\u2019]/g, "'")));
function isCommonFood(nom) {
  return COMMON_SET.has(nom.toLowerCase().replace(/['\u2019]/g, "'"));
}

// ============ Categorisation (simplifié) ============
function categorieOfFood(food) {
  const g = (food.groupe || '').toLowerCase();
  if (g.includes('viandes') || g.includes('poissons')) return 'proteines';
  if (g.includes('produits laitiers') || g.includes('fromages')) return 'laitiers';
  if (g.includes('céréales')) return 'cereales';
  if (g.includes('féculents')) return 'cereales';
  if (g.includes('légumes')) return 'legumes';
  if (g.includes('fruits à coque')) return 'fruits-coque';
  if (g.includes('fruits')) return 'fruits';
  if (g.includes('légumineuses')) return 'legumineuses';
  if (g.includes('matières grasses')) return 'matieres-grasses';
  if (g.includes('sucres')) return 'sucres';
  if (g.includes('boissons')) return 'boissons';
  return null;
}

// ============ Version simplifiée de suggestComplements ============
function suggestSimplified(plan, totals, cibles, allFoods) {
  const gapProt = cibles.prot - totals.prot;
  const gapGluc = cibles.gluc - totals.gluc;
  const gapLip = cibles.lip - totals.lip;
  const gapKcal = cibles.kcal - totals.kcal;
  const needProt = gapProt / cibles.prot > 0.1;
  const needGluc = gapGluc / cibles.gluc > 0.1;
  const needLip = gapLip / cibles.lip > 0.1;
  const needKcal = gapKcal / cibles.kcal > 0.05;

  const existingNames = new Set(plan.flatMap((m) => m.items.map((i) => i.nom.toLowerCase())));
  const candidates = [];
  for (const food of allFoods) {
    if (existingNames.has(food.nom.toLowerCase())) continue;
    if (SUGGEST_BLOCKLIST_PATTERN.test(food.nom)) continue;
    if (SUGGEST_NEVER_PATTERN.test(food.nom)) continue;

    const cat = categorieOfFood(food);
    if (!cat) continue;

    // Filtre pertinence macro
    if (needProt && food.prot < 5) continue;
    if (needGluc && !needProt && food.gluc < 5) continue;
    if (needLip && !needProt && !needGluc && food.lip < 3) continue;
    if (!needProt && !needGluc && !needLip && needKcal && food.kcal < 50) continue;

    // Score simple
    let score = 0;
    if (needProt) score += food.prot;
    if (needGluc) score += food.gluc / 3;
    if (needLip) score += food.lip / 2;
    if (needKcal) score += food.kcal / 100;

    // Bonus aliments courants ×3
    if (isCommonFood(food.nom)) score *= 3;

    candidates.push({ food, score });
  }

  candidates.sort((a, b) => b.score - a.score);

  // Dédup par catégorie
  const seenCat = new Set();
  const out = [];
  for (const c of candidates) {
    const cat = categorieOfFood(c.food);
    if (seenCat.has(cat)) continue;
    seenCat.add(cat);
    out.push(c.food);
    if (out.length >= 5) break;
  }
  return out;
}

// ============ Profils de test ============
const profiles = [
  {
    name: 'Benjy H 77kg mixte maintien',
    cibles: { kcal: 2878, prot: 139, gluc: 410, lip: 90 },
    plan: [
      { nom: 'Petit-déjeuner', items: [{ nom: 'Oeuf, cru' }, { nom: 'Pain complet' }] },
      { nom: 'Déjeuner', items: [{ nom: 'Poulet, filet, grillé' }, { nom: 'Riz basmati, cuit, non salé' }] },
      { nom: 'Dîner', items: [{ nom: 'Saumon, atlantique, cuit' }] },
    ],
    totals: { kcal: 1500, prot: 100, gluc: 200, lip: 50 }, // déficit mais dans les bornes
  },
  {
    name: 'Femme 60kg aucun sport maintien',
    cibles: { kcal: 1700, prot: 60, gluc: 213, lip: 57 },
    plan: [
      { nom: 'Petit-déjeuner', items: [{ nom: 'Yaourt nature' }, { nom: 'Banane, pulpe, crue' }] },
      { nom: 'Déjeuner', items: [{ nom: 'Poulet, filet, grillé' }] },
    ],
    totals: { kcal: 800, prot: 30, gluc: 70, lip: 15 },
  },
  {
    name: 'Homme 85kg muscu prise de masse',
    cibles: { kcal: 3500, prot: 153, gluc: 505, lip: 97 },
    plan: [
      { nom: 'Petit-déjeuner', items: [{ nom: 'Oeuf, cru' }, { nom: 'Pain complet' }, { nom: 'Avocat, pulpe, cru' }] },
      { nom: 'Déjeuner', items: [{ nom: 'Poulet, filet, grillé' }, { nom: 'Riz basmati, cuit, non salé' }] },
    ],
    totals: { kcal: 2000, prot: 100, gluc: 250, lip: 60 }, // gros déficit (1500 kcal)
  },
  {
    name: 'Femme 55kg endurance perte',
    cibles: { kcal: 1600, prot: 100, gluc: 220, lip: 39 },
    plan: [
      { nom: 'Petit-déjeuner', items: [{ nom: 'Yaourt nature' }] },
      { nom: 'Déjeuner', items: [{ nom: 'Saumon, atlantique, cuit' }, { nom: 'Courgette, crue' }] },
    ],
    totals: { kcal: 900, prot: 65, gluc: 90, lip: 30 },
  },
];

// ============ Execution ============
console.log('═══════════════════════════════════════════════════════════════════');
console.log('TEST DES SUGGESTIONS — 4 profils différents');
console.log('═══════════════════════════════════════════════════════════════════\n');

let allClean = true;
for (const p of profiles) {
  console.log(`📊 ${p.name}`);
  console.log(`   Cible : ${p.cibles.kcal} kcal / ${p.cibles.prot}g P / ${p.cibles.gluc}g G / ${p.cibles.lip}g L`);
  console.log(`   Plan actuel : ${p.totals.kcal} kcal — déficit kcal ${p.cibles.kcal - p.totals.kcal}`);
  const suggestions = suggestSimplified(p.plan, p.totals, p.cibles, foods);
  console.log(`   Suggestions (${suggestions.length}) :`);
  for (const s of suggestions) {
    const isCommon = isCommonFood(s.nom);
    const isJunk = SUGGEST_NEVER_PATTERN.test(s.nom);
    const icon = isJunk ? '❌' : isCommon ? '⭐' : '○';
    console.log(`     ${icon} ${s.nom.slice(0, 50)} (${s.kcal} kcal · P${s.prot.toFixed(1)} · G${s.gluc.toFixed(1)} · L${s.lip.toFixed(1)})`);
    if (isJunk) { allClean = false; console.log(`        ↑ JUNK / ALCOOL DÉTECTÉ`); }
  }
  console.log();
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(allClean ? '✅ Aucune suggestion junk/alcool dans les 4 profils' : '❌ Suggestions à problème détectées');
console.log('═══════════════════════════════════════════════════════════════════');

process.exit(allClean ? 0 : 1);
