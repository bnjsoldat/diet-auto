import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  /** Texte ou JSX expliquant la métrique. */
  children: ReactNode;
  /** Taille de l'icône (par défaut 11 px, discret à côté d'un label). */
  size?: number;
  /** Classe supplémentaire pour le bouton. */
  className?: string;
  /** Position préférée du popover. */
  position?: 'top' | 'bottom';
}

/**
 * Petit point d'interrogation (i) qui ouvre un tooltip au clic ou au survol.
 * Le tooltip se ferme en cliquant ailleurs ou sur Escape.
 *
 * Pourquoi pas juste `title=""` HTML natif ? Parce qu'il ne s'affiche pas sur
 * mobile (pas de hover), il n'accepte pas de formatage, et il est très lent
 * à apparaître (~1 seconde). Cette version est immédiate, multi-plateforme,
 * et permet d'expliquer des concepts comme "Harris-Benedict" en 2 phrases.
 */
export function InfoTip({ children, size = 11, className, position = 'top' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center h-4 w-4 rounded-full muted hover:text-emerald-600 hover:bg-[var(--bg-subtle)] transition-colors"
        aria-label="Informations"
      >
        <Info size={size} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 left-1/2 -translate-x-1/2 w-64 max-w-[calc(100vw-2rem)] rounded-md border bg-[var(--card)] shadow-lg p-3 text-xs leading-relaxed animate-fade-in-up',
            position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          )}
          role="tooltip"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
