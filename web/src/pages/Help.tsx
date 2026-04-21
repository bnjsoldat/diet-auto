import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QA {
  q: string;
  a: React.ReactNode;
}

/**
 * FAQ organisée en catégories repliables. Utilise le pattern <details>
 * HTML natif pour accessibilité + SEO (le contenu reste indexable).
 * Répond aux questions fréquentes qu'on voit revenir : à quoi sert
 * l'optimiseur, où sont mes données, comment installer sur mobile, etc.
 */
const SECTIONS: { title: string; items: QA[] }[] = [
  {
    title: 'Pour commencer',
    items: [
      {
        q: 'Comment ça marche en 3 étapes ?',
        a: (
          <>
            1) Crée un profil (poids, taille, date de naissance, activité, objectif).{' '}
            2) Sur <Link to="/today" className="underline">Aujourd'hui</Link>, ajoute des
            aliments à tes repas. 3) Clique sur <strong>Optimiser</strong> — les quantités
            s'ajustent automatiquement pour atteindre ta cible. C'est tout.
          </>
        ),
      },
      {
        q: 'À quoi sert l\'optimiseur ?',
        a: (
          <>
            Tu choisis tes aliments, il ajuste les grammages pour que tu atteignes ta cible
            calorique et tes macros (protéines / glucides / lipides). Si des éléments
            manquent, il peut en proposer automatiquement. Tu gardes la main via les{' '}
            <strong>verrous 🔒</strong> sur les aliments que tu ne veux pas voir bouger.
          </>
        ),
      },
      {
        q: 'Qu\'est-ce que la date de naissance fait ?',
        a: (
          <>
            Elle permet à l'app de recalculer ton âge automatiquement chaque année. Ton
            métabolisme de base (formule Harris-Benedict) utilise ton âge, donc il se met à
            jour tout seul au fil du temps. Pas besoin de mettre à jour le profil à chaque
            anniversaire.
          </>
        ),
      },
    ],
  },
  {
    title: 'Aliments et recettes',
    items: [
      {
        q: 'Je ne trouve pas un aliment dans la recherche ?',
        a: (
          <>
            La base contient 3 010 aliments issus de la base officielle française CIQUAL.
            Essaie un terme plus générique (« banane » trouve « Banane, pulpe, crue »). Si
            tu ne trouves toujours pas, utilise le bouton <strong>Scan</strong> pour scanner
            le code-barres d'un produit emballé — il est ajouté directement à ta liste
            personnelle.
          </>
        ),
      },
      {
        q: 'Pourquoi les noms d\'aliments sont parfois bizarres ?',
        a: (
          <>
            La base CIQUAL (officielle ANSES) utilise un format scientifique (ex : « Oeuf,
            cru »). On affiche une version raccourcie plus naturelle (« Œuf ») mais le nom
            technique reste visible en survolant la ligne — utile si tu cherches la version
            exacte du CIQUAL.
          </>
        ),
      },
      {
        q: 'Comment créer une recette ?',
        a: (
          <>
            Va sur <Link to="/recipes" className="underline">Mes recettes</Link>, clique
            <strong> Nouvelle recette</strong>, donne-lui un nom, ajoute les ingrédients
            puis éventuellement les étapes de préparation. Tu peux ensuite l'ajouter à
            n'importe quel repas en 1 clic, ou la partager par lien.
          </>
        ),
      },
    ],
  },
  {
    title: 'Fonctionnalités avancées',
    items: [
      {
        q: 'Comment copier un plan d\'un jour sur un autre ?',
        a: (
          <>
            Dans <Link to="/week" className="underline">Ma semaine</Link>, ouvre le menu{' '}
            <strong>⋯</strong> d'un jour et clique <strong>Copier ce plan</strong>. Un
            bandeau vert apparaît — clique sur n'importe quel autre jour pour coller. Tu
            peux aussi <strong>Appliquer à toute la semaine</strong> en un clic.
          </>
        ),
      },
      {
        q: 'À quoi servent les modes strict / normal / souple ?',
        a: (
          <>
            C'est la tolérance de l'optimiseur. <strong>Strict</strong> (±3 % kcal) pour
            une prépa sportive précise. <strong>Normal</strong> (±5 % kcal) par défaut,
            recommandé. <strong>Souple</strong> (±10 % kcal) pour un simple équilibre sans
            stresser sur les chiffres. Tu peux changer depuis{' '}
            <Link to="/profiles" className="underline">Mon profil</Link>.
          </>
        ),
      },
      {
        q: 'Comment partager une recette ou un plan ?',
        a: (
          <>
            Sur <Link to="/today" className="underline">Aujourd'hui</Link>, clique{' '}
            <strong>Partager</strong> → un lien est généré. Ton destinataire clique dessus
            et voit une proposition d'import direct dans son app. Idem pour une recette :
            icône <strong>🔗 Partage</strong> sur sa carte.
          </>
        ),
      },
      {
        q: 'Les raccourcis clavier ?',
        a: (
          <ul className="list-disc ml-5 space-y-1">
            <li><kbd className="kbd">/</kbd> : focus la barre de recherche d'aliment</li>
            <li><kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">K</kbd> (ou <kbd className="kbd">⌘</kbd>+<kbd className="kbd">K</kbd>) : ouvre la palette de commandes</li>
            <li><kbd className="kbd">Échap</kbd> : ferme les dialogs et modales</li>
          </ul>
        ),
      },
    ],
  },
  {
    title: 'Compte et données',
    items: [
      {
        q: 'Dois-je créer un compte ?',
        a: (
          <>
            Oui. La création de compte est <strong>gratuite et rapide</strong> (10 s par lien
            magique email ou Google, pas de mot de passe à retenir). Elle permet de retrouver
            tes plans sur tous tes appareils (mobile + ordinateur) et de ne jamais perdre ton
            historique si tu changes de navigateur.
          </>
        ),
      },
      {
        q: 'Où sont stockées mes données ?',
        a: (
          <>
            Tes données sont synchronisées avec Supabase (serveurs UE, Allemagne/Irlande) et
            isolées par Row Level Security (un utilisateur ne peut jamais voir les données
            d'un autre). Un cache local dans ton navigateur (IndexedDB) permet un usage
            hors-ligne. Aucun cookie de tracking, aucune pub, aucun outil d'analyse tiers.
            Voir notre{' '}
            <Link to="/confidentialite" className="underline">politique de confidentialité</Link>.
          </>
        ),
      },
      {
        q: 'Comment installer l\'app sur mon écran d\'accueil ?',
        a: (
          <>
            <strong>iPhone</strong> (Safari) : clique sur le bouton Partager → « Sur
            l'écran d'accueil ». <strong>Android</strong> (Chrome) : clique sur les 3
            points en haut → « Installer l'application » (un bouton peut aussi apparaître
            directement dans la topbar de Ma Diét).
          </>
        ),
      },
      {
        q: 'Comment supprimer mon compte ou exporter mes données ?',
        a: (
          <>
            Depuis <Link to="/compte" className="underline">Mon compte</Link> : bouton
            « Supprimer mon compte » (zone rouge en bas). Pour exporter, va sur{' '}
            <Link to="/history" className="underline">Mon suivi</Link> → bouton{' '}
            <strong>Export CSV</strong> — tu récupères tes plans en tableau ouvrable dans
            Excel.
          </>
        ),
      },
    ],
  },
  {
    title: 'Problèmes courants',
    items: [
      {
        q: 'L\'optimiseur ne converge pas vers ma cible ?',
        a: (
          <>
            C'est que ton plan est <strong>sous-dimensionné</strong> : il n'y a pas assez
            d'aliments pour atteindre la cible, même en remontant leurs quantités. Ajoute
            un aliment qui apporte ce qui manque (protéine / glucide / lipide selon le cas)
            ou clique sur une suggestion dans la modale d'optimisation.
          </>
        ),
      },
      {
        q: 'Le scanner ne détecte rien ?',
        a: (
          <>
            Vérifie que : 1) tu as autorisé la caméra (icône dans la barre d'adresse du
            navigateur) ; 2) l'éclairage est suffisant ; 3) le code-barres est bien lisible,
            pas froissé. Si ça ne marche toujours pas, utilise le bouton{' '}
            <strong>Saisie manuelle</strong> dans la modale de scan.
          </>
        ),
      },
      {
        q: 'Les notifications de rappel ne s\'affichent pas ?',
        a: (
          <>
            Les rappels sont déclenchés par le navigateur. Pour une meilleure fiabilité,
            installe l'app sur ton écran d'accueil (voir plus haut). Sans cela, si l'app
            est totalement fermée, aucun rappel ne peut apparaître — c'est une limitation
            du fonctionnement sans serveur.
          </>
        ),
      },
    ],
  },
];

export function Help() {
  // Mémorise les sections ouvertes pour les laisser ouvertes au remount.
  const [openIdx, setOpenIdx] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpenIdx((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="mb-8 text-center">
        <div className="inline-flex h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 grid place-items-center mb-3">
          <HelpCircle size={22} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Aide & questions fréquentes</h1>
        <p className="muted text-sm mt-2">
          Réponses aux questions qu'on nous pose le plus souvent. Tu ne trouves pas ? Écris-nous.
        </p>
      </div>

      <div className="grid gap-6">
        {SECTIONS.map((section, si) => (
          <section key={section.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider muted mb-3">
              {section.title}
            </h2>
            <div className="card divide-y">
              {section.items.map((item, qi) => {
                const key = `${si}-${qi}`;
                const isOpen = openIdx.has(key);
                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="w-full text-left p-4 flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="flex-1 font-medium text-sm">{item.q}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          'muted transition-transform',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm muted leading-relaxed animate-slide-down">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Contact */}
      <div className="card p-5 mt-8 text-center">
        <MessageCircle size={20} className="text-emerald-600 mx-auto mb-2" />
        <h2 className="font-semibold">Une question qui n'est pas ici ?</h2>
        <p className="text-sm muted mt-1">
          Écris-nous, on te répond sous 48 h.
        </p>
        <a
          href="mailto:contact@lentreprise.ai?subject=Ma%20Di%C3%A9t%20%E2%80%93%20Question"
          className="btn-primary mt-4 inline-flex"
        >
          <Mail size={14} /> Nous écrire
        </a>
      </div>
    </div>
  );
}
