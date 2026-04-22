import { useEffect, useState } from 'react';
import { LayoutTemplate, Wand2, X } from 'lucide-react';

/**
 * Bannière d'onboarding sur /today pour les nouveaux utilisateurs.
 *
 * Apparaît uniquement :
 *  - si le plan du jour est VIDE (pas encore d'aliments)
 *  - ET si l'user n'a jamais vu la bannière (localStorage)
 *
 * Disparaît définitivement dès qu'il clique "Voir les modèles" ou la
 * croix. L'objectif : guider en 30 s le 1er parcours critique
 * (charger modèle → optimiser) pour maximiser le taux d'activation.
 */
const KEY = 'welcomeHintDismissed';

interface Props {
  /** True si le plan du jour a déjà au moins un aliment (masque la bannière). */
  hasItems: boolean;
  /** Callback appelé quand l'user clique « Voir les modèles » → ouvre le TemplatePicker. */
  onOpenTemplates: () => void;
}

export function WelcomeHint({ hasItems, onOpenTemplates }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasItems) return; // plan déjà rempli → pas besoin de guidance
    try {
      const dismissed = localStorage.getItem(KEY);
      if (!dismissed) setVisible(true);
    } catch {
      /* localStorage indispo (private mode strict) → on ne montre pas */
    }
  }, [hasItems]);

  // Cache automatiquement dès qu'il y a un plan
  useEffect(() => {
    if (hasItems && visible) {
      setVisible(false);
      try {
        localStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [hasItems, visible]);

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function handleOpenAndDismiss() {
    dismiss();
    onOpenTemplates();
  }

  if (!visible) return null;

  return (
    <div className="card p-4 mb-5 bg-gradient-to-br from-emerald-50/80 dark:from-emerald-950/40 to-transparent border-emerald-200 dark:border-emerald-900 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden>
          👋
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base">Commence ici — 30 secondes chrono</h2>
          <ol className="mt-2 space-y-1 text-sm muted">
            <li>
              <strong className="text-[var(--text)]">1.</strong> Clique{' '}
              <strong className="text-[var(--text)]">« Mes plans »</strong> pour choisir un
              modèle déjà tout prêt (équilibré, sportif, perte, etc.)
            </li>
            <li>
              <strong className="text-[var(--text)]">2.</strong> Le plan se remplit avec des
              aliments. Remplace ce que tu n'aimes pas.
            </li>
            <li>
              <strong className="text-[var(--text)]">3.</strong> Clique{' '}
              <strong className="text-emerald-600">« Optimiser »</strong> — l'algo ajuste les
              grammages pour taper pile ta cible macros.
            </li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-sm" onClick={handleOpenAndDismiss}>
              <LayoutTemplate size={14} /> Voir les modèles
            </button>
            <span className="inline-flex items-center gap-1 text-xs muted">
              <Wand2 size={12} className="text-emerald-600" /> L'algo tape pile ta cible en 1 s
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="h-7 w-7 grid place-items-center rounded hover:bg-[var(--bg-subtle)] shrink-0"
          aria-label="Masquer"
          title="Je connais déjà, masquer ce guide"
        >
          <X size={14} className="muted" />
        </button>
      </div>
    </div>
  );
}
