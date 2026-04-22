import { useEffect, useMemo } from 'react';
import type { DayPlan, OptimizerMode, OptimizeResult } from '@/types';
import { AlertTriangle, Check, Lightbulb, Plus, Scale, X } from 'lucide-react';
import { OPTIMIZER_MODES } from '@/lib/constants';
import { foods, foodsByName } from '@/lib/foods';
import { suggestComplements, type Suggestion } from '@/lib/suggestions';
import { totalsForItems } from '@/lib/optimizer';
import { useDayPlan } from '@/store/useDayPlan';

interface Props {
  open: boolean;
  result: OptimizeResult | null;
  plan?: DayPlan | null;
  mode?: OptimizerMode;
  onClose: () => void;
}

function Row({
  label,
  unit,
  avant,
  apres,
  cible,
  tolerance,
}: {
  label: string;
  unit: string;
  avant: number;
  apres: number;
  cible: number;
  tolerance: number; // ex: 0.05 pour ±5 %
}) {
  const pct = ((apres - cible) / cible) * 100;
  const absRatio = Math.abs(pct) / 100;
  let tone: 'ok' | 'warn' | 'bad';
  if (absRatio <= tolerance) tone = 'ok';
  else if (absRatio <= tolerance * 2) tone = 'warn';
  else tone = 'bad';

  const colorClass =
    tone === 'ok'
      ? 'text-emerald-600'
      : tone === 'warn'
      ? 'text-amber-600'
      : 'text-red-600';

  return (
    <div className="grid grid-cols-4 gap-2 py-2 border-b last:border-0 text-sm">
      <div className="muted">{label}</div>
      <div className="font-mono tabular-nums">
        {Math.round(avant)} {unit}
      </div>
      <div className="font-mono tabular-nums font-medium">
        {Math.round(apres)} {unit}
      </div>
      <div className={`${colorClass} flex items-center gap-1`}>
        {tone === 'ok' ? (
          <Check size={12} />
        ) : tone === 'warn' ? (
          <AlertTriangle size={12} />
        ) : (
          <X size={12} />
        )}
        {pct >= 0 ? '+' : ''}
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

function SuggestionsBlock({
  suggestions,
  plan,
  onAdded,
}: {
  suggestions: Suggestion[];
  plan: DayPlan;
  onAdded: () => void;
}) {
  const addFood = useDayPlan((s) => s.addFood);
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
        <Lightbulb size={14} />
        Suggestions pour compléter ton plan
      </div>
      <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">
        Ces aliments comblent le mieux ce qui manque, en restant cohérents avec ce que tu as déjà choisi.
      </p>
      <div className="grid gap-2">
        {suggestions.map((s) => {
          const labelMacro =
            s.comble === 'prot'
              ? 'riche en protéines'
              : s.comble === 'gluc'
              ? 'apporte des glucides'
              : s.comble === 'lip'
              ? 'apporte des lipides'
              : 'apporte des calories';
          return (
            <div
              key={s.food.nom}
              className="flex flex-wrap items-center justify-between gap-2 bg-[var(--card)] rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.food.nom}</div>
                <div className="text-xs muted">
                  {s.quantite} g · {Math.round((s.quantite * s.food.kcal) / 100)} kcal · {labelMacro}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {plan.meals.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="btn-outline h-7 px-2 text-xs"
                    onClick={() => {
                      addFood(m.id, s.food.nom, s.quantite);
                      onAdded();
                    }}
                    title={`Ajouter dans ${m.nom}`}
                  >
                    <Plus size={11} /> {m.nom}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OptimizeDialog({ open, result, plan, mode, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const modeConfig = OPTIMIZER_MODES[mode ?? 'normal'];

  const suggestions = useMemo(() => {
    if (!open || !result || !plan) return [];
    return suggestComplements({
      plan,
      totals: result.apres,
      cibles: result.cibles,
      foods,
      poids: { kcal: modeConfig.poidsKcal, macro: modeConfig.poidsMacro },
      tolerance: { kcal: modeConfig.tolKcal, macro: modeConfig.tolMacro },
      max: 3,
    });
  }, [open, result, plan, modeConfig]);

  /**
   * Analyse de la distribution des kcal par repas après optimisation.
   * L'optimiseur n'a pas de notion de "quel repas" (il traite tout à plat),
   * donc il peut concentrer les kcal sur un seul repas. On détecte ce cas
   * et on affiche un warning utile — l'utilisateur peut alors redistribuer
   * manuellement ou supprimer des items trop chargés.
   */
  const mealDistribution = useMemo(() => {
    if (!open || !result || !plan) return null;
    const meals = plan.meals.map((m) => {
      const t = totalsForItems(m.items, foodsByName);
      return { nom: m.nom, kcal: t.kcal };
    });
    const total = meals.reduce((a, m) => a + m.kcal, 0);
    if (total < 100) return null;
    return meals.map((m) => ({ ...m, pct: (m.kcal / total) * 100 }));
  }, [open, result, plan]);

  /** Repas qui dépassent 40 % du total — signe d'un plan déséquilibré. */
  const overloadedMeals = useMemo(
    () => mealDistribution?.filter((m) => m.pct > 40) ?? [],
    [mealDistribution]
  );

  if (!open || !result) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg card p-5 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Optimisation terminée</h2>
            <p className="text-sm muted">
              {result.iterations} itérations ·{' '}
              {result.converge ? 'convergé' : 'max itérations atteint'} · mode{' '}
              <span className="font-medium">{modeConfig.label.toLowerCase()}</span>
            </p>
          </div>
          <button onClick={onClose} className="muted hover:text-[var(--text)]" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs font-semibold uppercase tracking-wider muted pb-2 border-b">
          <div></div>
          <div>Avant</div>
          <div>Après</div>
          <div>Écart</div>
        </div>
        <Row
          label="Calories"
          unit="kcal"
          avant={result.avant.kcal}
          apres={result.apres.kcal}
          cible={result.cibles.kcal}
          tolerance={modeConfig.tolKcal}
        />
        <Row
          label="Protéines"
          unit="g"
          avant={result.avant.prot}
          apres={result.apres.prot}
          cible={result.cibles.prot}
          tolerance={modeConfig.tolMacro}
        />
        <Row
          label="Glucides"
          unit="g"
          avant={result.avant.gluc}
          apres={result.apres.gluc}
          cible={result.cibles.gluc}
          tolerance={modeConfig.tolMacro}
        />
        <Row
          label="Lipides"
          unit="g"
          avant={result.avant.lip}
          apres={result.apres.lip}
          cible={result.cibles.lip}
          tolerance={modeConfig.tolMacro}
        />

        {/* Warning distribution repas : si un repas > 40 % du total kcal,
            c'est probablement pas ce que l'user voulait (il préfère souvent
            le midi ou le soir chargé, pas le petit-déj). L'optimiseur
            n'a pas cette notion — on délègue à l'utilisateur via warning. */}
        {overloadedMeals.length > 0 && mealDistribution && (
          <div className="mt-4 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
            <div className="flex items-start gap-2">
              <Scale size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Plan déséquilibré</div>
                <div className="text-xs muted mt-0.5">
                  {overloadedMeals.map((m, i) => (
                    <span key={m.nom}>
                      {i > 0 && ', '}
                      <strong>{m.nom}</strong> = {Math.round(m.pct)} % du total
                    </span>
                  ))}
                  . Si tu préfères équilibrer, retire ou diminue manuellement des
                  aliments dans ce repas et relance l'optimisation.
                </div>
                <div className="mt-2 grid gap-1 text-xs">
                  {mealDistribution.map((m) => (
                    <div key={m.nom} className="flex items-center gap-2">
                      <span className="w-28 truncate muted">{m.nom}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${m.pct > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, m.pct)}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-[11px] w-12 text-right">
                        {Math.round(m.pct)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {plan && (
          <SuggestionsBlock
            suggestions={suggestions}
            plan={plan}
            onAdded={onClose}
          />
        )}

        <div className="mt-5 flex justify-end">
          <button className="btn-primary" onClick={onClose}>
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}
