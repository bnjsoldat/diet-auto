import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useProfile } from '@/store/useProfile';
import { useDayPlan } from '@/store/useDayPlan';
import { foodsByName } from '@/lib/foods';
import { totalsForItems } from '@/lib/optimizer';
import { calcTargets } from '@/lib/calculations';
import { friendlyDate } from '@/lib/utils';
import { WeightTracker } from '@/components/WeightTracker';

/**
 * Sérialise la liste des entrées d'historique en CSV RFC 4180.
 * Une ligne par jour avec date, totaux macros et nombre d'items.
 * L'utilisateur peut l'ouvrir dans Excel/LibreOffice/Google Sheets pour
 * ses propres analyses.
 */
function buildHistoryCsv(
  entries: { date: string; kcal: number; prot: number; gluc: number; lip: number; items: number; meals: number }[]
): string {
  const header = ['Date', 'Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)', 'Repas', 'Aliments'];
  const lines = [header.join(',')];
  for (const e of entries) {
    lines.push([e.date, e.kcal, e.prot, e.gluc, e.lip, e.meals, e.items].join(','));
  }
  return lines.join('\r\n');
}

function triggerDownload(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff', content], { type: mime }); // BOM UTF-8 pour Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function History() {
  const profile = useProfile((s) => s.getActive());
  const plans = useDayPlan((s) => s.plans);

  const targets = useMemo(() => (profile ? calcTargets(profile) : null), [profile]);

  const entries = useMemo(() => {
    const list = Object.values(plans);
    return list
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

  if (!profile) return null;

  const chartData = [...entries].reverse().slice(-30);

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
        {entries.length > 0 && (
          <button
            className="btn-outline"
            onClick={() => {
              const csv = buildHistoryCsv(entries);
              const date = new Date().toISOString().slice(0, 10);
              triggerDownload(`diet-auto-${profile.nom}-${date}.csv`, csv);
            }}
            title="Télécharger toutes les lignes au format CSV (ouvrable dans Excel)"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      <div className="mb-6">
        <WeightTracker profile={profile} />
      </div>

      {entries.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="muted">
            Va sur <Link className="underline text-emerald-600" to="/today">Aujourd'hui</Link>{' '}
            pour commencer à construire ton plan. Tes journées seront automatiquement sauvegardées
            ici.
          </p>
        </div>
      ) : (
        <>
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Calories quotidiennes</h2>
              {targets && (
                <span className="text-xs muted">Cible : {targets.kcalCible} kcal</span>
              )}
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.slice(5)}
                    fontSize={11}
                    stroke="var(--text-muted)"
                  />
                  <YAxis fontSize={11} stroke="var(--text-muted)" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kcal"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-2">
            {entries.map((e) => (
              <div
                key={e.date}
                className="card p-4 flex flex-wrap items-center justify-between gap-2"
              >
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
