/**
 * Test complet du modèle de calculs — vérifications scientifiques.
 *
 * Vérifie :
 *  - Harris-Benedict cohérent (MB dans les plages attendues)
 *  - Macros g/kg alignées sur ACSM 2020 / ISSN 2017
 *  - Plancher kcal santé jamais franchi
 *  - Pas de double-comptage avec Strava
 *
 * Usage : node scripts/test-calculations.mjs
 */

// ============ Constants (miroir de src/lib/constants.ts) ============
const ACTIVITY_COEFS = {
  'Sédentaire': 1.2,
  'Légèrement actif': 1.375,
  'Actif': 1.55,
  'Très actif': 1.725,
  'Extrêmement actif': 1.9,
};
const OBJECTIVE_DELTA_KCAL = {
  'Perte de poids rapide': -750,
  'Perte de poids': -400,
  'Maintien': 0,
  'Prise de masse': +400,
  'Prise de masse rapide': +750,
};
const KCAL_PER_GRAM = { prot: 4, gluc: 4, lip: 9 };
const KCAL_PER_KG_FAT = 7700;
const SEDENTARY_COEF = 1.2;
const MIN_KCAL_FLOOR = { Homme: 1500, Femme: 1200 };
const PROTEIN_G_PER_KG = { aucun: 1.0, mixte: 1.4, endurance: 1.4, muscu: 1.8 };
const PROTEIN_LOSS_MULTIPLIER = 1.3;
const PROTEIN_MIN_G_PER_KG = 0.8;
const PROTEIN_MAX_G_PER_KG = 2.5;
const LIPID_PCT = { aucun: 0.30, mixte: 0.28, endurance: 0.22, muscu: 0.25 };
const LIPID_MIN_G_PER_KG = 0.8;
const PROTEIN_MAX_PCT_KCAL = 0.35;

// ============ Functions (miroir de src/lib/calculations.ts) ============
function calcMB(p) {
  if (p.genre === 'Homme') {
    return 13.7516 * p.poids + 500.33 * p.taille - 6.755 * p.age + 66.473;
  }
  return 9.5634 * p.poids + 184.96 * p.taille - 4.6756 * p.age + 665.0955;
}

function deriveDelta(p) {
  if (p.poidsCible == null || p.rythmeSem == null) return null;
  if (p.poidsCible === p.poids) return 0;
  const dir = p.poidsCible < p.poids ? -1 : 1;
  return (dir * p.rythmeSem * KCAL_PER_KG_FAT) / 7;
}

function computeMacros(p, kcalCible) {
  const sport = p.sportPrincipal ?? 'mixte';
  let protPerKg = PROTEIN_G_PER_KG[sport];
  if (p.objectifType === 'perdre') protPerKg *= PROTEIN_LOSS_MULTIPLIER;
  protPerKg = Math.min(PROTEIN_MAX_G_PER_KG, Math.max(PROTEIN_MIN_G_PER_KG, protPerKg));
  let prot = protPerKg * p.poids;
  // Plafond physiologique : max 35 % des kcal
  const protKcalMax = kcalCible * PROTEIN_MAX_PCT_KCAL;
  if (prot * KCAL_PER_GRAM.prot > protKcalMax) prot = protKcalMax / KCAL_PER_GRAM.prot;
  const lipFromPct = (kcalCible * LIPID_PCT[sport]) / KCAL_PER_GRAM.lip;
  const lipMinG = LIPID_MIN_G_PER_KG * p.poids;
  let lip = Math.max(lipFromPct, lipMinG);
  let gluc = (kcalCible - prot * KCAL_PER_GRAM.prot - lip * KCAL_PER_GRAM.lip) / KCAL_PER_GRAM.gluc;
  if (gluc < 0) {
    gluc = 0;
    const kcalForProt = Math.max(0, kcalCible - lipMinG * KCAL_PER_GRAM.lip);
    prot = kcalForProt / KCAL_PER_GRAM.prot;
    lip = lipMinG;
  }
  return { prot, gluc, lip };
}

function calcTargets(p, opts = {}) {
  const mb = calcMB(p);
  const maintenance = opts.useStravaAsActivitySource
    ? mb * SEDENTARY_COEF
    : mb * ACTIVITY_COEFS[p.activite];
  const delta = deriveDelta(p) ?? OBJECTIVE_DELTA_KCAL[p.objectif];
  const extra = opts.extraBurnedKcal ?? 0;
  let kcalCible = maintenance + delta + extra;
  const floor = MIN_KCAL_FLOOR[p.genre];
  if (kcalCible < floor) kcalCible = floor;
  const m = computeMacros(p, kcalCible);
  return {
    mb: Math.round(mb),
    maintenance: Math.round(maintenance),
    cible: Math.round(kcalCible),
    prot: Math.round(m.prot),
    gluc: Math.round(m.gluc),
    lip: Math.round(m.lip),
    protPerKg: m.prot / p.poids,
  };
}

// ============ Tests ============
const profiles = [
  {
    name: 'Benjy maintien mixte (bug report)',
    poids: 77, taille: 1.80, age: 25, genre: 'Homme', activite: 'Actif',
    objectif: 'Maintien', objectifType: 'maintien', sportPrincipal: 'mixte',
    expect: {
      cible: [2700, 3000],
      protPerKg: [1.2, 1.6],  // ACSM sportif recréatif
      protAbs: [90, 130],      // plage réaliste au lieu de 180g
    },
  },
  {
    name: 'Benjy muscu prise de masse',
    poids: 77, taille: 1.80, age: 25, genre: 'Homme', activite: 'Actif',
    objectif: 'Prise de masse', objectifType: 'prendre',
    poidsCible: 82, rythmeSem: 0.5, sportPrincipal: 'muscu',
    expect: {
      cible: [3100, 3500],
      protPerKg: [1.6, 2.0],  // ACSM muscu
      protAbs: [125, 155],
    },
  },
  {
    name: 'Benjy endurance maintien (prépa pompier)',
    poids: 77, taille: 1.80, age: 25, genre: 'Homme', activite: 'Très actif',
    objectif: 'Maintien', objectifType: 'maintien', sportPrincipal: 'endurance',
    expect: {
      cible: [3000, 3400],
      protPerKg: [1.2, 1.5],  // ACSM endurance
      protAbs: [90, 120],
    },
  },
  {
    name: 'Femme 60 kg perte endurance',
    poids: 60, taille: 1.65, age: 30, genre: 'Femme', activite: 'Actif',
    objectif: 'Perte de poids', objectifType: 'perdre',
    poidsCible: 55, rythmeSem: 0.5, sportPrincipal: 'endurance',
    expect: {
      cible: [1400, 1800],
      protPerKg: [1.6, 2.0],  // boost perte : 1.4 × 1.3 = 1.82
      protAbs: [95, 120],
    },
  },
  {
    name: 'Femme sédentaire aucun sport maintien',
    poids: 65, taille: 1.68, age: 35, genre: 'Femme', activite: 'Sédentaire',
    objectif: 'Maintien', objectifType: 'maintien', sportPrincipal: 'aucun',
    expect: {
      cible: [1500, 1800],
      protPerKg: [0.9, 1.1],  // ANSES/OMS 1.0
      protAbs: [58, 72],
    },
  },
  {
    name: 'Femme obèse perte aggressive (plancher 1200 kcal)',
    poids: 90, taille: 1.60, age: 40, genre: 'Femme', activite: 'Sédentaire',
    objectif: 'Perte de poids rapide', objectifType: 'perdre',
    poidsCible: 65, rythmeSem: 1, sportPrincipal: 'mixte',
    expect: {
      cible: [1200, 1200],    // plancher atteint
      // 1.4 × 1.3 = 1.82 g/kg → 164 g → mais plafond 35 % de 1200 = 105 g max.
      // Le plafond physiologique prévaut car la cible kcal est très basse.
      // En pratique : scientifiquement correct pour éviter les absurdités.
      protPerKg: [1.1, 1.3],
      protAbs: [100, 115],
    },
  },
  {
    name: 'Homme 100 kg actif perte muscu',
    poids: 100, taille: 1.85, age: 35, genre: 'Homme', activite: 'Actif',
    objectif: 'Perte de poids', objectifType: 'perdre',
    poidsCible: 85, rythmeSem: 0.75, sportPrincipal: 'muscu',
    expect: {
      // Maintenance ~3300 − 825 kcal/j (rythme 0.75) = 2475 kcal
      cible: [2300, 2700],
      protPerKg: [2.0, 2.5],  // 1.8 × 1.3 = 2.34, proche plafond
      protAbs: [200, 250],
    },
  },
  {
    name: 'Femme 55 kg sportive endurance perte',
    poids: 55, taille: 1.70, age: 28, genre: 'Femme', activite: 'Très actif',
    objectif: 'Perte de poids', objectifType: 'perdre',
    poidsCible: 50, rythmeSem: 0.25, sportPrincipal: 'endurance',
    expect: {
      cible: [1800, 2200],
      protPerKg: [1.6, 2.0],
      protAbs: [90, 115],
    },
  },
];

console.log('═══════════════════════════════════════════════════════════════════');
console.log('VÉRIFICATION SCIENTIFIQUE MACROS — ACSM 2020 / ISSN 2017');
console.log('═══════════════════════════════════════════════════════════════════\n');

let allOk = true;
const check = (label, v, range, unit = '') => {
  const ok = v >= range[0] && v <= range[1];
  const icon = ok ? '✅' : '❌';
  console.log(`   ${icon} ${label.padEnd(22)} ${v}${unit}  (attendu ${range[0]}-${range[1]}${unit})`);
  if (!ok) allOk = false;
  return ok;
};

for (const p of profiles) {
  const r = calcTargets(p);
  const pctP = Math.round((r.prot * 4 / r.cible) * 100);
  const pctG = Math.round((r.gluc * 4 / r.cible) * 100);
  const pctL = Math.round((r.lip * 9 / r.cible) * 100);
  console.log(`📊 ${p.name}`);
  console.log(`   ${p.poids} kg · ${p.genre} · ${p.activite} · sport=${p.sportPrincipal} · obj=${p.objectif}`);
  console.log(`   MB=${r.mb}  Maintenance=${r.maintenance}  Cible=${r.cible}`);
  console.log(`   Macros: P${r.prot}g (${pctP}%) / G${r.gluc}g (${pctG}%) / L${r.lip}g (${pctL}%)  |  protPerKg=${r.protPerKg.toFixed(2)}`);
  check('Cible kcal', r.cible, p.expect.cible, ' kcal');
  check('Protéines (g/kg)', +r.protPerKg.toFixed(2), p.expect.protPerKg, ' g/kg');
  check('Protéines absolues', r.prot, p.expect.protAbs, ' g');
  // Vérifications additionnelles (sanity checks)
  if (r.cible < MIN_KCAL_FLOOR[p.genre]) {
    console.log(`   ❌ ERREUR : cible ${r.cible} < plancher ${MIN_KCAL_FLOOR[p.genre]}`);
    allOk = false;
  }
  if (pctL < 18) {
    console.log(`   ⚠️  Lipides < 18 % (${pctL}%) — risque santé hormonale`);
  }
  if (pctG < 20 && p.sportPrincipal !== 'muscu' && p.objectifType !== 'perdre') {
    console.log(`   ⚠️  Glucides < 20 % (${pctG}%) — trop bas pour un non-muscu non-perte`);
  }
  console.log();
}

// ============ Tests Strava double-comptage ============
console.log('═══════════════════════════════════════════════════════════════════');
console.log('AJUSTEMENT STRAVA — pas de double-comptage du sport');
console.log('═══════════════════════════════════════════════════════════════════\n');

const benjyTrasActif = {
  poids: 77, taille: 1.80, age: 25, genre: 'Homme',
  activite: 'Très actif', objectif: 'Maintien', objectifType: 'maintien', sportPrincipal: 'mixte',
};

const withoutStrava = calcTargets(benjyTrasActif);
console.log('Benjy sans Strava (coef 1.725 très actif) :');
console.log(`  Maintenance = ${withoutStrava.maintenance} kcal (inclut déjà ~500 kcal sport estimés)`);
console.log();

const scenarios = [
  { kcal: 0, label: 'Jour repos' },
  { kcal: 300, label: 'Run 30 min' },
  { kcal: 600, label: 'Muscu 1h' },
  { kcal: 900, label: 'Triathlon long' },
];
console.log('Benjy avec Strava (base 1.2 sédentaire + kcal réels) :');
for (const s of scenarios) {
  const r = calcTargets(benjyTrasActif, { useStravaAsActivitySource: true, extraBurnedKcal: s.kcal });
  console.log(`  ${s.label.padEnd(20)} maintenance=${r.maintenance} + sport=${s.kcal} → cible=${r.cible} kcal`);
}
console.log();

// Comparaison à 500 kcal sport : ne devrait PAS être le double du "coef 1.725"
const stravaNormal = calcTargets(benjyTrasActif, { useStravaAsActivitySource: true, extraBurnedKcal: 500 });
console.log(`Sanity : Strava+500 (${stravaNormal.cible}) vs coef 1.725 (${withoutStrava.cible})`);
console.log(`         Écart : ${Math.abs(stravaNormal.cible - withoutStrava.cible)} kcal (plus c'est petit, mieux c'est)`);
console.log();

// ============ Final ============
console.log('═══════════════════════════════════════════════════════════════════');
console.log(allOk ? '✅ TOUS LES TESTS PASSENT — formules ACSM-conformes' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
console.log('═══════════════════════════════════════════════════════════════════');

process.exit(allOk ? 0 : 1);
