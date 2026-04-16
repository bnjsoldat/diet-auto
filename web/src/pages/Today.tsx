import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileDown, ListPlus, Sparkles } from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { calcTargets } from '@/lib/calculations';
import { foodsByName } from '@/lib/foods';
import { optimizeQuantities, totalsForItems } from '@/lib/optimizer';
import { TargetsCard } from '@/components/TargetsCard';
import { MealSection } from '@/components/MealSection';
import { OptimizeDialog } from '@/components/OptimizeDialog';
import { exportDayPlanPDF } from '@/lib/pdf';
import type { OptimizeResult } from '@/types';
import { friendlyDate, todayKey } from '@/lib/utils';

export function Today() {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.getActive());
  const profilesLoaded = useProfile((s) => s.loaded);

  const ensurePlan = useDayPlan((s) => s.ensurePlan);
  const current = useDayPlan((s) => s.current());
  const addMeal = useDayPlan((s) => s.addMeal);
  const replacePlan = useDayPlan((s) => s.replaceCurrentPlan);

  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [open, setOpen] = useState(false);

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
    const res = optimizeQuantities(allItemsClone, foodsByName, {
      kcal: targets.kcalCible,
      prot: targets.prot,
      gluc: targets.gluc,
      lip: targets.lip,
    });
    replacePlan({ ...clone, updatedAt: Date.now() });
    setResult(res);
    setOpen(true);
  }

  function handleExportPDF() {
    if (!current || !profile || !targets) return;
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
        <div className="flex items-center gap-2">
          <button className="btn-outline" onClick={handleExportPDF}>
            <FileDown size={14} /> PDF
          </button>
          <button className="btn-primary" onClick={handleOptimize}>
            <Sparkles size={14} /> Optimiser
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

      <OptimizeDialog open={open} result={result} onClose={() => setOpen(false)} />
    </div>
  );
}
