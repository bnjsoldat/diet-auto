import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Printer, ShoppingCart } from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { foodsByName } from '@/lib/foods';
import { bestUnitForGrams, formatCount, pluralize } from '@/lib/units';
import { formatNumber, todayKey } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { InfoTip } from '@/components/InfoTip';
import { shortName } from '@/lib/shortNames';

type Range = 'week' | 'month' | 'custom';

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function Shopping() {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.getActive());
  const profilesLoaded = useProfile((s) => s.loaded);
  const plans = useDayPlan((s) => s.plans);

  const today = todayKey();
  const [range, setRange] = useState<Range>('week');
  const [customFrom, setCustomFrom] = useState(shiftDate(today, -6));
  const [customTo, setCustomTo] = useState(today);
  const [margin, setMargin] = useState(0); // % marge (0, 10, 20)
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const { from, to } = useMemo(() => {
    if (range === 'week') return { from: shiftDate(today, -6), to: today };
    if (range === 'month') return { from: shiftDate(today, -29), to: today };
    return { from: customFrom, to: customTo };
  }, [range, customFrom, customTo, today]);

  /** Agrégation des aliments sur la plage choisie */
  const aggregated = useMemo(() => {
    const totals = new Map<string, number>(); // nom → grammes cumulés
    const daysIncluded = new Set<string>();
    for (const p of Object.values(plans)) {
      if (p.date < from || p.date > to) continue;
      if (!profile || p.profileId !== profile.id) continue;
      daysIncluded.add(p.date);
      for (const meal of p.meals) {
        for (const item of meal.items) {
          if (item.quantite <= 0) continue;
          totals.set(item.nom, (totals.get(item.nom) ?? 0) + item.quantite);
        }
      }
    }
    const byGroupe = new Map<string, { nom: string; grams: number }[]>();
    for (const [nom, g] of totals) {
      const food = foodsByName.get(nom.toLowerCase());
      const groupe = food?.groupe ?? 'Autres';
      const list = byGroupe.get(groupe) ?? [];
      list.push({ nom, grams: g });
      byGroupe.set(groupe, list);
    }
    for (const list of byGroupe.values()) list.sort((a, b) => b.grams - a.grams);
    const groupes = Array.from(byGroupe.entries()).sort((a, b) => a[0].localeCompare(b[0], 'fr'));
    return { groupes, nbDays: daysIncluded.size, nbFoods: totals.size };
  }, [plans, from, to, profile]);

  if (profilesLoaded && !profile) {
    navigate('/setup');
    return null;
  }
  if (!profile) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center muted">Chargement…</div>;
  }

  function describeLine(nom: string, grams: number): string {
    const food = foodsByName.get(nom.toLowerCase());
    const adjusted = grams * (1 + margin / 100);
    if (!food) return `${formatNumber(adjusted)} g`;
    const u = bestUnitForGrams(food, adjusted);
    if (!u) return `${formatNumber(adjusted)} g`;
    const count = adjusted / u.g;
    const rounded = Math.ceil(count * 2) / 2; // arrondi à 0.5 supérieur pour les courses
    return `${formatCount(rounded)} ${pluralize(u.label, rounded)}  (≈ ${formatNumber(Math.ceil(adjusted))} g)`;
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 print:py-4">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 print:mb-3">
        <div>
          <div className="flex items-center gap-2 muted text-xs font-semibold uppercase tracking-wider">
            <ShoppingCart size={12} /> Liste de courses
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Mes courses</h1>
          <p className="muted text-xs mt-0.5">{profile.nom}</p>
          <p className="muted text-sm mt-1">
            {aggregated.nbDays} jour{aggregated.nbDays > 1 ? 's' : ''} couvert
            {aggregated.nbDays > 1 ? 's' : ''} · {aggregated.nbFoods} aliment
            {aggregated.nbFoods > 1 ? 's' : ''} à acheter · du {from} au {to}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button className="btn-outline" onClick={handlePrint}>
            <Printer size={14} /> Imprimer
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 mb-6 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm muted">
            <Calendar size={14} /> Période :
          </div>
          <div className="inline-flex rounded-md border p-0.5">
            {(['week', 'month', 'custom'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'h-8 px-3 text-sm rounded-sm',
                  range === r ? 'bg-[var(--bg-subtle)] font-medium' : 'muted'
                )}
              >
                {r === 'week' ? '7 derniers jours' : r === 'month' ? '30 derniers jours' : 'Personnalisée'}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex items-center gap-2 text-sm">
              <input
                type="date"
                className="input h-8 w-auto"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="muted">→</span>
              <input
                type="date"
                className="input h-8 w-auto"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="muted flex items-center gap-1">
              Marge :
              <InfoTip>
                La marge de sécurité permet de prévoir un peu plus pour couvrir les pertes à la
                cuisson ou les imprévus. Les quantités pratiques sont arrondies à la demi-unité
                supérieure (1,5 œuf → 2 œufs, etc.).
              </InfoTip>
            </span>
            <div className="inline-flex rounded-md border p-0.5">
              {[0, 10, 20].map((m) => (
                <button
                  key={m}
                  onClick={() => setMargin(m)}
                  className={cn(
                    'h-8 px-2 text-xs rounded-sm',
                    margin === m ? 'bg-[var(--bg-subtle)] font-medium' : 'muted'
                  )}
                >
                  +{m}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {aggregated.nbFoods === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Pas encore de courses à prévoir"
          description={
            <>Compose un plan sur <strong>Aujourd'hui</strong> puis reviens ici — tes aliments seront automatiquement agrégés sur la période choisie.</>
          }
          cta={
            <button className="btn-primary" onClick={() => navigate('/today')}>
              Aller composer un repas
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {aggregated.groupes.map(([groupe, items]) => (
            <section key={groupe} className="card p-4 print:break-inside-avoid">
              <h2 className="font-semibold mb-3 capitalize text-emerald-700 dark:text-emerald-500">
                {groupe}
              </h2>
              <div className="grid gap-1">
                {items.map(({ nom, grams }) => {
                  const key = nom;
                  const isChecked = !!checked[key];
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex items-start gap-3 py-1.5 cursor-pointer rounded hover:bg-[var(--bg-subtle)] px-2 -mx-2 transition-colors',
                        isChecked && 'opacity-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setChecked((c) => ({ ...c, [key]: e.target.checked }))}
                        className="mt-1 print:hidden"
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm',
                            isChecked && 'line-through'
                          )}
                          title={nom}
                        >
                          {shortName(nom)}
                        </div>
                        <div className="text-xs muted">{describeLine(nom, grams)}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}
