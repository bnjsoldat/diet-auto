#!/usr/bin/env node
/**
 * Extrait la base CIQUAL 2020 complète depuis les XML décompressés dans
 * /tmp/ciqual, et génère `web/src/data/foods.json` prêt à l'emploi.
 *
 * Garde uniquement :
 *   - kcal (const_code 328, EU Règlement 1169/2011)
 *   - Protéines (25000 ou fallback 25003)
 *   - Glucides (31000)
 *   - Lipides (40000)
 * Les aliments dont une de ces 4 valeurs est manquante sont ignorés.
 *
 * Usage : node scripts/extract-ciqual.js <cheminZipExtrait> <sortie>
 *   ex : node scripts/extract-ciqual.js /tmp/ciqual web/src/data/foods.json
 */
const fs = require('fs');
const path = require('path');

const CIQUAL_DIR = process.argv[2] || '/tmp/ciqual';
const OUT = process.argv[3] || path.join(__dirname, '..', 'src', 'data', 'foods.json');

function readXml(file) {
  const buf = fs.readFileSync(path.join(CIQUAL_DIR, file));
  return new TextDecoder('windows-1252').decode(buf);
}

function parseNumber(s) {
  if (!s) return null;
  const t = s.trim();
  if (!t || t === '-') return null;
  if (t.toLowerCase().startsWith('traces')) return 0;
  // virgule décimale FR, parfois "< 0,1" ou similaire
  const cleaned = t.replace(',', '.').replace(/[^\d.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// 1) ALIM : code → {nom, grp, ssgrp}
const alimXml = readXml('alim_2020_07_07.xml');
const alimRe = /<ALIM>[\s\S]*?<alim_code>\s*(\d+)\s*<\/alim_code>\s*<alim_nom_fr>\s*([^<]+?)\s*<\/alim_nom_fr>[\s\S]*?<alim_grp_code>\s*(\d+)\s*<\/alim_grp_code>\s*<alim_ssgrp_code>\s*(\d+)\s*<\/alim_ssgrp_code>[\s\S]*?<\/ALIM>/g;
const alims = new Map(); // code → {nom, grp, ssgrp}
let m;
while ((m = alimRe.exec(alimXml)) !== null) {
  alims.set(m[1], { nom: m[2].trim(), grp: m[3], ssgrp: m[4] });
}
console.log('ALIM entries:', alims.size);

// 2) COMPO : (alim_code, const_code) → teneur
const NEEDED = new Set(['328', '25000', '25003', '31000', '40000']);
const comp = new Map(); // alim_code → {kcal, prot, gluc, lip}

const compoXml = readXml('compo_2020_07_07.xml');
const compoRe = /<COMPO>\s*<alim_code>\s*(\d+)\s*<\/alim_code>\s*<const_code>\s*(\d+)\s*<\/const_code>\s*<teneur>\s*([^<]*?)\s*<\/teneur>/g;
let cm;
while ((cm = compoRe.exec(compoXml)) !== null) {
  const [, alimCode, constCode, teneur] = cm;
  if (!NEEDED.has(constCode)) continue;
  const n = parseNumber(teneur);
  if (n == null) continue;
  const cur = comp.get(alimCode) ?? {};
  if (constCode === '328') cur.kcal = n;
  else if (constCode === '25000') cur.prot = n;
  else if (constCode === '25003' && cur.prot == null) cur.prot = n; // fallback
  else if (constCode === '31000') cur.gluc = n;
  else if (constCode === '40000') cur.lip = n;
  comp.set(alimCode, cur);
}
console.log('COMPO entries with at least one needed nutrient:', comp.size);

// 3) Mapper ssgrp → catégorie groupe (labels alignés sur categories.ts)
function groupeForAlim(grp, ssgrp) {
  // 02 : fruits/légumes/légumineuses/oléagineux
  if (grp === '02') {
    if (ssgrp === '0201') return 'légumes';
    if (ssgrp === '0202') return 'féculents';
    if (ssgrp === '0203') return 'légumineuses';
    if (ssgrp === '0204') return 'fruits';
    if (ssgrp === '0205') return 'fruits à coque';
    return null;
  }
  if (grp === '03') return 'céréales et produits à base de céréales';
  if (grp === '04') return 'viandes, œufs, poissons et assimilés';
  if (grp === '05') {
    if (ssgrp === '0503') return 'fromages';
    return 'produits laitiers';
  }
  if (grp === '06') return 'boissons';
  if (grp === '07' || grp === '08') return 'sucres et produits sucrés';
  if (grp === '09') return 'matières grasses';
  if (grp === '01') return 'plats composés';
  // grp 10 (aides culinaires) → on garde seulement les sauces et condiments
  if (grp === '10') {
    if (ssgrp === '1001' || ssgrp === '1002') return 'sauces et condiments';
    return null;
  }
  // grp 11 (aliments infantiles) → ignoré
  return null;
}

// 4) Assemble
// CIQUAL omet souvent certaines valeurs quand elles sont < seuil de détection
// (ex : lipides sur un fruit). On les traite comme 0 pour ne pas jeter
// l'aliment. kcal absente → fallback calculé (Atwater 4/4/9).
const out = [];
for (const [code, a] of alims) {
  const c = comp.get(code);
  if (!c) continue;
  const prot = c.prot ?? 0;
  const gluc = c.gluc ?? 0;
  const lip = c.lip ?? 0;
  let kcal = c.kcal;
  if (kcal == null) {
    kcal = prot * 4 + gluc * 4 + lip * 9;
    if (kcal < 1) continue;
  }
  const groupe = groupeForAlim(a.grp, a.ssgrp);
  if (!groupe) continue;
  out.push({
    nom: a.nom,
    groupe,
    kcal: Math.round(kcal * 10) / 10,
    prot: Math.round(prot * 10) / 10,
    gluc: Math.round(gluc * 10) / 10,
    lip: Math.round(lip * 10) / 10,
  });
}

// Trier et dédupliquer par nom (garder la 1ère occurrence)
out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }));
const seen = new Set();
const deduped = [];
for (const f of out) {
  const k = f.nom.toLowerCase();
  if (seen.has(k)) continue;
  seen.add(k);
  deduped.push(f);
}

console.log('Output count (dédupliqué):', deduped.length);

// Stats par groupe
const stats = {};
for (const f of deduped) stats[f.groupe] = (stats[f.groupe] ?? 0) + 1;
console.log('Par groupe :', stats);

fs.writeFileSync(OUT, JSON.stringify(deduped));
console.log('Écrit :', OUT);
