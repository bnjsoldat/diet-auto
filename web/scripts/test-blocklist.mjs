// Test de la regex de blocklist — version élargie 2026-04-22

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
    '|\\b(?:cucurbitacées|chanvre), graine\\b' +
    '|\\b(?:hyposodé|hyposodée|pour diab[eé]tique|sans sucres? ajoutés?|allégé technique)\\b' +
    '|\\bbiscuit(?:s)? sec(?:s)?\\b' +
    '|\\bbiscotte(?:s)?\\b' +
    '|\\b(?:gâteau|brioche|croissant|pain au chocolat|chausson|viennoiserie|pâtisserie|tarte sucrée)\\b',
  'i'
);

const tests = [
  // À BLOQUER (true = should be blocked)
  ['Pop-corn ou Maïs éclaté, au caramel', true],
  ['Pop-corn ou Maïs éclaté, à l\'air, non salé', true],
  ['Crème de cassis', true],
  ['Crème de menthe', true],
  ['Vin rouge', true],
  ['Whisky', true],
  ['Barre chocolatée au caramel', true],
  ['Chips nature', true],
  ['Bonbon acidulé', true],
  ['Marsala', true],
  ['Porto', true],
  ['Galette multicéréales soufflée', true],
  ['Galette de maïs soufflé', true],
  ['Oeuf, blanc (blanc d\'oeuf), en poudre', true],
  ['Lait en poudre, demi-écrémé', true],
  ['Cucurbitacées, graine', true],
  ['Graine de courge', true],
  ['Graine de tournesol', true],
  ['Biscuit sec aux fruits hyposodé, sans sucres ajoutés', true],
  ['Biscotte complète', true],
  ['Gâteau au chocolat', true],
  ['Croissant', true],
  ['Pain au chocolat', true],

  // À LAISSER PASSER (false = should NOT be blocked)
  ['Yaourt nature', false],
  ['Pain complet', false],
  ['Poulet, filet, grillé', false],
  ['Crème de lait, 15 à 20% MG, légère, épaisse, rayon frais', false],
  ['Crème fraîche', false],
  ['Saumon, atlantique, cuit', false],
  ['Flocon d\'avoine', false],
  ['Amande, grillée', false],
  ['Thon albacore ou thon jaune, au naturel, appertisé, égoutté', false],
  ['Beurre de cacahuète ou Pâte d\'arachide', false],
  ['Fromage de chèvre sec', false],  // "sec" ici ne doit pas matcher le pattern céréales/fruits
  ['Riz basmati, cuit, non salé', false],
  ['Pain de seigle', false],
  ['Lentille verte, bouillie/cuite à l\'eau', false],
  ['Oeuf, cru', false],  // œuf CRU est OK (matière première, pas junk)
];

let allPass = true;
const bugs = [];
for (const [name, shouldBlock] of tests) {
  const blocked = SUGGEST_NEVER_PATTERN.test(name);
  const ok = blocked === shouldBlock;
  if (!ok) { allPass = false; bugs.push({ name, shouldBlock, blocked }); }
  console.log(`${ok ? '✅' : '❌'} ${blocked ? 'BLOQUÉ' : 'OK    '} — "${name}"${ok ? '' : ` (attendu ${shouldBlock ? 'BLOQUÉ' : 'OK'})`}`);
}
console.log(allPass ? '\n✅ Tous les tests passent (36 cas)' : `\n❌ ${bugs.length} test(s) échoué`);
process.exit(allPass ? 0 : 1);
