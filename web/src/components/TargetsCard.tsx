import type { OptimizerMode, Targets } from '@/types';
import { AlertTriangle, Check, X } from 'lucide-react';
import { OPTIMIZER_MODES } from '@/lib/constants';
import { MacrosDonut } from './MacrosDonut';

interface Props {
  targets: Targets;
  currentKcal?: number;
  currentProt?: number;
  currentGluc?: number;
  currentLip?: number;
  /** Mode d'optimisation actif (pour connaître les tolérances). */
  mode?: OptimizerMode;
}

function statusForRatio(ratio: number, tol: number): 'ok' | 'warn' | 'bad' {
  const abs = Math.abs(ratio);
  if (abs <= tol) return 'ok';
  if (abs <= tol * 2) return 'warn';
  return 'bad';
}

function Row({
  label,
  current,
  target,
  unit,
  tolerance,
}: {
  label: string;
  current?: number;
  target: number;
  unit: string;
  tolerance: number;
}) {
  const hasCurrent = typeof current === 'number';
  const pct = hasCurrent ? Math.min(100, (current! / target) * 100) : 0;
  // Statut basé sur l'écart relatif, pas juste un booléen ±5 %.
  const status: 'ok' | 'warn' | 'bad' | 'empty' = hasCurrent
    ? statusForRatio((current! - target) / target, tolerance)
    : 'empty';
  const barColor =
    status === 'ok' ? '#10b981' : status === 'warn' ? '#f59e0b' : status === 'bad' ? '#ef4444' : '#10b981';
  const badge =
    status === 'ok' ? (
      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-500" aria-label="dans la tolérance">
        <Check size={12} />
      </span>
    ) : status === 'warn' ? (
      <span className="inline-flex items-center text-amber-600" aria-label="hors tolérance légère">
        <AlertTriangle size={12} />
      </span>
    ) : status === 'bad' ? (
      <span className="inline-flex items-center text-red-600" aria-label="écart important">
        <X size={12} />
      </span>
    ) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm gap-2">
        <span className="muted flex items-center gap-1.5">
          {badge}
          {label}
        </span>
        <span className="font-mono tabular-nums">
          {hasCurrent ? Math.round(current!) : '—'}{' '}
          <span className="muted">/ {Math.round(target)} {unit}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

export function TargetsCard({ targets, currentKcal, currentProt, currentGluc, currentLip, mode = 'normal' }: Props) {
  const m = OPTIMIZER_MODES[mode];
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider muted mb-1">
            Cible du jour
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-emerald-600">{targets.kcalCible}</div>
            <div className="muted text-sm">kcal</div>
          </div>
          <div className="text-xs muted mt-1">
            Maintenance {targets.kcalMaintenance} kcal
            {targets.deltaKcal !== 0 && (
              <>
                {' '}
                · écart {targets.deltaKcal > 0 ? '+' : ''}
                {targets.deltaKcal} kcal
              </>
            )}
          </div>
        </div>
        <MacrosDonut
          prot={targets.prot}
          gluc={targets.gluc}
          lip={targets.lip}
          kcalTotal={targets.kcalCible}
          compact
        />
      </div>

      <div className="mt-5 grid gap-3">
        <Row label="Calories" current={currentKcal} target={targets.kcalCible} unit="kcal" tolerance={m.tolKcal} />
        <Row label="Protéines" current={currentProt} target={targets.prot} unit="g" tolerance={m.tolMacro} />
        <Row label="Glucides" current={currentGluc} target={targets.gluc} unit="g" tolerance={m.tolMacro} />
        <Row label="Lipides" current={currentLip} target={targets.lip} unit="g" tolerance={m.tolMacro} />
      </div>
      <div className="mt-3 text-[11px] muted">
        Tolérance : ±{Math.round(m.tolKcal * 100)}% kcal, ±{Math.round(m.tolMacro * 100)}% macros (mode {m.label.toLowerCase()}).
      </div>
    </div>
  );
}
