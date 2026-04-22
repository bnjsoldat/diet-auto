// Test de la regex de blocklist des suggestions (2026-04-22)

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
    '|\\b(?:vin|bi[èe]re|cidre|champagne|crémant|cr[èe]me de (?:cassis|menthe|framboise|mûre|pêche|cacao|whisky))\\b' +
    '|\\b(?:whisky|vodka|rhum|gin|cognac|pastis|liqueur|kir|martini|apéritif|eau-de-vie|calvados|digestif)\\b',
  'i'
);

const tests = [
  ['Pop-corn ou Maïs éclaté, au caramel', true],
  ['Pop-corn ou Maïs éclaté, à l\'air, non salé', true],
  ['Crème de cassis', true],
  ['Crème de menthe', true],
  ['Vin rouge', true],
  ['Whisky', true],
  ['Barre chocolatée au caramel', true],
  ['Chips nature', true],
  ['Bonbon acidulé', true],
  // Faux positifs à éviter :
  ['Yaourt nature', false],
  ['Pain complet', false],
  ['Poulet, filet, grillé', false],
  ['Crème de lait, 15 à 20% MG, légère, épaisse, rayon frais', false],
  ['Crème fraîche', false],
  ['Saumon, atlantique, cuit', false],
];

let allPass = true;
for (const [name, shouldBlock] of tests) {
  const blocked = SUGGEST_NEVER_PATTERN.test(name);
  const ok = blocked === shouldBlock;
  if (!ok) allPass = false;
  console.log(`${ok ? '✅' : '❌'} ${blocked ? 'BLOQUÉ' : 'OK    '} — "${name}"${ok ? '' : ` (attendu ${shouldBlock ? 'BLOQUÉ' : 'OK'})`}`);
}
console.log(allPass ? '\n✅ Tous les tests passent' : '\n❌ Certains tests ont échoué');
process.exit(allPass ? 0 : 1);
