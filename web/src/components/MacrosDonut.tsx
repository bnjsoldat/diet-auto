import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface Props {
  prot: number; // grams
  gluc: number;
  lip: number;
  kcalTotal?: number;
  compact?: boolean;
}

const COLORS = {
  prot: '#10b981', // emerald
  gluc: '#3b82f6', // blue
  lip: '#f59e0b', // amber
};

export function MacrosDonut({ prot, gluc, lip, kcalTotal, compact }: Props) {
  const kcalProt = prot * 4;
  const kcalGluc = gluc * 4;
  const kcalLip = lip * 9;
  const total = kcalProt + kcalGluc + kcalLip || 1;

  const data = [
    { name: 'Protéines', value: kcalProt, pct: (kcalProt / total) * 100, g: prot, color: COLORS.prot },
    { name: 'Glucides', value: kcalGluc, pct: (kcalGluc / total) * 100, g: gluc, color: COLORS.gluc },
    { name: 'Lipides', value: kcalLip, pct: (kcalLip / total) * 100, g: lip, color: COLORS.lip },
  ];

  const size = compact ? 120 : 160;
  const ir = compact ? 38 : 52;
  const or = compact ? 54 : 72;

  return (
    <div className="flex items-center gap-4">
      <div style={{ width: size, height: size }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={ir}
              outerRadius={or}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {kcalTotal != null && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className={compact ? 'text-sm font-semibold' : 'text-lg font-semibold'}>
                {Math.round(kcalTotal)}
              </div>
              <div className="text-[10px] muted uppercase tracking-wider">kcal</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-1 text-sm">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="muted w-[60px]">{d.name}</span>
            <span className="font-medium w-12 text-right">{Math.round(d.g)} g</span>
            <span className="muted text-xs">({d.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
