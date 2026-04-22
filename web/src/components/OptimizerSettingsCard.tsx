import { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, Settings2 } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { OPTIMIZER_MODES } from '@/lib/constants';
import type { OptimizerMode } from '@/types';
import { cn } from '@/lib/utils';
import { InfoTip } from './InfoTip';

/**
 * Carte repliée par défaut : les modes d'optimisation sont une option
 * avancée (95 % des utilisateurs restent en Normal). On les cache hors
 * du flux principal pour ne pas polluer la toolbar /today.
 */
export function OptimizerSettingsCard() {
  const [open, setOpen] = useState(false);
  const mode = useSettings((s) => s.optimizerMode);
  /** `suggestComplements` défaut `true` → si la clé n'existe pas encore
   *  dans le store (profils pré-v2), on affiche les suggestions. */
  const suggestComplements = useSettings((s) => s.suggestComplements) ?? true;
  const update = useSettings((s) => s.update);
  const current = OPTIMIZER_MODES[mode];

  return (
    <div className="card">
      {/* Header : bouton toggle + InfoTip à part (HTML interdit un <button>
          imbriqué dans un autre <button>). */}
      <div className="flex items-center p-4 gap-2">
        <button
          type="button"
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="h-7 w-7 rounded-md grid place-items-center muted bg-[var(--bg-subtle)]">
            <Settings2 size={14} />
          </span>
          <div>
            <div className="font-semibold text-sm">Mode d'optimisation</div>
            <div className="text-xs muted mt-0.5">
              Actuel : <span className="font-medium text-[var(--text)]">{current.label}</span> ·
              ±{Math.round(current.tolKcal * 100)}% kcal, ±{Math.round(current.tolMacro * 100)}%
              macros
            </div>
          </div>
          <div className="ml-auto">
            {open ? <ChevronDown size={16} className="muted" /> : <ChevronRight size={16} className="muted" />}
          </div>
        </button>
        <InfoTip>
          Règle la précision de l'optimiseur. La plupart des gens restent en{' '}
          <strong>Normal</strong> (±5 % kcal). Le mode <strong>Strict</strong> sert aux
          athlètes en prépa, le mode <strong>Souple</strong> aux débutants qui veulent
          moins de stress sur les chiffres.
        </InfoTip>
      </div>

      {open && (
        <div className="p-4 pt-0 grid gap-2 animate-slide-down">
          {(['strict', 'normal', 'souple'] as OptimizerMode[]).map((m) => {
            const info = OPTIMIZER_MODES[m];
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => update({ optimizerMode: m })}
                className={cn(
                  'text-left p-3 rounded-md border transition-colors',
                  active
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                    : 'hover:bg-[var(--bg-subtle)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{info.label}</div>
                  <div className="text-xs muted tabular-nums">
                    ±{Math.round(info.tolKcal * 100)}% / ±{Math.round(info.tolMacro * 100)}%
                  </div>
                </div>
                <div className="text-xs muted mt-1">{info.description}</div>
              </button>
            );
          })}

          {/* Toggle suggestions complémentaires. Deux modes :
                 - ON  : après optim, on propose des aliments pour compléter le plan
                 - OFF : juste optimiser les quantités, sans rajouter de nouveaux items */}
          <div className="mt-2 pt-3 border-t">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={suggestComplements}
                onChange={(e) => update({ suggestComplements: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Lightbulb size={14} className="text-amber-500" />
                  Proposer des aliments complémentaires
                </div>
                <div className="text-xs muted mt-0.5">
                  Si activé (par défaut), après l'optimisation l'app suggère
                  des aliments à ajouter pour combler un éventuel déficit
                  kcal/macros. Décoche si tu veux juste <em>ajuster</em> ton
                  plan sans aucune suggestion.
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
