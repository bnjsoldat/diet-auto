import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { track } from '@vercel/analytics';
import { useActivity } from '@/store/useActivity';
import { labelForActivityType, syncActivities } from '@/lib/strava';
import { cn } from '@/lib/utils';

/**
 * Widget affiché sur /today : montre les kcal brûlées aujourd'hui
 * (depuis Strava ou saisie manuelle) et permet d'éditer une valeur manuelle.
 *
 * Si l'user est connecté à Strava, bouton "Sync" pour rafraîchir à la demande.
 */
interface Props {
  /** Date du jour au format 'YYYY-MM-DD'. */
  date: string;
  /** True si Strava est connecté pour cet user. */
  stravaConnected: boolean;
}

export function ActivityWidget({ date, stravaConnected }: Props) {
  const activity = useActivity((s) => s.byDate[date]);
  const setManual = useActivity((s) => s.setManual);
  const mergeActivities = useActivity((s) => s.merge);
  const remove = useActivity((s) => s.remove);

  const [editing, setEditing] = useState(false);
  const [editKcal, setEditKcal] = useState<string>(activity ? String(activity.kcal) : '');
  const [editMinutes, setEditMinutes] = useState<string>(activity ? String(activity.minutes) : '');
  const [syncing, setSyncing] = useState(false);

  const totalKcal = activity?.kcal ?? 0;

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await syncActivities();
      await mergeActivities(res.activities);
      track('strava_sync_from_today', { count: res.count });
    } catch {
      /* silencieux ici — l'user peut voir l'erreur sur /integrations */
    } finally {
      setSyncing(false);
    }
  }

  function openEditor() {
    setEditKcal(activity?.source === 'manual' ? String(activity.kcal) : '');
    setEditMinutes(activity?.source === 'manual' ? String(activity.minutes) : '');
    setEditing(true);
  }

  async function handleSaveManual() {
    const kcal = Number(editKcal) || 0;
    const minutes = Number(editMinutes) || 0;
    await setManual(date, kcal, minutes);
    setEditing(false);
    track('activity_manual_saved', { kcal });
  }

  async function handleRemove() {
    await remove(date);
    setEditing(false);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-orange-500" />
          <div className="text-xs font-semibold uppercase tracking-wider muted">
            Sport aujourd'hui
          </div>
        </div>
        {stravaConnected && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="text-xs muted hover:text-[var(--text)] inline-flex items-center gap-1 disabled:opacity-50"
            title="Re-synchroniser Strava"
          >
            <RefreshCw size={12} className={cn(syncing && 'animate-spin')} />
            Sync
          </button>
        )}
      </div>

      {/* État : pas d'activité */}
      {!activity && !editing && (
        <div>
          <div className="text-sm muted leading-relaxed mb-3">
            {stravaConnected
              ? "Aucune activité enregistrée aujourd'hui sur Strava. Tu peux sync ou saisir manuellement."
              : "Ajoute tes calories dépensées en sport : ta cible du jour s'ajuste automatiquement."}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline text-sm" onClick={openEditor}>
              <Plus size={12} /> Saisir manuellement
            </button>
            {!stravaConnected && (
              <Link to="/integrations" className="btn-outline text-sm">
                <Flame size={12} /> Connecter Strava
              </Link>
            )}
          </div>
        </div>
      )}

      {/* État : activité présente (Strava ou manuelle) */}
      {activity && !editing && (
        <div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-orange-500 tabular-nums">
              +{totalKcal}
            </div>
            <div className="text-sm muted">kcal brûlées</div>
          </div>
          <div className="text-xs muted mt-1">
            {activity.minutes > 0 && <>{activity.minutes} min · </>}
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
              activity.source === 'strava'
                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                : 'bg-[var(--bg-subtle)]'
            )}>
              {activity.source === 'strava' ? 'Strava' : 'manuel'}
            </span>
          </div>
          <div className="mt-2 text-[11px] muted leading-relaxed rounded bg-[var(--bg-subtle)] p-2">
            ℹ️ Ta cible du jour utilise la base <strong>sédentaire</strong> (métabolisme basal
            corps seul) + les <strong>{totalKcal} kcal sport exactes</strong>. Pas de
            double-comptage avec ton niveau d'activité profil.
          </div>

          {activity.items && activity.items.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs">
              {activity.items.map((it) => {
                const { emoji, label } = labelForActivityType(it.type);
                return (
                  <li key={it.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {emoji} <span className="muted">{label}</span> · {it.name}
                    </span>
                    <span className="muted tabular-nums shrink-0">
                      {it.kcal} kcal
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-outline text-xs" onClick={openEditor}>
              <Pencil size={11} /> {activity.source === 'manual' ? 'Modifier' : 'Ajouter manuellement'}
            </button>
            {activity.source === 'manual' && (
              <button
                type="button"
                className="btn-outline text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={handleRemove}
              >
                <Trash2 size={11} /> Retirer
              </button>
            )}
          </div>
        </div>
      )}

      {/* État : édition */}
      {editing && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Calories brûlées</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="5000"
              value={editKcal}
              onChange={(e) => setEditKcal(e.target.value)}
              className="input w-full"
              placeholder="Ex : 450"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Durée (min, optionnel)</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="600"
              value={editMinutes}
              onChange={(e) => setEditMinutes(e.target.value)}
              className="input w-full"
              placeholder="Ex : 60"
            />
          </div>
          <div className="text-[11px] muted">
            Tu peux trouver tes kcal brûlées dans ton app (Garmin Connect, Apple Fitness,
            etc.). Ta cible du jour s'ajuste automatiquement.
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline text-sm" onClick={() => setEditing(false)}>
              Annuler
            </button>
            <button type="button" className="btn-primary text-sm" onClick={handleSaveManual}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
