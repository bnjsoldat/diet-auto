import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { useSettings } from '@/store/useSettings';
import { calcTargets } from '@/lib/calculations';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import { OPTIMIZER_MODES } from '@/lib/constants';
import { friendlyDate, todayKey } from '@/lib/utils';

/** Ajoute un nombre de jours à une date 'YYYY-MM-DD' et renvoie le résultat. */
function shiftDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Format court "lun. 15" pour la grille hebdo. */
function shortWeekday(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  const num = d.getDate();
  return `${dayName} ${num}`;
}

export function Week() {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.getActive());
  const plans = useDayPlan((s) => s.plans);
  const switchDate = useDayPlan((s) => s.switchDate);
  const duplicateFromDate = useDayPlan((s) => s.duplicateFromDate);
  const optimizerMode = useSettings((s) => s.optimizerMode);

  // Ancre = dimanche le plus proche ≥ aujourd'hui (on montre la semaine en cours)
  const [anchor, setAnchor] = useState<string>(() => todayKey());

  const targets = useMemo(() => (profile ? calcTargets(profile) : null), [profile]);
  const tolKcal = OPTIMIZER_MODES[optimizerMode].tolKcal;

  // 7 jours alignés lundi → dimanche contenant `anchor`.
  const weekDates = useMemo(() => {
    const d = new Date(anchor + 'T12:00:00');
    const day = (d.getDay() + 6) % 7; // 0=lundi … 6=dimanche
    const monday = shiftDate(anchor, -day);
    return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
  }, [anchor]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider muted">Vue hebdo</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Semaine du {friendlyDate(weekDates[0])}</h1>
          <p className="muted text-sm mt-1">
            {profile.nom} · cible {targets?.kcalCible} kcal/j · tolérance ±
            {Math.round(tolKcal * 100)}% ({optimizerMode})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline"
            onClick={() => setAnchor(shiftDate(anchor, -7))}
            title="Semaine précédente"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="btn-outline"
            onClick={() => setAnchor(todayKey())}
          >
            <CalendarDays size={14} /> Cette semaine
          </button>
          <button
            className="btn-outline"
            onClick={() => setAnchor(shiftDate(anchor, 7))}
            title="Semaine suivante"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDates.map((date) => {
          const plan = plans[date];
          const items = plan ? plan.meals.flatMap((m) => m.items) : [];
          const totals = totalsForItems(items, foodsByName);
          const isToday = date === todayKey();
          const hasPlan = items.length > 0;
          const ecartKcal = targets ? (totals.kcal - targets.kcalCible) / targets.kcalCible : 0;
          const tone =
            !hasPlan
              ? 'empty'
              : Math.abs(ecartKcal) <= tolKcal
                ? 'ok'
                : Math.abs(ecartKcal) <= tolKcal * 2
                  ? 'warn'
                  : 'bad';
          const toneClass =
            tone === 'ok'
              ? 'border-emerald-400 dark:border-emerald-700'
              : tone === 'warn'
                ? 'border-amber-400 dark:border-amber-700'
                : tone === 'bad'
                  ? 'border-red-400 dark:border-red-700'
                  : '';

          return (
            <div
              key={date}
              className={
                'card p-3 flex flex-col gap-2 ' +
                toneClass +
                (isToday ? ' ring-2 ring-emerald-500' : '')
              }
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs font-semibold capitalize hover:underline"
                  onClick={() => {
                    switchDate(date);
                    navigate('/today');
                  }}
                >
                  {shortWeekday(date)}
                  {isToday && <span className="ml-1 text-emerald-600">•</span>}
                </button>
                {hasPlan && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        plans[todayKey()] &&
                        plans[todayKey()].meals.some((m) => m.items.length > 0) &&
                        !confirm('Remplacer le plan d\u2019aujourd\u2019hui par la copie de ce jour ?')
                      )
                        return;
                      switchDate(todayKey());
                      duplicateFromDate(date);
                      navigate('/today');
                    }}
                    className="h-6 w-6 grid place-items-center rounded muted hover:bg-[var(--bg-subtle)]"
                    title="Copier vers aujourd'hui"
                  >
                    <Copy size={11} />
                  </button>
                )}
              </div>

              {hasPlan ? (
                <>
                  <div className="text-sm font-bold tabular-nums">
                    {Math.round(totals.kcal)} <span className="text-xs font-normal muted">kcal</span>
                  </div>
                  <div className="text-[11px] muted">
                    P {totals.prot.toFixed(0)} · G {totals.gluc.toFixed(0)} · L {totals.lip.toFixed(0)}
                  </div>
                  <ul className="mt-1 text-[11px] muted space-y-0.5 border-t pt-2">
                    {plan!.meals.map((m) => (
                      <li key={m.id} className="truncate">
                        <span className="text-[var(--text)]">{m.nom.split(' ')[0]}</span> ·{' '}
                        {m.items.length} {m.items.length > 1 ? 'aliments' : 'aliment'}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    switchDate(date);
                    navigate('/today');
                  }}
                  className="flex-1 grid place-items-center min-h-[90px] border border-dashed rounded-md text-xs muted hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <Plus size={14} />
                  <span className="mt-1">Créer</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-xs muted">
        Cliquer sur un jour ouvre le plan correspondant. Le bouton{' '}
        <Copy size={11} className="inline" aria-hidden /> copie la journée dans le plan du jour
        actuel. <Link to="/history" className="underline">Voir l’historique complet</Link>.
      </div>
    </div>
  );
}
