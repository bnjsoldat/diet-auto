# Ma Diét — site web

Planificateur alimentaire web qui optimise automatiquement les quantités des repas
pour atteindre une cible calorique et macros précise. React + Vite + TypeScript.
Fonctionne 100 % client (IndexedDB) par défaut, synchronisation cloud optionnelle
via Supabase (compte utilisateur).

→ **Production** : https://madiet.lentreprise.ai

## Démarrage local

```bash
cd web
npm install
npm run dev
```

Puis ouvre http://localhost:5173

## Scripts

- `npm run dev` — serveur de dev avec HMR
- `npm run build` — build de production dans `dist/`
- `npm run preview` — serveur local du build
- `npm run typecheck` — vérifie les types TypeScript

## Fonctionnalités principales

- **Optimiseur intelligent** — descente de gradient projetée pour ajuster les grammages
- **Base CIQUAL** — 3 010 aliments (ANSES 2020)
- **Scan code-barres** — BarcodeDetector natif + fallback zxing (iOS/Firefox) via dynamic import
- **Open Food Facts** — récupération auto des valeurs nutritionnelles au scan
- **Multi-profil** — plusieurs utilisateurs sur un même appareil
- **Vue semaine + copier/coller** — duplication flexible entre jours
- **Recettes composées** — ingrédients + étapes + partage URL
- **Suivi de poids** — avec courbe Recharts
- **Suivi d'hydratation** — verres cliquables, objectif personnalisable
- **Rappels quotidiens** — via Notifications API + Service Worker
- **Export CSV + PDF** — pour Excel ou impression A4
- **Authentification optionnelle** — Supabase (email+pwd, magic link, Google)
- **Sync cloud** — last-write-wins entre appareils
- **Installable** — manifest PWA, fonctionne hors-ligne
- **Thèmes** — clair / sombre / pastel
- **Accessible** — WCAG AA, aria-labels, prefers-reduced-motion

## Architecture

```
src/
├─ data/
│  └─ foods.json             3 010 aliments (extraction CIQUAL)
├─ lib/
│  ├─ calculations.ts        Harris-Benedict + coef + macros
│  ├─ optimizer.ts           Descente de gradient + bornes par groupe
│  ├─ suggestions.ts         Complément auto du plan
│  ├─ storage.ts             IndexedDB via localforage
│  ├─ supabase.ts            Client Supabase (null si non configuré)
│  ├─ cloudSync.ts           Push/pull snapshot JSONB
│  ├─ shortNames.ts          Nom CIQUAL → nom court affiché
│  ├─ barcode.ts             Scanner natif + fallback zxing
│  ├─ openfoodfacts.ts       API publique Open Food Facts
│  ├─ share.ts               Encodage base64url pour partage URL
│  ├─ shareRecipe.ts         Idem pour recettes
│  └─ templates.ts           4 plans prêts à l'emploi + rebuild
├─ store/                    9 stores Zustand
│  ├─ useAuth.ts             Session Supabase
│  ├─ useProfile.ts
│  ├─ useDayPlan.ts
│  ├─ useFavorites.ts
│  ├─ useWeight.ts
│  ├─ useRecipes.ts
│  ├─ useCustomFoods.ts      Aliments scannés
│  ├─ useCustomTemplates.ts  Modèles perso
│  ├─ useReminders.ts
│  ├─ useWater.ts            Suivi hydratation
│  ├─ useSettings.ts         Thème + mode optimiseur
│  └─ useToast.ts            Toasts undo
├─ pages/                    Routes React Router
│  ├─ Home.tsx               Landing
│  ├─ Login.tsx              Email+pwd / magic / Google
│  ├─ Account.tsx            Mon compte (sync + RGPD)
│  ├─ Setup.tsx              Création de profil
│  ├─ Today.tsx              Plan du jour (vue principale)
│  ├─ Week.tsx               Vue semaine
│  ├─ Shopping.tsx           Liste de courses agrégée
│  ├─ Recipes.tsx            Mes recettes
│  ├─ History.tsx            Mon suivi (graphiques)
│  ├─ Favorites.tsx
│  ├─ Profiles.tsx
│  ├─ Help.tsx               FAQ
│  ├─ Integrations.tsx       Roadmap Garmin/Apple/Google Fit
│  └─ Legal.tsx              CGU/Confidentialité/Mentions
└─ components/               Composants UI partagés
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

- **Sans compte** : tout reste dans IndexedDB du navigateur, rien ne sort
- **Avec compte** : données syncées avec Supabase (serveurs UE, Frankfurt)
- Aucun cookie de tracking, aucune pub, aucun Google Analytics
- Suppression du compte = effacement complet des données cloud (RGPD)

## Roadmap

Backlog en attente de traction utilisateur :
- Intégration trackers sportifs (Garmin, Apple Health, Google Fit, Strava)
- Micronutriments (fibres, sel, sucres, acides gras saturés)
- Mode famille (6 profils partageant un plan, quantités ajustées)
- Abonnement Pro (synchronisation multi-appareil, fonctionnalités avancées)
- Photo du frigo (analyse IA pour composer un plan)

## Licence

Code source : propriété de l'éditeur. Base CIQUAL : ANSES, licence ouverte.
Données Open Food Facts : ODbL.
