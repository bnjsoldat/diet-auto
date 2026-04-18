import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChefHat,
  Copy,
  Plus,
  Save,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useRecipes } from '@/store/useRecipes';
import { FoodSearch } from '@/components/FoodSearch';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import type { Recipe, RecipeIngredient } from '@/types';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import {
  buildRecipeShareUrl,
  clearRecipeFromLocation,
  readRecipeFromLocation,
} from '@/lib/shareRecipe';

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
  const [draftSteps, setDraftSteps] = useState<string[]>([]);
  const [shareModal, setShareModal] = useState<Recipe | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  /**
   * Écoute les URL #recipe=… pour importer une recette partagée. On
   * nettoie le hash après acceptation ou refus pour que recharger la
   * page ne propose pas l'import une deuxième fois.
   */
  useEffect(() => {
    const shared = readRecipeFromLocation();
    if (!shared || !profile) return;
    const ok = window.confirm(
      `Importer la recette partagée « ${shared.nom} » (${shared.ingredients.length} ingrédients${shared.etapes ? `, ${shared.etapes.length} étapes` : ''}) dans tes recettes ?`
    );
    clearRecipeFromLocation();
    if (!ok) return;
    create(shared.nom, shared.ingredients, shared.etapes);
  }, [profile, create]);

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
    setDraftSteps([]);
  }

  function startEdit(r: Recipe) {
    setEditing(r);
    setDraftName(r.nom);
    setDraftIngredients(r.ingredients.map((i) => ({ ...i })));
    setDraftSteps(r.etapes ? [...r.etapes] : []);
  }

  function cancel() {
    setEditing(null);
    setDraftName('');
    setDraftIngredients([]);
    setDraftSteps([]);
  }

  function save() {
    if (!draftName.trim() || draftIngredients.length === 0) return;
    const cleanSteps = draftSteps.map((s) => s.trim()).filter(Boolean);
    if (editing && editing.id) {
      update(editing.id, {
        nom: draftName.trim(),
        ingredients: draftIngredients,
        etapes: cleanSteps.length > 0 ? cleanSteps : undefined,
      });
    } else {
      create(draftName, draftIngredients, cleanSteps.length > 0 ? cleanSteps : undefined);
    }
    cancel();
  }

  function updateIngredient(idx: number, patch: Partial<RecipeIngredient>) {
    setDraftIngredients((list) => list.map((i, k) => (k === idx ? { ...i, ...patch } : i)));
  }

  function removeIngredient(idx: number) {
    setDraftIngredients((list) => list.filter((_, k) => k !== idx));
  }

  function addStep() {
    setDraftSteps((list) => [...list, '']);
  }

  function updateStep(idx: number, value: string) {
    setDraftSteps((list) => list.map((s, k) => (k === idx ? value : s)));
  }

  function removeStep(idx: number) {
    setDraftSteps((list) => list.filter((_, k) => k !== idx));
  }

  function moveStep(idx: number, dir: -1 | 1) {
    setDraftSteps((list) => {
      const ni = idx + dir;
      if (ni < 0 || ni >= list.length) return list;
      const next = [...list];
      [next[idx], next[ni]] = [next[ni], next[idx]];
      return next;
    });
  }

  async function shareRecipe(r: Recipe) {
    const url = buildRecipeShareUrl(r);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & {
          share: (data: { title: string; text: string; url: string }) => Promise<void>;
        }).share({
          title: `Recette : ${r.nom}`,
          text: `Voici une recette que je te partage :`,
          url,
        });
        return;
      } catch {
        /* annulé → fallback modal */
      }
    }
    setShareModal(r);
    setShareCopied(false);
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
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Mes recettes</h1>
          <p className="muted text-sm mt-1">
            Sauvegarde tes plats habituels (ex : Bolognaise, smoothie matin…) avec ingrédients et
            étapes. Ajoute-les en 1 clic dans un repas, partage-les par lien.
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
                      aria-label={`Quantité pour ${ing.nom}`}
                    />
                    <span className="text-xs muted">g</span>
                    <span className="text-xs muted w-16 text-right tabular-nums">{kcal} kcal</span>
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="h-7 w-7 grid place-items-center rounded muted hover:text-red-600"
                      title="Retirer"
                      aria-label={`Retirer ${ing.nom}`}
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

          {/* Étapes de préparation — optionnelles */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Étapes de préparation (optionnel)</label>
              <button type="button" className="btn-outline h-7 px-2 text-xs" onClick={addStep}>
                <Plus size={12} /> Ajouter
              </button>
            </div>
            {draftSteps.length === 0 ? (
              <p className="text-xs muted py-3 text-center border border-dashed rounded-md">
                Décris les étapes de préparation pour retrouver ta recette facilement.
              </p>
            ) : (
              <ol className="grid gap-2">
                {draftSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="flex flex-col gap-0.5 mt-1">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, -1)}
                        disabled={idx === 0}
                        className="h-4 w-4 grid place-items-center rounded muted hover:text-[var(--text)] disabled:opacity-30"
                        title="Remonter"
                        aria-label={`Remonter l'étape ${idx + 1}`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 1)}
                        disabled={idx === draftSteps.length - 1}
                        className="h-4 w-4 grid place-items-center rounded muted hover:text-[var(--text)] disabled:opacity-30"
                        title="Descendre"
                        aria-label={`Descendre l'étape ${idx + 1}`}
                      >
                        ▼
                      </button>
                    </div>
                    <span className="shrink-0 h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-semibold grid place-items-center mt-0.5">
                      {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      className="input flex-1 min-h-[2.5rem]"
                      value={step}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      placeholder={`Étape ${idx + 1}…`}
                    />
                    <button
                      onClick={() => removeStep(idx)}
                      className="h-7 w-7 grid place-items-center rounded muted hover:text-red-600 mt-0.5"
                      title="Retirer cette étape"
                      aria-label={`Retirer l'étape ${idx + 1}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>

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
        <EmptyState
          icon={BookOpen}
          title="Aucune recette enregistrée"
          description={
            <>
              Groupe plusieurs aliments en une seule entrée (ex : <em>Salade poulet-quinoa</em>)
              pour les ajouter en un clic à n'importe quel repas. Tu peux aussi noter les
              étapes de préparation et partager la recette par lien.
            </>
          }
          cta={
            <button className="btn-primary" onClick={startNew}>
              <Plus size={14} /> Créer ma première recette
            </button>
          }
        />
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
                      {r.etapes && r.etapes.length > 0 && (
                        <> · {r.etapes.length} étape{r.etapes.length > 1 ? 's' : ''}</>
                      )}
                    </p>
                    <p className="text-xs mt-1 tabular-nums">
                      <span className="muted">Totaux : </span>
                      {formatNumber(t.kcal)} kcal · P {formatNumber(t.prot)} · G{' '}
                      {formatNumber(t.gluc)} · L {formatNumber(t.lip)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <button
                      className="btn-outline h-8 px-2"
                      onClick={() => startEdit(r)}
                      title="Modifier"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => shareRecipe(r)}
                      className="h-8 w-8 grid place-items-center rounded-md muted hover:bg-[var(--bg-subtle)]"
                      title="Partager par lien"
                      aria-label={`Partager la recette ${r.nom}`}
                    >
                      <Share2 size={13} />
                    </button>
                    <button
                      onClick={() => duplicate(r.id)}
                      className="h-8 w-8 grid place-items-center rounded-md muted hover:bg-[var(--bg-subtle)]"
                      title="Dupliquer"
                      aria-label={`Dupliquer ${r.nom}`}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la recette "${r.nom}" ?`)) remove(r.id);
                      }}
                      className="h-8 w-8 grid place-items-center rounded-md muted hover:text-red-600"
                      title="Supprimer"
                      aria-label={`Supprimer ${r.nom}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="text-xs muted cursor-pointer">
                    Voir les ingrédients {r.etapes && r.etapes.length > 0 && '& les étapes'}
                  </summary>
                  <div className="mt-2 grid gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider muted mb-1">
                        Ingrédients
                      </div>
                      <ul className="grid gap-0.5 text-xs">
                        {r.ingredients.map((i, k) => (
                          <li key={k} className={cn('flex justify-between')}>
                            <span>{i.nom}</span>
                            <span className="tabular-nums muted">{i.quantite} g</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {r.etapes && r.etapes.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider muted mb-1">
                          Préparation
                        </div>
                        <ol className="grid gap-1.5 text-sm">
                          {r.etapes.map((step, k) => (
                            <li key={k} className="flex gap-2 items-start">
                              <span className="shrink-0 h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold grid place-items-center mt-0.5">
                                {k + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de partage fallback (quand navigator.share n'est pas dispo) */}
      {shareModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShareModal(null)}
        >
          <div className="card p-5 w-full max-w-md animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">Partager « {shareModal.nom} »</h3>
                <p className="text-xs muted mt-0.5">
                  Copie le lien et envoie-le. Le destinataire verra une proposition d'import
                  direct dans ses recettes.
                </p>
              </div>
              <button
                className="h-7 w-7 grid place-items-center rounded muted hover:bg-[var(--bg-subtle)]"
                onClick={() => setShareModal(null)}
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-xs font-mono"
                readOnly
                value={buildRecipeShareUrl(shareModal)}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                className="btn-primary shrink-0"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(buildRecipeShareUrl(shareModal));
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  } catch {
                    /* silent */
                  }
                }}
              >
                {shareCopied ? 'Copié ✓' : 'Copier'}
              </button>
            </div>
          </div>
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
