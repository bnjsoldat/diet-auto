import { useState } from 'react';
import { Droplet, Minus, Plus, Settings2 } from 'lucide-react';
import { useWater } from '@/store/useWater';
import { InfoTip } from './InfoTip';
import { cn } from '@/lib/utils';

interface Props {
  profileId: string;
  /** Date au format ISO 'YYYY-MM-DD'. */
  date: string;
}

/**
 * Carte compacte de suivi d'hydratation pour la page /today.
 * Affiche le nombre de verres bus, la progression vers l'objectif,
 * et permet d'ajouter/retirer un verre rapidement. Objectif configurable
 * par l'utilisateur (persisté global).
 */
export function WaterTracker({ profileId, date }: Props) {
  const count = useWater((s) => s.counts[`water:${profileId}:${date}`] ?? 0);
  const goal = useWater((s) => s.goal);
  const increment = useWater((s) => s.increment);
  const decrement = useWater((s) => s.decrement);
  const setFor = useWater((s) => s.setFor);
  const setGoal = useWater((s) => s.setGoal);
  const [editing, setEditing] = useState(false);

  const pct = Math.min(100, (count / goal) * 100);
  const liters = (count * 0.25).toFixed(2).replace('.', ',');

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold flex items-center gap-1.5">
          <Droplet size={14} className="text-blue-500" />
          Hydratation
          <InfoTip>
            Repère simple : 1 verre ≈ 250 mL. L'objectif recommandé est de 1,5 à 2 L/jour
            (6 à 8 verres) pour un adulte sédentaire, et jusqu'à 3 L pour une activité
            soutenue ou par forte chaleur. Tu peux ajuster ton objectif avec l'icône
            paramètres.
          </InfoTip>
        </h3>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="h-6 w-6 grid place-items-center rounded muted hover:bg-[var(--bg-subtle)]"
          title="Régler l'objectif"
          aria-label="Régler l'objectif d'hydratation"
        >
          <Settings2 size={12} />
        </button>
      </div>

      {/* Ligne de verres visuels */}
      <div className="flex flex-wrap gap-1 mt-2">
        {Array.from({ length: goal }).map((_, i) => {
          const filled = i < count;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setFor(profileId, date, i + 1 === count ? count - 1 : i + 1)}
              className={cn(
                'h-7 w-5 rounded-b-sm border-2 transition-colors',
                filled
                  ? 'bg-blue-500/70 border-blue-500'
                  : 'border-[var(--border)] hover:border-blue-400'
              )}
              aria-label={`Verre n°${i + 1}${filled ? ' (bu)' : ''}`}
              title={`Verre ${i + 1}/${goal}`}
            />
          );
        })}
        {/* Verres bonus au-delà de l'objectif */}
        {count > goal &&
          Array.from({ length: count - goal }).map((_, i) => (
            <button
              key={'bonus-' + i}
              type="button"
              onClick={() => setFor(profileId, date, count - 1)}
              className="h-7 w-5 rounded-b-sm border-2 bg-blue-600/70 border-blue-600"
              aria-label={`Verre bonus n°${goal + i + 1}`}
              title={`Bonus (${goal + i + 1})`}
            />
          ))}
      </div>

      {/* Ligne d'état + boutons rapides */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-semibold tabular-nums text-blue-600">{count}</span>
          <span className="muted"> / {goal} verres</span>
          <span className="muted text-xs ml-1.5">({liters} L)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => decrement(profileId, date)}
            disabled={count === 0}
            className="h-7 w-7 grid place-items-center rounded border muted hover:bg-[var(--bg-subtle)] disabled:opacity-30"
            aria-label="Retirer un verre"
          >
            <Minus size={12} />
          </button>
          <button
            type="button"
            onClick={() => increment(profileId, date)}
            className="h-7 px-2 inline-flex items-center gap-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium"
            aria-label="Ajouter un verre"
          >
            <Plus size={12} /> Verre
          </button>
        </div>
      </div>

      {/* Barre de progression mince en bas */}
      <div className="mt-2 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Éditeur d'objectif, replié par défaut */}
      {editing && (
        <div className="mt-3 pt-3 border-t animate-slide-down">
          <label className="block text-xs muted mb-1">
            Objectif quotidien (en verres de 250 mL)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={20}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value) || 8)}
              className="input h-8 w-20"
            />
            <span className="text-xs muted">= {(goal * 0.25).toFixed(2).replace('.', ',')} L</span>
          </div>
        </div>
      )}
    </div>
  );
}
