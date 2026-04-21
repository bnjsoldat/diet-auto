/**
 * Convertit les screenshots 1440×900 en 1270×760 (format Product Hunt / LinkedIn).
 * Crop centré, ratio 1.67:1 ≈ PH aspect.
 *
 * Usage : node scripts/resize-for-producthunt.cjs
 * Sortie : screenshots/ph/01-*.png, ...
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', '..', 'screenshots');
const OUT_DIR = path.resolve(__dirname, '..', '..', 'screenshots', 'ph');

const TARGET_W = 1270;
const TARGET_H = 760;

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.png'));
  for (const f of files) {
    const inp = path.join(SRC_DIR, f);
    const out = path.join(OUT_DIR, f);
    try {
      await sharp(inp)
        .resize(TARGET_W, TARGET_H, {
          fit: 'cover',
          position: 'top', // garde le haut de la page (hero + nav visibles)
        })
        .png({ quality: 95 })
        .toFile(out);
      console.log(`✓ ${f} → ph/${f}`);
    } catch (err) {
      console.error(`✗ ${f}: ${err.message}`);
    }
  }
  console.log(`\n📸 ${files.length} captures redimensionnées dans ${OUT_DIR}`);
  console.log('→ Prêtes pour upload Product Hunt (1270×760).');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
