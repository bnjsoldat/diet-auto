import { useEffect, useRef, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRecipes } from '@/store/useRecipes';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import type { Recipe } from '@/types';
import { cn, formatNumber } from '@/lib/utils';

interface Props {
  onPick: (recipe: Recipe, portionRatio: number) => void;
}

/**
 * Petit bouton qui ouvre une popup listant les recettes de l'utilisateur.
 * Cliquer sur une recette l'ajoute (avec portion 1x par défaut).
 */
export function RecipePicker({ onPick }: Props) {
  const recipes = useRecipes((s) => s.recipes);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5 h-10 px-3 rounded-md border text-sm whitespace-nowrap transition-colors',
          'hover:bg-[var(--bg-subtle)]',
          recipes.length === 0 && 'muted'
        )}
        onClick={() => setOpen((o) => !o)}
        title={recipes.length ? 'Ajouter une recette' : 'Tu n’as pas encore de recette'}
      >
        <ChefHat size={14} />
        <span className="hidden sm:inline">Recette</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-80 max-h-96 overflow-auto rounded-md border bg-[var(--card)] shadow-lg">
          {recipes.length === 0 ? (
            <div className="p-4 text-sm muted">
              Tu n'as pas encore de recette.{' '}
              <Link to="/recipes" className="underline text-emerald-600">
                Créer ma première
              </Link>
              .
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold muted uppercase tracking-wide border-b flex items-center justify-between">
                <span>Mes recettes</span>
                <Link to="/recipes" className="text-[10px] text-emerald-600 hover:underline">
                  Gérer
                </Link>
              </div>
              {recipes.map((r) => {
                const t = totalsForItems(
                  r.ingredients.map((i) => ({ id: '', nom: i.nom, quantite: i.quantite, verrou: false })),
                  foodsByName
                );
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      onPick(r, 1);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 border-b last:border-0 hover:bg-[var(--bg-subtle)]"
                  >
                    <div className="text-sm font-medium truncate">{r.nom}</div>
                    <div className="text-xs muted truncate">
                      {r.ingredients.length} ingrédients · {r.portionG} g ·{' '}
                      {formatNumber(t.kcal)} kcal · P {formatNumber(t.prot)} · G{' '}
                      {formatNumber(t.gluc)} · L {formatNumber(t.lip)}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
