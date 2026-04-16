# Diét Auto — site web

Version web de l'optimiseur de plan alimentaire. React + Vite + Tailwind + Zustand. 100 % client, aucune API backend.

## Démarrage local

```bash
cd web
npm install
npm run dev
```

Ouvre ensuite http://localhost:5173 dans ton navigateur.

## Scripts

- `npm run dev` — serveur de dev avec HMR
- `npm run build` — build de production dans `dist/`
- `npm run preview` — preview du build local
- `npm run typecheck` — vérifie les types TypeScript

## Architecture rapide

- `src/data/foods.json` — 770 aliments (base CIQUAL, extraite du Google Sheet d'origine)
- `src/lib/calculations.ts` — Harris-Benedict + coef activité + quotas macros
- `src/lib/optimizer.ts` — descente de gradient projetée (portage de `Code.gs`)
- `src/lib/storage.ts` — persistance via localForage (IndexedDB)
- `src/store/*.ts` — stores Zustand (profils, plan du jour, favoris, settings)
- `src/pages/*.tsx` — Home, Setup, Today, History, Profiles, Favorites

## Déploiement sur Vercel

1. Crée un compte sur https://vercel.com (gratuit, via GitHub recommandé)
2. Pousse ce repo sur GitHub
3. Dans Vercel : **Add New Project** → sélectionne ton repo
4. Root directory : `web` (important si le repo contient aussi le Sheet/Code.gs)
5. Framework : Vite (détecté automatiquement)
6. Deploy → tu obtiens une URL en `.vercel.app`

Le fichier `vercel.json` gère le rewriting pour les routes SPA.

## Données & vie privée

Aucune donnée n'est envoyée à un serveur. Tout est stocké dans le navigateur de l'utilisateur (IndexedDB via localForage) : profils, plans, favoris, préférences.
