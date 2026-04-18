# Setup Supabase pour Ma Diét

Guide pas-à-pas pour activer l'authentification et la synchronisation cloud.
Compte gratuit Supabase = 500 MB DB + 50 000 utilisateurs actifs/mois.
Large pour démarrer.

---

## 1. Créer un projet Supabase (5 min)

1. Va sur **https://supabase.com** → **Start your project**
2. Login avec GitHub
3. **New project** :
   - Name : `ma-diet`
   - Database Password : génère-en un fort, **note-le quelque part**
   - Region : **Frankfurt (eu-central-1)** (proche des users français, RGPD-friendly)
   - Pricing : Free
4. Attends 1-2 min la création

---

## 2. Appliquer le schéma de base (2 min)

1. Dans ton projet Supabase, menu gauche → **SQL Editor**
2. **New query**
3. Ouvre le fichier **`web/supabase/schema.sql`** de ce repo
4. Copie TOUT le contenu, colle-le dans Supabase SQL Editor
5. Clique **Run** (bouton en bas à droite)

Tu devrais voir "Success. No rows returned" plusieurs fois. C'est bon.

---

## 3. Configurer l'authentification (3 min)

### Email/Password + Magic Link (activés par défaut)

Dans Supabase → **Authentication** → **Providers** :
- Email : ON (déjà activé)
- Enable email confirmations : à toi de choisir (je recommande **ON** pour éviter le spam)

### Google OAuth (optionnel mais recommandé — 10 min)

1. Va sur **https://console.cloud.google.com** → crée un projet
2. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
   - Application type : Web
   - Authorized redirect URI : Copie l'URL fournie par Supabase (visible sur la page Providers → Google)
3. Dans Supabase → **Authentication → Providers → Google** :
   - Enable : ON
   - Client ID et Client Secret : colle ceux fournis par Google

### URL de redirection

Dans Supabase → **Authentication → URL Configuration** :
- **Site URL** : `https://madiet.lentreprise.ai`
- **Redirect URLs** : ajoute
  - `https://madiet.lentreprise.ai/**`
  - `http://localhost:5173/**` (pour le dev)

---

## 4. Récupérer les clés (1 min)

Dans Supabase → **Settings → API** :
- **Project URL** : `https://xxxxx.supabase.co`
- **anon / public** key : longue chaîne commençant par `eyJ...`

---

## 5. Configurer Vercel (2 min)

1. Va sur **https://vercel.com/dashboard** → projet `diet-auto` → **Settings → Environment Variables**
2. Ajoute 2 variables (pour les 3 environnements : Production, Preview, Development) :
   - `VITE_SUPABASE_URL` = ton Project URL
   - `VITE_SUPABASE_ANON_KEY` = ta anon key
3. **Save**
4. Redéploie : onglet **Deployments** → sur le dernier → `⋯` → **Redeploy**

---

## 6. Tester (1 min)

1. Ouvre **https://madiet.lentreprise.ai**
2. Clique **Se connecter** (en haut à droite)
3. Crée un compte avec ton email
4. Vérifie ta boîte mail → clique le lien de confirmation
5. Tu devrais être redirigé dans l'app, connecté

Si tu vois un bouton **Se connecter** qui fonctionne = tout roule. 🎉

---

## 7. Dev local (optionnel)

Pour tester en local avec Supabase :
1. Crée un fichier **`.env.local`** à la racine de `web/`
2. Ajoute :
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Relance `npm run dev`

Sans fichier `.env.local`, l'app continue à fonctionner en mode 100 % local — pratique pour itérer sans toucher au cloud.

---

## Questions courantes

**Q : Combien ça coûte ?**
R : Gratuit jusqu'à 500 MB de DB + 50 000 MAU. Largement assez pour démarrer. Payant au-delà : 25 $/mois pour 8 GB.

**Q : Les données sont-elles chez Google/US ?**
R : Non. Supabase Frankfurt = serveurs UE (Irlande pour l'auth, Allemagne pour la DB). Conforme RGPD.

**Q : Mes utilisateurs sans compte perdent-ils leurs données ?**
R : Non. Un utilisateur qui n'a pas de compte reste sur l'app en mode 100 % local, comme avant. S'il se crée un compte ensuite, ses données locales sont automatiquement uploadées.

**Q : Comment je deviens Pro gratuit à vie ?**
R : Tant que le plan Pro n'est pas encore lancé, tu as tout. Quand il le sera, je te filerai un code promo / un flag en DB pour que ton compte soit Pro à vie gratuitement.
