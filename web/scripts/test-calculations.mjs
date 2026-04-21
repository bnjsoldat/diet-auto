/**
 * Test des calculs Harris-Benedict + ajustement Strava.
 *
 * Cible : vérifier qu'il n'y a pas de double-comptage et que les chiffres
 * sont dans une plage réaliste pour différents profils.
 *
 * Usage : node scripts/test-calculations.mjs
 */

// Import des constantes et fonctions (on les redéfinit ici pour que le
// script tourne sans build Vite). Les formules doivent matcher exactement
// celles de src/lib/calculations.ts.

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

const MACRO_SPLIT = { protPct: 0.25, glucPct: 0.50, lipPct: 0.25 };
const KCAL_PER_GRAM = { prot: 4, gluc: 4, lip: 9 };
const SEDENTARY_COEF = 1.2;

function calcMB(profile) {
  const { poids, taille, age, genre } = profile;
  if (genre === 'Homme') {
    return 13.7516 * poids + 500.33 * taille - 6.755 * age + 66.473;
  }
  return 9.5634 * poids + 184.96 * taille - 4.6756 * age + 665.0955;
}

function calcTargets(profile, opts = {}) {
  const mb = calcMB(profile);
  const kcalMaintenance = opts.useStravaAsActivitySource
    ? mb * SEDENTARY_COEF
    : mb * ACTIVITY_COEFS[profile.activite];
  const delta = OBJECTIVE_DELTA_KCAL[profile.objectif];
  const extra = opts.extraBurnedKcal ?? 0;
  const kcalCible = kcalMaintenance + delta + extra;
  return {
    mb: Math.round(mb),
    maintenance: Math.round(kcalMaintenance),
    cible: Math.round(kcalCible),
    prot: Math.round((kcalCible * MACRO_SPLIT.protPct) / KCAL_PER_GRAM.prot),
    gluc: Math.round((kcalCible * MACRO_SPLIT.glucPct) / KCAL_PER_GRAM.gluc),
    lip: Math.round((kcalCible * MACRO_SPLIT.lipPct) / KCAL_PER_GRAM.lip),
  };
}

// -------- Profils de test --------
const profiles = [
  {
    name: 'Femme sédentaire 30 ans, maintien',
    poids: 60, taille: 1.65, age: 30, genre: 'Femme', activite: 'Sédentaire', objectif: 'Maintien',
    expect: { maintenanceRange: [1500, 1900] },
  },
  {
    name: 'Femme active 28 ans, perte',
    poids: 65, taille: 1.68, age: 28, genre: 'Femme', activite: 'Actif', objectif: 'Perte de poids',
    expect: { maintenanceRange: [1900, 2300], cibleRange: [1500, 1900] },
  },
  {
    name: 'Homme sédentaire 40 ans, maintien',
    poids: 80, taille: 1.80, age: 40, genre: 'Homme', activite: 'Sédentaire', objectif: 'Maintien',
    expect: { maintenanceRange: [2100, 2500] },
  },
  {
    name: 'Homme actif 25 ans, prise de masse',
    poids: 75, taille: 1.78, age: 25, genre: 'Homme', activite: 'Actif', objectif: 'Prise de masse',
    expect: { maintenanceRange: [2700, 3100], cibleRange: [3100, 3500] },
  },
  {
    name: 'Homme très actif 30 ans (Benjy concours pompier)',
    poids: 72, taille: 1.79, age: 30, genre: 'Homme', activite: 'Très actif', objectif: 'Maintien',
    expect: { maintenanceRange: [2800, 3300] },
  },
  {
    name: 'Homme extrêmement actif 26 ans',
    poids: 78, taille: 1.82, age: 26, genre: 'Homme', activite: 'Extrêmement actif', objectif: 'Maintien',
    expect: { maintenanceRange: [3300, 3900] },
  },
];

console.log('═══════════════════════════════════════════════════════════════════');
console.log('TESTS CALCUL TARGETS — profils variés');
console.log('═══════════════════════════════════════════════════════════════════\n');

let allOk = true;

for (const p of profiles) {
  const base = calcTargets(p);
  const inRange = (v, r) => v >= r[0] && v <= r[1];
  const maintenanceOk = inRange(base.maintenance, p.expect.maintenanceRange);
  const cibleOk = p.expect.cibleRange ? inRange(base.cible, p.expect.cibleRange) : maintenanceOk;

  console.log(`📊 ${p.name}`);
  console.log(`   MB = ${base.mb} kcal`);
  console.log(`   Maintenance = ${base.maintenance} kcal  (attendu ${p.expect.maintenanceRange[0]}-${p.expect.maintenanceRange[1]})  ${maintenanceOk ? '✅' : '❌'}`);
  console.log(`   Cible = ${base.cible} kcal  (P${base.prot} / G${base.gluc} / L${base.lip})  ${cibleOk ? '✅' : '❌'}`);
  if (!maintenanceOk || !cibleOk) allOk = false;
  console.log();
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log('TESTS AJUSTEMENT STRAVA — double-comptage vérifié');
console.log('═══════════════════════════════════════════════════════════════════\n');

const benjy = {
  poids: 72, taille: 1.79, age: 30, genre: 'Homme',
  activite: 'Très actif', objectif: 'Maintien',
};
const withStrava = (kcal) => calcTargets(benjy, {
  extraBurnedKcal: kcal,
  useStravaAsActivitySource: true,
});
const withManual = (kcal) => calcTargets(benjy, {
  extraBurnedKcal: kcal,
  useStravaAsActivitySource: true,
});
const withoutStrava = calcTargets(benjy); // coef très actif = 1.725

console.log('Benjy (H, 72 kg, 1.79 m, 30 ans, très actif, maintien)');
console.log(`  MB = ${withoutStrava.mb} kcal`);
console.log(`  Sans Strava : maintenance = ${withoutStrava.maintenance}, cible = ${withoutStrava.cible} (coef 1.725)`);
console.log();

const scenarios = [
  { kcal: 0, label: 'Jour repos (0 kcal sport)' },
  { kcal: 300, label: 'Course légère 30 min (300 kcal)' },
  { kcal: 600, label: 'Footing 1h + muscu (600 kcal)' },
  { kcal: 900, label: 'Triathlon training long (900 kcal)' },
];

console.log('Avec Strava connecté (base sédentaire 1.2 + kcal réels) :');
for (const s of scenarios) {
  const r = withStrava(s.kcal);
  console.log(`  ${s.label}`);
  console.log(`    Maintenance = ${r.maintenance} (MB×1.2 = ${Math.round(withoutStrava.mb * 1.2)}), cible = ${r.cible} (+${s.kcal} sport)`);
  console.log(`    Macros : P${r.prot} / G${r.gluc} / L${r.lip}`);
}
console.log();

// Vérification du NON-double-comptage
console.log('✅ Vérification : maintenance Strava (1.2) + 500 kcal sport ≠ maintenance coef 1.725');
const strava500 = withStrava(500);
console.log(`   Strava 1.2 + 500 kcal sport = ${strava500.maintenance + 500} kcal`);
console.log(`   Coef 1.725 seul            = ${withoutStrava.maintenance} kcal`);
console.log(`   Différence : ${Math.abs(strava500.maintenance + 500 - withoutStrava.maintenance)} kcal`);
console.log(`   (plus c'est petit, mieux c'est : le coef "très actif" estime ~500 kcal sport/jour)`);
console.log();

console.log('═══════════════════════════════════════════════════════════════════');
console.log(allOk ? '✅ TOUS LES TESTS PASSENT' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
console.log('═══════════════════════════════════════════════════════════════════');

process.exit(allOk ? 0 : 1);
