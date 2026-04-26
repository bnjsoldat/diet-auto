# Guide : Brander l'écran de connexion Google OAuth

**Objectif** : remplacer le « Sélectionnez un compte / Accéder à l'application **vhgmsmhkhncxvkvnoquz.supabase.co** » qui fait peur, par une page Google qui affiche **Ma Diét** avec ton logo et tes liens légaux.

**Durée** : ~10 min  
**Coût** : 0 €

---

## Ce que tu vas obtenir

### Avant (actuel)
```
┌─────────────────────────────────────┐
│ Connexion : comptes Google      ⋮  │
│ accounts.google.com                 │
├─────────────────────────────────────┤
│ Sélectionnez un compte              │
│ Accéder à l'application             │
│ vhgmsmhkhncxvkvnoquz.supabase.co    │  ← scary
│                                     │
│ 👤 Steven Berfroi                   │
│    steveberfroi@gmail.com           │
└─────────────────────────────────────┘
```

### Après (ce que ce guide configure)
```
┌─────────────────────────────────────┐
│ Connexion : comptes Google      ⋮  │
│ accounts.google.com                 │
├─────────────────────────────────────┤
│  [Logo Ma Diét]                     │
│                                     │
│  Ma Diét                            │
│  Continuer avec Ma Diét             │
│                                     │
│ 👤 Steven Berfroi                   │
│    steveberfroi@gmail.com           │
│                                     │
│ Politique de confidentialité · CGU  │
└─────────────────────────────────────┘
```

L'URL `vhgmsmhkhncxvkvnoquz.supabase.co` apparaîtra TOUJOURS sur l'écran de
*consentement* (page suivante après le sélecteur), c'est imposé par Google
pour la transparence. Mais l'**écran de consentement** sera entièrement aux
couleurs de Ma Diét : nom, logo, liens.

Pour supprimer **complètement** l'URL Supabase, il faudrait passer à
**Supabase Pro** ($25/mois) avec un *Custom Domain* (`auth.madiet.lentreprise.ai`).
À reporter post-lancement quand tu auras des revenus.

---

## Étape 1 — Ouvrir Google Cloud Console

1. Va sur https://console.cloud.google.com/
2. Connecte-toi avec le **compte Google qui a créé le projet OAuth pour Ma Diét**
   (probablement le même que ton compte Supabase / Vercel)
3. En haut, clique le **sélecteur de projet** (à gauche de la barre de
   recherche)
4. Sélectionne le projet **« Ma Diét »** (ou le nom que tu lui as donné
   au moment de l'intégration Supabase)

> 💡 Si tu n'as plus de projet Google Cloud, c'est que l'OAuth Google passe
> directement par Supabase sans ton propre projet. Dans ce cas, va dans
> Supabase Dashboard → Auth → Providers → Google → tu y trouveras le
> Client ID et Client Secret. Le projet Google Cloud associé est celui
> qui a généré ce Client ID. Tu peux le retrouver via les premières
> lettres du Client ID.

---

## Étape 2 — Aller à l'écran de consentement OAuth

Dans le menu de gauche (☰) :

```
APIs & Services
└─ OAuth consent screen        ← clique ici
```

Lien direct : https://console.cloud.google.com/apis/credentials/consent

---

## Étape 3 — Remplir les informations de l'app

Si l'app est en mode **« Testing »**, clique d'abord sur **« EDIT APP »**.

### 3a. App information

Remplis exactement ces champs :

| Champ | Valeur à entrer |
|---|---|
| **App name** | `Ma Diét` |
| **User support email** | `lentreprise@lentreprise.ai` |
| **App logo** | Upload `web/public/icon-512.png` (ou `og-image.png`) — voir étape 4 |

### 3b. App domain

| Champ | Valeur |
|---|---|
| **Application home page** | `https://madiet.lentreprise.ai` |
| **Application privacy policy link** | `https://madiet.lentreprise.ai/confidentialite` |
| **Application terms of service link** | `https://madiet.lentreprise.ai/cgu` |

### 3c. Authorized domains

Ajoute :
- `madiet.lentreprise.ai`
- `lentreprise.ai`
- `supabase.co` (probablement déjà là — gardé pour le callback OAuth)

### 3d. Developer contact information

| Champ | Valeur |
|---|---|
| **Email addresses** | `lentreprise@lentreprise.ai` |

---

## Étape 4 — Préparer le logo (1 minute)

Google demande un **logo carré 120×120 px minimum** au format PNG/JPG.

### Option rapide : utiliser le favicon existant

```bash
# Vérifier les logos déjà disponibles
ls "web/public" | grep -E "(icon|logo|og)"
```

Tu devrais avoir `icon-512.png` ou `og-image.png` qui peuvent servir.

### Option propre : créer un logo carré dédié

1. Prends ton logo Ma Diét (icône emerald, etc.)
2. Centre-le sur fond blanc ou transparent
3. Format **carré 512×512 px** au minimum
4. Format PNG transparent recommandé
5. Taille **< 1 Mo**

Upload via le bouton « UPLOAD LOGO » sur l'écran Google Cloud.

---

## Étape 5 — Sauvegarder et passer en Production

1. En bas de la page, clique **« SAVE AND CONTINUE »** (3 fois pour passer
   les sections Scopes / Test users)

2. Si l'app est en mode **« Testing »** : tu vois un bandeau
   « Publishing status: Testing ». Clique **« PUBLISH APP »** → confirme.
   
   ⚠️ Si tu obtiens une erreur disant que tu dois **vérifier l'app**, ce
   n'est pas grave pour le moment — voir étape 6.

---

## Étape 6 — La vérification Google (optionnelle pour l'instant)

Google demande une **vérification** quand l'app est en production ET demande
des scopes sensibles. Pour Ma Diét, on demande juste `email` + `profile` qui
sont des scopes **non-sensibles**, donc **AUCUNE vérification requise**.

Tu verras peut-être un écran d'avertissement « Cette app n'est pas vérifiée »
pour les **100 premiers utilisateurs**. Ils peuvent cliquer « Avancé →
Continuer vers Ma Diét (non sécurisé) » pour passer.

### Pour supprimer cet avertissement

1. **Sur le court terme** (< 100 users) : ignore, c'est normal
2. **Sur le moyen terme** : soumets l'app à vérification Google
   - Lien : « PUBLISH APP » → suit le processus
   - Délai : ~3-7 jours ouvrés
   - Demande : un screencast de l'usage de l'app + politique de confidentialité hébergée + email du support
3. **Une fois vérifié** : badge « ✓ Verified » et plus d'avertissement

---

## Étape 7 — Tester

1. Ouvre **un navigateur en navigation privée** (ou un autre browser)
2. Va sur `https://madiet.lentreprise.ai`
3. Clique « Continuer avec Google »
4. Observe l'écran de consentement :
   - ✅ Tu dois voir **« Ma Diét »** comme nom d'app
   - ✅ Ton **logo** s'affiche
   - ✅ Les **liens « politique de confidentialité » et « CGU »** sont cliquables
   - ⚠️ L'URL `supabase.co` reste dans le sélecteur de compte (normal sans
     custom domain)

---

## Bonus : si tu veux pousser plus loin

### Option A — Custom Domain Supabase (Pro plan, $25/mois)

Permet de remplacer `vhgmsmhkhncxvkvnoquz.supabase.co` par
`auth.madiet.lentreprise.ai`. Documentation officielle :

- https://supabase.com/docs/guides/platform/custom-domains

Étapes :
1. Upgrade Supabase à Pro ($25/mois minimum)
2. Settings → Custom Domains → ajouter `auth.madiet.lentreprise.ai`
3. Configurer les CNAMEs sur ton DNS (Vercel ou registrar)
4. Mettre à jour les **Authorized redirect URIs** dans Google Cloud
   Console : remplacer `https://vhgmsmhk....supabase.co/auth/v1/callback`
   par `https://auth.madiet.lentreprise.ai/auth/v1/callback`
5. Tester : l'URL Supabase disparaît complètement

### Option B — Vérification Google complète

Demande à Google de vérifier ton app pour avoir le badge ✓.

1. Dans OAuth consent screen → cliquer « PREPARE FOR VERIFICATION »
2. Suivre les étapes : screencast (Loom OK), démo de l'app, contact
3. Délai : 3-7 jours en moyenne pour les apps non-sensibles
4. Effet : plus d'avertissement « Non vérifié », badge de confiance

---

## Checklist finale

- [ ] App name = « Ma Diét » dans Google Cloud Console
- [ ] User support email = `lentreprise@lentreprise.ai`
- [ ] Logo uploadé (512×512 PNG)
- [ ] Application home page = `https://madiet.lentreprise.ai`
- [ ] Privacy policy = `https://madiet.lentreprise.ai/confidentialite`
- [ ] Terms = `https://madiet.lentreprise.ai/cgu`
- [ ] Authorized domains : madiet.lentreprise.ai, lentreprise.ai
- [ ] Developer contact email = `lentreprise@lentreprise.ai`
- [ ] App publiée (status « In production »)
- [ ] Test en navigation privée : nom + logo Ma Diét visibles ✅

---

## Liens utiles

- **OAuth consent screen** : https://console.cloud.google.com/apis/credentials/consent
- **OAuth credentials** (Client ID/Secret) : https://console.cloud.google.com/apis/credentials
- **Supabase Auth → Google provider** : Dashboard → Authentication → Providers → Google
- **Doc Supabase OAuth Google** : https://supabase.com/docs/guides/auth/social-login/auth-google
- **Doc Supabase Custom Domains** : https://supabase.com/docs/guides/platform/custom-domains

---

## Si quelque chose ne marche pas

| Problème | Solution |
|---|---|
| Je ne trouve pas le projet dans Google Cloud Console | Va dans Supabase Dashboard → Auth → Providers → Google → vois le Client ID. Le projet Google associé est celui où ce Client ID a été créé. Tu peux aussi créer un **nouveau projet** Google Cloud, regénérer Client ID/Secret et les coller dans Supabase. |
| Erreur 400 redirect_uri_mismatch | Vérifie dans Google Cloud Console → Credentials → l'OAuth Client → « Authorized redirect URIs » contient bien `https://[ton-project].supabase.co/auth/v1/callback` |
| L'avertissement « Cette app n'est pas vérifiée » apparaît | Normal pour les 100 premiers users. Soumets pour vérification Google si tu veux le faire disparaître (étape 6). |
| Le logo n'apparaît pas | Format incorrect ? Doit être PNG/JPG carré, < 1 Mo, ≥ 120×120 px. Re-upload après vérification. |
| Aucun champ « App information » | L'app est peut-être déjà publiée. Clique « EDIT APP » en haut. |
