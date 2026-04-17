import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Bouton d'action principal. */
  cta?: ReactNode;
  /** Ton de l'icône : émeraude par défaut (positif), amber (attention). */
  tone?: 'emerald' | 'amber' | 'slate';
  className?: string;
}

/**
 * État vide cohérent pour toutes les pages. Icône en ovale doux, titre,
 * sous-texte discret et CTA optionnel. Pas de texte brut qui donne l'air
 * abandonné ; toujours suggérer une prochaine action.
 */
export function EmptyState({ icon: Icon, title, description, cta, tone = 'emerald', className }: Props) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
      : tone === 'amber'
      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
      : 'bg-[var(--bg-subtle)] muted';
  return (
    <div
      className={cn(
        'card p-8 sm:p-10 text-center animate-slide-down',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto h-14 w-14 grid place-items-center rounded-full mb-4',
          toneClass
        )}
      >
        <Icon size={24} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <div className="text-sm muted mt-1.5 max-w-sm mx-auto leading-relaxed">{description}</div>
      )}
      {cta && <div className="mt-5 flex justify-center">{cta}</div>}
    </div>
  );
}
