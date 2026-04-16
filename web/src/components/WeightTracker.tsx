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
import type { Profile, WeightEntry } from '@/types';
import { todayKey, friendlyDate } from '@/lib/utils';

interface Props {
  profile: Profile;
}

export function WeightTracker({ profile }: Props) {
  const entries = useWeight((s) => s.entries);
  const addOrUpdate = useWeight((s) => s.addOrUpdate);
  const remove = useWeight((s) => s.remove);

  const [date, setDate] = useState(todayKey());
  const [kg, setKg] = useState<number | ''>('');

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );
  const chartData = sorted.slice(-60);

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const delta = latest && first ? latest.kg - first.kg : 0;
  const deltaSinceStart = latest ? latest.kg - profile.poids : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (typeof kg !== 'number' || kg <= 0) return;
    const entry: WeightEntry = { date, kg };
    addOrUpdate(entry);
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

      {chartData.length >= 2 && (
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
                  (dataMin: number) => Math.floor(dataMin - 1),
                  (dataMax: number) => Math.ceil(dataMax + 1),
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
                y={profile.poids}
                stroke="var(--text-muted)"
                strokeDasharray="3 3"
                label={{
                  value: `départ ${profile.poids} kg`,
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
          Une seule mesure enregistrée. Ajoutes-en une autre pour voir la courbe apparaître.
        </p>
      )}

      {chartData.length === 0 && (
        <p className="text-xs muted mb-3">
          Pèse-toi régulièrement (même heure idéalement) et note ton poids ci-dessous pour voir ta
          progression.
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

      {latest && Math.abs(deltaSinceStart) > 0.1 && (
        <p className="mt-3 text-xs muted">
          Tu as{' '}
          <span className={deltaSinceStart < 0 ? 'text-emerald-600' : 'text-amber-600'}>
            {deltaSinceStart > 0 ? 'pris' : 'perdu'} {Math.abs(deltaSinceStart).toFixed(1)} kg
          </span>{' '}
          depuis la création du profil.
        </p>
      )}
    </div>
  );
}
