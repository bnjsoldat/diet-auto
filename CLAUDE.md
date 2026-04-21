# Diét Automatique — contexte projet

## 🚀 État actuel (2026-04-21)

**App déployée en prod** : https://madiet.lentreprise.ai (branche `main`, déploiement auto Vercel).

**Éditeur légal** : Benjy GRONDIN, 26 ans, micro-entreprise à Saint-Paul (La Réunion), SIRET 933 093 882 00019, prépare le concours pompier. Pratique muscu / course / volley / boxe. Auto-entrepreneur : cours de maths, rédaction mémoires techniques, création sites + SaaS B2B.

**Phase** : prêt au lancement public. Date J = **mardi 21 avril 2026, 10h heure La Réunion**. Plateforme 1 = r/fitness_France (Reddit), puis Twitter thread le soir, LinkedIn jeudi. Product Hunt = dans ~2 semaines selon feedback.

**Ton** pour les posts sociaux : *"dev sportif qui a galéré avec MFP/Yazio, a codé son outil pour préparer le concours pompier, cherche du feedback honnête"*. Jamais "founder qui lance", jamais mention du Pro payant (prévu plus tard à 4,99 €/mois, tabou dans les threads).

**⚠️ Positionnement auth (changé le 21/04)** : la création de compte est maintenant **OBLIGATOIRE** pour accéder à /today, /week, /shopping, etc. (capture email pour marketing + sync cross-device). Landing + /blog + /aide + /legal restent publics. Méthodes de connexion : Google OAuth (1 clic), lien magique par email (10 s), ou email + mot de passe (caché dans « autres options »). Le RequireAuth guard redirect vers /login si non connecté. Les anciennes mentions « sans compte / 100 % local » ont été retirées partout (landing, blog, help, legal, onboarding, Reddit/Twitter/LinkedIn templates).

**Fichiers de lancement prêts à copier-coller** :
- `LAUNCH_DAY_READY.md` (racine) — post Reddit + 7 tweets + LinkedIn + email beta + checklist jour J
- `LAUNCH_KIT.md` (racine) — version longue (PH template, autres subs, métriques)
- `REDDIT_POST_DRAFT.md` (racine) — 3 versions explorées du post Reddit
- `CLAUDE_PROJECT_SETUP.md` (racine) — guide pour créer le Projet sur claude.ai mobile

**10 captures d'écran 1440×900** dans `screenshots/` (générées via `web/scripts/screenshot.cjs` avec Puppeteer + Chrome local). Relançables via `node web/scripts/screenshot.cjs` après changement UI majeur.

**Ce que le user doit encore faire manuellement (hors Claude Code)** :
- Poster sur Reddit mardi matin (copier depuis `LAUNCH_DAY_READY.md`)
- Poster le thread Twitter le soir
- Répondre aux commentaires Reddit dans les 2-4 h
- Uploader les screenshots sur Product Hunt le jour J
- Vercel Speed Insights NON activé (payant après essai, décision assumée)

## Vue d'ensemble

Dossier contenant **deux implémentations** du même système de planification alimentaire :

1. **Google Sheet + Apps Script** (original, opérationnel) — dans ce dossier, menu « Diét Auto » installé sur le Sheet distant.
2. **Site web React** (`web/` sous-dossier) — version moderne publique, même logique, UI épurée, offline-friendly, déployable sur Vercel. **C'est le focus actuel.**

Le but commun : à partir d'un profil (poids, taille, âge, activité, genre, objectif), calculer le besoin calorique + quotas macros via Harris-Benedict, puis **ajuster automatiquement les quantités des aliments choisis** pour atteindre ces cibles (descente de gradient projetée).

## Fichiers du dossier

- `Programme alimentaire bnj.ods` — copie locale LibreOffice du classeur (source
  initiale du projet, le travail courant se fait sur la version Google Sheets).
- `Code.gs` — script Apps Script (optimiseur + menu « Diét Auto »). À coller
  dans Extensions > Apps Script du Sheet Google.
- `web/` — projet Vite + React + TypeScript + Tailwind (site web autonome, voir `web/README.md`).
- `INSTRUCTIONS.txt` — guide d'installation et d'utilisation complet (français).
- `CLAUDE.md` — ce fichier.

## Google Sheet de référence

URL :
`https://docs.google.com/spreadsheets/d/18b6dfxfoQatDqpudt4eERIL100JDe7F8XbsmC43kchA/edit`

### Onglets (11)

| Onglet | Rôle |
|---|---|
| `Données` | Inputs profil + calculs (MB, maintenance, quotas macros, cibles finales). |
| `Programme` → `Programme 7` | 7 plans de repas interchangeables. Mêmes colonnes/plages. |
| `Toutes les recettes` | Base nutritionnelle : nom, kcal/100g, P/100g, G/100g, L/100g. |
| `nombre pour la quantité` | Liste des valeurs de quantité acceptées par les VLOOKUP. |
| `DONNEES CLIENTS` | Stockage multi-profils (utilisé manuellement). |

### Cellules clés — feuille `Données`

Attention : **différent** de ce que suggérait l'analyse initiale du `.ods`.
Références vérifiées sur le Sheet réel :

- `A2` = Taille (m), `B2` = Poids (kg), `C2` = Âge
- `D2` = Coéfficient d'activité, `E2` = Genre, `F2` = Objectif
- `C3` = MB (Métabolisme basal, kcal)
- `C4` = Maintenance (kcal = MB × coef)
- `C5` = Surplus / déficit (kcal)
- `C6` = IMC
- `A10` = Quota Protéines (g), `B10` = Quota Glucides (g), `C10` = Quota Lipides (g)
- `C15` = **Total calorique avec objectif** (kcal) — **c'est la cible kcal à utiliser**
- `C16` = glucide (g) avec objectif (doublon partiel du B10, à vérifier si utilisé)

### Feuilles `Programme X` — structure commune

- Ligne 7 : en-têtes (D=Période, E=Aliment, F=Quantité(g), G=Kcal, H=Protéines, I=Glucides, J=Lipides)
- Plages d'aliments (10 lignes/repas) :
  - Repas 1 (4h30-9h) : lignes 8-17, total ligne 18
  - Collation 1 (10h30-11h30) : lignes 19-28, total ligne 29
  - Repas 2 (12h-13h30) : lignes 30-39, total ligne 40
  - Repas 3 (19h30-20h30) : lignes 41-49, total ligne 50
  - Collation/Repas 5 : lignes 51-60, total ligne 61
- Colonne K : **colonne "Verrou"** avec cases à cocher (ajoutée pour
  l'optimiseur — si cochée, la quantité de cette ligne reste figée).
- Cellules vides en E contiennent parfois le texte `rien`.

### Feuille `Toutes les recettes`

- Colonne B : Nom de l'aliment (clé VLOOKUP)
- Colonnes C, D, E, F : kcal/100g, Protéines/100g, Glucides/100g, Lipides/100g
- Colonnes G, H (optionnelles, à ajouter si besoin) : Qmin (g), Qmax (g) par aliment

### Feuille `nombre pour la quantité`

- Colonne A : liste des valeurs de quantité autorisées (utilisée par les
  VLOOKUP dans les feuilles Programme). Une quantité écrite en F doit exister
  dans cette liste, sinon la formule renvoie `#N/A`.
- **Contrainte forte** : le script optimiseur écrit des valeurs arrondies
  (multiples de 5 g par défaut). S'assurer que la liste couvre bien ces
  valeurs, ou remplacer les formules pour ne plus en dépendre.

## Formules existantes (à NE PAS casser)

Dans les feuilles `Programme`, colonnes G/H/I/J :

```
= VLOOKUP(E8; 'Toutes les recettes'!B:F; 2; 0)
  * VLOOKUP(F8; 'nombre pour la quantité'!A:A; 1; 0) / 100
```

La formule Harris-Benedict genre-spécifique et l'application du coef. activité
sont déjà en place dans la feuille Données. Ne pas dupliquer côté script.

## Script `Code.gs` — points de config à respecter

Les références sont centralisées dans l'objet `CONFIG` en tête de fichier :

- `cellulesCibleKcal` : **doit être `['C15']`** (une seule cellule — la cible
  finale est déjà calculée). La valeur par défaut `['C4','C5']` du fichier
  original était incorrecte pour ce Sheet.
- `cellCibleProteines` = `'A10'`, `cellCibleGlucides` = `'B10'`,
  `cellCibleLipides` = `'C10'`.
- Plages d'aliments : 8-17, 19-28, 30-39, 41-49, 51-60 (conformes).
- Colonnes : aliment=5 (E), quantité=6 (F), verrou=11 (K).

## Site web `web/`

Projet Vite + React 18 + TypeScript + Tailwind + Zustand + localForage.

- **Base aliments** : `web/src/data/foods.json` (3010 entrées CIQUAL 2020, format `{nom, groupe, kcal, prot, gluc, lip}` par 100 g) — extraite depuis les XML officiels ANSES via `web/scripts/extract-ciqual.cjs`.
- **Aliments perso** : ajoutés au vol via le scanner code-barres (Open Food Facts) et persistés en IndexedDB (store `useCustomFoods`). Catégorie 📦 « Mes aliments ».
- **Logique portée depuis `Code.gs`** : `web/src/lib/calculations.ts` (Harris-Benedict + coefs + macros), `web/src/lib/optimizer.ts` (descente de gradient projetée, même algo).
- **Persistance** : IndexedDB via localForage (profils, plans, favoris, settings, aliments perso, rappels, poids, recettes). Zéro backend, zéro compte.
- **Navigation** : React Router v6 — routes `/`, `/setup`, `/today`, `/history`, `/profiles`, `/favorites`, `/shopping`, `/recipes`.
- **Design** : moderne épuré, palette émeraude + neutres, mode sombre via classe `.dark` sur `<html>`, responsive mobile-first.
- **PWA** : installable (manifest + service worker), fonctionne hors-ligne, shortcut "Plan du jour".
- **Features** : scanner code-barres (BarcodeDetector + Open Food Facts, fallback saisie manuelle), partage de plan via URL encodée base64url, rappels quotidiens via Notifications API, progression pondérale + courbe, recettes composées, export PDF.
- **Commandes** : `cd web && npm install && npm run dev`. Build : `npm run build`. Typecheck : `npm run typecheck`. Extraction CIQUAL : `node scripts/extract-ciqual.cjs <dossierXmlCiqual> src/data/foods.json`.
- **Déploiement** : Vercel (voir `web/README.md`), root directory = `web`.

Le site et le Sheet partagent la logique mais sont totalement **indépendants** — aucune synchro bidirectionnelle. Les utilisateurs du site n'ont pas besoin du Sheet.

## Conventions du projet

- Tout est en français (UI, commentaires, messages d'erreur, noms de variables
  métier). Conserver cette cohérence.
- Script Apps Script : pas de dépendances externes, uniquement Apps Script.
- Site web : dépendances listées dans `web/package.json`, zéro backend.
- L'optimiseur doit être **idempotent** : le relancer plusieurs fois d'affilée
  doit converger, pas diverger.
- Les aliments verrouillés (case cochée en col K) ne doivent jamais être
  modifiés, même marginalement.

## À ne pas modifier sans discussion

- Les formules VLOOKUP existantes (colonnes G-J des feuilles Programme) —
  l'utilisateur les a construites avec soin.
- La feuille `DONNEES CLIENTS` (persistance manuelle des profils).
- Les totaux par repas (lignes 18, 29, 40, 50, 61) et leurs formules `SUM`.

## Idées éventuelles pour plus tard (non demandées)

- Export d'un bilan PDF journalier.
- Menu "Suggérer un aliment manquant" pour combler un déficit protéines/glucides.
- Sauvegarde automatique du plan optimisé dans `DONNEES CLIENTS`.
