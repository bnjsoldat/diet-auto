import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Wand2, CalendarRange, BookOpen, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Onboarding 4-étapes modal au tout premier usage de l'app.
 * - Se déclenche si localStorage 'onboardingSeen' est absent.
 * - 4 cartes avec icône + titre + description des features clés.
 * - Skip en haut à droite, progression en bas.
 *
 * Design volontairement léger : on ne fait pas un tour "highlight
 * d'éléments du DOM" (trop fragile) mais une série d'écrans
 * illustratifs qui plantent le décor en 30 secondes.
 */
const KEY = 'onboardingSeen';

interface Step {
  icon: typeof Sparkles;
  title: string;
  description: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Bienvenue sur Ma Diét',
    description:
      'Choisis tes aliments, l\u2019optimiseur ajuste les quantités pour atteindre ta cible calorique. Gratuit, sync multi-appareil, 100 % privé.',
    accent: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600',
  },
  {
    icon: Wand2,
    title: 'L\u2019optimiseur fait le travail',
    description:
      'Ajoute 3-5 aliments, clique sur Optimiser. En quelques millisecondes, les grammages sont ajustés automatiquement pour coller à tes besoins. Il peut même ajouter ce qui manque.',
    accent: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600',
  },
  {
    icon: CalendarRange,
    title: 'Suis ta progression',
    description:
      'Vue semaine, historique, courbe des calories et des macros, copier-coller de journées. Tu vois ton évolution sur 7, 30 ou 90 jours.',
    accent: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600',
  },
  {
    icon: BookOpen,
    title: 'Tes propres recettes',
    description:
      'Enregistre tes plats habituels (ingrédients + étapes), ajoute-les en un clic dans un repas. Partage une recette avec un ami via un simple lien.',
    accent: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(KEY);
      if (!seen) setOpen(true);
    } catch {
      /* localStorage indispo (private mode très strict) → on montre pas */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md card p-6 sm:p-8 animate-slide-down">
        {/* Header : skip à droite */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="text-xs muted hover:text-[var(--text)] underline"
          >
            Passer
          </button>
        </div>

        {/* Icône */}
        <div className="mt-2 flex justify-center">
          <div
            className={cn(
              'h-16 w-16 rounded-full grid place-items-center transition-colors',
              s.accent
            )}
          >
            <s.icon size={28} />
          </div>
        </div>

        {/* Titre + description */}
        <h2 className="mt-5 text-xl font-bold text-center">{s.title}</h2>
        <p className="mt-3 text-sm muted text-center leading-relaxed">{s.description}</p>

        {/* Indicateurs de progression */}
        <div className="mt-6 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-6 bg-emerald-600' : 'w-1.5 bg-[var(--border)]'
              )}
              aria-label={`Étape ${i + 1} sur ${STEPS.length}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            className={cn(
              'btn-outline h-10 px-3',
              isFirst && 'invisible'
            )}
          >
            <ChevronLeft size={14} /> Précédent
          </button>

          {isLast ? (
            <button type="button" onClick={dismiss} className="btn-primary h-10 px-4">
              <Star size={14} /> Commencer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="btn-primary h-10 px-4"
            >
              Suivant <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Réinitialise l'onboarding (pour tests / après clear de données). */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
