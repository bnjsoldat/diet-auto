import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, History as HistoryIcon, Target, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import { calcTargets } from '@/lib/calculations';
import { friendlyDate } from '@/lib/utils';
import { WeightTracker } from '@/components/WeightTracker';
import { EmptyState } from '@/components/EmptyState';
import { InfoTip } from '@/components/InfoTip';

type Entry = {
  date: string;
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  items: number;
  meals: number;
};

/** CSV RFC 4180 : 1 ligne par jour. BOM UTF-8 pour Excel. */
function buildHistoryCsv(entries: Entry[]): string {
  const header = ['Date', 'Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)', 'Repas', 'Aliments'];
  const lines = [header.join(',')];
  for (const e of entries) {
    lines.push([e.date, e.kcal, e.prot, e.gluc, e.lip, e.meals, e.items].join(','));
  }
  return lines.join('\r\n');
}

function triggerDownload(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Moyenne mobile (glissante) sur n jours pour lisser les variations quotidiennes. */
function rollingMean(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < window) {
      out.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < window; j++) sum += values[i - j];
    out.push(Math.round(sum / window));
  }
  return out;
}

export function History() {
  const profile = useProfile((s) => s.getActive());
  const plans = useDayPlan((s) => s.plans);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const targets = useMemo(() => (profile ? calcTargets(profile) : null), [profile]);

  const entries: Entry[] = useMemo(() => {
    const list = Object.values(plans);
    return list
      .filter((p) => p.meals.flatMap((m) => m.items).length > 0)
      .map((p) => {
        const items = p.meals.flatMap((m) => m.items);
        const t = totalsForItems(items, foodsByName);
        return {
          date: p.date,
          kcal: Math.round(t.kcal),
          prot: Math.round(t.prot),
          gluc: Math.round(t.gluc),
          lip: Math.round(t.lip),
          items: items.length,
          meals: p.meals.length,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [plans]);

  /** Série chronologique la plus ancienne → la plus récente, sur la plage choisie. */
  const chrono = useMemo(() => [...entries].reverse().slice(-range), [entries, range]);

  /** Moyenne mobile 7j sur les kcal pour montrer la tendance. */
  const kcalSeries = useMemo(() => chrono.map((e) => e.kcal), [chrono]);
  const kcalMA7 = useMemo(() => rollingMean(kcalSeries, 7), [kcalSeries]);

  /** Enrichit chaque point avec la moyenne 7j, utile au tooltip. */
  const chartData = useMemo(
    () =>
      chrono.map((e, i) => ({
        ...e,
        ma7: kcalMA7[i],
      })),
    [chrono, kcalMA7]
  );

  /**
   * Statistiques globales sur la plage : moyenne, jours dans la cible (±5%),
   * écart-type, série la plus longue dans la cible.
   */
  const stats = useMemo(() => {
    if (!targets || chrono.length === 0) return null;
    const tol = 0.05;
    const target = targets.kcalCible;
    const inRange = (v: number) => Math.abs(v - target) / target <= tol;
    const avg = Math.round(chrono.reduce((a, b) => a + b.kcal, 0) / chrono.length);
    const variance = chrono.reduce((a, b) => a + Math.pow(b.kcal - avg, 2), 0) / chrono.length;
    const std = Math.round(Math.sqrt(variance));
    let streak = 0;
    let maxStreak = 0;
    let hits = 0;
    for (const e of chrono) {
      if (inRange(e.kcal)) {
        streak++;
        hits++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }
    return { avg, std, hits, total: chrono.length, maxStreak, target };
  }, [chrono, targets]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Historique</h1>
          <p className="muted mt-1">
            {entries.length === 0
              ? 'Aucun plan enregistré pour l\u2019instant.'
              : `${entries.length} jour${entries.length > 1 ? 's' : ''} de données pour ${profile.nom}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <>
              {/* Sélecteur de plage */}
              <div className="inline-flex rounded-md border p-0.5">
                {[7, 30, 90].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r as 7 | 30 | 90)}
                    className={
                      'h-8 px-2.5 text-xs rounded-sm transition-colors ' +
                      (range === r ? 'bg-[var(--bg-subtle)] font-medium' : 'muted hover:bg-[var(--bg-subtle)]')
                    }
                  >
                    {r}j
                  </button>
                ))}
              </div>
              <button
                className="btn-outline"
                onClick={() => {
                  const csv = buildHistoryCsv(entries);
                  const date = new Date().toISOString().slice(0, 10);
                  triggerDownload(`ma-diet-${profile.nom}-${date}.csv`, csv);
                }}
                title="Télécharger toutes les lignes au format CSV"
              >
                <Download size={14} /> CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6">
        <WeightTracker profile={profile} />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="Pas encore d'historique"
          description={
            <>
              Compose ton premier plan sur <strong>Aujourd'hui</strong> — chaque journée est
              automatiquement sauvegardée et viendra enrichir la courbe.
            </>
          }
          cta={
            <Link className="btn-primary" to="/today">
              Créer un plan
            </Link>
          }
        />
      ) : (
        <>
          {/* Stats résumées */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon={Target}
                label="Moyenne kcal"
                value={`${stats.avg}`}
                suffix="kcal"
                hint={`± ${stats.std} kcal d'écart-type`}
                tip={
                  <>
                    Moyenne des calories sur la plage sélectionnée. L'écart-type mesure la
                    régularité : plus il est bas, plus tes journées se ressemblent.
                  </>
                }
              />
              <StatCard
                icon={TrendingUp}
                label="Jours dans la cible"
                value={`${stats.hits}`}
                suffix={`/ ${stats.total}`}
                hint={`${Math.round((stats.hits / stats.total) * 100)} % des jours ±5 %`}
                tone={stats.hits / stats.total >= 0.7 ? 'good' : stats.hits / stats.total >= 0.4 ? 'warn' : 'bad'}
              />
              <StatCard
                icon={TrendingUp}
                label="Meilleure série"
                value={`${stats.maxStreak}`}
                suffix="jours"
                hint="consécutifs ±5 %"
                tone={stats.maxStreak >= 7 ? 'good' : stats.maxStreak >= 3 ? 'warn' : 'bad'}
              />
              <StatCard
                icon={Target}
                label="Cible"
                value={`${stats.target}`}
                suffix="kcal"
                hint={`${profile.objectif}`}
              />
            </div>
          )}

          {/* Graphe 1 : kcal avec bande tolérance + moyenne 7j */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h2 className="font-semibold flex items-center gap-1.5">
                Calories quotidiennes
                <InfoTip>
                  Chaque point est une journée. La zone verte = tolérance ±5 % autour de ta
                  cible. La ligne pleine est le brut ; la ligne pointillée est la moyenne sur
                  7 jours glissants (tendance lissée).
                </InfoTip>
              </h2>
              {targets && (
                <span className="text-xs muted">Cible : {targets.kcalCible} kcal · tol. ±5%</span>
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} stroke="var(--text-muted)" />
                  <YAxis fontSize={11} stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    formatter={(v: number, name: string) => [
                      `${v} kcal`,
                      name === 'kcal' ? 'Jour' : name === 'ma7' ? 'Moyenne 7j' : name,
                    ]}
                  />
                  {targets && (
                    <>
                      <ReferenceArea
                        y1={targets.kcalCible * 0.95}
                        y2={targets.kcalCible * 1.05}
                        fill="#10b981"
                        fillOpacity={0.08}
                        stroke="none"
                      />
                      <ReferenceLine
                        y={targets.kcalCible}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeOpacity={0.6}
                      />
                    </>
                  )}
                  <Line
                    type="monotone"
                    dataKey="kcal"
                    name="kcal"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ma7"
                    name="ma7"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphe 2 : ventilation macros empilées (kcal issues de P/G/L) */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h2 className="font-semibold flex items-center gap-1.5">
                Répartition des macros
                <InfoTip>
                  Barres empilées des kcal issues de chaque macro (P × 4, G × 4, L × 9). Permet
                  de voir si ta répartition reste équilibrée jour après jour. Les couleurs
                  correspondent à celles des anneaux de progression.
                </InfoTip>
              </h2>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.map((e) => ({
                    ...e,
                    kcalP: e.prot * 4,
                    kcalG: e.gluc * 4,
                    kcalL: e.lip * 9,
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} stroke="var(--text-muted)" />
                  <YAxis fontSize={11} stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="kcalP" stackId="a" fill="#f97316" name="Protéines" />
                  <Bar dataKey="kcalG" stackId="a" fill="#3b82f6" name="Glucides" />
                  <Bar dataKey="kcalL" stackId="a" fill="#a855f7" name="Lipides" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphe 3 : adhérence (aire colorée sous la courbe) */}
          {targets && (
            <div className="card p-5 mb-6">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h2 className="font-semibold flex items-center gap-1.5">
                  Écart à la cible (%)
                  <InfoTip>
                    Pourcentage d'écart entre le jour et la cible kcal. Barre au-dessus de 0 = surplus,
                    en dessous = déficit. Plus c'est proche de 0, mieux c'est. Les bandes vertes
                    (±5 %) sont la zone idéale.
                  </InfoTip>
                </h2>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.map((e) => ({
                      date: e.date,
                      ecart: Math.round(((e.kcal - targets.kcalCible) / targets.kcalCible) * 100),
                    }))}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} stroke="var(--text-muted)" />
                    <YAxis fontSize={11} stroke="var(--text-muted)" unit="%" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v > 0 ? '+' : ''}${v} %`, 'Écart kcal']}
                    />
                    <ReferenceArea y1={-5} y2={5} fill="#10b981" fillOpacity={0.1} stroke="none" />
                    <ReferenceLine y={0} stroke="#10b981" strokeOpacity={0.6} />
                    <Area
                      type="monotone"
                      dataKey="ecart"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tableau : chaque journée détaillée (comme avant) */}
          <div className="grid gap-2">
            {entries.map((e) => (
              <div key={e.date} className="card p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium capitalize">{friendlyDate(e.date)}</div>
                  <div className="text-xs muted">
                    {e.meals} repas · {e.items} aliments
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-mono tabular-nums">
                    <span className="muted">kcal</span> {e.kcal}
                  </span>
                  <span className="font-mono tabular-nums">
                    <span className="muted">P</span> {e.prot}
                  </span>
                  <span className="font-mono tabular-nums">
                    <span className="muted">G</span> {e.gluc}
                  </span>
                  <span className="font-mono tabular-nums">
                    <span className="muted">L</span> {e.lip}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  tone,
  tip,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  tone?: 'good' | 'warn' | 'bad';
  tip?: React.ReactNode;
}) {
  const accent =
    tone === 'good'
      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
      : tone === 'warn'
      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
      : tone === 'bad'
      ? 'text-red-600 bg-red-50 dark:bg-red-950/40'
      : 'muted bg-[var(--bg-subtle)]';
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={'h-7 w-7 rounded-md grid place-items-center ' + accent}>
          <Icon size={14} />
        </div>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      <div className="text-xs muted">{label}</div>
      <div className="mt-0.5">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {suffix && <span className="text-xs muted ml-1">{suffix}</span>}
      </div>
      {hint && <div className="text-[11px] muted mt-1">{hint}</div>}
    </div>
  );
}
