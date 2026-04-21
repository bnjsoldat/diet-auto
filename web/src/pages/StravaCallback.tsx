import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Flame, Loader2, XCircle } from 'lucide-react';
import { track } from '@vercel/analytics';
import { exchangeCode, syncActivities } from '@/lib/strava';
import { useActivity } from '@/store/useActivity';

type Status = 'processing' | 'success' | 'error';

/**
 * Page `/integrations/strava/callback` : atterrissage après l'autorisation OAuth Strava.
 *
 * L'URL contient :
 *  - `?code=XXX&scope=read,activity:read` en cas d'acceptation
 *  - `?error=access_denied` en cas de refus
 *
 * On échange le code contre les tokens via l'Edge Function, puis on
 * déclenche automatiquement la 1re sync pour montrer quelque chose de
 * concret à l'utilisateur.
 */
export function StravaCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mergeActivities = useActivity((s) => s.merge);

  const [status, setStatus] = useState<Status>('processing');
  const [message, setMessage] = useState('Connexion à Strava en cours…');
  const [athlete, setAthlete] = useState<{ firstname?: string; lastname?: string; profile?: string } | null>(null);
  const [activitiesCount, setActivitiesCount] = useState<number>(0);

  useEffect(() => {
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setMessage(
        error === 'access_denied'
          ? 'Tu as refusé l\u2019accès à Strava. Tu peux réessayer quand tu veux depuis la page Intégrations.'
          : `Erreur Strava : ${error}`
      );
      track('strava_callback_error', { error });
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Paramètre `code` manquant dans l\u2019URL.');
      return;
    }

    (async () => {
      try {
        const res = await exchangeCode(code);
        setAthlete(res.athlete ?? null);
        track('strava_connected');

        // Première sync automatique pour montrer quelque chose
        setMessage('Importation de tes activités du jour…');
        try {
          const sync = await syncActivities();
          await mergeActivities(sync.activities);
          setActivitiesCount(sync.count);
        } catch {
          // Erreur de sync non bloquante — l'auth a marché.
        }

        setStatus('success');
        setMessage('Strava connecté avec succès !');
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Erreur lors de la connexion Strava.');
        track('strava_exchange_error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {status === 'processing' && (
        <>
          <div className="inline-flex h-14 w-14 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 grid place-items-center mb-4">
            <Loader2 size={24} className="animate-spin" />
          </div>
          <h1 className="text-xl font-bold mb-2">Connexion Strava</h1>
          <p className="muted text-sm">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="inline-flex h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 grid place-items-center mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-xl font-bold mb-2">{message}</h1>
          {athlete && (athlete.firstname || athlete.lastname) && (
            <p className="muted text-sm mb-2">
              Bienvenue <strong>{athlete.firstname}</strong> ! Tes activités seront
              synchronisées automatiquement à chaque ouverture.
            </p>
          )}
          {activitiesCount > 0 && (
            <p className="muted text-sm">
              {activitiesCount} activité{activitiesCount > 1 ? 's' : ''} importée
              {activitiesCount > 1 ? 's' : ''} aujourd'hui.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            <button type="button" className="btn-primary" onClick={() => navigate('/today')}>
              <Flame size={14} /> Voir mon plan du jour
            </button>
            <Link to="/integrations" className="btn-outline">
              Retour aux intégrations
            </Link>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="inline-flex h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 grid place-items-center mb-4">
            <XCircle size={28} />
          </div>
          <h1 className="text-xl font-bold mb-2">Connexion échouée</h1>
          <p className="muted text-sm">{message}</p>
          <div className="mt-6">
            <Link to="/integrations" className="btn-primary">
              Réessayer
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
