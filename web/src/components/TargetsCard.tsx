import type { Targets } from '@/types';
import { MacrosDonut } from './MacrosDonut';

interface Props {
  targets: Targets;
  currentKcal?: number;
  currentProt?: number;
  currentGluc?: number;
  currentLip?: number;
}

function Row({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current?: number;
  target: number;
  unit: string;
}) {
  const hasCurrent = typeof current === 'number';
  const pct = hasCurrent ? Math.min(100, (current! / target) * 100) : 0;
  const ok = hasCurrent && Math.abs(current! - target) / target < 0.05;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="muted">{label}</span>
        <span className="font-mono tabular-nums">
          {hasCurrent ? Math.round(current!) : '—'}{' '}
          <span className="muted">/ {Math.round(target)} {unit}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: ok ? '#10b981' : current! > target ? '#f59e0b' : '#10b981',
          }}
        />
      </div>
    </div>
  );
}

export function TargetsCard({ targets, currentKcal, currentProt, currentGluc, currentLip }: Props) {
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
        <Row label="Calories" current={currentKcal} target={targets.kcalCible} unit="kcal" />
        <Row label="Protéines" current={currentProt} target={targets.prot} unit="g" />
        <Row label="Glucides" current={currentGluc} target={targets.gluc} unit="g" />
        <Row label="Lipides" current={currentLip} target={targets.lip} unit="g" />
      </div>
    </div>
  );
}
