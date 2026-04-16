import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Moon, Sparkles, Star, TrendingUp } from 'lucide-react';
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
      <section className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-6">
          <Sparkles size={12} className="text-emerald-600" />
          <span>Un site, pas de compte, 100 % local.</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Ton plan alimentaire,{' '}
          <span className="text-emerald-600">optimisé automatiquement</span>.
        </h1>
        <p className="mt-5 text-lg muted">
          Choisis tes aliments. L'optimiseur ajuste les quantités pour atteindre précisément tes
          cibles caloriques et macros. Aucune inscription — tes données restent sur ton appareil.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button className="btn-primary text-base h-11 px-6" onClick={handleStart}>
            {profiles.length > 0 ? 'Ouvrir mon plan' : 'Commencer'}
            <ArrowRight size={16} />
          </button>
          <Link to="/setup" className="btn-outline h-11 px-6">
            Créer un nouveau profil
          </Link>
        </div>

        <p className="mt-3 text-xs muted">
          {nbAliments.toLocaleString('fr-FR')} aliments · viandes, poissons, œufs, légumes, fruits,
          céréales, produits laitiers…
        </p>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Feature
          icon={TrendingUp}
          title="Optimiseur intelligent"
          desc="Ajuste les quantités de tous les aliments pour atteindre calories + macros, en quelques millisecondes."
        />
        <Feature
          icon={Lock}
          title="Portions verrouillables"
          desc="Tu manges 2 œufs fixes ? Verrouille-les, l'algo ajuste le reste autour."
        />
        <Feature
          icon={Star}
          title="Favoris & historique"
          desc="Garde tes aliments favoris à portée de main, retrouve tes plans des 30 derniers jours."
        />
        <Feature
          icon={Check}
          title="Profils multiples"
          desc="Plusieurs personnes peuvent utiliser l'app sur le même appareil, chacun ses données."
        />
        <Feature
          icon={Moon}
          title="Mode sombre"
          desc="Bascule en un clic, respecte tes préférences système par défaut."
        />
        <Feature
          icon={Sparkles}
          title="Export PDF"
          desc="Imprime ou partage ton plan du jour en un clic, mise en page soignée."
        />
      </section>

      <section className="mt-20 card p-6 sm:p-10 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Comment ça marche</h2>
        <ol className="grid gap-4 sm:gap-3">
          <Step n={1} title="Renseigne ton profil">
            Poids, taille, âge, activité, objectif. Métabolisme et macros calculés instantanément.
          </Step>
          <Step n={2} title="Construis tes repas">
            Cherche parmi {nbAliments.toLocaleString('fr-FR')} aliments (base CIQUAL), ajoute-les
            dans les sections de repas.
          </Step>
          <Step n={3} title="Optimise">
            Un clic : les quantités s'ajustent automatiquement pour coller à tes cibles.
          </Step>
          <Step n={4} title="Ajuste au besoin">
            Verrouille les aliments à portion fixe, relance l'optimiseur autant que tu veux.
          </Step>
        </ol>
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
    <div className="card p-5">
      <div className="h-9 w-9 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 grid place-items-center mb-3">
        <Icon size={16} />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm muted">{desc}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 h-7 w-7 rounded-full bg-emerald-600 text-white text-sm font-semibold grid place-items-center">
        {n}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm muted">{children}</div>
      </div>
    </li>
  );
}
