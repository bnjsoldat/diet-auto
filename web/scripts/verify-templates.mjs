/**
 * Vérifie que chaque ingrédient des PLAN_TEMPLATES et DEFAULT_RECIPES
 * existe dans la base (foods.json + foods-extras.json).
 * Usage : node scripts/verify-templates.mjs
 */
import { readFileSync } from 'node:fs';

const foods = JSON.parse(readFileSync('./src/data/foods.json', 'utf8'));
const extras = JSON.parse(readFileSync('./src/data/foods-extras.json', 'utf8'));

const norm = (s) => s.toLowerCase().replace(/[’ʼʹʻ`´]/g, "'");
const byName = new Map();
for (const x of foods) byName.set(norm(x.nom), x);
for (const x of extras) byName.set(norm(x.nom), x);

/** Évalue les échappements \uXXXX et \' comme le ferait le parseur JS. */
function decodeEscapes(s) {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\'/g, "'");
}

let allOk = true;

function checkFile(path, tupleRegex) {
  const src = readFileSync(path, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(tupleRegex)) {
    names.add(decodeEscapes(m[1]));
  }
  let missing = 0;
  for (const n of names) {
    if (!byName.has(norm(n))) {
      console.log(`  ❌ MISSING: ${JSON.stringify(n)}`);
      missing++;
      allOk = false;
    }
  }
  console.log(`  ${names.size} ingrédients uniques, ${missing} manquants`);
}

console.log('── templates.ts (PLAN_TEMPLATES) ──');
checkFile('./src/lib/templates.ts', /\['((?:[^'\\]|\\.)+)',\s*\d+\]/g);

console.log('── defaultRecipes.ts (DEFAULT_RECIPES) ──');
checkFile('./src/lib/defaultRecipes.ts', /\{\s*nom:\s*'((?:[^'\\]|\\.)+)'\s*,\s*quantite/g);

console.log('── substitutes.ts (CURATED substituts) ──');
checkFile('./src/lib/substitutes.ts', /^\s+'((?:[^'\\]|\\.)+)',\s*$/gm);

console.log(allOk ? '\n✅ Tous les ingrédients existent dans la base' : '\n❌ Ingrédients manquants détectés');
process.exit(allOk ? 0 : 1);
