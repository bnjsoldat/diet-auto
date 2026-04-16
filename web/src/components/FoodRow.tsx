import { Lock, LockOpen, Star, Trash2 } from 'lucide-react';
import { foodsByName } from '@/lib/foods';
import { useFavorites } from '@/store/useFavorites';
import type { MealFoodItem } from '@/types';
import { cn, formatNumber } from '@/lib/utils';

interface Props {
  item: MealFoodItem;
  onUpdate: (patch: Partial<MealFoodItem>) => void;
  onRemove: () => void;
}

export function FoodRow({ item, onUpdate, onRemove }: Props) {
  const food = foodsByName.get(item.nom.toLowerCase());
  const toggleFav = useFavorites((s) => s.toggle);
  const isFav = useFavorites((s) => s.favorites.includes(item.nom));

  const kcal = food ? (item.quantite * food.kcal) / 100 : 0;
  const prot = food ? (item.quantite * food.prot) / 100 : 0;
  const gluc = food ? (item.quantite * food.gluc) / 100 : 0;
  const lip = food ? (item.quantite * food.lip) / 100 : 0;

  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_72px_auto_auto] gap-2 items-center py-2 border-b last:border-0',
        item.verrou && 'bg-amber-50/50 dark:bg-amber-950/20 -mx-4 px-4'
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleFav(item.nom)}
            className={cn(
              'h-5 w-5 grid place-items-center rounded hover:text-amber-500',
              isFav ? 'text-amber-500' : 'muted'
            )}
            title={isFav ? 'Retirer des favoris' : 'Mettre en favori'}
          >
            <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <span className="text-sm truncate">{item.nom}</span>
        </div>
        <div className="text-xs muted">
          {formatNumber(kcal)} kcal · P {prot.toFixed(1)} · G {gluc.toFixed(1)} · L {lip.toFixed(1)}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <input
          type="number"
          value={item.quantite}
          min={0}
          max={1000}
          step={5}
          onChange={(e) => onUpdate({ quantite: Math.max(0, Number(e.target.value)) })}
          className="input h-8 w-16 px-2 text-right text-sm"
          aria-label="Quantité en grammes"
        />
        <span className="text-xs muted">g</span>
      </div>

      <button
        type="button"
        onClick={() => onUpdate({ verrou: !item.verrou })}
        className={cn(
          'h-8 w-8 grid place-items-center rounded-md border transition-colors',
          item.verrou
            ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400'
            : 'muted hover:bg-[var(--bg-subtle)]'
        )}
        title={item.verrou ? 'Verrouillé : quantité fixe' : 'Verrouiller la quantité'}
      >
        {item.verrou ? <Lock size={14} /> : <LockOpen size={14} />}
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="h-8 w-8 grid place-items-center rounded-md muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
