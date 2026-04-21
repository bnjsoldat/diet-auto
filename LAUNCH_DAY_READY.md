# 🚀 Launch Day — Copier/coller prêt à poster

**Profil** : Benjy GRONDIN, 26 ans, La Réunion, futur pompier, auto-entrepreneur
(cours de maths, rédaction mémoires techniques, sites web + SaaS B2B), pratique
muscu + course + volley + boxe.

**App** : https://madiet.lentreprise.ai

---

## 📅 Timing recommandé

| Jour | Heure La Réunion | Action | Plateforme |
|---|---|---|---|
| **Lundi 20 avril** | soir | Warmer le compte Reddit (commenter 2-3 posts sympas du sub) | r/fitness_France |
| **Mardi 21 avril** | **10h** | 🚀 **Post Reddit** | r/fitness_France |
| Mardi 21 avril | 10h-14h | Répondre à TOUS les commentaires (objectif : < 30 min de délai) | Reddit |
| Mardi 21 avril | 20h | Thread Twitter (7 tweets) | X / Twitter |
| Mercredi 22 avril | journée | Fixer les bugs remontés, derniers coms Reddit | GitHub + Reddit |
| Jeudi 23 avril | matin | Post LinkedIn | LinkedIn |
| Jeudi 23 avril | soir | Bilan chiffré (visites, profils, feedback) | Vercel Analytics |
| Lundi 28 avril | - | Go/no-go Product Hunt selon feedback | — |

---

## 🎯 1. POST REDDIT — r/fitness_France

### Titre

```
J'en ai eu marre de calculer mes portions à la main, j'ai codé un truc qui le fait — retours bienvenus
```

### Corps (copier-coller tel quel)

```
Salut,

Je prépare le concours pompier et je track mes macros depuis un peu plus d'un an (muscu 3x/sem, course, volley et boxe en complément). Le truc qui m'a toujours saoulé c'est le moment du "bricolage de grammages" : je sais que je veux ~180g de prot aujourd'hui, j'ouvre MyFitnessPal, je rentre poulet + riz + brocolis + yaourt, et là faut que je bricole 20 min pour tomber juste sur mes cibles. À chaque repas. Tous les jours.

Du coup, comme je suis aussi dev à côté (auto-entrepreneur, je fais de la rédaction technique et du code pour des boîtes), j'ai codé mon propre truc le weekend : tu mets les aliments que tu veux manger, tu cliques "Optimiser", l'algo ajuste automatiquement les grammages pour matcher tes cibles kcal + macros (P/G/L). Tu peux verrouiller un aliment ("je veux exactement 150g de riz point"), l'algo ajuste le reste.

Base CIQUAL/ANSES (3010 aliments français) + scan code-barres Open Food Facts pour les produits industriels. C'est gratuit, pas besoin de compte pour tester, tout reste en local dans ton navigateur.

👉 https://madiet.lentreprise.ai

Je cherche surtout à savoir :
- Est-ce que les calculs (Harris-Benedict + coef activité) vous paraissent cohérents avec vos chiffres habituels ?
- Quels aliments manquent ou ont des macros pétées dans la base ?
- L'UX mobile, ça passe ? (je suis à La Réunion, mon panel de testeurs IRL est limité 😅)

Je réponds à tous les commentaires dans les heures qui viennent. Cassez-moi le truc si y'a un bug, je corrige direct.

Bon entraînement 💪
```

### Flair à choisir
- [OC] si dispo
- ou "Discussion" / "Ressources"

### 🛑 Pièges à éviter absolument
- ❌ **NE parle JAMAIS du Pro 4,99 €** dans le thread. Si on demande : *"gratuit pour l'instant, un Pro arrivera plus tard pour financer, mais l'essentiel reste gratuit. Point."*
- ❌ Ne liste pas les features en ✅ ✅ ✅ → ça sent le marketing.
- ❌ Ne dis pas "meilleur que MFP/Yazio" → tu humilieras leurs users.
- ❌ Ne supprime JAMAIS le post même si tu te fais vanner.

### ✅ Si quelqu'un pose une question critique
- "Pourquoi gratuit ?" → *"Pour l'instant j'ai pas 100 users, je me focus sur rendre le truc bien. Un Pro arrivera dans quelques mois pour des features avancées mais l'essentiel restera gratuit."*
- "C'est sécurisé ?" → *"Tout est en local dans ton navigateur par défaut (IndexedDB). La sync cloud est optionnelle via Supabase (OAuth Google). Je ne collecte aucune donnée perso, pas de tracking tiers."*
- "Le CIQUAL c'est 2020, c'est pas trop vieux ?" → *"C'est la dernière version officielle publiée par l'ANSES. Pour les produits industriels, j'utilise Open Food Facts qui est à jour."*
- "Vous êtes diététicien ?" → *"Non, je suis dev et sportif. L'outil calcule mécaniquement selon Harris-Benedict — c'est une aide pour calibrer, pas un conseil médical. Pour un vrai plan, faut voir un diét."*

---

## 🐦 2. THREAD TWITTER / X (7 tweets)

À poster **après le Reddit** (mardi soir ou mercredi selon la réception).

### Tweet 1 — accroche

```
J'ai passé mon weekend à coder un optimiseur de plan alimentaire en React.

Tu dis "je veux 2700 kcal et 150g de protéines", tu choisis tes aliments, l'algo ajuste automatiquement les grammages.

Gratuit, sans compte : madiet.lentreprise.ai

🧵 comment ça marche 👇
```

### Tweet 2 — l'algo

```
L'algorithme : descente de gradient projetée.

Tu minimises la somme des carrés d'erreur relative entre (kcal, P, G, L) calculés et tes cibles, sous contraintes que chaque quantité > 0.

Ça converge en <100 ms pour 50 aliments. Testé sur un plan de 8 repas.
```

### Tweet 3 — la base de données

```
Base de données : CIQUAL 2020 (ANSES, 3010 aliments français officiels).

Pour les produits industriels emballés, scan du code-barres → appel à Open Food Facts, l'aliment est ajouté à ta base perso.

Tout est en local (IndexedDB), zéro backend, 100% privé.
```

### Tweet 4 — la stack

```
Stack :
- Vite + React 18 + TypeScript
- Tailwind v4 + Framer Motion
- Zustand (state) + localforage (persistance)
- Supabase (optionnel, sync multi-appareils)
- Hébergement Vercel

Bundle : 393 kB gzip pour la landing. Installable en PWA.
```

### Tweet 5 — le pourquoi perso

```
Pourquoi j'ai codé ça :

Je prépare le concours pompier → je track mes macros depuis 1 an → j'en avais marre de passer 20 min par repas à bricoler les grammages sur MFP.

Si je dois le faire, d'autres aussi.
```

### Tweet 6 — le CTA

```
Si tu traques tes macros, teste et dis-moi :

- Les calculs Harris-Benedict matchent tes chiffres ?
- Quels aliments manquent dans la base ?
- L'UX mobile, ça passe ?

Retour bienvenu 🙏

👉 madiet.lentreprise.ai
```

### Tweet 7 (optionnel) — bonus

```
Pas de pub, pas de tracking tiers, pas d'abo obligatoire.

Si t'aimes, fav ce tweet et partage à quelqu'un qui galère avec ses macros.

Merci 🙌
```

---

## 💼 3. POST LINKEDIN (jeudi matin)

```
Il y a 6 mois, j'ai commencé à préparer le concours pompier.

Comme tout sportif qui monte en charge, j'ai naturellement structuré mon alimentation : calculer mon besoin calorique, répartir mes macros, ajuster les quantités à chaque repas.

Problème : les apps existantes (MyFitnessPal, Yazio...) te forcent à bricoler manuellement. Tu entres les aliments, tu regardes les macros, tu remontes la quantité de 10g, tu re-regardes. 20 minutes par repas.

Donc, comme je suis aussi développeur (auto-entrepreneur à La Réunion, je fais du SaaS B2B et de la rédaction technique), j'ai codé ce qui me manquait :

Ma Diét → https://madiet.lentreprise.ai

Tu renseignes ton profil, tu choisis tes aliments, et un optimiseur numérique (descente de gradient projetée, pour les curieux) ajuste automatiquement les grammages pour tomber pile sur tes cibles.

Base CIQUAL 2020 (ANSES, 3 010 aliments français), scan code-barres Open Food Facts, mode sombre, PWA installable, offline-first. Pas de compte requis, tout reste local par défaut. Gratuit.

Ce post n'est pas un launch — c'est un appel à feedback. Si ça t'intéresse, teste et dis-moi :

• Les calculs matchent tes chiffres habituels ?
• Quels aliments manquent dans la base ?
• Des bugs à remonter ?

Je réponds à tous les messages.

#Nutrition #React #SoloFounder #MicroEntreprise #LaRéunion
```

---

## 📧 4. EMAIL beta testers (si tu as une liste)

```
Objet : 5 min pour me rendre service ?

Salut [prénom],

Tu connais Ma Diét, le petit planificateur alimentaire sur lequel je
bosse. J'ai bien avancé et je voudrais ton avis avant de lancer publiquement
la semaine prochaine.

Le lien : https://madiet.lentreprise.ai (gratuit, sans compte)

Ce que j'aimerais que tu testes (5 min max) :
1. Crée ton profil
2. Charge le plan "équilibré" ou "sportif"
3. Clique "Optimiser" → regarde si les quantités tombent juste
4. Dis-moi ce qui cloche

Si t'as 2 min pour répondre à ce mail avec tes retours, je t'en serai
reconnaissant à vie.

Benjy
```

---

## 📊 Métriques à suivre (après J+7)

Dans ton dashboard Vercel Analytics :

- **Visites totales** (objectif : 200+ sur la semaine)
- **Top pages** (landing vs Today vs blog articles)
- **Top referrers** (Reddit vs LinkedIn vs direct)
- **Durée moyenne par session** (objectif : > 2 min = engagement réel)
- **Taux de création de profil** (visites → /today avec data = conversion)

Côté qualitatif (à noter dans un Google Doc ou Notion) :
- Nombre de commentaires Reddit positifs vs négatifs
- Bugs remontés (et fixés)
- Features demandées (priorise celles qui reviennent 3+ fois)

**Seuil pour Product Hunt** : 500+ visites cumulées, au moins 10 profils créés,
3 feedbacks qualitatifs de gens qui utilisent l'app plus d'1 jour.

---

## 🆘 Checklist jour J (mardi 21 avril matin)

- [ ] Vercel Analytics vérifié (au moins 0 event visible dans le dashboard)
- [ ] https://madiet.lentreprise.ai répond en < 1 s
- [ ] Je peux créer un profil depuis mon tel (safari/chrome mobile)
- [ ] Le scan code-barres fonctionne sur mon tel
- [ ] Compte Reddit prêt (6 mois + 50 karma minimum)
- [ ] Post Reddit copié depuis ce fichier
- [ ] J'ai bloqué 2h dans mon agenda pour répondre aux coms
- [ ] Mon tel est chargé 🔋

---

## 🔗 Accès rapide

- **App** : https://madiet.lentreprise.ai
- **Repo GitHub** : https://github.com/bnjsoldat/diet-auto
- **Blog** : https://madiet.lentreprise.ai/blog
- **Vercel dashboard** : https://vercel.com/bnjsoldat/diet-auto
- **Ce fichier sur GitHub** (pour copier depuis le tel) : https://github.com/bnjsoldat/diet-auto/blob/main/LAUNCH_DAY_READY.md

---

**Bonne chance Benjy. Tu as tout pour réussir. 🔥**
