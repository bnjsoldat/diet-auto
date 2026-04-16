import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useDayPlan } from '@/store/useDayPlan';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import { clearPlanFromLocation, decodePlanFromUrl, readPlanFromLocation } from '@/lib/share';
import { formatNumber } from '@/lib/utils';
import type { DayPlan } from '@/types';

/**
 * À l'ouverture de l'app, si l'URL contient `#plan=...`, on décode le plan et
 * on propose à l'utilisateur de l'importer dans sa journée courante (écrase
 * le plan actuel) ou de l'ignorer.
 */
export function ImportPlanPrompt() {
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const replacePlan = useDayPlan((s) => s.replaceCurrentPlan);
  const current = useDayPlan((s) => s.current());

  useEffect(() => {
    const encoded = readPlanFromLocation();
    if (!encoded) return;
    const decoded = decodePlanFromUrl(encoded);
    if (decoded) setPlan(decoded);
    // On garde l'URL en place pour que l'utilisateur puisse copier/re-partager
    // mais on la nettoie après import ou fermeture explicite.
  }, []);

  const totals = useMemo(
    () => (plan ? totalsForItems(plan.meals.flatMap((m) => m.items), foodsByName) : null),
    [plan]
  );
  const itemsCount = plan
    ? plan.meals.reduce((sum, m) => sum + m.items.length, 0)
    : 0;
  const unknownItems = useMemo(() => {
    if (!plan) return [];
    const all = plan.meals.flatMap((m) => m.items);
    return all.filter((i) => !foodsByName.has(i.nom.toLowerCase()));
  }, [plan]);

  function handleImport() {
    if (!plan || !current) return;
    replacePlan({
      ...plan,
      date: current.date,
      profileId: current.profileId,
      updatedAt: Date.now(),
    });
    clearPlanFromLocation();
    setPlan(null);
  }

  function handleCancel() {
    clearPlanFromLocation();
    setPlan(null);
  }

  if (!plan || !totals) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg bg-[var(--card)] border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-emerald-600" />
            <h3 className="font-semibold">Plan partagé reçu</h3>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="h-8 w-8 grid place-items-center rounded hover:bg-[var(--bg-subtle)]"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          <p>
            Ce lien contient un plan avec <strong>{itemsCount} aliments</strong> répartis sur{' '}
            <strong>{plan.meals.length} repas</strong>.
          </p>

          <div className="rounded-md border bg-[var(--bg-subtle)] p-3 text-xs">
            <div className="font-medium mb-1">Totaux estimés</div>
            <div className="tabular-nums">
              {formatNumber(totals.kcal)} kcal · P {formatNumber(totals.prot)} · G{' '}
              {formatNumber(totals.gluc)} · L {formatNumber(totals.lip)}
            </div>
          </div>

          {unknownItems.length > 0 && (
            <div className="rounded-md border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs">
              <div className="font-medium mb-1 text-amber-700 dark:text-amber-400">
                {unknownItems.length} aliment{unknownItems.length > 1 ? 's' : ''} non reconnu
                {unknownItems.length > 1 ? 's' : ''}
              </div>
              <div className="muted">
                Ces aliments seront ajoutés mais leurs kcal/macros ne s'afficheront pas tant que tu
                ne les auras pas dans ta base (souvent des produits scannés).
              </div>
              <div className="mt-1 truncate">
                {unknownItems.slice(0, 3).map((i) => i.nom).join(', ')}
                {unknownItems.length > 3 && '…'}
              </div>
            </div>
          )}

          <p className="text-xs muted">
            L’import remplace ton plan actuel pour cette journée. Tu peux toujours revenir en
            arrière en ajoutant manuellement tes aliments.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={handleCancel}>
              Ignorer
            </button>
            <button type="button" className="btn-primary" onClick={handleImport}>
              Importer dans aujourd’hui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
