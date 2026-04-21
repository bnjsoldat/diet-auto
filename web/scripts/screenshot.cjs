/**
 * Prend les captures d'écran pour Product Hunt / LinkedIn / Reddit.
 * Utilise puppeteer-core + Chrome local (pas de téléchargement de browser).
 *
 * Prérequis : le dev server doit tourner sur http://localhost:5173
 *   npm run dev
 *
 * Lancement :
 *   node scripts/screenshot.cjs
 *
 * Les PNG sont sauvés dans ../screenshots/
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.resolve(__dirname, '..', '..', 'screenshots');

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };

async function prep(page, dark = false) {
  await page.evaluate((isDark) => {
    localStorage.setItem('onboardingSeen', '1');
    document.documentElement.classList.toggle('dark', isDark);
    // Ajuste aussi le color-scheme natif pour les scrollbars etc.
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, dark);
}

async function createProfile(page) {
  await page.goto(BASE_URL + '/setup', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  // Remplit le formulaire Setup (sélecteurs basés sur le label/placeholder)
  const filled = await page.evaluate(() => {
    const setByLabel = (labelText, value) => {
      const labels = Array.from(document.querySelectorAll('label, div, span')).filter((el) =>
        el.textContent?.toLowerCase().includes(labelText.toLowerCase())
      );
      for (const l of labels) {
        const input =
          l.querySelector('input, select') ||
          l.parentElement?.querySelector('input, select') ||
          l.closest('div')?.querySelector('input, select');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(
            input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype,
            'value'
          )?.set;
          setter?.call(input, value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    };
    const results = {
      nom: setByLabel('nom', 'Benjy'),
      poids: setByLabel('poids', '72'),
      taille: setByLabel('taille', '179'),
    };
    return results;
  });
  console.log('   setup fill result:', filled);
  await new Promise((r) => setTimeout(r, 500));
  // Clique sur "Créer le profil"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ok = btns.find(
      (b) => /cr[ée]er/i.test(b.textContent || '') && /profil/i.test(b.textContent || '')
    );
    if (ok) ok.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: VIEWPORT,
  });
  const page = await browser.newPage();

  // 1re visite = prep (onboarding off)
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle2' });
  await prep(page);

  // Captures publiques (landing, blog, articles)
  const pub = [
    { name: '01-landing-light', url: '/', dark: false },
    { name: '02-landing-dark', url: '/', dark: true },
    { name: '03-blog-light', url: '/blog', dark: false },
    { name: '04-article-light', url: '/blog/besoin-calorique-journalier', dark: false },
  ];
  for (const shot of pub) {
    console.log(`📸 ${shot.name} — ${shot.url} (${shot.dark ? 'dark' : 'light'})`);
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: shot.dark ? 'dark' : 'light' },
    ]);
    await page.goto(BASE_URL + shot.url, { waitUntil: 'networkidle2', timeout: 15000 });
    await prep(page, shot.dark);
    await new Promise((r) => setTimeout(r, 800));
    const out = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`   ✓ ${out}`);
  }

  // Création du profil
  console.log('🔧 Création profil Benjy…');
  await createProfile(page);

  // Captures du /today VIDE (important : montre le point d'entrée propre
  // où on peut comprendre la structure en 1 coup d'œil)
  for (const shot of [
    { name: '05-today-empty-light', url: '/today', dark: false },
  ]) {
    console.log(`📸 ${shot.name} — ${shot.url}`);
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: shot.dark ? 'dark' : 'light' },
    ]);
    await page.goto(BASE_URL + shot.url, { waitUntil: 'networkidle2' });
    await prep(page);
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`) });
    console.log(`   ✓ ${shot.name}.png`);
  }

  // Charge le plan "équilibré" pour avoir des données réalistes
  console.log('🍽️ Chargement du modèle « équilibré »…');
  await page.goto(BASE_URL + '/today', { waitUntil: 'networkidle2' });
  await prep(page);
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    // Clique sur "Mes plans"
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      /mes plans/i.test(b.textContent || '')
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    // Clique sur le 1er plan (équilibré par défaut)
    const cards = Array.from(
      document.querySelectorAll('[role="dialog"] button, .card button, button[type="button"]')
    );
    const cta = cards.find((b) => /appliquer|charger|utiliser/i.test(b.textContent || ''));
    if (cta) cta.click();
    else {
      // Fallback : 1er bouton qui contient "équilibré" ou "équilibre"
      const eq = cards.find((b) => /[ée]quilibr/i.test(b.textContent || ''));
      eq?.click();
    }
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Captures avec plan rempli
  const filled = [
    { name: '06-today-filled-light', url: '/today', dark: false },
    { name: '07-today-filled-dark', url: '/today', dark: true },
    { name: '08-week-light', url: '/week', dark: false },
    { name: '09-shopping-light', url: '/shopping', dark: false },
    { name: '10-recipes-light', url: '/recipes', dark: false },
  ];
  for (const shot of filled) {
    console.log(`📸 ${shot.name} — ${shot.url} (${shot.dark ? 'dark' : 'light'})`);
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: shot.dark ? 'dark' : 'light' },
    ]);
    await page.goto(BASE_URL + shot.url, { waitUntil: 'networkidle2', timeout: 15000 });
    await prep(page, shot.dark);
    await new Promise((r) => setTimeout(r, 1000));
    const out = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`   ✓ ${out}`);
  }

  const priv = [];
  for (const shot of priv) {
    console.log(`📸 ${shot.name} — ${shot.url} (${shot.dark ? 'dark' : 'light'})`);
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: shot.dark ? 'dark' : 'light' },
    ]);
    await page.goto(BASE_URL + shot.url, { waitUntil: 'networkidle2', timeout: 15000 });
    await prep(page, shot.dark);
    await new Promise((r) => setTimeout(r, 1000));
    const out = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`   ✓ ${out}`);
  }

  await browser.close();
  console.log(`\n✅ Captures terminées dans : ${OUT_DIR}`);
}

run().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
