import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Eraser,
  FileDown,
  LayoutTemplate,
  ListPlus,
  Wand2,
} from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { useSettings } from '@/store/useSettings';
import { calcTargets } from '@/lib/calculations';
import { foods, foodsByName } from '@/lib/foods';
import { optimizeQuantities, totalsForItems } from '@/lib/optimizer';
import { OPTIMIZER_MODES } from '@/lib/constants';
import { suggestComplements } from '@/lib/suggestions';
import { categorieOfFood } from '@/lib/categories';
import { vibrate } from '@/lib/haptic';
import { celebrateTargetIfFirstTime } from '@/lib/celebrate';
import { on as onEvent } from '@/lib/eventBus';
import { TargetsCard } from '@/components/TargetsCard';
import { MealSection } from '@/components/MealSection';
import { OptimizeDialog } from '@/components/OptimizeDialog';
import { ShareButton } from '@/components/ShareButton';
import { TemplatePicker } from '@/components/TemplatePicker';
import { buildMealsFromTemplate } from '@/lib/templates';
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
  const plans = useDayPlan((s) => s.plans);
  const addMeal = useDayPlan((s) => s.addMeal);
  const replacePlan = useDayPlan((s) => s.replaceCurrentPlan);
  const duplicateFromDate = useDayPlan((s) => s.duplicateFromDate);

  const optimizerMode = useSettings((s) => s.optimizerMode);
  const updateSettings = useSettings((s) => s.update);

  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [open, setOpen] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [draggingMealId, setDraggingMealId] = useState<string | null>(null);
  const [dragOverMealId, setDragOverMealId] = useState<string | null>(null);
  /** Input inline "Ajouter un repas" : null quand fermé, valeur saisie sinon. */
  const [newMealName, setNewMealName] = useState<string | null>(null);
  const reorderMeals = useDayPlan((s) => s.reorderMeals);

  /**
   * Dates précédentes (hors aujourd'hui) avec un plan non vide, triées de
   * la plus récente à la plus ancienne. Sert au menu "Dupliquer une
   * journée précédente".
   */
  const previousDates = useMemo(() => {
    const today = current?.date;
    return Object.values(plans)
      .filter((p) => p.date !== today && p.meals.some((m) => m.items.length > 0))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 7); // 7 plus récents
  }, [plans, current]);

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

  /**
   * Déclenche l'animation de célébration quand kcal et macros atteignent
   * la cible en mode normal (±5 %). Se joue une seule fois par jour.
   */
  /** Abonnement au bus global : la command palette peut déclencher l'optim. */
  useEffect(() => {
    return onEvent('optimize:run', () => {
      void handleOptimize();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, targets, optimizerMode, autoBusy]);

  useEffect(() => {
    if (!targets || !current) return;
    const withinKcal = Math.abs(totals.kcal - targets.kcalCible) / targets.kcalCible <= 0.05;
    const withinP = Math.abs(totals.prot - targets.prot) / targets.prot <= 0.1;
    const withinG = Math.abs(totals.gluc - targets.gluc) / targets.gluc <= 0.1;
    const withinL = Math.abs(totals.lip - targets.lip) / targets.lip <= 0.1;
    if (withinKcal && withinP && withinG && withinL && allItems.length >= 3) {
      void celebrateTargetIfFirstTime(current.date);
    }
  }, [totals, targets, current, allItems.length]);

  if (!profile || !current || !targets) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center muted">Chargement…</div>
    );
  }

  /**
   * Cycle d'optimisation unique et complet (max 3 passes). À chaque itération :
   *  1. Optimise les quantités des aliments présents.
   *  2. Si encore hors tolérance, calcule les suggestions et les insère
   *     dans le repas le plus pertinent selon la catégorie (petit-déj =
   *     fruits/laitiers, midi/soir = protéines/féculents, etc.).
   *  3. Recommence.
   * L'utilisateur peut toujours verrouiller un aliment (🔒) pour empêcher
   * que sa quantité bouge, ou retirer les ajouts qu'il n'aime pas depuis
   * le plan — les suggestions sont toujours une aide, jamais une obligation.
   */
  async function handleOptimize() {
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
    vibrate(addedLog.length > 0 ? 'success' : 'medium');
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
          <button
            className="btn-outline"
            onClick={() => setTplOpen(true)}
            title="Charger un plan pré-fait (petit-déj / déjeuner / dîner prêts à optimiser)"
          >
            <LayoutTemplate size={14} /> Modèle
          </button>
          {current.meals.some((m) => m.items.length > 0) && (
            <button
              className="btn-outline"
              onClick={() => {
                if (!confirm('Vider tous les aliments du plan du jour ? (les repas restent)')) return;
                replacePlan({
                  ...current,
                  meals: current.meals.map((m) => ({ ...m, items: [] })),
                  updatedAt: Date.now(),
                });
              }}
              title="Supprime tous les aliments en gardant la structure des repas"
            >
              <Eraser size={14} /> Vider
            </button>
          )}
          {previousDates.length > 0 && (
            <DuplicateFromPrevious
              previousDates={previousDates}
              onPick={(date) => {
                if (
                  current &&
                  current.meals.some((m) => m.items.length > 0) &&
                  !confirm('Remplacer le plan du jour par la copie de cette journée ?')
                )
                  return;
                duplicateFromDate(date);
              }}
            />
          )}
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
          <button
            className="btn-primary"
            onClick={handleOptimize}
            disabled={autoBusy}
            title="Ajuste les quantités et complète ton plan pour atteindre ta cible. Les aliments verrouillés 🔒 restent figés."
          >
            <Wand2 size={14} /> {autoBusy ? 'En cours…' : 'Optimiser'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid gap-4 order-2 lg:order-1">
          {current.meals.map((meal) => (
            <MealSection
              key={meal.id}
              meal={meal}
              canRemove={current.meals.length > 1}
              onDragStart={(id) => setDraggingMealId(id)}
              onDragOver={(id) => setDragOverMealId(id)}
              onDrop={(targetId) => {
                if (!draggingMealId || draggingMealId === targetId) {
                  setDraggingMealId(null);
                  setDragOverMealId(null);
                  return;
                }
                const fromIdx = current.meals.findIndex((m) => m.id === draggingMealId);
                const toIdx = current.meals.findIndex((m) => m.id === targetId);
                if (fromIdx === -1 || toIdx === -1) {
                  setDraggingMealId(null);
                  setDragOverMealId(null);
                  return;
                }
                // Quand on drag vers le BAS (from < to), on veut que l'item
                // se retrouve APRÈS la cible. Vers le haut (from > to), AVANT.
                const currentIds = current.meals.map((m) => m.id);
                const filtered = currentIds.filter((id) => id !== draggingMealId);
                const targetIdxInFiltered = filtered.indexOf(targetId);
                const insertAt = fromIdx < toIdx ? targetIdxInFiltered + 1 : targetIdxInFiltered;
                filtered.splice(insertAt, 0, draggingMealId);
                reorderMeals(filtered);
                setDraggingMealId(null);
                setDragOverMealId(null);
              }}
              isDragTarget={dragOverMealId === meal.id && draggingMealId !== meal.id}
            />
          ))}

          {/* Input inline + bouton (le prompt() natif ne s'affiche pas
              toujours sur mobile, en plus d'être visuellement daté). */}
          {newMealName === null ? (
            <button
              className="btn-outline mx-auto"
              onClick={() => setNewMealName('Collation')}
            >
              <ListPlus size={14} /> Ajouter un repas
            </button>
          ) : (
            <div className="card p-3 flex flex-wrap items-center gap-2 animate-fade-in-up mx-auto max-w-md w-full">
              <input
                autoFocus
                className="input flex-1 min-w-[120px]"
                placeholder="Nom du repas"
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = newMealName.trim();
                    if (v) addMeal(v);
                    setNewMealName(null);
                  } else if (e.key === 'Escape') {
                    setNewMealName(null);
                  }
                }}
              />
              <button
                className="btn-primary"
                onClick={() => {
                  const v = (newMealName ?? '').trim();
                  if (v) addMeal(v);
                  setNewMealName(null);
                }}
                disabled={!newMealName?.trim()}
              >
                Ajouter
              </button>
              <button
                className="btn-outline"
                onClick={() => setNewMealName(null)}
              >
                Annuler
              </button>
            </div>
          )}

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

      <TemplatePicker
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        willReplace={current.meals.some((m) => m.items.length > 0)}
        onPick={(tpl) => {
          if (!current) return;
          const meals = buildMealsFromTemplate(tpl, foodsByName);
          replacePlan({ ...current, meals, updatedAt: Date.now() });
          if (tpl.mode) updateSettings({ optimizerMode: tpl.mode });
        }}
      />
    </div>
  );
}

/**
 * Petit menu déroulant "Dupliquer d'une journée" : la date la plus récente
 * est un clic direct ; les autres sont dans un <details>.
 */
function DuplicateFromPrevious({
  previousDates,
  onPick,
}: {
  previousDates: { date: string }[];
  onPick: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const latest = previousDates[0];
  return (
    <div className="relative">
      <button
        type="button"
        className="btn-outline"
        onClick={() => setOpen((o) => !o)}
        title="Copier le plan d'une journée passée"
      >
        <CalendarDays size={14} /> Dupliquer
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-md border bg-[var(--card)] shadow-lg">
            {previousDates.map((p, i) => (
              <button
                key={p.date}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-subtle)] border-b last:border-0 flex justify-between gap-2"
                onClick={() => {
                  onPick(p.date);
                  setOpen(false);
                }}
              >
                <span className="capitalize">{friendlyDate(p.date)}</span>
                {i === 0 && latest && (
                  <span className="text-[10px] text-emerald-600">+ récent</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
