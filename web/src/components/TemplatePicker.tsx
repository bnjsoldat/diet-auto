import { useEffect } from 'react';
import { AlertTriangle, Trash2, User, X } from 'lucide-react';
import { PLAN_TEMPLATES, type PlanTemplate } from '@/lib/templates';
import { useCustomTemplates } from '@/store/useCustomTemplates';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (tpl: PlanTemplate) => void;
  /** Si vrai, afficher un avertissement "va remplacer le plan actuel". */
  willReplace: boolean;
}

export function TemplatePicker({ open, onClose, onPick, willReplace }: Props) {
  const customs = useCustomTemplates((s) => s.templates);
  const removeCustom = useCustomTemplates((s) => s.remove);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl card p-5 my-6 animate-slide-down" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">Charger un plan pré-fait</h2>
            <p className="text-sm muted">
              Un squelette de journée prêt à l'emploi. Tu pourras éditer et optimiser après.
            </p>
          </div>
          <button onClick={onClose} className="muted hover:text-[var(--text)]" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {willReplace && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <div>
              Le plan du jour contient déjà des aliments. Charger un template{' '}
              <strong>remplacera complètement</strong> la journée en cours.
            </div>
          </div>
        )}

        {/* Modèles perso d'abord (plus pertinents pour l'utilisateur) */}
        {customs.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider muted mb-2 flex items-center gap-1">
              <User size={11} /> Mes modèles
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {customs.map((tpl) => (
                <div key={tpl.id} className="relative group">
                  <button
                    type="button"
                    className="w-full text-left p-4 rounded-md border hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                    onClick={() => {
                      onPick(tpl);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" aria-hidden>
                        {tpl.emoji}
                      </span>
                      <h3 className="font-semibold truncate">{tpl.label}</h3>
                    </div>
                    <p className="text-xs muted mt-1.5 line-clamp-2">{tpl.description}</p>
                    <div className="mt-2 text-[11px] muted">
                      {tpl.meals.length} repas ·{' '}
                      {tpl.meals.reduce((acc, m) => acc + m.items.length, 0)} aliments
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer le modèle « ${tpl.label} » ?`)) removeCustom(tpl.id);
                    }}
                    className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded opacity-0 group-hover:opacity-100 muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-opacity"
                    title="Supprimer ce modèle"
                    aria-label={`Supprimer le modèle ${tpl.label}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modèles par défaut */}
        <div className="mt-4">
          {customs.length > 0 && (
            <div className="text-xs font-semibold uppercase tracking-wider muted mb-2">Modèles par défaut</div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {PLAN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className="text-left p-4 rounded-md border hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                onClick={() => {
                  onPick(tpl);
                  onClose();
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>
                    {tpl.emoji}
                  </span>
                  <h3 className="font-semibold">{tpl.label}</h3>
                </div>
                <p className="text-xs muted mt-1.5">{tpl.description}</p>
                <div className="mt-2 text-[11px] muted">
                  {tpl.meals.length} repas · {tpl.meals.reduce((acc, m) => acc + m.items.length, 0)} aliments
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
