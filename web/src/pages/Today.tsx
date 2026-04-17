import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileDown, ListPlus, Sparkles, Wand2 } from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { useSettings } from '@/store/useSettings';
import { calcTargets } from '@/lib/calculations';
import { foods, foodsByName } from '@/lib/foods';
import { optimizeQuantities, totalsForItems } from '@/lib/optimizer';
import { OPTIMIZER_MODES } from '@/lib/constants';
import { suggestComplements } from '@/lib/suggestions';
import { categorieOfFood } from '@/lib/categories';
import { TargetsCard } from '@/components/TargetsCard';
import { MealSection } from '@/components/MealSection';
import { OptimizeDialog } from '@/components/OptimizeDialog';
import { ShareButton } from '@/components/ShareButton';
import type { MealFoodItem, OptimizeResult, OptimizerMode } from '@/types';
import { friendlyDate, todayKey } from '@/lib/utils';

/**
 * Choisit l'id du repas le plus pertinent pour y insérer un aliment
 * d'une catégorie donnée. Un fruit ou un yaourt part en petit-déj ou en
 * collation ; une viande/poisson part au déjeuner/dîner ; les féculents
 * rejoignent le repas qui a déjà un féculent similaire. À défaut, on
 * tombe sur le premier repas du plan.
 */
function pickMealForCategory(
  meals: { id: string; nom: string; items: { nom: string }[] }[],
  cat: string | null
): string {
  const lc = (s: string) => s.toLowerCase();
  const findByPattern = (patt: RegExp) =>
    meals.find((m) => patt.test(lc(m.nom)))?.id;
  // Heuristique simple par catégorie + nom du repas
  if (cat === 'fruits' || cat === 'laitiers' || cat === 'sucres' || cat === 'cereales') {
    return (
      findByPattern(/matin|petit.?d[ée]j|r[ée]veil/) ||
      findByPattern(/collation|go[uû]ter|snack/) ||
      meals[0].id
    );
  }
  if (cat === 'proteines' || cat === 'legumineuses' || cat === 'plats') {
    return (
      findByPattern(/midi|d[ée]jeuner|d[îi]ner|soir|repas 2|repas 3/) ||
      meals[0].id
    );
  }
  if (cat === 'legumes') {
    return (
      findByPattern(/midi|d[ée]jeuner|d[îi]ner|soir|repas 2|repas 3/) ||
      meals[0].id
    );
  }
  if (cat === 'fruits-coque' || cat === 'matieres-grasses' || cat === 'sauces') {
    // Se glisse dans le plus gros repas existant
    let best = meals[0];
    for (const m of meals) if (m.items.length > best.items.length) best = m;
    return best.id;
  }
  return meals[0].id;
}

export function Today() {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.getActive());
  const profilesLoaded = useProfile((s) => s.loaded);

  const ensurePlan = useDayPlan((s) => s.ensurePlan);
  const current = useDayPlan((s) => s.current());
  const addMeal = useDayPlan((s) => s.addMeal);
  const replacePlan = useDayPlan((s) => s.replaceCurrentPlan);

  const optimizerMode = useSettings((s) => s.optimizerMode);
  const updateSettings = useSettings((s) => s.update);

  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [open, setOpen] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);

  useEffect(() => {
    if (profilesLoaded && !profile) {
      navigate('/setup');
    }
  }, [profilesLoaded, profile, navigate]);

  useEffect(() => {
    if (profile) ensurePlan();
  }, [profile, ensurePlan]);

  const targets = useMemo(() => (profile ? calcTargets(profile) : null), [profile]);

  const allItems = useMemo(
    () => (current ? current.meals.flatMap((m) => m.items) : []),
    [current]
  );
  const totals = useMemo(() => totalsForItems(allItems, foodsByName), [allItems]);

  if (!profile || !current || !targets) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center muted">Chargement…</div>
    );
  }

  function handleOptimize() {
    if (!current || !targets) return;
    // Muter en place sur une copie profonde
    const clone = JSON.parse(JSON.stringify(current)) as typeof current;
    const allItemsClone = clone.meals.flatMap((m) => m.items);
    if (allItemsClone.length === 0) {
      alert('Ajoute au moins un aliment avant d\u2019optimiser.');
      return;
    }
    const res = optimizeQuantities(
      allItemsClone,
      foodsByName,
      {
        kcal: targets.kcalCible,
        prot: targets.prot,
        gluc: targets.gluc,
        lip: targets.lip,
      },
      { mode: optimizerMode }
    );
    replacePlan({ ...clone, updatedAt: Date.now() });
    setResult(res);
    setOpen(true);
  }

  /**
   * "Optimiser+" : cycle automatique jusqu'à ce que le plan rentre dans la
   * tolérance du mode actif (max 3 passes). À chaque itération :
   *  1. Optimise les quantités.
   *  2. Si encore hors tolérance, calcule les suggestions, puis insère
   *     chacune dans le repas le plus pertinent selon la catégorie
   *     (déjeuner = plat principal, petit-déj = sucré/fruits/laitiers).
   *  3. Recommence.
   * Le dialogue final montre l'écart résiduel et la liste des ajouts.
   */
  async function handleOptimizePlus() {
    if (!current || !targets || autoBusy) return;
    const clone = JSON.parse(JSON.stringify(current)) as typeof current;
    if (clone.meals.flatMap((m) => m.items).length === 0) {
      alert('Ajoute au moins un aliment avant d\u2019optimiser.');
      return;
    }
    setAutoBusy(true);
    const mode = OPTIMIZER_MODES[optimizerMode];
    const cibles = {
      kcal: targets.kcalCible,
      prot: targets.prot,
      gluc: targets.gluc,
      lip: targets.lip,
    };
    const addedLog: string[] = [];
    let lastRes: OptimizeResult | null = null;

    for (let pass = 0; pass < 3; pass++) {
      const items = clone.meals.flatMap((m) => m.items);
      const res = optimizeQuantities(items, foodsByName, cibles, { mode: optimizerMode });
      lastRes = res;

      const ecart = {
        k: Math.abs((res.apres.kcal - cibles.kcal) / cibles.kcal),
        p: Math.abs((res.apres.prot - cibles.prot) / cibles.prot),
        g: Math.abs((res.apres.gluc - cibles.gluc) / cibles.gluc),
        l: Math.abs((res.apres.lip - cibles.lip) / cibles.lip),
      };
      const ok =
        ecart.k <= mode.tolKcal &&
        ecart.p <= mode.tolMacro &&
        ecart.g <= mode.tolMacro &&
        ecart.l <= mode.tolMacro;
      if (ok) break;

      // Calcule les suggestions sur l'état optimisé courant.
      const sugs = suggestComplements({
        plan: clone,
        totals: res.apres,
        cibles,
        foods,
        poids: { kcal: mode.poidsKcal, macro: mode.poidsMacro },
        tolerance: { kcal: mode.tolKcal, macro: mode.tolMacro },
        max: 2,
      });
      if (sugs.length === 0) break;

      // Insère chaque suggestion dans le meilleur repas pour sa catégorie.
      for (const s of sugs) {
        const cat = categorieOfFood(s.food);
        const targetMeal = pickMealForCategory(clone.meals, cat);
        const newItem: MealFoodItem = {
          id: 'itm_' + Math.random().toString(36).slice(2, 9),
          nom: s.food.nom,
          quantite: s.quantite,
          verrou: false,
        };
        const meal = clone.meals.find((m) => m.id === targetMeal);
        if (meal) {
          meal.items.push(newItem);
          addedLog.push(`${s.food.nom} (${s.quantite} g) → ${meal.nom}`);
        }
      }
    }

    replacePlan({ ...clone, updatedAt: Date.now() });
    setResult(lastRes);
    setOpen(true);
    setAutoBusy(false);
    // Petit log dans le title de la modale en mettant les ajouts dans la console
    if (addedLog.length) console.log('Optimiser+ a ajouté :', addedLog);
  }

  async function handleExportPDF() {
    if (!current || !profile || !targets) return;
    // Import dynamique : jsPDF + html2canvas (~400 KB) ne sont téléchargés
    // qu'au premier clic sur "PDF", pas à l'ouverture de la page.
    const { exportDayPlanPDF } = await import('@/lib/pdf');
    exportDayPlanPDF(current, profile, targets);
  }

  const isToday = current.date === todayKey();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider muted">
            {isToday ? 'Aujourd\u2019hui' : 'Plan du jour'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 capitalize">
            {friendlyDate(current.date)}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ShareButton plan={current} />
          <button className="btn-outline" onClick={handleExportPDF}>
            <FileDown size={14} /> PDF
          </button>
          <div className="inline-flex items-center rounded-md border overflow-hidden h-10">
            <span className="px-2 text-xs muted border-r h-full grid place-items-center">
              Mode
            </span>
            {(['strict', 'normal', 'souple'] as OptimizerMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => updateSettings({ optimizerMode: m })}
                className={
                  'px-2.5 text-xs h-full border-r last:border-r-0 transition-colors ' +
                  (optimizerMode === m
                    ? 'bg-emerald-600 text-white'
                    : 'hover:bg-[var(--bg-subtle)]')
                }
                title={OPTIMIZER_MODES[m].description}
              >
                {OPTIMIZER_MODES[m].label}
              </button>
            ))}
          </div>
          <button className="btn-outline" onClick={handleOptimize} disabled={autoBusy}>
            <Sparkles size={14} /> Optimiser
          </button>
          <button
            className="btn-primary"
            onClick={handleOptimizePlus}
            disabled={autoBusy}
            title="Optimise, ajoute automatiquement les aliments qui manquent, puis réoptimise — en un clic."
          >
            <Wand2 size={14} /> {autoBusy ? 'En cours…' : 'Optimiser +'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid gap-4 order-2 lg:order-1">
          {current.meals.map((meal) => (
            <MealSection key={meal.id} meal={meal} canRemove={current.meals.length > 1} />
          ))}

          <button
            className="btn-outline mx-auto"
            onClick={() => {
              const nom = prompt('Nom du repas :', 'Collation');
              if (nom?.trim()) addMeal(nom.trim());
            }}
          >
            <ListPlus size={14} /> Ajouter un repas
          </button>

          <div className="card p-5 mt-2">
            <div className="text-xs font-semibold uppercase tracking-wider muted mb-2">
              Total journalier
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <div className="muted text-xs">Calories</div>
                <div className="font-semibold tabular-nums">{Math.round(totals.kcal)} kcal</div>
              </div>
              <div>
                <div className="muted text-xs">Protéines</div>
                <div className="font-semibold tabular-nums">{totals.prot.toFixed(1)} g</div>
              </div>
              <div>
                <div className="muted text-xs">Glucides</div>
                <div className="font-semibold tabular-nums">{totals.gluc.toFixed(1)} g</div>
              </div>
              <div>
                <div className="muted text-xs">Lipides</div>
                <div className="font-semibold tabular-nums">{totals.lip.toFixed(1)} g</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-20">
            <TargetsCard
              targets={targets}
              currentKcal={totals.kcal}
              currentProt={totals.prot}
              currentGluc={totals.gluc}
              currentLip={totals.lip}
              mode={optimizerMode}
            />
            <div className="mt-3 text-xs muted">
              Profil :{' '}
              <Link to="/profiles" className="underline">
                {profile.nom}
              </Link>{' '}
              · {profile.objectif}
            </div>
          </div>
        </aside>
      </div>

      <OptimizeDialog
        open={open}
        result={result}
        plan={current}
        mode={optimizerMode}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
