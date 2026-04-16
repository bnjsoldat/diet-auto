import { useEffect } from 'react';
import type { OptimizeResult } from '@/types';
import { Check, X } from 'lucide-react';

interface Props {
  open: boolean;
  result: OptimizeResult | null;
  onClose: () => void;
}

function Row({
  label,
  unit,
  avant,
  apres,
  cible,
}: {
  label: string;
  unit: string;
  avant: number;
  apres: number;
  cible: number;
}) {
  const pct = (v: number) => ((v - cible) / cible) * 100;
  const ok = Math.abs(pct(apres)) < 5;
  return (
    <div className="grid grid-cols-4 gap-2 py-2 border-b last:border-0 text-sm">
      <div className="muted">{label}</div>
      <div className="font-mono tabular-nums">
        {Math.round(avant)} {unit}
      </div>
      <div className="font-mono tabular-nums font-medium">
        {Math.round(apres)} {unit}
      </div>
      <div
        className={ok ? 'text-emerald-600 flex items-center gap-1' : 'text-amber-600'}
      >
        {ok && <Check size={12} />}
        {pct(apres) >= 0 ? '+' : ''}
        {pct(apres).toFixed(1)}%
      </div>
    </div>
  );
}

export function OptimizeDialog({ open, result, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !result) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Optimisation terminée</h2>
            <p className="text-sm muted">
              {result.iterations} itérations ·{' '}
              {result.converge ? 'convergé' : 'max itérations atteint'}
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
        />
        <Row
          label="Protéines"
          unit="g"
          avant={result.avant.prot}
          apres={result.apres.prot}
          cible={result.cibles.prot}
        />
        <Row
          label="Glucides"
          unit="g"
          avant={result.avant.gluc}
          apres={result.apres.gluc}
          cible={result.cibles.gluc}
        />
        <Row
          label="Lipides"
          unit="g"
          avant={result.avant.lip}
          apres={result.apres.lip}
          cible={result.cibles.lip}
        />

        <div className="mt-5 flex justify-end">
          <button className="btn-primary" onClick={onClose}>
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}
