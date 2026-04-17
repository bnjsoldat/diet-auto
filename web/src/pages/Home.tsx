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
import { foods } from '@/lib/foods';

export function Home() {
  const profiles = useProfile((s) => s.profiles);
  const navigate = useNavigate();

  const nbAliments = foods.length;

  function handleStart() {
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
            <span>Un site, pas de compte, 100 % local.</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight animate-fade-in-up">
            Ton plan alimentaire,{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              optimisé automatiquement
            </span>
            .
          </h1>
          <p className="mt-5 text-lg muted max-w-xl lg:max-w-none mx-auto lg:mx-0 animate-fade-in-up">
            Choisis tes aliments, scanne les produits emballés. L'optimiseur ajuste les quantités
            pour atteindre tes cibles caloriques et macros, en un clic.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 animate-fade-in-up">
            <button className="btn-primary text-base h-12 px-6" onClick={handleStart}>
              {profiles.length > 0 ? 'Ouvrir mon plan' : 'Commencer gratuitement'}
              <ArrowRight size={16} />
            </button>
            <Link to="/setup" className="btn-outline h-12 px-6">
              Créer un nouveau profil
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs muted">
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> Zéro compte
            </span>
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> Hors-ligne
            </span>
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> {nbAliments.toLocaleString('fr-FR')} aliments CIQUAL
            </span>
            <span className="flex items-center gap-1">
              <Check size={12} className="text-emerald-600" /> Scan code-barres
            </span>
          </div>
        </div>

        {/* Mockup cartes flottantes — donne une idée de l'UI réelle */}
        <div className="relative hidden lg:block animate-fade-in-up">
          <div className="absolute -top-4 -left-4 card p-4 w-56 shadow-xl bg-[var(--card)]">
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

          <div className="mt-20 ml-auto card p-4 w-64 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-6 rounded bg-emerald-600 text-white grid place-items-center">
                <Wand2 size={12} />
              </span>
              <div className="text-sm font-semibold">Optimiseur +</div>
            </div>
            <p className="text-xs muted">
              Ajuste toutes les quantités et ajoute les aliments manquants pour atteindre ta
              cible au pourcent près.
            </p>
          </div>

          <div className="absolute top-40 -right-4 card p-3 w-52 shadow-xl">
            <div className="flex items-center gap-2 text-xs muted">
              <ScanBarcode size={14} className="text-emerald-600" />
              Scan d'un produit
            </div>
            <div className="mt-1 text-sm font-medium">Tuiles apéro paprika</div>
            <div className="text-xs muted">535 kcal · P 6 · G 55 · L 32</div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          icon={Wand2}
          title="Optimiseur + intelligent"
          desc="Ajuste les quantités et ajoute les aliments manquants en un clic pour atteindre précisément ta cible."
        />
        <Feature
          icon={ScanBarcode}
          title="Scanner code-barres"
          desc="Scanne un produit emballé, les valeurs nutritionnelles sont récupérées automatiquement via Open Food Facts."
        />
        <Feature
          icon={TrendingUp}
          title="3 modes d'optimisation"
          desc="Strict (±3 %), Normal (±5 %) ou Souple (±10 %) — choisis la précision qui colle à ton objectif."
        />
        <Feature
          icon={Lock}
          title="Portions verrouillables"
          desc="Tu manges 2 œufs fixes ? Verrouille-les, l'algo ajuste le reste autour."
        />
        <Feature
          icon={Star}
          title="Favoris & historique"
          desc="Retrouve tes aliments préférés en un clic, visualise ta courbe de calories sur 30 jours."
        />
        <Feature
          icon={CalendarRange}
          title="Vue semaine"
          desc="7 jours d'un coup d'œil, duplication de journées, liste de courses agrégée automatiquement."
        />
        <Feature
          icon={BookOpen}
          title="Recettes composées"
          desc="Groupe plusieurs aliments en une recette, ajoute-la en un clic à un repas à la portion voulue."
        />
        <Feature
          icon={Share2}
          title="Partage & PDF"
          desc="Envoie un plan par lien (base64url) ou exporte un PDF A4 mise en page pour l'imprimer."
        />
        <Feature
          icon={Moon}
          title="Mode sombre + PWA"
          desc="Installable sur ton téléphone, utilisable hors-ligne, avec un mode nuit soigné."
        />
      </section>

      {/* How it works */}
      <section className="mt-24 card p-6 sm:p-10 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-5">Comment ça marche</h2>
        <ol className="grid gap-4 sm:gap-3">
          <Step n={1} title="Renseigne ton profil">
            Poids, taille, âge, activité, objectif. Métabolisme de base (Harris-Benedict), besoin
            de maintenance et macros calculés instantanément.
          </Step>
          <Step n={2} title="Construis ou charge un modèle">
            Cherche parmi {nbAliments.toLocaleString('fr-FR')} aliments (CIQUAL 2020), scanne un
            produit emballé, ou charge un modèle : équilibré, sportif, perte, végétarien.
          </Step>
          <Step n={3} title="Optimise en un clic">
            <strong>Optimiseur +</strong> : ajuste les quantités, ajoute les aliments manquants et
            repasse jusqu'à atteindre ta cible.
          </Step>
          <Step n={4} title="Suis tes progrès">
            Historique avec courbe des calories, suivi pondéral, vue hebdomadaire, liste de
            courses agrégée, export CSV.
          </Step>
        </ol>
      </section>

      {/* Trust / privacy */}
      <section className="mt-16 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs muted">
          <Lock size={12} />
          Tes données restent sur ton appareil — aucune inscription, aucun serveur, aucune analyse.
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
