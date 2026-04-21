import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  Check,
  Lock,
  Moon,
  ScanBarcode,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useAuth } from '@/store/useAuth';
import { SocialProof } from '@/components/SocialProof';

/**
 * Nombre d'aliments dans la base (CIQUAL 2020 + extras curated). Inlined en
 * constante pour que la landing (chunk principal) n'ait pas à importer
 * `@/lib/foods` et ses 479 KB de JSON — ceux-ci restent dans les chunks
 * lazy des pages Today/Week/etc.
 */
const NB_ALIMENTS = 3010;

export function Home() {
  const profiles = useProfile((s) => s.profiles);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const nbAliments = NB_ALIMENTS;

  /**
   * Parcours d'entrée :
   *  - Non connecté → /login (auth obligatoire en prod)
   *  - Connecté, pas de profil → /setup
   *  - Connecté avec profil → /today
   */
  function handleStart() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profiles.length > 0) navigate('/today');
    else navigate('/setup');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero — un seul bloc centré, avec un mock graphique à droite sur desktop */}
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-6 animate-fade-in-up">
            <Sparkles size={12} className="text-emerald-600" />
            <span>Base officielle française · 3 010 aliments CIQUAL · Gratuit</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight animate-fade-in-up">
            Tes macros, calculées{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              au gramme près
            </span>
            .
          </h1>
          <p className="mt-5 text-lg muted max-w-xl lg:max-w-none mx-auto lg:mx-0 animate-fade-in-up">
            Dis ta cible calorique. Choisis tes aliments. L'algo ajuste automatiquement les
            grammages pour taper pile sur tes protéines, glucides et lipides. Plus jamais
            20 minutes à bidouiller les quantités avant chaque repas.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 animate-fade-in-up">
            <button className="btn-primary text-base h-12 px-6" onClick={handleStart}>
              {user ? (profiles.length > 0 ? 'Ouvrir mon plan' : 'Créer mon profil') : 'Commencer gratuitement'}
              <ArrowRight size={16} />
            </button>
            {!user && (
              <Link to="/login" className="btn-outline h-12 px-6">
                Me connecter
              </Link>
            )}
          </div>

          {/* Social proof : affiché discrètement UNIQUEMENT si > 50 users créés
              (évite l'effet démotivant d'un "3 users" en phase early). */}
          <div className="mt-5">
            <SocialProof />
          </div>

          <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs muted">
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> Gratuit
            </span>
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> Sync multi-appareil
            </span>
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> {nbAliments.toLocaleString('fr-FR')} aliments référencés
            </span>
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> Scan code-barres
            </span>
          </div>
        </div>

        {/* Mockup cartes flottantes — donne une idée de l'UI réelle.
            Positionnement absolu avec hauteur explicite + gaps verticaux
            assez larges pour éviter tout chevauchement, même quand le
            navigateur n'est pas en plein écran. */}
        <div className="relative hidden lg:block h-[500px] animate-fade-in-up">
          {/* Carte 1 — Cibles du jour (top-left) */}
          <div className="absolute top-0 left-0 card p-4 w-60 shadow-xl bg-[var(--card)] z-10">
            <div className="text-xs muted font-semibold uppercase tracking-wider mb-1">
              Cible du jour
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-emerald-600">2 745</div>
              <div className="text-xs muted">kcal</div>
            </div>
            <div className="mt-3 space-y-1.5">
              <MiniBar label="P" value={168} target={172} />
              <MiniBar label="G" value={343} target={343} />
              <MiniBar label="L" value={78} target={76} />
            </div>
          </div>

          {/* Carte 2 — Optimiseur (positionnée BIEN plus bas pour ne jamais
              chevaucher la carte Cible, même à largeur réduite) */}
          <div className="absolute top-52 right-0 card p-4 w-64 shadow-xl z-20 bg-[var(--card)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-6 rounded bg-emerald-600 text-white grid place-items-center">
                <Wand2 size={12} />
              </span>
              <div className="text-sm font-semibold">Optimiseur</div>
            </div>
            <p className="text-xs muted leading-relaxed">
              Ajuste toutes les quantités et complète ton plan pour atteindre ta cible au
              pourcent près.
            </p>
          </div>

          {/* Carte 3 — Scan d'un produit healthy (bas-gauche) */}
          <div className="absolute bottom-0 left-8 card p-3 w-56 shadow-xl z-30 bg-[var(--card)]">
            <div className="flex items-center gap-2 text-xs muted">
              <ScanBarcode size={14} className="text-emerald-600" />
              Scan d'un produit
            </div>
            <div className="mt-1 text-sm font-medium">Skyr nature</div>
            <div className="text-xs muted">60 kcal · P 11 · G 4 · L 0 (/100 g)</div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          icon={Wand2}
          title="Calculé, pas bricolé"
          desc="Tu cliques « Optimiser » — l'algo fait les maths pour taper ta cible kcal + macros au pourcent près, en moins d'une seconde."
        />
        <Feature
          icon={ScanBarcode}
          title="Scan = aliment ajouté"
          desc="Code-barres scanné en 2 s, valeurs nutritionnelles récupérées direct depuis Open Food Facts. Même les produits bio de La Réunion."
        />
        <Feature
          icon={TrendingUp}
          title="3 précisions, 1 clic"
          desc="Strict (±3 %), Normal (±5 %) ou Souple (±10 %). Adapte la rigueur à ton objectif : sèche, maintien, prise."
        />
        <Feature
          icon={Lock}
          title="Verrouille ce qui compte"
          desc="Tu veux exactement 2 œufs et 150 g de riz ? Verrouille-les, l'algo ajuste les autres aliments autour. Fin du bras de fer."
        />
        <Feature
          icon={Star}
          title="Historique sans effort"
          desc="Chaque journée est snapshotée. Courbes calories/macros sur 7, 30 ou 90 jours. Tu vois ce qui marche pour toi."
        />
        <Feature
          icon={CalendarRange}
          title="Vue semaine complète"
          desc="7 jours d'un coup d'œil, duplication de journées, liste de courses agrégée automatiquement par rayon."
        />
        <Feature
          icon={BookOpen}
          title="Tes recettes, pesées"
          desc="Combine plusieurs aliments en une recette, ajoute-la à un repas à la portion voulue. Les macros suivent."
        />
        <Feature
          icon={Share2}
          title="Partage ou imprime"
          desc="Envoie ton plan par lien (WhatsApp, sms) ou exporte un PDF A4 propre à coller sur le frigo."
        />
        <Feature
          icon={Moon}
          title="Mobile d'abord"
          desc="Installable sur ton écran d'accueil comme une vraie app, fonctionne hors-ligne, mode nuit impeccable."
        />
        <Feature
          icon={Lock}
          title="Tes données, tes règles"
          desc="Ton compte sert à la sync multi-appareil, point. Zéro pub, zéro tracking tiers, zéro revente. Serveurs UE."
        />
      </section>

      {/* How it works */}
      <section className="mt-24 card p-6 sm:p-10 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-5">Comment ça marche</h2>
        <ol className="grid gap-4 sm:gap-3">
          <Step n={1} title="Ton profil, ta cible">
            Taille, poids, âge, activité, objectif. Ton besoin calorique et tes macros sont
            calculés instantanément (formule Harris-Benedict reconnue médicalement).
          </Step>
          <Step n={2} title="Tes aliments, en vrai">
            Cherche parmi {nbAliments.toLocaleString('fr-FR')} aliments de la base officielle
            française <strong>CIQUAL 2020</strong> (ANSES), scanne un produit emballé, ou charge
            un des modèles pré-faits (équilibré, sportif, perte, prise de masse, végé).
          </Step>
          <Step n={3} title="1 clic, 0 calcul">
            <strong>Optimiser</strong> : les grammages s'ajustent automatiquement, les aliments
            manquants sont proposés, tu tombes pile sur ta cible kcal + macros. Verrouille 🔒
            ce qui ne doit pas bouger.
          </Step>
          <Step n={4} title="Ton suivi, ta progression">
            Historique complet, courbes kcal/macros 7-30-90 jours, suivi pondéral, liste de
            courses auto par rayon. Tu vois ce qui fonctionne pour toi sur la durée.
          </Step>
        </ol>
      </section>

      {/* Trust / privacy */}
      <section className="mt-16 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs muted">
          <Lock size={12} />
          Compte gratuit (lien magique email ou Google). Zéro pub. Zéro tracking tiers. Serveurs UE.
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof TrendingUp;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="h-10 w-10 rounded-md bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-950/30 text-emerald-600 grid place-items-center mb-3">
        <Icon size={18} />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm muted leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold grid place-items-center">
        {n}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm muted mt-0.5">{children}</div>
      </div>
    </li>
  );
}

function MiniBar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min(100, (value / target) * 100);
  const ok = Math.abs(value - target) / target < 0.05;
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] muted tabular-nums">
        <span>{label}</span>
        <span>
          {value} / {target}
        </span>
      </div>
      <div className="h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden mt-0.5">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: ok ? '#10b981' : '#f59e0b',
          }}
        />
      </div>
    </div>
  );
}
