import { useMemo, useState } from 'react';
import { Plus, Scale, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useWeight } from '@/store/useWeight';
import { useProfile } from '@/store/useProfile';
import { useToast } from '@/store/useToast';
import type { Profile, WeightEntry } from '@/types';
import { todayKey, friendlyDate } from '@/lib/utils';

interface Props {
  profile: Profile;
}

/**
 * Suivi de poids + courbe + auto-sync du profil.
 *
 * Comportement clé : quand l'utilisateur saisit une nouvelle pesée et que
 * celle-ci devient la plus récente (date ≥ max des dates existantes), on
 * met aussi à jour le `poids` du profil actif via `updateProfile`. Ça
 * déclenche automatiquement le recalcul du métabolisme basal → cibles
 * kcal/macros. Sinon l'app utiliserait ad vitam le poids de création,
 * ce qui est absurde après 5 kg de perte.
 *
 * Le "départ" sur la courbe reste basé sur la 1re mesure chronologique
 * (ou à défaut, sur profile.poids si aucune mesure). Donc on ne perd pas
 * le repère visuel même après auto-update.
 */
export function WeightTracker({ profile }: Props) {
  const entries = useWeight((s) => s.entries);
  const addOrUpdate = useWeight((s) => s.addOrUpdate);
  const remove = useWeight((s) => s.remove);
  const updateProfile = useProfile((s) => s.updateProfile);
  const showToast = useToast((s) => s.show);

  const [date, setDate] = useState(todayKey());
  const [kg, setKg] = useState<number | ''>('');

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );
  const chartData = sorted.slice(-60);

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  /** Baseline : 1re mesure si dispo, sinon poids initial du profil. */
  const baseline = first?.kg ?? profile.poids;
  const delta = latest ? latest.kg - baseline : 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (typeof kg !== 'number' || kg <= 0) return;
    const entry: WeightEntry = { date, kg };

    // On capte la dernière date AVANT d'ajouter, pour savoir si cette
    // nouvelle entrée devient le "poids actuel".
    const latestBefore = sorted[sorted.length - 1];
    const becomesLatest = !latestBefore || date >= latestBefore.date;

    addOrUpdate(entry);

    // Auto-update du profil uniquement si :
    //  1) cette pesée est la plus récente (sinon on backfill de l'historique
    //     et on ne veut pas changer le poids "actuel")
    //  2) l'écart avec profile.poids est ≥ 0.1 kg (évite les updates inutiles)
    if (becomesLatest && Math.abs(kg - profile.poids) >= 0.1) {
      try {
        await updateProfile(profile.id, { poids: kg });
        showToast({
          message: `Poids mis à jour (${kg.toFixed(1)} kg). Cibles kcal recalculées.`,
        });
      } catch {
        // Erreur silencieuse : la pesée est tout de même enregistrée
      }
    }

    setKg('');
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-emerald-600" />
          <h2 className="font-semibold">Suivi de poids</h2>
        </div>
        {latest && (
          <div className="text-sm tabular-nums">
            <span className="font-semibold">{latest.kg.toFixed(1)} kg</span>
            {sorted.length > 1 && (
              <span
                className={
                  'ml-2 text-xs ' +
                  (delta < 0
                    ? 'text-emerald-600'
                    : delta > 0
                      ? 'text-amber-600'
                      : 'muted')
                }
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)} kg depuis le {friendlyDate(first.date)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Graphe : affiché dès 1 mesure (avant, il fallait 2 mesures).
          Avec 1 seul point, on voit le dot + la ligne "départ" du profil,
          ce qui donne déjà un repère visuel utile. */}
      {chartData.length >= 1 && (
        <div className="h-40 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                fontSize={11}
                stroke="var(--text-muted)"
              />
              <YAxis
                domain={[
                  (dataMin: number) => Math.floor(Math.min(dataMin, baseline) - 1),
                  (dataMax: number) => Math.ceil(Math.max(dataMax, baseline) + 1),
                ]}
                fontSize={11}
                stroke="var(--text-muted)"
              />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)} kg`, 'Poids']}
                labelFormatter={(v) => friendlyDate(v as string)}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={baseline}
                stroke="var(--text-muted)"
                strokeDasharray="3 3"
                label={{
                  value: `départ ${baseline.toFixed(1)} kg`,
                  fill: 'var(--text-muted)',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 1 && (
        <p className="text-xs muted mb-3">
          1re mesure enregistrée. Pèse-toi à nouveau dans 3-7 jours pour voir la
          tendance se dessiner. La ligne pointillée montre ton poids de départ.
        </p>
      )}

      {chartData.length === 0 && (
        <p className="text-xs muted mb-3">
          Pèse-toi régulièrement (même heure idéalement, à jeun) et note ton
          poids ci-dessous. Ton profil ({profile.poids} kg) sera mis à jour
          automatiquement et les cibles kcal recalculées.
        </p>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-[auto_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-xs muted mb-1">Date</label>
          <input
            type="date"
            className="input h-9"
            value={date}
            max={todayKey()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs muted mb-1">Poids (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            className="input h-9"
            placeholder={profile.poids.toString()}
            min={20}
            max={300}
            step={0.1}
            value={kg}
            onChange={(e) => {
              const v = e.target.value.replace(',', '.').trim();
              if (v === '') return setKg('');
              const n = Number(v);
              setKg(Number.isFinite(n) ? n : '');
            }}
          />
        </div>
        <button type="submit" className="btn-primary h-9" disabled={typeof kg !== 'number' || kg <= 0}>
          <Plus size={14} /> Ajouter
        </button>
      </form>

      {/* Astuce discrète pour rassurer sur l'auto-update */}
      <p className="text-[11px] muted mt-2">
        💡 Une pesée à la date la plus récente met à jour le poids de ton
        profil. Les cibles kcal/macros s'ajustent automatiquement.
      </p>

      {sorted.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs muted cursor-pointer">
            Voir toutes les mesures ({sorted.length})
          </summary>
          <div className="mt-2 grid gap-1 max-h-48 overflow-auto">
            {[...sorted].reverse().map((e) => (
              <div
                key={e.date}
                className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-[var(--bg-subtle)]"
              >
                <span className="muted">{friendlyDate(e.date)}</span>
                <span className="font-mono tabular-nums">{e.kg.toFixed(1)} kg</span>
                <button
                  type="button"
                  onClick={() => remove(e.date)}
                  className="h-6 w-6 grid place-items-center rounded muted hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {latest && sorted.length >= 2 && Math.abs(delta) > 0.1 && (
        <p className="mt-3 text-xs muted">
          Tu as{' '}
          <span className={delta < 0 ? 'text-emerald-600' : 'text-amber-600'}>
            {delta > 0 ? 'pris' : 'perdu'} {Math.abs(delta).toFixed(1)} kg
          </span>{' '}
          depuis ta 1re pesée.
        </p>
      )}
    </div>
  );
}
