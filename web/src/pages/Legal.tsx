import { Link } from 'react-router-dom';

/**
 * Trois pages légales réunies dans un seul composant (routing par prop).
 * Textes minimaux mais conformes RGPD / CGU auto-entrepreneur France.
 * À adapter avec tes vraies coordonnées légales dans mentions-legales.
 */
interface Props {
  section: 'cgu' | 'confidentialite' | 'mentions';
}

export function Legal({ section }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 prose-sm">
      <nav className="flex gap-4 text-xs muted mb-6 flex-wrap">
        <Link to="/cgu" className={section === 'cgu' ? 'text-emerald-600 font-medium' : 'hover:text-[var(--text)]'}>
          Conditions d'utilisation
        </Link>
        <Link
          to="/confidentialite"
          className={section === 'confidentialite' ? 'text-emerald-600 font-medium' : 'hover:text-[var(--text)]'}
        >
          Confidentialité
        </Link>
        <Link
          to="/mentions-legales"
          className={section === 'mentions' ? 'text-emerald-600 font-medium' : 'hover:text-[var(--text)]'}
        >
          Mentions légales
        </Link>
      </nav>

      {section === 'cgu' && <CGU />}
      {section === 'confidentialite' && <Privacy />}
      {section === 'mentions' && <Mentions />}
    </div>
  );
}

function CGU() {
  return (
    <article>
      <h1 className="text-2xl font-bold mb-4">Conditions générales d'utilisation</h1>
      <p className="muted text-xs">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <h2 className="font-semibold mt-6 mb-2">1. Objet</h2>
      <p className="text-sm muted leading-relaxed">
        Ma Diét est une application web de planification alimentaire qui permet de calculer ses
        besoins nutritionnels et d'optimiser les quantités de ses repas. L'utilisation du service
        est gratuite (sauf abonnement premium à venir).
      </p>

      <h2 className="font-semibold mt-6 mb-2">2. Compte utilisateur</h2>
      <p className="text-sm muted leading-relaxed">
        La création d'un compte est facultative (l'app fonctionne en mode 100 % local). Elle
        permet la synchronisation multi-appareil. L'utilisateur s'engage à fournir une adresse
        email valide et à protéger son mot de passe.
      </p>

      <h2 className="font-semibold mt-6 mb-2">3. Nature du service</h2>
      <p className="text-sm muted leading-relaxed">
        <strong>Ma Diét n'est pas un conseil médical ni un avis diététique professionnel.</strong>{' '}
        Les calculs (métabolisme de base, besoins caloriques, répartition des macros) sont
        purement indicatifs et fondés sur des formules standards (Harris-Benedict). Pour tout
        suivi personnalisé ou pathologique, consulte un professionnel de santé (diététicien,
        nutritionniste, médecin).
      </p>

      <h2 className="font-semibold mt-6 mb-2">4. Données et contenu</h2>
      <p className="text-sm muted leading-relaxed">
        La base nutritionnelle provient de CIQUAL 2020 (ANSES), publiée en licence ouverte. Les
        informations produits scannées proviennent d'Open Food Facts (licence ODbL). Les
        utilisateurs restent seuls responsables du contenu qu'ils créent (recettes, notes).
      </p>

      <h2 className="font-semibold mt-6 mb-2">5. Responsabilité</h2>
      <p className="text-sm muted leading-relaxed">
        Le service est fourni « tel quel », sans garantie de disponibilité ni d'exactitude des
        données. Ma Diét ne pourra être tenu responsable des conséquences d'une utilisation
        inappropriée des recommandations alimentaires.
      </p>

      <h2 className="font-semibold mt-6 mb-2">6. Modification des CGU</h2>
      <p className="text-sm muted leading-relaxed">
        Ces CGU peuvent être modifiées. Les utilisateurs seront informés par email des
        changements significatifs.
      </p>
    </article>
  );
}

function Privacy() {
  return (
    <article>
      <h1 className="text-2xl font-bold mb-4">Politique de confidentialité</h1>
      <p className="muted text-xs">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <h2 className="font-semibold mt-6 mb-2">1. Données collectées</h2>
      <p className="text-sm muted leading-relaxed">
        La création de compte est obligatoire pour utiliser Ma Diét. Nous collectons uniquement
        ton <strong>email</strong> (identification) et éventuellement ton <strong>nom/avatar Google</strong> (si tu
        te connectes via OAuth Google).
      </p>
      <p className="text-sm muted leading-relaxed mt-2">
        Tes <strong>données d'usage</strong> (plans alimentaires, recettes, profils nutritionnels,
        suivi pondéral, rappels, paramètres) sont stockées dans notre base Supabase (serveurs UE)
        et isolées par Row Level Security — un utilisateur ne peut jamais accéder aux données d'un
        autre. Un cache local dans ton navigateur (IndexedDB) permet un usage hors-ligne.
      </p>

      <h2 className="font-semibold mt-6 mb-2">2. Finalités</h2>
      <ul className="text-sm muted leading-relaxed list-disc ml-5 space-y-1">
        <li>Permettre la synchronisation de tes données sur plusieurs appareils</li>
        <li>Te renvoyer ton mot de passe en cas d'oubli</li>
        <li>T'informer d'éventuels changements de CGU (rares)</li>
      </ul>
      <p className="text-sm muted leading-relaxed mt-2">
        <strong>Ma Diét ne fait aucun profilage, aucune revente, aucune publicité, aucun tracking
        tiers.</strong> Pas de Google Analytics, pas de cookies marketing.
      </p>

      <h2 className="font-semibold mt-6 mb-2">3. Hébergement</h2>
      <p className="text-sm muted leading-relaxed">
        L'application est hébergée par Vercel (États-Unis, clauses contractuelles types UE→US
        appliquées). La base de données et l'authentification sont hébergées par Supabase
        (Irlande, Union Européenne).
      </p>

      <h2 className="font-semibold mt-6 mb-2">4. Intégrations tiers (optionnelles)</h2>
      <p className="text-sm muted leading-relaxed">
        Si tu choisis de connecter un service tiers, Ma Diét récupère des données de ce service
        via OAuth :
      </p>
      <ul className="text-sm muted leading-relaxed list-disc ml-5 space-y-1 mt-1">
        <li>
          <strong>Strava</strong> (optionnel) : si tu actives l'intégration depuis la page{' '}
          <Link to="/integrations" className="underline">Intégrations</Link>, nous récupérons
          tes <em>activités sportives du jour</em> (type, durée, calories brûlées) pour ajuster
          automatiquement ta cible calorique journalière. Scope OAuth minimal :{' '}
          <code>activity:read</code> (lecture seule). Aucune publication n'est faite sur ton
          profil Strava. Les tokens OAuth sont stockés chiffrés dans Supabase avec RLS stricte.
          Tu peux te déconnecter à tout moment depuis la même page (cela supprime les tokens de
          notre base).
        </li>
        <li>
          <strong>Open Food Facts</strong> : lorsque tu scannes un code-barres, nous faisons une
          requête anonyme à l'API Open Food Facts pour récupérer les valeurs nutritionnelles
          publiques du produit. Aucune donnée personnelle n'est envoyée.
        </li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">5. Durée de conservation</h2>
      <p className="text-sm muted leading-relaxed">
        Tes données sont conservées tant que ton compte existe. Tu peux supprimer ton compte à
        tout moment depuis la page <Link to="/compte" className="underline">Mon compte</Link> —
        cela efface définitivement toutes tes données de notre serveur (y compris les tokens
        Strava si tu avais connecté l'intégration).
      </p>

      <h2 className="font-semibold mt-6 mb-2">6. Tes droits (RGPD)</h2>
      <p className="text-sm muted leading-relaxed">
        Conformément au RGPD, tu peux :
      </p>
      <ul className="text-sm muted leading-relaxed list-disc ml-5 space-y-1 mt-1">
        <li>Accéder à tes données (page <Link to="/compte" className="underline">Mon compte</Link>, bouton « Récupérer du cloud »)</li>
        <li>Rectifier tes données (en les modifiant dans l'app)</li>
        <li>Les supprimer (bouton « Supprimer mon compte »)</li>
        <li>Les exporter au format CSV (page Mon suivi → Export CSV)</li>
        <li>Adresser toute demande au contact ci-dessous</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">7. Contact</h2>
      <p className="text-sm muted leading-relaxed">
        Pour toute question sur tes données : <a href="mailto:lentreprise@lentreprise.ai" className="underline">lentreprise@lentreprise.ai</a>.
        Tu peux aussi déposer une réclamation auprès de la CNIL (cnil.fr).
      </p>
    </article>
  );
}

function Mentions() {
  return (
    <article>
      <h1 className="text-2xl font-bold mb-4">Mentions légales</h1>
      <p className="muted text-xs">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <h2 className="font-semibold mt-6 mb-2">Éditeur</h2>
      <p className="text-sm muted leading-relaxed">
        Ma Diét est édité par <strong>Benjy GRONDIN</strong>, auto-entrepreneur immatriculé
        en France (micro-entreprise).
      </p>
      <p className="text-sm muted leading-relaxed mt-2">
        SIRET : 933 093 882 00019<br />
        Adresse : 56 chemin Champs de Merle, 97435 Saint-Paul (La Réunion)<br />
        Email : <a href="mailto:lentreprise@lentreprise.ai" className="underline">lentreprise@lentreprise.ai</a>
      </p>
      <p className="text-sm muted leading-relaxed mt-2">
        Directeur de la publication : Benjy GRONDIN.
      </p>

      <h2 className="font-semibold mt-6 mb-2">Hébergement</h2>
      <p className="text-sm muted leading-relaxed">
        Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
      </p>
      <p className="text-sm muted leading-relaxed mt-2">
        Base de données : Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992 (serveurs UE).
      </p>

      <h2 className="font-semibold mt-6 mb-2">Propriété intellectuelle</h2>
      <p className="text-sm muted leading-relaxed">
        Le code source, le design et le contenu éditorial de Ma Diét sont la propriété de
        l'éditeur. La base nutritionnelle CIQUAL est publiée par l'ANSES (France) en licence
        ouverte. Les données produits scannées proviennent d'Open Food Facts, publiées en licence
        ODbL.
      </p>
    </article>
  );
}
