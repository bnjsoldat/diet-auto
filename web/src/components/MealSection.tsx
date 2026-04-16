import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Plus, Trash2 } from 'lucide-react';
import type { Meal, MealFoodItem } from '@/types';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import { FoodRow } from './FoodRow';
import { FoodSearch } from './FoodSearch';
import { useDayPlan } from '@/store/useDayPlan';
import { cn, formatNumber } from '@/lib/utils';

interface Props {
  meal: Meal;
  canRemove: boolean;
}

export function MealSection({ meal, canRemove }: Props) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nomEdit, setNomEdit] = useState(meal.nom);

  const updateItem = useDayPlan((s) => s.updateItem);
  const removeItem = useDayPlan((s) => s.removeItem);
  const addFood = useDayPlan((s) => s.addFood);
  const renameMeal = useDayPlan((s) => s.renameMeal);
  const removeMeal = useDayPlan((s) => s.removeMeal);

  const totals = totalsForItems(meal.items, foodsByName);

  function handleUpdate(itemId: string, patch: Partial<MealFoodItem>) {
    updateItem(meal.id, itemId, patch);
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {editing ? (
            <input
              autoFocus
              className="input h-8 max-w-[260px]"
              value={nomEdit}
              onChange={(e) => setNomEdit(e.target.value)}
              onBlur={() => {
                renameMeal(meal.id, nomEdit.trim() || meal.nom);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setNomEdit(meal.nom);
                  setEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="font-semibold">{meal.nom}</h3>
          )}
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="muted hidden sm:inline">
            {formatNumber(totals.kcal)} kcal · P {totals.prot.toFixed(1)} · G{' '}
            {totals.gluc.toFixed(1)} · L {totals.lip.toFixed(1)}
          </span>
          <span className="muted sm:hidden font-medium">{formatNumber(totals.kcal)} kcal</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="h-7 w-7 grid place-items-center rounded muted hover:bg-[var(--bg-subtle)]"
            title="Renommer le repas"
          >
            <Edit2 size={13} />
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Supprimer le repas « ${meal.nom} » ?`)) removeMeal(meal.id);
              }}
              className="h-7 w-7 grid place-items-center rounded muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Supprimer le repas"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className={cn(!open && 'hidden')}>
        {meal.items.length > 0 && (
          <div className="mb-3">
            {meal.items.map((item) => (
              <FoodRow
                key={item.id}
                item={item}
                onUpdate={(patch) => handleUpdate(item.id, patch)}
                onRemove={() => removeItem(meal.id, item.id)}
              />
            ))}
          </div>
        )}

        <FoodSearch
          onSelect={(food) => addFood(meal.id, food.nom, 100)}
          placeholder={`Ajouter un aliment dans ${meal.nom.toLowerCase()}…`}
        />

        {meal.items.length === 0 && (
          <p className="text-xs muted mt-2 flex items-center gap-1">
            <Plus size={12} /> Ajoute des aliments depuis la recherche ci-dessus
          </p>
        )}
      </div>
    </section>
  );
}
