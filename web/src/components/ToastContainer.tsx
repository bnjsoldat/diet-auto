import { X } from 'lucide-react';
import { useToast } from '@/store/useToast';
import { cn } from '@/lib/utils';

/**
 * Affiche la pile de toasts actuellement actifs, en bas de l'écran
 * (au-dessus de la bottom bar mobile). Les toasts glissent du bas
 * et disparaissent seuls après leur durée ou au clic sur une action.
 */
export function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-50 flex flex-col gap-2 w-[min(90vw,420px)] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-lg border shadow-lg backdrop-blur-md px-4 py-3 flex items-center gap-3 animate-slide-down',
            t.tone === 'danger'
              ? 'bg-red-50/95 dark:bg-red-950/80 border-red-200 dark:border-red-900 text-red-900 dark:text-red-100'
              : t.tone === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100'
                : 'bg-[var(--card)]/95 border-[var(--border)]'
          )}
        >
          <span className="flex-1 text-sm">{t.message}</span>
          {t.actionLabel && t.onAction && (
            <button
              type="button"
              onClick={() => {
                t.onAction?.();
                dismiss(t.id);
              }}
              className="text-sm font-medium underline hover:no-underline shrink-0"
            >
              {t.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="h-6 w-6 grid place-items-center rounded hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
