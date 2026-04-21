import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { InfoTip } from './InfoTip';
import { cn } from '@/lib/utils';

interface Props {
  /** Totaux micros journaliers déjà calculés (sortie de totalsForItems). */
  fib: number;
  suc: number;
  sel: number;
  ags: number;
  /** Couverture (0..1) : ratio d'aliments du plan ayant la donnée CIQUAL. */
  cov: { fib: number; suc: number; sel: number; ags: number };
}

/**
 * Repères de consommation journalière pour un adulte moyen (ANSES / OMS).
 * On les utilise pour colorer les lignes : vert si dans la cible, amber
 * si écart modéré, rouge si écart fort.
 */
const RECOS = {
  /** Fibres : ANSES recommande ≥ 30 g/jour pour un adulte. */
  fib: { goal: 30, kind: 'min' as const },
  /** Sucres libres : OMS recommande < 50 g/jour (idéalement < 25 g). */
  suc: { goal: 50, kind: 'max' as const },
  /** Sel : OMS < 5 g/jour, ANSES < 6 g/jour. On retient 6 g. */
  sel: { goal: 6, kind: 'max' as const },
  /** AG saturés : ANSES recommande ≤ 22 g/jour (10 % apport énergétique). */
  ags: { goal: 22, kind: 'max' as const },
};

function statusFor(value: number, reco: { goal: number; kind: 'min' | 'max' }): 'ok' | 'warn' | 'bad' | 'neutral' {
  if (value === 0) return 'neutral';
  const ratio = value / reco.goal;
  if (reco.kind === 'max') {
    if (ratio <= 1) return 'ok';
    if (ratio <= 1.5) return 'warn';
    return 'bad';
  }
  // 'min' : plus c'est élevé, mieux c'est
  if (ratio >= 1) return 'ok';
  if (ratio >= 0.6) return 'warn';
  return 'bad';
}

function dotColor(status: 'ok' | 'warn' | 'bad' | 'neutral'): string {
  if (status === 'ok') return 'bg-emerald-500';
  if (status === 'warn') return 'bg-amber-500';
  if (status === 'bad') return 'bg-red-500';
  return 'bg-[var(--border)]';
}

/**
 * Carte repliée par défaut affichant les 4 micronutriments clés :
 * fibres, sucres, sel, acides gras saturés. Chaque ligne a un code
 * couleur par rapport aux recos ANSES/OMS. Couverture affichée si
 * certains aliments du plan n'ont pas la donnée CIQUAL.
 */
export function MicroNutrientsCard({ fib, suc, sel, ags, cov }: Props) {
  const [open, setOpen] = useState(false);

  const lines = [
    {
      key: 'fib',
      label: 'Fibres',
      value: fib,
      unit: 'g',
      reco: RECOS.fib,
      coverage: cov.fib,
      tip: 'Les fibres (légumes, fruits, céréales complètes, légumineuses) améliorent la satiété et le transit. ANSES recommande ≥ 30 g/jour pour un adulte.',
    },
    {
      key: 'suc',
      label: 'Sucres',
      value: suc,
      unit: 'g',
      reco: RECOS.suc,
      coverage: cov.suc,
      tip: 'Sucres totaux (ajoutés + naturels des fruits / produits laitiers). L\u2019OMS recommande de rester < 50 g/jour, idéalement < 25 g pour la santé cardiovasculaire.',
    },
    {
      key: 'sel',
      label: 'Sel',
      value: sel,
      unit: 'g',
      reco: RECOS.sel,
      coverage: cov.sel,
      tip: 'Sel = chlorure de sodium. OMS < 5 g/jour, ANSES < 6 g/jour. 80 % du sel consommé vient des aliments transformés, pas de la salière.',
    },
    {
      key: 'ags',
      label: 'Saturés',
      value: ags,
      unit: 'g',
      reco: RECOS.ags,
      coverage: cov.ags,
      tip: 'Acides gras saturés (beurre, fromage, charcuterie, huile de palme). ANSES recommande ≤ 22 g/jour, soit 10 % de l\u2019apport énergétique.',
    },
  ];

  // Résumé visuel dans l'en-tête : un point par nutriment
  const summary = lines.map((l) => ({
    key: l.key,
    status: statusFor(l.value, l.reco),
  }));

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center p-3 text-left gap-2"
        aria-expanded={open}
      >
        <span className="h-7 w-7 rounded-md grid place-items-center bg-[var(--bg-subtle)] muted">
          <Sparkles size={13} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Fibres · sucres · sel · saturés</div>
          {!open && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {summary.map((s) => (
                <span
                  key={s.key}
                  className={cn('h-2 w-2 rounded-full shrink-0', dotColor(s.status))}
                  aria-label={s.key + ' ' + s.status}
                />
              ))}
              <span className="text-xs muted ml-1">Détails</span>
            </div>
          )}
        </div>
        {open ? (
          <ChevronDown size={14} className="muted" />
        ) : (
          <ChevronRight size={14} className="muted" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 animate-slide-down">
          <div className="grid gap-2.5">
            {lines.map((l) => {
              const status = statusFor(l.value, l.reco);
              const pct = Math.min(100, (l.value / l.reco.goal) * 100);
              const coverageLow = l.coverage < 0.9 && l.value > 0;
              return (
                <div key={l.key}>
                  <div className="flex items-baseline justify-between text-xs gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', dotColor(status))} />
                      <span className="font-medium">{l.label}</span>
                      <InfoTip>{l.tip}</InfoTip>
                    </span>
                    <span className="font-mono tabular-nums">
                      {coverageLow && <span className="muted">≈ </span>}
                      {l.value.toFixed(l.key === 'sel' ? 2 : 1)} {l.unit}
                      <span className="muted">
                        {' '}
                        / {l.reco.goal} {l.unit} {l.reco.kind === 'max' ? 'max' : 'min'}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        status === 'ok'
                          ? 'bg-emerald-500'
                          : status === 'warn'
                            ? 'bg-amber-500'
                            : status === 'bad'
                              ? 'bg-red-500'
                              : 'bg-[var(--border)]'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] muted mt-3 leading-relaxed">
            Repères pour un adulte (ANSES / OMS). Couverture variable selon les aliments — les
            valeurs « ≈ » indiquent qu'une partie des aliments du plan n'ont pas la donnée
            dans CIQUAL.
          </p>
        </div>
      )}
    </div>
  );
}
