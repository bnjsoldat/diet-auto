import { Link } from 'react-router-dom';
import { Activity, Apple, Clock, Flame, Watch } from 'lucide-react';

/**
 * Page /integrations : annonce les connecteurs tracker à venir (Garmin,
 * Apple Health, Google Fit). Objectif : capturer l'intérêt des users avant
 * la livraison, et permettre à ceux qui arrivent via SEO ("ma diet garmin")
 * de comprendre la roadmap.
 *
 * Stratégie : "Coming soon" honnête, avec inscription à la liste d'attente
 * par email (via mailto pour l'instant, un formulaire plus tard).
 */

interface Integration {
  name: string;
  icon: typeof Watch;
  description: string;
  status: 'planned' | 'research';
  color: string;
}

const INTEGRATIONS: Integration[] = [
  {
    name: 'Garmin Connect',
    icon: Watch,
    description:
      'Récupère tes séances de sport et tes calories réellement brûlées (course, vélo, musculation). Ta cible journalière s\u2019ajuste automatiquement : sport = + de calories autorisées.',
    status: 'planned',
    color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600',
  },
  {
    name: 'Apple Santé',
    icon: Apple,
    description:
      'Importe les entraînements, la fréquence cardiaque et les calories actives enregistrés par ton iPhone ou ton Apple Watch. Fonctionne via HealthKit.',
    status: 'planned',
    color: 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200',
  },
  {
    name: 'Google Fit',
    icon: Activity,
    description:
      'Synchronise avec ton compte Google Fit pour récupérer les activités détectées par ton téléphone Android ou ta montre Wear OS.',
    status: 'planned',
    color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600',
  },
  {
    name: 'Strava',
    icon: Flame,
    description:
      'Si tu uses tes baskets ou ton vélo plus que la moyenne, Strava détaille chaque sortie et on ajuste ta cible calorique à la journée précise.',
    status: 'research',
    color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600',
  },
];

export function Integrations() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center mb-4">
          <Watch size={24} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Intégrations trackers sportifs</h1>
        <p className="muted text-sm mt-2 max-w-xl mx-auto">
          Bientôt : connecte ta montre ou ton app de sport pour ajuster automatiquement ta
          cible calorique en fonction de ce que tu brûles réellement. Plus besoin d'estimer,
          tout devient précis.
        </p>
      </div>

      {/* Concept : comment ça va marcher */}
      <div className="card p-5 mb-8 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-950/20 to-transparent border-emerald-200 dark:border-emerald-900">
        <h2 className="font-semibold mb-2">Comment ça va marcher</h2>
        <ol className="space-y-2 text-sm muted">
          <li>
            <strong className="text-[var(--text)]">1.</strong> Tu connectes ton compte tracker
            (OAuth sécurisé, un clic).
          </li>
          <li>
            <strong className="text-[var(--text)]">2.</strong> Ma Diét récupère tes
            entraînements et leurs calories actives (chaque matin, en arrière-plan).
          </li>
          <li>
            <strong className="text-[var(--text)]">3.</strong> Ta cible du jour inclut le bonus
            sport : un jour de vélo 800 kcal → tu as 800 kcal de plus à manger sans déficit.
          </li>
          <li>
            <strong className="text-[var(--text)]">4.</strong> Sur <Link to="/today" className="underline">Aujourd'hui</Link>, tu vois les deux chiffres : cible statique + bonus sport du jour.
          </li>
        </ol>
      </div>

      {/* Grille des intégrations */}
      <div className="grid gap-3">
        {INTEGRATIONS.map((it) => (
          <div key={it.name} className="card p-4 flex items-start gap-3">
            <div
              className={
                'h-10 w-10 rounded-md grid place-items-center shrink-0 ' + it.color
              }
            >
              <it.icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{it.name}</h3>
                <span
                  className={
                    'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ' +
                    (it.status === 'planned'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400')
                  }
                >
                  <Clock size={9} className="inline -mt-0.5" />{' '}
                  {it.status === 'planned' ? 'prévu' : 'à l\u2019étude'}
                </span>
              </div>
              <p className="text-sm muted mt-1 leading-relaxed">{it.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA : liste d'attente */}
      <div className="card p-5 mt-8 text-center">
        <h2 className="font-semibold">Être prévenu du lancement</h2>
        <p className="text-sm muted mt-1 mb-4">
          Écris-nous avec le nom du tracker que tu utilises — on te notifie dès qu'il est
          branché.
        </p>
        <a
          href="mailto:contact@lentreprise.ai?subject=Ma%20Di%C3%A9t%20%E2%80%93%20Int%C3%A9gration%20tracker&body=Bonjour%2C%0A%0AJe%20serais%20int%C3%A9ress%C3%A9%28e%29%20par%20l%E2%80%99int%C3%A9gration%20du%20tracker%20suivant%20%3A%20%28Garmin%20%2F%20Apple%20Sant%C3%A9%20%2F%20Google%20Fit%20%2F%20Strava%20%2F%20autre%29.%0A%0AMerci%20%21"
          className="btn-primary inline-flex"
        >
          Rejoindre la liste
        </a>
      </div>
    </div>
  );
}
