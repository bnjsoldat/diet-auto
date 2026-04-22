import { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, Settings2 } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { useProfile } from '@/store/useProfile';
import { MEAL_DISTRIBUTION_PRESETS, OPTIMIZER_MODES } from '@/lib/constants';
import type { MealDistribution, OptimizerMode } from '@/types';
import { cn } from '@/lib/utils';
import { InfoTip } from './InfoTip';

/**
 * Carte « Paramètres du plan » (renommée depuis « Mode d'optimisation »
 * le 2026-04-22). Regroupe tout ce qui affecte le comportement du plan
 * du jour sans changer l'identité du profil :
 *
 *  1. Distribution des repas (preset du profil) — où concentrer les kcal
 *  2. Mode d'optimisation — tolérance kcal/macros de l'algo
 *  3. Toggle suggestions — proposer ou non des aliments en plus
 *
 * Repliée par défaut : la majorité des utilisateurs ne touchent rien
 * après l'onboarding. Ouverture au clic pour ajustements fins.
 */
export function OptimizerSettingsCard() {
  const [open, setOpen] = useState(false);
  const mode = useSettings((s) => s.optimizerMode);
  const suggestComplements = useSettings((s) => s.suggestComplements) ?? true;
  const updateSettings = useSettings((s) => s.update);
  const current = OPTIMIZER_MODES[mode];

  // Distribution des repas est stockée sur le Profile (pas sur les Settings)
  // car c'est une préférence personnelle qui peut différer par profil.
  const profile = useProfile((s) => s.getActive());
  const updateProfile = useProfile((s) => s.updateProfile);
  const mealDistribution: MealDistribution = profile?.mealDistribution ?? 'equilibre';
  const distMeta = MEAL_DISTRIBUTION_PRESETS[mealDistribution];

  function setDistribution(d: MealDistribution) {
    if (!profile) return;
    updateProfile(profile.id, { mealDistribution: d });
  }

  return (
    <div className="card">
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
          <div className="min-w-0">
            <div className="font-semibold text-sm">Paramètres du plan</div>
            <div className="text-xs muted mt-0.5 truncate">
              {distMeta.emoji} {distMeta.label} ·{' '}
              <span className="font-medium text-[var(--text)]">{current.label}</span> · tol. ±
              {Math.round(current.tolKcal * 100)}%
            </div>
          </div>
          <div className="ml-auto shrink-0">
            {open ? <ChevronDown size={16} className="muted" /> : <ChevronRight size={16} className="muted" />}
          </div>
        </button>
        <InfoTip>
          Regroupe les réglages qui changent le comportement du plan sans
          toucher à ton profil physique : <strong>distribution des repas</strong>,{' '}
          <strong>précision de l'optimiseur</strong> et <strong>suggestions</strong>.
        </InfoTip>
      </div>

      {open && (
        <div className="p-4 pt-0 grid gap-5 animate-slide-down">
          {/* ================= DISTRIBUTION DES REPAS ================= */}
          <section>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider muted mb-2">
              Répartition des repas
              <InfoTip>
                <strong>Où concentrer tes kcal sur la journée.</strong> Chaque preset
                est basé sur une recommandation scientifique ou culturelle :
                <br />
                <br />
                • <em>Équilibré</em> : ANSES, recommandation FR
                <br />
                • <em>Petit-déj copieux</em> : chrono-nutrition Delabos
                <br />
                • <em>Déjeuner copieux</em> : tradition française/méditerranéenne
                <br />
                • <em>Dîner copieux</em> : pattern anglo-américain
                <br />
                • <em>Jeûne 16/8</em> : intermittent fasting
                <br />
                <br />
                Les cibles par repas sont affichées sur la page « Aujourd'hui ».
              </InfoTip>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(MEAL_DISTRIBUTION_PRESETS) as MealDistribution[]).map((key) => {
                const meta = MEAL_DISTRIBUTION_PRESETS[key];
                const active = mealDistribution === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDistribution(key)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 rounded-md border p-2.5 text-left transition-colors',
                      active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'border-[var(--border)] hover:bg-[var(--bg-subtle)]'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{meta.emoji}</span>
                      <span className="text-sm font-medium">{meta.label}</span>
                    </div>
                    <span className="text-[10px] muted leading-tight">{meta.description}</span>
                    <span className="text-[10px] muted font-mono">
                      {Object.values(meta.shares).filter((s) => s > 0).join('/')} %
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================= MODE D'OPTIMISATION ================= */}
          <section>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider muted mb-2">
              Précision de l'optimiseur
              <InfoTip>
                Règle la tolérance d'écart à la cible. 95 % des utilisateurs restent
                en <strong>Normal</strong>. Le mode <strong>Strict</strong> sert aux
                athlètes en prépa, <strong>Souple</strong> aux débutants.
              </InfoTip>
            </div>
            <div className="grid gap-2">
              {(['strict', 'normal', 'souple'] as OptimizerMode[]).map((m) => {
                const info = OPTIMIZER_MODES[m];
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateSettings({ optimizerMode: m })}
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
            </div>
          </section>

          {/* ================= SUGGESTIONS ================= */}
          <section>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md border hover:bg-[var(--bg-subtle)] transition-colors">
              <input
                type="checkbox"
                checked={suggestComplements}
                onChange={(e) => updateSettings({ suggestComplements: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Lightbulb size={14} className="text-amber-500" />
                  Proposer des aliments complémentaires
                </div>
                <div className="text-xs muted mt-0.5">
                  Si activé (par défaut), après optim l'app suggère des aliments
                  à ajouter pour combler un éventuel déficit. Décoche pour juste
                  <em> ajuster les quantités</em> sans ajouter de nouveaux items.
                </div>
              </div>
            </label>
          </section>
        </div>
      )}
    </div>
  );
}
