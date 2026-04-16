import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChefHat, Copy, Plus, Save, Trash2, X } from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useRecipes } from '@/store/useRecipes';
import { FoodSearch } from '@/components/FoodSearch';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import type { Recipe, RecipeIngredient } from '@/types';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Recipes() {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.getActive());
  const profilesLoaded = useProfile((s) => s.loaded);
  const recipes = useRecipes((s) => s.recipes);
  const create = useRecipes((s) => s.create);
  const update = useRecipes((s) => s.update);
  const remove = useRecipes((s) => s.remove);
  const duplicate = useRecipes((s) => s.duplicate);

  const [editing, setEditing] = useState<Recipe | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftIngredients, setDraftIngredients] = useState<RecipeIngredient[]>([]);

  if (profilesLoaded && !profile) {
    navigate('/setup');
    return null;
  }
  if (!profile) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center muted">Chargement…</div>;
  }

  function startNew() {
    setEditing({ id: '', nom: '', ingredients: [], portionG: 0, createdAt: 0, updatedAt: 0 });
    setDraftName('');
    setDraftIngredients([]);
  }

  function startEdit(r: Recipe) {
    setEditing(r);
    setDraftName(r.nom);
    setDraftIngredients(r.ingredients.map((i) => ({ ...i })));
  }

  function cancel() {
    setEditing(null);
    setDraftName('');
    setDraftIngredients([]);
  }

  function save() {
    if (!draftName.trim() || draftIngredients.length === 0) return;
    if (editing && editing.id) {
      update(editing.id, { nom: draftName.trim(), ingredients: draftIngredients });
    } else {
      create(draftName, draftIngredients);
    }
    cancel();
  }

  function updateIngredient(idx: number, patch: Partial<RecipeIngredient>) {
    setDraftIngredients((list) => list.map((i, k) => (k === idx ? { ...i, ...patch } : i)));
  }

  function removeIngredient(idx: number) {
    setDraftIngredients((list) => list.filter((_, k) => k !== idx));
  }

  const draftTotals = useMemo(() => {
    if (!editing) return null;
    return totalsForItems(
      draftIngredients.map((i) => ({ id: '', nom: i.nom, quantite: i.quantite, verrou: false })),
      foodsByName
    );
  }, [editing, draftIngredients]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 muted text-xs font-semibold uppercase tracking-wider">
            <ChefHat size={12} /> Mes recettes
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Recettes composées</h1>
          <p className="muted text-sm mt-1">
            Sauvegarde tes plats habituels (ex : Bolognaise, smoothie matin…) pour les ajouter en 1
            clic dans un repas.
          </p>
        </div>
        {!editing && (
          <button className="btn-primary" onClick={startNew}>
            <Plus size={14} /> Nouvelle recette
          </button>
        )}
      </div>

      {editing ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing.id ? 'Modifier' : 'Nouvelle recette'}</h2>
            <button className="btn-outline" onClick={cancel}>
              <X size={14} /> Annuler
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Nom de la recette</label>
            <input
              className="input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="ex : Bolognaise maison, smoothie protéiné…"
              maxLength={60}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Ajouter un ingrédient</label>
            <FoodSearch
              onSelect={(food) => {
                const def = food.unites?.[0]?.g ?? 100;
                setDraftIngredients((list) => [...list, { nom: food.nom, quantite: def }]);
              }}
              placeholder="Rechercher un aliment à ajouter…"
            />
          </div>

          {draftIngredients.length === 0 ? (
            <p className="text-sm muted py-6 text-center border-2 border-dashed rounded-md">
              Ajoute tes ingrédients via la recherche ci-dessus.
            </p>
          ) : (
            <div className="grid gap-1 mb-4">
              {draftIngredients.map((ing, idx) => {
                const food = foodsByName.get(ing.nom.toLowerCase());
                const kcal = food ? Math.round((ing.quantite * food.kcal) / 100) : 0;
                return (
                  <div key={idx} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                    <span className="flex-1 text-sm truncate">{ing.nom}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={ing.quantite > 0 ? ing.quantite : ''}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        const n = v === '' ? 0 : Number(v);
                        updateIngredient(idx, { quantite: Number.isFinite(n) ? Math.max(0, n) : 0 });
                      }}
                      min={0}
                      max={5000}
                      step={5}
                      className="input h-8 w-20 px-2 text-right text-sm"
                    />
                    <span className="text-xs muted">g</span>
                    <span className="text-xs muted w-16 text-right tabular-nums">{kcal} kcal</span>
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="h-7 w-7 grid place-items-center rounded muted hover:text-red-600"
                      title="Retirer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {draftTotals && draftIngredients.length > 0 && (
            <div className="mb-4 p-3 rounded-md bg-[var(--bg-subtle)] grid grid-cols-4 gap-2 text-sm">
              <Stat label="kcal" value={formatNumber(draftTotals.kcal)} />
              <Stat label="P" value={formatNumber(draftTotals.prot) + ' g'} />
              <Stat label="G" value={formatNumber(draftTotals.gluc) + ' g'} />
              <Stat label="L" value={formatNumber(draftTotals.lip) + ' g'} />
            </div>
          )}

          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={save}
              disabled={!draftName.trim() || draftIngredients.length === 0}
            >
              <Save size={14} /> {editing.id ? 'Enregistrer' : 'Créer la recette'}
            </button>
          </div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
          <p className="muted">
            Tu n'as aucune recette pour l'instant. Clique sur <strong>Nouvelle recette</strong> pour
            en créer une — tu pourras l'ajouter ensuite à n'importe quel repas en 1 clic.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {recipes.map((r) => {
            const t = totalsForItems(
              r.ingredients.map((i) => ({ id: '', nom: i.nom, quantite: i.quantite, verrou: false })),
              foodsByName
            );
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{r.nom}</h3>
                    <p className="text-xs muted">
                      {r.ingredients.length} ingrédient{r.ingredients.length > 1 ? 's' : ''} · portion{' '}
                      {r.portionG} g
                    </p>
                    <p className="text-xs mt-1 tabular-nums">
                      <span className="muted">Totaux : </span>
                      {formatNumber(t.kcal)} kcal · P {formatNumber(t.prot)} · G{' '}
                      {formatNumber(t.gluc)} · L {formatNumber(t.lip)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn-outline h-8 px-2"
                      onClick={() => startEdit(r)}
                      title="Modifier"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => duplicate(r.id)}
                      className="h-8 w-8 grid place-items-center rounded-md muted hover:bg-[var(--bg-subtle)]"
                      title="Dupliquer"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la recette "${r.nom}" ?`)) remove(r.id);
                      }}
                      className="h-8 w-8 grid place-items-center rounded-md muted hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="text-xs muted cursor-pointer">Voir les ingrédients</summary>
                  <ul className="mt-1 grid gap-0.5 text-xs">
                    {r.ingredients.map((i, k) => (
                      <li key={k} className={cn('flex justify-between')}>
                        <span>{i.nom}</span>
                        <span className="tabular-nums muted">{i.quantite} g</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs muted">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
