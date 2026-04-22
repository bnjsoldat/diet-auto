import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Plus, Scale, Trash2 } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useWeight } from '@/store/useWeight';
import { useProfile } from '@/store/useProfile';
import { useToast } from '@/store/useToast';
import { calcTargets } from '@/lib/calculations';
import type { Profile, WeightEntry } from '@/types';
import { todayKey, friendlyDate } from '@/lib/utils';

interface Props {
  profile: Profile;
}

/** Moyenne mobile glissante sur n jours (même impl. que History.tsx). */
function rollingMean(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < window) {
      out.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < window; j++) sum += values[i - j];
    out.push(Number((sum / window).toFixed(2)));
  }
  return out;
}

/**
 * Régression linéaire sur les pesées : renvoie la pente en kg/jour et
 * l'étendue temporelle. Utilisé pour détecter si la tendance correspond
 * à l'objectif du profil (ex: perte de poids mais stagnation).
 *
 * Formule moindres carrés : slope = Σ((xᵢ - x̄)(yᵢ - ȳ)) / Σ((xᵢ - x̄)²).
 * Retourne null si < 3 points ou étendue < 10 jours (trop peu pour un signal).
 */
function computeTrend(entries: WeightEntry[]): { slopePerDay: number; days: number } | null {
  if (entries.length < 3) return null;
  const firstMs = new Date(entries[0].date).getTime();
  const pts = entries.map((e) => ({
    x: (new Date(e.date).getTime() - firstMs) / (24 * 3600 * 1000),
    y: e.kg,
  }));
  const days = pts[pts.length - 1].x - pts[0].x;
  if (days < 10) return null;
  const n = pts.length;
  const meanX = pts.reduce((a, p) => a + p.x, 0) / n;
  const meanY = pts.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  if (den === 0) return null;
  return { slopePerDay: num / den, days };
}

/**
 * Compare la tendance mesurée à l'objectif du profil et retourne un message
 * d'alerte (null si tout est cohérent).
 *
 * Seuils empiriques :
 *  - Perte : on attend au moins -0.03 kg/jour (≈ -200 g/semaine). Sinon stagnation.
 *  - Prise : on attend au moins +0.03 kg/jour.
 *  - Maintien : on s'attend à |slope| < 0.05 kg/jour (≈ ±350 g/semaine).
 */
function analyseTrend(
  profile: Profile,
  trend: { slopePerDay: number; days: number }
): { tone: 'info' | 'warn'; title: string; detail: string } | null {
  const { slopePerDay, days } = trend;
  const weekly = slopePerDay * 7;
  const weeklyStr = `${weekly > 0 ? '+' : ''}${weekly.toFixed(2)} kg/sem`;

  const isLoss = profile.objectif.includes('Perte');
  const isGain = profile.objectif.includes('Prise');
  const isMaintain = profile.objectif === 'Maintien';

  if (isLoss && slopePerDay > -0.03) {
    return {
      tone: 'warn',
      title: `Objectif perte, mais tendance ${weeklyStr} sur ${Math.round(days)} j`,
      detail:
        'Ta cible kcal n\u2019est peut-être pas assez basse. Essaie d\u2019augmenter ton activité ou de passer à « Perte de poids rapide » (cible plus serrée).',
    };
  }
  if (isGain && slopePerDay < 0.03) {
    return {
      tone: 'warn',
      title: `Objectif prise, mais tendance ${weeklyStr} sur ${Math.round(days)} j`,
      detail:
        'Ta cible kcal n\u2019est peut-être pas assez haute. Vérifie que tu atteins bien ta cible quotidienne, ou passe à « Prise de masse rapide ».',
    };
  }
  if (isMaintain && Math.abs(slopePerDay) > 0.05) {
    return {
      tone: 'info',
      title: `Dérive ${weeklyStr} sur ${Math.round(days)} j`,
      detail:
        'Tu es en objectif maintien mais le poids bouge. Si c\u2019est voulu, change ton objectif. Sinon, vérifie ton activité et tes saisies.',
    };
  }
  return null;
}

/**
 * Suivi de poids + courbe + auto-sync du profil + alerte tendance.
 *
 * Fonctionnalités :
 *  1. Saisie d'une pesée → auto-update profile.poids si c'est la plus
 *     récente (cibles kcal/macros recalculées automatiquement).
 *  2. Courbe affichée dès la 1re mesure (seuil abaissé de 2 → 1).
 *  3. Moyenne mobile 7 jours (ligne violette pointillée) pour lisser
 *     les variations quotidiennes d'hydratation.
 *  4. Cible kcal en évolution (ligne orange pointillée, axe Y droit) :
 *     on recalcule calcTargets pour chaque point en remplaçant poids
 *     par la mesure → on voit comment ta cible a bougé avec ton poids.
 *  5. Alerte tendance (régression linéaire) si incohérence avec objectif
 *     (perte stagnante, prise stagnante, dérive en maintien).
 */
export function WeightTracker({ profile }: Props) {
  const entries = useWeight((s) => s.entries);
  const addOrUpdate = useWeight((s) => s.addOrUpdate);
  const remove = useWeight((s) => s.remove);
  const updateProfile = useProfile((s) => s.updateProfile);
  const showToast = useToast((s) => s.show);

  const [date, setDate] = useState(todayKey());
  const [kg, setKg] = useState<number | ''>('');
  const [showKcalLine, setShowKcalLine] = useState(true);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );
  const chartDataRaw = sorted.slice(-60);

  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const baseline = first?.kg ?? profile.poids;
  const delta = latest ? latest.kg - baseline : 0;

  /** Moyenne 7j sur la série de poids (série parallèle, null si window pas rempli). */
  const ma7 = useMemo(
    () => rollingMean(chartDataRaw.map((e) => e.kg), 7),
    [chartDataRaw]
  );

  /**
   * Pour chaque point, on recalcule la cible kcal en simulant un profil
   * au poids de la mesure. Montre comment la cible évolue avec le poids.
   */
  const kcalAtWeight = useMemo(
    () =>
      chartDataRaw.map((e) => {
        const hypothetical: Profile = { ...profile, poids: e.kg };
        return calcTargets(hypothetical).kcalCible;
      }),
    [chartDataRaw, profile]
  );

  /** Données fusionnées pour Recharts. */
  const chartData = useMemo(
    () =>
      chartDataRaw.map((e, i) => ({
        ...e,
        ma7: ma7[i],
        kcalCible: kcalAtWeight[i],
      })),
    [chartDataRaw, ma7, kcalAtWeight]
  );

  /** Analyse de tendance (pente kg/jour vs objectif). */
  const trendAlert = useMemo(() => {
    const t = computeTrend(sorted);
    if (!t) return null;
    return analyseTrend(profile, t);
  }, [sorted, profile]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (typeof kg !== 'number' || kg <= 0) return;
    const entry: WeightEntry = { date, kg };
    const latestBefore = sorted[sorted.length - 1];
    const becomesLatest = !latestBefore || date >= latestBefore.date;

    addOrUpdate(entry);

    if (becomesLatest && Math.abs(kg - profile.poids) >= 0.1) {
      try {
        await updateProfile(profile.id, { poids: kg });
        showToast({
          message: `Poids mis à jour (${kg.toFixed(1)} kg). Cibles kcal recalculées.`,
        });
      } catch {
        /* silencieux : la pesée est tout de même enregistrée */
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

      {/* Alerte tendance (n'apparaît que si décalage réel détecté). */}
      {trendAlert && (
        <div
          className={
            'mb-4 rounded-md border p-3 text-sm flex gap-3 items-start ' +
            (trendAlert.tone === 'warn'
              ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800'
              : 'border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800')
          }
        >
          <AlertTriangle
            size={16}
            className={trendAlert.tone === 'warn' ? 'text-amber-600 shrink-0 mt-0.5' : 'text-blue-600 shrink-0 mt-0.5'}
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium">{trendAlert.title}</div>
            <div className="text-xs muted mt-0.5">{trendAlert.detail}</div>
            <Link
              to="/profiles"
              className="inline-block mt-2 text-xs underline hover:no-underline"
            >
              Ajuster mon profil
            </Link>
          </div>
        </div>
      )}

      {chartData.length >= 1 && (
        <>
          <div className="h-48 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5)}
                  fontSize={11}
                  stroke="var(--text-muted)"
                />
                {/* Axe Y gauche : poids (kg) */}
                <YAxis
                  yAxisId="kg"
                  domain={[
                    (dataMin: number) => Math.floor(Math.min(dataMin, baseline) - 1),
                    (dataMax: number) => Math.ceil(Math.max(dataMax, baseline) + 1),
                  ]}
                  fontSize={11}
                  stroke="var(--text-muted)"
                  width={36}
                />
                {/* Axe Y droit : kcal cible (masqué si toggle off) */}
                {showKcalLine && (
                  <YAxis
                    yAxisId="kcal"
                    orientation="right"
                    domain={[
                      (dataMin: number) => Math.floor(dataMin - 50),
                      (dataMax: number) => Math.ceil(dataMax + 50),
                    ]}
                    fontSize={11}
                    stroke="#f59e0b"
                    width={48}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => friendlyDate(v as string)}
                  formatter={(v: number, name: string) => {
                    if (name === 'Poids') return [`${v.toFixed(1)} kg`, name];
                    if (name === 'Moy. 7j') return [`${v.toFixed(1)} kg`, name];
                    if (name === 'Cible kcal') return [`${Math.round(v)} kcal`, name];
                    return [v, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine
                  yAxisId="kg"
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
                  yAxisId="kg"
                  type="monotone"
                  dataKey="kg"
                  name="Poids"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="kg"
                  type="monotone"
                  dataKey="ma7"
                  name="Moy. 7j"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
                {showKcalLine && (
                  <Line
                    yAxisId="kcal"
                    type="monotone"
                    dataKey="kcalCible"
                    name="Cible kcal"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="2 3"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Toggle courbe kcal (discrète, sous le graphe) */}
          <div className="flex items-center justify-end mb-3">
            <label className="inline-flex items-center gap-1.5 text-[11px] muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showKcalLine}
                onChange={(e) => setShowKcalLine(e.target.checked)}
                className="h-3 w-3"
              />
              Afficher la courbe cible kcal (axe droit)
            </label>
          </div>
        </>
      )}

      {chartData.length === 1 && (
        <p className="text-xs muted mb-3">
          1re mesure enregistrée. Pèse-toi à nouveau dans 3-7 jours pour voir la
          tendance (moyenne 7j) se dessiner.
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
