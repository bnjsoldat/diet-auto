import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookmarkPlus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eraser,
  FileDown,
  LayoutTemplate,
  ListPlus,
  Wand2,
} from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { useSettings } from '@/store/useSettings';
import { calcTargets, kcalPerMeal } from '@/lib/calculations';
import { foods, foodsByName } from '@/lib/foods';
import { track } from '@vercel/analytics';
import { optimizeQuantities, totalsForItems } from '@/lib/optimizer';
import { OPTIMIZER_MODES } from '@/lib/constants';
import { suggestComplements } from '@/lib/suggestions';
import { categorieOfFood } from '@/lib/categories';
import { vibrate } from '@/lib/haptic';
import { celebrateTargetIfFirstTime } from '@/lib/celebrate';
import { on as onEvent } from '@/lib/eventBus';
import { TargetsCard } from '@/components/TargetsCard';
import { WaterTracker } from '@/components/WaterTracker';
import { MicroNutrientsCard } from '@/components/MicroNutrientsCard';
import { ActivityWidget } from '@/components/ActivityWidget';
import { WelcomeHint } from '@/components/WelcomeHint';
import { MealSection } from '@/components/MealSection';
import { OptimizeDialog } from '@/components/OptimizeDialog';
import { ShareButton } from '@/components/ShareButton';
import { TemplatePicker } from '@/components/TemplatePicker';
import { buildMealsFromTemplate, type PlanTemplate } from '@/lib/templates';
import { useCustomTemplates } from '@/store/useCustomTemplates';
import { useActivity } from '@/store/useActivity';
import { useAuth } from '@/store/useAuth';
import { supabase } from '@/lib/supabase';
import type { MealFoodItem, OptimizeResult } from '@/types';
import { friendlyDate, todayKey } from '@/lib/utils';

/** Ajoute un nombre de jours à une date ISO 'YYYY-MM-DD'. */
function shiftDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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
  const currentDate = useDayPlan((s) => s.date);
  const current = useDayPlan((s) => s.current());
  const plans = useDayPlan((s) => s.plans);
  const addMeal = useDayPlan((s) => s.addMeal);
  const replacePlan = useDayPlan((s) => s.replaceCurrentPlan);
  const switchDate = useDayPlan((s) => s.switchDate);
  const duplicateFromDate = useDayPlan((s) => s.duplicateFromDate);

  const optimizerMode = useSettings((s) => s.optimizerMode);
  const updateSettings = useSettings((s) => s.update);
  const addCustomTemplate = useCustomTemplates((s) => s.add);

  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [open, setOpen] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [draggingMealId, setDraggingMealId] = useState<string | null>(null);
  const [dragOverMealId, setDragOverMealId] = useState<string | null>(null);
  /** Input inline "Ajouter un repas" : null quand fermé, valeur saisie sinon. */
  const [newMealName, setNewMealName] = useState<string | null>(null);
  /** Modale inline "Enregistrer comme plan" : null quand fermée. Remplace
   *  `window.prompt()` que Chrome Android bloque silencieusement. */
  const [saveTplName, setSaveTplName] = useState<string | null>(null);
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

  // ensurePlan() est appelé à chaque fois que la date courante change
  // (navigation ‹/›) ou au changement de profil. Sans ça, naviguer vers
  // un jour qui n'a jamais eu de plan laisse `current` à null et bloque
  // la page sur "Chargement…".
  useEffect(() => {
    if (profile) ensurePlan();
  }, [profile, ensurePlan, currentDate]);

  // Activité du jour (Strava ou manuel) → ajuste la cible journalière.
  // Quand une activité est présente, on passe le flag `useStravaAsActivitySource`
  // à calcTargets, qui remplace le coef d'activité par sédentaire (1.2) pour
  // éviter le double-comptage (Strava = sport réel vs. coef = sport estimé).
  const todayActivity = useActivity((s) => (current ? s.byDate[current.date] : null));
  const extraBurnedKcal = todayActivity?.kcal ?? 0;
  const hasActivityToday = !!todayActivity && extraBurnedKcal > 0;

  const targets = useMemo(
    () =>
      profile
        ? calcTargets(profile, {
            extraBurnedKcal,
            useStravaAsActivitySource: hasActivityToday,
          })
        : null,
    [profile, extraBurnedKcal, hasActivityToday]
  );

  // État "Strava connecté" — check 1 fois au mount, pas critique
  const user = useAuth((s) => s.user);
  const [stravaConnected, setStravaConnected] = useState(false);
  useEffect(() => {
    if (!user || !supabase) return;
    (async () => {
      const { data } = await supabase!
        .from('user_integrations')
        .select('provider')
        .eq('user_id', user.id)
        .eq('provider', 'strava')
        .maybeSingle();
      setStravaConnected(!!data);
    })();
  }, [user]);

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
    // Event custom pour mesurer l'activation de la feature-phare
    track('plan_optimized', {
      mode: optimizerMode,
      nb_items: clone.meals.flatMap((m) => m.items).length,
    });
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
      {/* Bannière d'onboarding — visible uniquement à la 1re visite tant que le
          plan du jour est vide. Guide l'utilisateur vers Mes plans → Optimiser. */}
      <WelcomeHint hasItems={allItems.length > 0} onOpenTemplates={() => setTplOpen(true)} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider muted flex items-center gap-2">
            <span>{isToday ? 'Aujourd\u2019hui' : 'Plan du jour'}</span>
            {!isToday && (
              <button
                type="button"
                onClick={() => switchDate(todayKey())}
                className="inline-flex items-center gap-1 px-1.5 h-5 text-[10px] font-medium rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                title="Revenir au plan d'aujourd'hui"
              >
                <CalendarDays size={10} /> Revenir à aujourd'hui
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button
              type="button"
              onClick={() => switchDate(shiftDate(current.date, -1))}
              className="h-8 w-8 grid place-items-center rounded muted hover:bg-[var(--bg-subtle)] transition-colors"
              title="Jour précédent"
              aria-label="Jour précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold capitalize px-1 tabular-nums">
              {friendlyDate(current.date)}
            </h1>
            <button
              type="button"
              onClick={() => switchDate(shiftDate(current.date, 1))}
              className="h-8 w-8 grid place-items-center rounded muted hover:bg-[var(--bg-subtle)] transition-colors"
              title="Jour suivant"
              aria-label="Jour suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn-outline"
            onClick={() => setTplOpen(true)}
            title="Charger un plan pré-fait ou un de tes plans sauvegardés"
          >
            <LayoutTemplate size={14} /> Mes plans
          </button>
          {current.meals.some((m) => m.items.length > 0) && (
            <button
              className="btn-outline"
              onClick={() =>
                setSaveTplName(`Mon plan du ${new Date().toLocaleDateString('fr-FR')}`)
              }
              title="Enregistrer le plan du jour comme modèle réutilisable"
            >
              <BookmarkPlus size={14} /> Enregistrer
            </button>
          )}
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
          {/* Le bouton Optimiser gagne un petit point pulsant émeraude
              quand le plan contient assez d'aliments mais est hors
              tolérance : guide l'utilisateur sans être intrusif. */}
          {(() => {
            const tol = OPTIMIZER_MODES[optimizerMode].tolKcal;
            const offTarget = targets
              ? Math.abs(totals.kcal - targets.kcalCible) / targets.kcalCible > tol
              : false;
            const shouldHint = allItems.length >= 3 && offTarget && !autoBusy;
            return (
              <button
                className="btn-primary relative"
                onClick={handleOptimize}
                disabled={autoBusy}
                title="Ajuste les quantités et complète ton plan pour atteindre ta cible. Les aliments verrouillés 🔒 restent figés."
              >
                <Wand2 size={14} /> {autoBusy ? 'En cours…' : 'Optimiser'}
                {shouldHint && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid gap-4 order-2 lg:order-1">
          {(() => {
            // Cibles kcal par repas selon la distribution préférée du profil.
            // Détection sémantique par NOM de repas (cf. detectMealSlot) pour
            // que l'ordre dans le plan n'impacte plus le mapping — un plan
            // « Petit-déj, Déjeuner, Collation, Dîner » est géré correctement
            // même si le preset assume l'ordre classique 5 repas.
            const mealTargets = targets
              ? kcalPerMeal(
                  targets.kcalCible,
                  current.meals.map((m) => m.nom),
                  profile.mealDistribution
                )
              : [];
            return current.meals.map((meal, i) => (
            <MealSection
              key={meal.id}
              meal={meal}
              canRemove={current.meals.length > 1}
              targetKcal={mealTargets[i]}
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
            ));
          })()}

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
            <div className="mt-3">
              <ActivityWidget date={current.date} stravaConnected={stravaConnected} />
            </div>
            <div className="mt-3">
              <WaterTracker profileId={profile.id} date={current.date} />
            </div>
            <div className="mt-3">
              <MicroNutrientsCard
                fib={totals.fib}
                suc={totals.suc}
                sel={totals.sel}
                ags={totals.ags}
                cov={totals.cov}
              />
            </div>
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

      {/* Modale inline "Enregistrer comme plan" : remplace window.prompt()
          qui ne s'ouvre pas sur Chrome Android dans certaines conditions. */}
      {saveTplName !== null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setSaveTplName(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-[var(--card)] border shadow-xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">Enregistrer comme plan</h3>
              <p className="text-xs muted mt-0.5">
                Ce plan sera réutilisable depuis « Mes plans » pour n'importe quelle journée.
              </p>
            </div>
            <div className="p-4 space-y-3">
              <input
                autoFocus
                className="input w-full"
                placeholder="Nom du plan"
                value={saveTplName}
                onChange={(e) => setSaveTplName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = saveTplName.trim();
                    if (!v || !current) return;
                    const tpl: PlanTemplate = {
                      id: 'custom_' + Date.now().toString(36),
                      label: v,
                      emoji: '👤',
                      description: 'Mon modèle personnel.',
                      mode: optimizerMode,
                      meals: current.meals.map((m) => ({
                        nom: m.nom,
                        items: m.items
                          .filter((it) => it.quantite > 0)
                          .map((it) => [it.nom, it.quantite] as [string, number]),
                      })),
                    };
                    void addCustomTemplate(tpl);
                    setSaveTplName(null);
                  } else if (e.key === 'Escape') {
                    setSaveTplName(null);
                  }
                }}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setSaveTplName(null)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!saveTplName.trim()}
                  onClick={() => {
                    const v = saveTplName.trim();
                    if (!v || !current) return;
                    const tpl: PlanTemplate = {
                      id: 'custom_' + Date.now().toString(36),
                      label: v,
                      emoji: '👤',
                      description: 'Mon modèle personnel.',
                      mode: optimizerMode,
                      meals: current.meals.map((m) => ({
                        nom: m.nom,
                        items: m.items
                          .filter((it) => it.quantite > 0)
                          .map((it) => [it.nom, it.quantite] as [string, number]),
                      })),
                    };
                    void addCustomTemplate(tpl);
                    setSaveTplName(null);
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
