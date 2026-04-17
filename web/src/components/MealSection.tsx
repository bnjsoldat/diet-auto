import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Edit2, GripVertical, Plus, ScanBarcode, Trash2 } from 'lucide-react';
import type { Meal, MealFoodItem } from '@/types';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import { FoodRow } from './FoodRow';
import { FoodSearch } from './FoodSearch';
import { RecipePicker } from './RecipePicker';
import { BarcodeScanner } from './BarcodeScanner';
import { useDayPlan } from '@/store/useDayPlan';
import { cn, formatNumber } from '@/lib/utils';
import { emojiForMeal } from '@/lib/mealEmoji';

interface Props {
  meal: Meal;
  canRemove: boolean;
  /** Callbacks de drag & drop pour réordonner les repas. */
  onDragStart?: (mealId: string) => void;
  onDragOver?: (mealId: string) => void;
  onDrop?: (mealId: string) => void;
  isDragTarget?: boolean;
}

export function MealSection({ meal, canRemove, onDragStart, onDragOver, onDrop, isDragTarget }: Props) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nomEdit, setNomEdit] = useState(meal.nom);
  const [scannerOpen, setScannerOpen] = useState(false);

  const updateItem = useDayPlan((s) => s.updateItem);
  const removeItem = useDayPlan((s) => s.removeItem);
  const addFood = useDayPlan((s) => s.addFood);
  const addRecipe = useDayPlan((s) => s.addRecipe);
  const renameMeal = useDayPlan((s) => s.renameMeal);
  const removeMeal = useDayPlan((s) => s.removeMeal);
  const duplicateMeal = useDayPlan((s) => s.duplicateMeal);

  const totals = totalsForItems(meal.items, foodsByName);

  function handleUpdate(itemId: string, patch: Partial<MealFoodItem>) {
    updateItem(meal.id, itemId, patch);
  }

  return (
    <section
      className={cn(
        'card p-4 transition-colors',
        isDragTarget && 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-transparent'
      )}
      onDragOver={
        onDragOver
          ? (e) => {
              e.preventDefault();
              onDragOver(meal.id);
            }
          : undefined
      }
      onDrop={
        onDrop
          ? (e) => {
              e.preventDefault();
              onDrop(meal.id);
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        {onDragStart && (
          <button
            type="button"
            draggable
            onDragStart={() => onDragStart(meal.id)}
            className="muted hover:text-[var(--text)] cursor-grab active:cursor-grabbing touch-none"
            title="Glisser pour réordonner"
            aria-label="Réordonner le repas"
          >
            <GripVertical size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left flex-1"
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
            <h3 className="font-semibold flex items-center gap-1.5">
              <span aria-hidden className="text-base leading-none">
                {emojiForMeal(meal.nom)}
              </span>
              {meal.nom}
            </h3>
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              duplicateMeal(meal.id);
            }}
            className="h-7 w-7 grid place-items-center rounded muted hover:bg-[var(--bg-subtle)]"
            title="Dupliquer le repas"
          >
            <Copy size={13} />
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

        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <FoodSearch
              onSelect={(food) => addFood(meal.id, food.nom)}
              placeholder={`Ajouter un aliment dans ${meal.nom.toLowerCase()}…`}
            />
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md border text-sm whitespace-nowrap transition-colors hover:bg-[var(--bg-subtle)]"
            title="Scanner un code-barres"
          >
            <ScanBarcode size={14} />
            <span className="hidden sm:inline">Scan</span>
          </button>
          <RecipePicker onPick={(r, ratio) => addRecipe(meal.id, r, ratio)} />
        </div>

        <BarcodeScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onConfirm={(food, grams) => addFood(meal.id, food.nom, grams)}
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
