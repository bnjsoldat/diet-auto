# Ma Diét — site web

Planificateur alimentaire web qui optimise automatiquement les quantités des repas
pour atteindre une cible calorique et macros précise. React + Vite + TypeScript.
Persistance IndexedDB locale + synchronisation cloud Supabase (compte obligatoire
depuis le 21/04/2026 pour capture email + sync cross-device).

→ **Production** : https://madiet.lentreprise.ai

## Démarrage local

```bash
cd web
npm install
npm run dev
```

Puis ouvre http://localhost:5173

## Scripts

**Dev / build** :
- `npm run dev` — serveur de dev avec HMR
- `npm run build` — build de production dans `dist/`
- `npm run preview` — serveur local du build
- `npm run typecheck` — vérifie les types TypeScript

**Tests automatiques** (ajoutés 22/04/2026) :
- `npm run test:calc` — 8 profils × formules Harris-Benedict + macros (ACSM 2020)
- `npm run test:blocklist` — 36 cas × regex blocklist suggestions (alcool, junk)
- `npm run test:suggestions` — 4 profils × vérif suggestions saines/communes
- `npm run test:all` — typecheck + les 3 tests ci-dessus
- `npm run preflight` — `test:all` + `build` (à lancer avant un lancement / release)

**Outils** :
- `npm run screenshots` — régénère les 11 PNG 1440×900 dans `../screenshots/`
- `npm run screenshots:ph` — resize en 1270×760 pour Product Hunt

## Fonctionnalités principales

### Calculs nutritionnels (ACSM 2020 / ISSN 2017)
- **Métabolisme basal** — Harris-Benedict genre-spécifique
- **Maintenance** — × coef activité (5 niveaux) OU × 1.2 si Strava connecté (anti-double-comptage)
- **Macros en g/kg** — Protéines 1.0-1.8 selon sport, boost ×1.3 en perte, plafond 2.5 g/kg et 35 % kcal
- **Lipides** — 22-30 % kcal avec plancher 0.8 g/kg (santé hormonale)
- **Plancher kcal santé** — 1200 F / 1500 H (jamais descendu même en perte agressive)

### Objectif v2 (refonte 22/04)
- **3 boutons visuels** : Perdre / Maintenir / Prendre
- **Poids cible + rythme** : 0.25 / 0.5 / 0.75 / 1 kg/sem (formule 7700 kcal/kg)
- **Sport principal** (4 choix) qui module les macros
- **Distribution repas** : 5 presets (équilibré / petit-déj / déjeuner / dîner copieux / jeûne 16-8)
- **Préférences alimentaires** : Végé / Végan / Sans gluten / Sans lactose / Halal (filtre auto recherche)
- **Warnings santé** — IMC cible < 18.5 ou > 30, rythme > 1 kg/sem, etc.

### Optimiseur
- **Descente de gradient projetée** — bornes par groupe CIQUAL + patterns par nom
- **Items-recette fixes** — l'optim ajuste uniquement les aliments simples
- **Suggestions complémentaires** (optionnel via toggle) — propose des aliments communs pour combler un déficit
- **Blocklist** — alcools, junk food, poudres, aliments diététiques, viennoiseries
- **Bonus ×3 aliments courants** — 55 aliments INCA 3 ANSES
- **Équilibrage par repas** — les ajouts respectent la distribution choisie

### Suivi
- **Suivi de poids** auto-sync avec profil + courbe Recharts + moyenne mobile 7j + ligne cible kcal + alerte tendance
- **Suivi d'hydratation** — verres cliquables, objectif personnalisable
- **Historique** — 30/90 jours, macros agrégées, export CSV

### Recettes & templates
- **40 recettes populaires** importables 1-clic (10 par repas avec étapes)
- **Recette composite** — affichée en 1 ligne, drawer ingrédients + étapes
- **4 templates prédéfinis** (équilibré / sportif / perte / végé) + templates perso
- **Partage par lien** — URL base64url pour recette ou plan entier

### Intégrations
- **Strava OAuth** — sync activités du jour, kcal ajustées
- **Scan code-barres** — BarcodeDetector natif + fallback zxing + Open Food Facts

### UX
- **PWA** installable, hors-ligne, shortcut "Plan du jour"
- **Auth Supabase** — Google OAuth / magic link / email+pwd
- **Multi-profil** — plusieurs utilisateurs sur un même appareil
- **Thèmes** clair / sombre / pastel
- **Accessible** WCAG AA, aria-labels, prefers-reduced-motion
- **Sentry + ErrorBoundary** — capture errors en prod

## Architecture

```
src/
├─ data/
│  ├─ foods.json             3 010 aliments CIQUAL 2020 (ANSES)
│  ├─ foods-extras.json      175 aliments curated (noms simplifiés)
│  ├─ foods-units.json       Unités pratiques (œuf, tranche, pomme...)
│  └─ foods-unit-patterns.json
├─ lib/
│  ├─ calculations.ts        Harris-Benedict + macros g/kg ACSM + kcalPerMeal
│  ├─ optimizer.ts           Descente de gradient, exclut items-recette
│  ├─ suggestions.ts         Suggestions d'optim + blocklist (alcool, junk, rare)
│  ├─ commonFoods.ts         55 aliments INCA 3 ANSES + contexte par repas
│  ├─ dietary.ts             Filtres Végé/Végan/Sans gluten/Lactose/Halal
│  ├─ mealSlot.ts            Détection sémantique petit-déj/déjeuner/dîner
│  ├─ defaultRecipes.ts      40 recettes populaires (10 par repas, avec étapes)
│  ├─ templates.ts           4 plans prédéfinis + rebuild
│  ├─ constants.ts           Toutes les constantes (bornes, macros, presets)
│  ├─ storage.ts             IndexedDB via localforage
│  ├─ supabase.ts            Client Supabase (null si non configuré)
│  ├─ cloudSync.ts           Push/pull snapshot JSONB last-write-wins
│  ├─ strava.ts              OAuth + sync activités Strava
│  ├─ sentry.ts              Init Sentry (lazy, no-op si pas de DSN)
│  ├─ shortNames.ts          Nom CIQUAL → nom court affiché
│  ├─ barcode.ts             Scanner natif + fallback zxing
│  ├─ openfoodfacts.ts       API publique Open Food Facts
│  ├─ share.ts               Encodage base64url pour partage URL
│  ├─ shareRecipe.ts         Idem pour recettes
│  └─ age.ts                 Âge effectif (birthDate ou fallback)
├─ store/                    Stores Zustand
│  ├─ useAuth.ts             Session Supabase
│  ├─ useProfile.ts          Profils + auto-seed favoris par défaut
│  ├─ useDayPlan.ts          Plan du jour + addRecipe (item composite)
│  ├─ useFavorites.ts
│  ├─ useWeight.ts
│  ├─ useRecipes.ts
│  ├─ useCustomFoods.ts      Aliments scannés
│  ├─ useCustomTemplates.ts  Modèles perso
│  ├─ useReminders.ts
│  ├─ useWater.ts            Suivi hydratation
│  ├─ useActivity.ts         Sport du jour (Strava + manuel)
│  ├─ useSettings.ts         Thème + mode optim + toggle suggestions
│  └─ useToast.ts            Toasts undo
├─ pages/                    Routes React Router
│  ├─ Home.tsx               Landing
│  ├─ Login.tsx              Email+pwd / magic / Google
│  ├─ Account.tsx            Mon compte (sync + RGPD + suppression)
│  ├─ Setup.tsx              Création de profil initial
│  ├─ Today.tsx              Plan du jour (vue principale)
│  ├─ Week.tsx               Vue semaine
│  ├─ Shopping.tsx           Liste de courses agrégée
│  ├─ Recipes.tsx            Mes recettes + import 40 populaires
│  ├─ History.tsx            Mon suivi (graphiques Recharts)
│  ├─ Favorites.tsx
│  ├─ Profiles.tsx           Édition profils + Paramètres du plan
│  ├─ Help.tsx               FAQ + ContactCard
│  ├─ Integrations.tsx       Connexion Strava
│  ├─ StravaCallback.tsx     OAuth callback Strava
│  ├─ blog/                  6 articles SEO
│  └─ Legal.tsx              CGU/Confidentialité/Mentions
└─ components/               ~30 composants UI partagés
```

## Supabase (auth + cloud)

L'app fonctionne sans Supabase (mode 100 % local). Pour activer la
synchronisation cloud, suis `SUPABASE_SETUP.md`. En résumé :

1. Créer un projet Supabase gratuit
2. Appliquer `supabase/schema.sql` dans le SQL Editor
3. Ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans Vercel

## Déploiement Vercel

Le `vercel.json` gère le rewriting SPA. Connecte simplement le repo GitHub
à Vercel avec `web` comme root directory.

## Données & vie privée

- **Compte obligatoire** depuis 21/04/2026 (capture email + sync cross-device) — auth Supabase (Google / magic link / email+pwd)
- **Données locales** : IndexedDB navigateur pour usage offline (cache)
- **Serveurs** : Supabase (UE), pas de pub, pas de Google Analytics, pas de cookies marketing
- **RGPD** : suppression du compte = effacement complet des données serveur + local

## Roadmap post-lancement

Priorités post-feedback (J+30 à J+90) :
- Templates additionnels (Méditerranéen, Petit mangeur, Low-carb)
- Food substitutes (« Pas fan du poulet ? → dinde, œufs... »)
- Apple Health / Google Fit direct (en plus de Strava)
- Micronutriments étendus (calcium, fer, vit D) en détail
- Mode famille (6 profils partageant un plan, quantités ajustées)
- Abonnement Pro 4,99 €/mois (quand > 100 users actifs)
- Photo du frigo → analyse IA pour composer un plan

## Licence

Code source : propriété de l'éditeur. Base CIQUAL : ANSES, licence ouverte.
Données Open Food Facts : ODbL.
