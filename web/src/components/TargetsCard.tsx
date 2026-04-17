import { useState } from 'react';
import type { OptimizerMode, Targets } from '@/types';
import { AlertTriangle, Camera, Check, RotateCcw, X } from 'lucide-react';
import { OPTIMIZER_MODES } from '@/lib/constants';
import { ProgressRings } from './ProgressRings';
import { InfoTip } from './InfoTip';

interface Props {
  targets: Targets;
  currentKcal?: number;
  currentProt?: number;
  currentGluc?: number;
  currentLip?: number;
  /** Mode d'optimisation actif (pour connaître les tolérances). */
  mode?: OptimizerMode;
}

/** Affiche un delta chiffré entre l'état de référence figé et l'état courant. */
function DeltaBadge({ delta, unit }: { delta: number; unit: string }) {
  if (Math.abs(delta) < 0.5) return null;
  const sign = delta >= 0 ? '+' : '';
  const colorClass =
    delta >= 0
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
      : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50';
  return (
    <span
      className={
        'ml-1 inline-block text-[10px] tabular-nums rounded px-1 py-[1px] font-medium ' + colorClass
      }
    >
      {sign}
      {Math.round(delta)} {unit}
    </span>
  );
}

function statusForRatio(ratio: number, tol: number): 'ok' | 'warn' | 'bad' {
  const abs = Math.abs(ratio);
  if (abs <= tol) return 'ok';
  if (abs <= tol * 2) return 'warn';
  return 'bad';
}

/** Palette cohérente avec ProgressRings pour un repère visuel instantané. */
const MACRO_COLOR: Record<string, string> = {
  Calories: '#10b981',
  'Protéines': '#f97316',
  'Glucides': '#3b82f6',
  'Lipides': '#a855f7',
};

function Row({
  label,
  current,
  target,
  unit,
  tolerance,
  snapshot,
}: {
  label: string;
  current?: number;
  target: number;
  unit: string;
  tolerance: number;
  /** Valeur figée pour calculer le delta, ou null si pas de comparaison active. */
  snapshot?: number | null;
}) {
  const hasCurrent = typeof current === 'number';
  const pct = hasCurrent ? Math.min(100, (current! / target) * 100) : 0;
  // Statut basé sur l'écart relatif, pas juste un booléen ±5 %.
  const status: 'ok' | 'warn' | 'bad' | 'empty' = hasCurrent
    ? statusForRatio((current! - target) / target, tolerance)
    : 'empty';
  // Barre : couleur macro en mode OK, couleur alerte en mode warn/bad.
  const macroColor = MACRO_COLOR[label] ?? '#10b981';
  const barColor =
    status === 'ok' ? macroColor : status === 'warn' ? '#f59e0b' : status === 'bad' ? '#ef4444' : macroColor;
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
  const delta = typeof snapshot === 'number' && hasCurrent ? current! - snapshot : null;

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
          {delta !== null && <DeltaBadge delta={delta} unit={unit} />}
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
  /**
   * Snapshot = état figé à l'instant où l'utilisateur clique "Comparer".
   * Tant qu'il est non-null, les lignes affichent un badge delta vs ce snapshot.
   * Permet de voir l'impact d'une modification sans avoir à faire de calcul mental.
   */
  const [snapshot, setSnapshot] = useState<{
    kcal?: number;
    prot?: number;
    gluc?: number;
    lip?: number;
  } | null>(null);

  function handleToggleCompare() {
    if (snapshot) {
      setSnapshot(null);
    } else {
      setSnapshot({
        kcal: currentKcal,
        prot: currentProt,
        gluc: currentGluc,
        lip: currentLip,
      });
    }
  }
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider muted mb-1">
            Progression du jour
          </div>
          <ProgressRings
            targets={targets}
            currentKcal={currentKcal ?? 0}
            currentProt={currentProt ?? 0}
            currentGluc={currentGluc ?? 0}
            currentLip={currentLip ?? 0}
            size={160}
          />
          <div className="text-xs muted mt-3 flex items-center gap-1 flex-wrap">
            <span>Maintenance {targets.kcalMaintenance} kcal</span>
            <InfoTip>
              <strong>Maintenance</strong> = nombre de calories pour maintenir ton poids, sans
              perdre ni gagner. Calculé à partir du <em>métabolisme de base</em> (Harris-Benedict
              genre/taille/poids/âge) multiplié par ton coefficient d'activité.
            </InfoTip>
            {targets.deltaKcal !== 0 && (
              <>
                <span>
                  · écart {targets.deltaKcal > 0 ? '+' : ''}
                  {targets.deltaKcal} kcal
                </span>
                <InfoTip>
                  {targets.deltaKcal < 0 ? (
                    <>
                      <strong>Déficit</strong> pour perdre du poids. Un déficit de{' '}
                      {Math.abs(targets.deltaKcal)} kcal/j correspond à environ{' '}
                      {Math.round((Math.abs(targets.deltaKcal) * 7) / 7700)} kg perdu par
                      semaine (1 kg ≈ 7 700 kcal stockés).
                    </>
                  ) : (
                    <>
                      <strong>Surplus</strong> pour prendre du poids ou de la masse. Un surplus
                      maîtrisé de 400 kcal/j donne environ 250 g/semaine de gain — idéal pour
                      limiter la prise de gras.
                    </>
                  )}
                </InfoTip>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <Row
          label="Calories"
          current={currentKcal}
          target={targets.kcalCible}
          unit="kcal"
          tolerance={m.tolKcal}
          snapshot={snapshot?.kcal ?? null}
        />
        <Row
          label="Protéines"
          current={currentProt}
          target={targets.prot}
          unit="g"
          tolerance={m.tolMacro}
          snapshot={snapshot?.prot ?? null}
        />
        <Row
          label="Glucides"
          current={currentGluc}
          target={targets.gluc}
          unit="g"
          tolerance={m.tolMacro}
          snapshot={snapshot?.gluc ?? null}
        />
        <Row
          label="Lipides"
          current={currentLip}
          target={targets.lip}
          unit="g"
          tolerance={m.tolMacro}
          snapshot={snapshot?.lip ?? null}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] muted">
        <span>
          Tol. ±{Math.round(m.tolKcal * 100)}% kcal, ±{Math.round(m.tolMacro * 100)}% macros
        </span>
        <button
          type="button"
          onClick={handleToggleCompare}
          className={
            'inline-flex items-center gap-1 h-6 px-2 rounded border text-[11px] transition-colors ' +
            (snapshot
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'hover:bg-[var(--bg-subtle)]')
          }
          title={
            snapshot
              ? 'Arrêter la comparaison (efface le point de référence)'
              : 'Fige les totaux actuels : les prochains changements afficheront le delta'
          }
        >
          {snapshot ? (
            <>
              <RotateCcw size={11} /> Réinit.
            </>
          ) : (
            <>
              <Camera size={11} /> Comparer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
