import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Apple, CheckCircle2, Clock, Flame, Loader2, RefreshCw, Trash2, Watch } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useAuth } from '@/store/useAuth';
import { useActivity } from '@/store/useActivity';
import { supabase, isCloudEnabled } from '@/lib/supabase';
import {
  disconnectStrava,
  getAuthorizeUrl,
  isStravaConfigured,
  syncActivities,
} from '@/lib/strava';

/**
 * Page /integrations : gestion des connecteurs tiers (Strava, et plus tard
 * Apple Santé, Google Fit, Garmin direct).
 *
 * Strava est le premier livré car il agrège automatiquement Garmin, Apple
 * Watch, Polar, etc. (90 % des sportifs équipés l'utilisent déjà).
 */

interface StravaConnection {
  connected: boolean;
  athlete?: { firstname?: string; lastname?: string; profile?: string };
  lastSyncAt?: string | null;
  connectedAt?: string;
}

export function Integrations() {
  const user = useAuth((s) => s.user);
  const activities = useActivity((s) => s.byDate);
  const mergeActivities = useActivity((s) => s.merge);

  const [strava, setStrava] = useState<StravaConnection>({ connected: false });
  const [loadingStrava, setLoadingStrava] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  /** Charge l'état de connexion Strava depuis Supabase. */
  useEffect(() => {
    if (!user || !supabase) {
      setLoadingStrava(false);
      return;
    }
    (async () => {
      const { data } = await supabase!
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'strava')
        .maybeSingle();
      if (data) {
        setStrava({
          connected: true,
          athlete: data.provider_metadata ?? {},
          lastSyncAt: data.last_sync_at,
          connectedAt: data.connected_at,
        });
      }
      setLoadingStrava(false);
    })();
  }, [user]);

  function handleConnectStrava() {
    if (!isStravaConfigured()) return;
    track('strava_connect_clicked');
    window.location.href = getAuthorizeUrl();
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncActivities();
      await mergeActivities(res.activities);
      track('strava_sync', { activities_count: res.count });
      setSyncResult(
        res.count === 0
          ? 'Aucune activité aujourd\u2019hui (ou pas encore synchronisée côté Strava).'
          : `${res.count} activité${res.count > 1 ? 's' : ''} synchronisée${res.count > 1 ? 's' : ''}.`
      );
      // Refresh connection info (last_sync_at)
      if (user && supabase) {
        const { data } = await supabase
          .from('user_integrations')
          .select('last_sync_at')
          .eq('user_id', user.id)
          .eq('provider', 'strava')
          .maybeSingle();
        if (data) setStrava((s) => ({ ...s, lastSyncAt: data.last_sync_at }));
      }
    } catch (e) {
      setSyncResult(e instanceof Error ? e.message : 'Erreur de sync');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Déconnecter Strava ? Les activités déjà importées resteront dans ton plan.')) return;
    setDisconnecting(true);
    try {
      await disconnectStrava();
      setStrava({ connected: false });
      track('strava_disconnect');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setDisconnecting(false);
    }
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayActivity = activities[todayKey];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center mb-4">
          <Watch size={24} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Intégrations trackers</h1>
        <p className="muted text-sm mt-2 max-w-xl mx-auto">
          Connecte ton tracker pour ajuster automatiquement ta cible calorique selon ton
          sport du jour. Plus besoin d'estimer : ta cible devient précise.
        </p>
      </div>

      {/* ---- Strava (actif) ---- */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 grid place-items-center shrink-0">
            <Flame size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold">Strava</h2>
              {strava.connected ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">
                  ✓ Connecté
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] muted font-medium">
                  Disponible
                </span>
              )}
            </div>
            <p className="text-sm muted mt-1 leading-relaxed">
              Récupère automatiquement les calories brûlées de tes activités. Strava agrège
              déjà Garmin, Apple Watch, Polar, Coros, Suunto, Wahoo, Fitbit, Nike Run Club,
              et plein d'autres.
            </p>

            {!isCloudEnabled() && (
              <p className="mt-3 text-xs text-amber-600">
                Connexion cloud nécessaire — <Link to="/login" className="underline">connecte-toi</Link>{' '}
                d'abord.
              </p>
            )}

            {isCloudEnabled() && !isStravaConfigured() && (
              <p className="mt-3 text-xs text-amber-600">
                Configuration Strava en cours (VITE_STRAVA_CLIENT_ID manquant). Reviens dans
                quelques minutes.
              </p>
            )}

            {loadingStrava && (
              <div className="mt-3 flex items-center gap-2 text-sm muted">
                <Loader2 size={14} className="animate-spin" /> Chargement…
              </div>
            )}

            {!loadingStrava && isStravaConfigured() && user && !strava.connected && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleConnectStrava}
                  className="btn-primary bg-[#FC4C02] hover:bg-[#e54401] border-transparent text-white"
                >
                  <Flame size={14} /> Connecter Strava
                </button>
                <p className="text-[11px] muted mt-2">
                  Tu seras redirigé vers Strava pour autoriser Ma Diét (scope{' '}
                  <code>activity:read</code> uniquement, on ne peut rien publier pour toi).
                </p>
              </div>
            )}

            {!loadingStrava && strava.connected && (
              <div className="mt-4 space-y-3">
                {strava.athlete && (strava.athlete.firstname || strava.athlete.lastname) && (
                  <div className="flex items-center gap-2 text-sm">
                    {strava.athlete.profile && (
                      <img
                        src={strava.athlete.profile}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    )}
                    <span>
                      Connecté en tant que{' '}
                      <strong>
                        {strava.athlete.firstname} {strava.athlete.lastname}
                      </strong>
                    </span>
                  </div>
                )}
                <div className="text-xs muted flex items-center gap-1.5">
                  <Clock size={11} />
                  {strava.lastSyncAt
                    ? `Dernière sync : ${new Date(strava.lastSyncAt).toLocaleString('fr-FR')}`
                    : 'Jamais synchronisé — clique sur « Synchroniser »'}
                </div>

                {todayActivity && todayActivity.source === 'strava' && (
                  <div className="rounded-md border bg-[var(--bg-subtle)] p-3 text-sm">
                    <div className="font-medium">
                      Aujourd'hui : {todayActivity.kcal} kcal brûlées · {todayActivity.minutes} min
                    </div>
                    {todayActivity.items && todayActivity.items.length > 0 && (
                      <ul className="mt-1.5 text-xs muted space-y-0.5">
                        {todayActivity.items.map((it) => (
                          <li key={it.id}>
                            {it.name} — {it.kcal} kcal ({it.minutes} min)
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {syncResult && (
                  <div
                    className={
                      'text-sm rounded-md p-2.5 ' +
                      (syncResult.toLowerCase().includes('erreur') ||
                      syncResult.toLowerCase().includes('error')
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900')
                    }
                  >
                    {syncResult.toLowerCase().includes('erreur') ||
                    syncResult.toLowerCase().includes('error') ? null : (
                      <CheckCircle2 size={14} className="inline mr-1" />
                    )}
                    {syncResult}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn-primary"
                  >
                    {syncing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Sync…
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} /> Synchroniser
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="btn-outline text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={14} /> Déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- À venir ---- */}
      <h2 className="font-semibold text-sm mt-8 mb-3 muted">À venir</h2>
      <div className="space-y-3">
        <ComingSoon
          icon={Apple}
          name="Apple Santé"
          desc="Import direct depuis HealthKit (iPhone/Apple Watch), sans passer par Strava."
          color="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200"
        />
        <ComingSoon
          icon={Activity}
          name="Google Fit"
          desc="Synchronise avec ton compte Google Fit (Android, Wear OS, Samsung Health via passerelle)."
          color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
        />
        <ComingSoon
          icon={Watch}
          name="Garmin Connect (direct)"
          desc="Accès natif Garmin Health API pour récupérer aussi le sommeil, HRV, stress. Partenariat Garmin en cours."
          color="bg-blue-50 dark:bg-blue-950/40 text-blue-600"
        />
      </div>

      <div className="mt-10 text-center text-sm muted">
        <p>
          Une idée de connecteur manquant ? Clique sur le bouton 💬 en bas à droite et dis-le
          moi.
        </p>
      </div>
    </div>
  );
}

function ComingSoon({
  icon: Icon,
  name,
  desc,
  color,
}: {
  icon: typeof Watch;
  name: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="card p-4 opacity-70">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-md grid place-items-center shrink-0 ${color}`}>
          <Icon size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{name}</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] muted">
              Bientôt
            </span>
          </div>
          <p className="text-xs muted mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
