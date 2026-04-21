# Draft post r/fitness_France — version "galère vécue"

Voici **3 versions** du post, du plus "humain / authentique" au plus "produit",
pour que tu choisisses celle qui te ressemble le plus. Le ton Reddit français
déteste le marketing déguisé — la version A marche presque toujours mieux,
mais teste selon ton style.

---

## 🥇 Version A — "j'ai codé mon outil" (recommandée)

> **Titre** : J'en avais marre de MyFitnessPal, j'ai codé mon propre planificateur alimentaire (gratuit, sans compte)
>
> Hello r/fitness_France,
>
> Bon, après 2 ans à utiliser MyFitnessPal + Yazio en parallèle, j'en pouvais
> plus de 2 trucs :
>
> 1. **Tracker chaque aliment à la main**. Je sais que j'ai besoin de 2 700
>    kcal avec 150g de protéines, mais à chaque repas je dois bidouiller les
>    quantités pour tomber pile. En 10 min par jour, ça fait 1h par semaine
>    juste pour ajuster.
> 2. **Les bases d'aliments pourries en français**. MFP a la moitié des plats
>    français en "user-generated" avec des macros inventées. Yazio c'est mieux
>    mais c'est payant pour l'export.
>
> Du coup j'ai codé une app web (solo dev, micro-entreprise), qui fait
> **exactement l'inverse** :
>
> - Tu renseignes ton profil (poids, taille, âge, activité) → elle calcule ton
>   besoin avec Harris-Benedict.
> - Tu choisis les aliments que tu veux manger (base CIQUAL 2020 ANSES, 3010
>   aliments réels + scan code-barres Open Food Facts pour les produits
>   industriels).
> - Tu cliques **"Optimiser"** → un algo (descente de gradient projetée, si
>   ça dit quelque chose à des matheux ici) ajuste les quantités pour taper
>   pile tes cibles kcal + macros. Tu peux verrouiller certains aliments pour
>   qu'ils ne bougent pas ("je veux 150 g de riz point").
>
> **Pas de compte obligatoire** (tout est en local dans ton navigateur), option
> de sync Google si tu veux multi-appareil. Pas de pub. Gratuit. Zéro
> tracking (juste Vercel Analytics cookie-free).
>
> Le lien : https://madiet.lentreprise.ai
>
> J'cherche des retours honnêtes, notamment sur :
> - La qualité de l'optimiseur (est-ce que les quantités tombent juste pour
>   vos besoins à vous ?)
> - Des aliments manquants / mal dosés dans la base.
> - L'UX mobile (j'ai fait ce que j'ai pu sans designer).
>
> Je lis tout, je réponds à tout. Cassez-moi le truc si y'a quelque chose qui
> cloche.
>
> Bon entraînement 💪

---

## 🥈 Version B — Plus directe / technique

> **Titre** : [OC] Planificateur alimentaire avec optimiseur automatique de macros — gratuit, sans compte, 3010 aliments ANSES
>
> Je développe depuis quelques mois une app de planification nutritionnelle.
> L'objectif : tu entres ton profil, tu choisis tes aliments, et l'algo ajuste
> les quantités pour atteindre tes cibles (kcal + protéines + glucides +
> lipides). Tu peux verrouiller des aliments, dupliquer des plans, exporter PDF.
>
> Features :
> - Base CIQUAL 2020 (ANSES, 3010 aliments)
> - Scan code-barres (Open Food Facts)
> - 7 modèles de plans (équilibré, sportif, perte, végé, prise de masse,
>   restauration rapide, keto)
> - Mode sombre, PWA (installable), offline-first
> - Sync cloud optionnelle (Supabase) — ou tout en local
> - Pas de compte requis, pas de pub, gratuit
>
> Stack pour les curieux : React + Vite + TS + Tailwind + Zustand + localforage
> (IndexedDB). Code source pas ouvert pour l'instant mais l'algo d'optimisation
> est détaillé dans mon article de blog (https://madiet.lentreprise.ai/blog).
>
> Lien app : https://madiet.lentreprise.ai
>
> Feedbacks bienvenus, surtout sur la pertinence des macros par défaut (je
> suis en LA Réunion donc mon biais est biaisé 😅).

---

## 🥉 Version C — "j'ai un problème à résoudre" (plus question)

> **Titre** : Comment vous faites pour tomber pile sur vos macros sans passer 1h à réajuster ?
>
> Hello, question pour la communauté :
>
> Je vise 2700 kcal, 150P/330G/75L. Avec MyFitnessPal je dois :
> - Ajouter un aliment → regarder les macros
> - Ajuster la quantité à la main pour que ça tombe
> - Répéter pour chaque aliment des 4 repas
>
> Résultat : ça me prend 15-20 min par repas, surtout au petit-déj où je
> rajoute 20g de fromage blanc pour finir les protéines.
>
> Vous avez une méthode / une app qui fait ça mieux ? J'ai testé Yazio
> (meilleur) mais même problème. Foodvisor = lecture de photo pour
> tracking mais pas d'optimisation automatique.
>
> Du coup j'ai fini par coder mon propre outil
> (https://madiet.lentreprise.ai) qui fait la bidouille automatiquement
> avec un solveur numérique. Mais ça m'intéresse de savoir si je réinvente
> la roue — peut-être qu'il y a déjà une solution que je connais pas ?

---

## Recommandations avant de poster

**Timing idéal** : mardi/mercredi/jeudi, entre 9h et 11h ou 18h-20h (heure
FR). Évite le weekend (algorithme Reddit défavorise).

**Avant de poster** :
1. Crée/utilise un compte Reddit avec au moins 6 mois d'ancienneté + du
   karma (sinon r/fitness_France auto-supprime les posts de nouveaux
   comptes).
2. Contribue avant à 2-3 autres posts du sub (commentaires utiles). Le
   mod regarde ça avant de laisser passer.
3. Mets un flair **[OC]** (Original Content) si dispo.

**Après avoir posté** :
1. Réponds à **TOUS** les commentaires dans les 2 heures — Reddit récompense
   l'engagement.
2. Si quelqu'un trouve un bug, répare-le dans la journée et commente pour
   le prévenir. C'est une énorme boost de crédibilité.
3. Ne supprime JAMAIS le post même si ça te vanne. Absorbe la critique.

**Attendu réaliste** :
- Upvote ratio > 80% → bon signal
- 50-200 visiteurs sur le site le jour J
- 5-15 profils créés
- 1-3 critiques valables à corriger → c'est pour ça qu'on poste

**Pour éviter le "tu fais de la pub déguisée" qui tue le post** :
- Version A avec l'angle "j'avais un problème, j'ai codé ma solution"
  passe 90% du temps.
- Évite de poster plus d'1 fois par mois sur le même sub.
- Pas de DM commercial aux commentateurs — Reddit bannit direct.

---

## Variantes pour d'autres subs

**r/bouffe** (moins hardcore, plus grand public) — reformule pour virer le
jargon "macros" :

> Titre : J'ai codé un truc qui calcule automatiquement les portions pour manger équilibré
>
> ...même intro mais simplifiée... "pas la force de peser chaque patate" ...

**r/france** ou **r/Entrepreneur** (plus dur, publics différents) — ne pas
cibler au début. Réussis d'abord r/fitness_France.

**r/nutrition** (EN) — traduis en anglais, ton différent (plus formel).

---

Dis-moi laquelle tu veux raffiner / poster. Je peux aussi l'adapter à ton
niveau de vie (t'es pas bodybuilder, tu fais peut-être plutôt du running ou
de la rando — ça change l'angle d'accroche pour que ce soit authentique).
