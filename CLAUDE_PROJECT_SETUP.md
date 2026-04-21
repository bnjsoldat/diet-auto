# Setup Projet Claude.ai — Ma Diét

Ce fichier contient tout ce qu'il faut pour créer un Projet dans Claude.ai
(https://claude.ai → Projects → New project). Une fois créé, tu pourras
accéder au contexte complet de Ma Diét depuis ton téléphone (app iOS/Android)
pour brainstormer, rédiger, prendre des décisions produit.

---

## Étape 1 — Créer le projet

1. Va sur https://claude.ai
2. Menu latéral → **Projects** → **Create project** (en haut à droite)
3. **Name** : `Ma Diét — App nutrition`
4. **Description** : `Planificateur alimentaire React/TypeScript déployé sur madiet.lentreprise.ai. Micro-entreprise Benjy GRONDIN (SIRET 933 093 882 00019).`

## Étape 2 — Custom instructions

Colle CECI dans le champ **"What are you trying to achieve?"** / **"Custom instructions"** :

```
Je travaille sur Ma Diét, une app web de planification alimentaire optimisée :
- URL : https://madiet.lentreprise.ai
- Repo GitHub : bnjsoldat/diet-auto (branche main, déploiement auto Vercel)
- Stack : React 18 + Vite + TypeScript + Tailwind + Zustand + Supabase (auth + sync)
- Base nutritionnelle : CIQUAL 2020 (3 010 aliments ANSES) + Open Food Facts scan
- Stade : 0 utilisateurs, préparation du lancement public (Product Hunt, LinkedIn, Reddit)
- Business : micro-entreprise Benjy GRONDIN à Saint-Paul (La Réunion), gratuit pour les 100 premiers users puis freemium

Règles de conversation :
- Réponds en français, direct, sans bla-bla.
- Je code avec Claude Code sur mon PC (Windows). Depuis mon téléphone je te parle sur claude.ai pour brainstormer — ne tente pas d'écrire du code "final", donne-moi juste des pistes et je l'implémenterai plus tard.
- Pour les sujets copywriting / posts sociaux / articles de blog / réponses aux feedbacks users : tu peux écrire directement.
- Si tu ne sais pas, dis-le. Pas d'invention de chiffres ou de faits.
- Prix cible Pro (plus tard) : 4,99 €/mois. Pas de données médicales sensibles côté légal.
- Priorité actuelle : acquérir les 100 premiers utilisateurs avec le contenu existant.
```

## Étape 3 — Project knowledge (fichiers à uploader)

Dans la section **"Project knowledge"**, uploade CES 3 fichiers depuis ton
dossier local `C:\Users\Client\Documents\diét automatique\` :

1. **`CLAUDE.md`** — la mémoire projet complète (stack, structure, contraintes)
2. **`LAUNCH_KIT.md`** — tous les templates posts (Product Hunt, LinkedIn, Reddit, Twitter, email beta)
3. **`web/README.md`** — si présent, sinon ignore

**Optionnel si tu as de la place dans le knowledge (limite ~10 fichiers)** :

4. **`web/src/App.tsx`** — vue d'ensemble des routes
5. **`web/package.json`** — dépendances
6. **`INSTRUCTIONS.txt`** — guide utilisateur interne

**NE PAS uploader** :
- Aucun secret (`.env`, clés API)
- Aucune donnée utilisateur
- `node_modules/`
- `dist/`

## Étape 4 — Premier test depuis ton téléphone

Ouvre l'app Claude sur ton téléphone, sélectionne le Projet **Ma Diét**, et
essaie un de ces prompts pour vérifier que ça marche :

```
Lis le LAUNCH_KIT.md. Donne-moi le post Reddit r/fitness_France reformulé pour qu'il ait
l'air moins "markéting" et plus "j'ai galéré avec MyFitnessPal, voici ce que j'ai codé".
```

ou

```
Selon notre CLAUDE.md, quel est le principal risque si je lance sur Product Hunt demain sans avoir testé ?
```

Si Claude répond avec des références précises au contenu de tes fichiers → le
projet est bien configuré.

## Étape 5 — Usage type depuis ton téléphone

**Cas d'usage concrets** :

- **Dans le bus** : "Écris-moi 3 variantes de tweets pour annoncer le lancement"
- **Au café** : "Rédige un article de blog de 800 mots sur la chrononutrition, style Ma Diét"
- **En attendant un RDV** : "Brainstorme 5 features freemium qu'on pourrait réserver à la version Pro"
- **Le soir avant de dormir** : "Que dois-je prioriser demain pour avancer sur le lancement ?"

Toutes ces réponses arrivent dans la même conversation projet → tu peux les
retrouver plus tard sur ton PC dans Claude Code via un simple copier-coller.

---

## Pont Claude.ai (mobile) ↔ Claude Code (desktop)

**Workflow idéal** :

1. **Sur ton tel** (Claude.ai app) : tu brainstormes / rédiges. Tu sauvegardes
   les bons trucs en les copiant dans un Google Keep ou Notion.
2. **Sur ton PC** (Claude Code) : tu ouvres une session, tu dis à Claude Code
   "voici ce qu'on a décidé sur claude.ai : [...]" → il implémente.

**Astuce** : mets à jour régulièrement ton CLAUDE.md quand tu prends une
décision importante (ex : "Pro prix fixé à 4,99 €"). Comme ça les deux
Claude (mobile et desktop) restent synchronisés sur la même vision.
