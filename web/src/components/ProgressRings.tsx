import type { Targets } from '@/types';

interface Props {
  targets: Targets;
  currentKcal: number;
  currentProt: number;
  currentGluc: number;
  currentLip: number;
  /** Taille du SVG en pixels. */
  size?: number;
}

/**
 * Anneaux de progression style Apple Watch : un anneau par macro + kcal.
 * L'anneau externe est le total calorique, les 3 anneaux internes sont
 * protéines/glucides/lipides. Chaque anneau affiche son pourcentage, et
 * les couleurs sont distinctes pour une lecture immédiate.
 */
export function ProgressRings({
  targets,
  currentKcal,
  currentProt,
  currentGluc,
  currentLip,
  size = 180,
}: Props) {
  const rings = [
    {
      key: 'kcal',
      label: 'Calories',
      current: currentKcal,
      target: targets.kcalCible,
      color: '#10b981', // emerald
    },
    {
      key: 'prot',
      label: 'Protéines',
      current: currentProt,
      target: targets.prot,
      color: '#f97316', // orange (protéines : effort, viande)
    },
    {
      key: 'gluc',
      label: 'Glucides',
      current: currentGluc,
      target: targets.gluc,
      color: '#3b82f6', // bleu (glucides : énergie)
    },
    {
      key: 'lip',
      label: 'Lipides',
      current: currentLip,
      target: targets.lip,
      color: '#a855f7', // violet (lipides : densité)
    },
  ];

  const cx = size / 2;
  const cy = size / 2;
  const thickness = size / 16;
  const gap = thickness * 0.4;
  const maxRadius = size / 2 - thickness / 2;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {rings.map((r, i) => {
          const radius = maxRadius - i * (thickness + gap);
          const circ = 2 * Math.PI * radius;
          const pct = Math.min(1, r.target > 0 ? r.current / r.target : 0);
          // Ring de fond (plus pâle)
          return (
            <g key={r.key}>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeOpacity="0.15"
                strokeWidth={thickness}
              />
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
              />
            </g>
          );
        })}
        {/* Centre : total kcal restant ou atteint */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          className="fill-[var(--text)]"
          style={{ fontSize: size * 0.16, fontWeight: 700 }}
        >
          {Math.round(currentKcal)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.12}
          textAnchor="middle"
          className="fill-[var(--text-muted)]"
          style={{ fontSize: size * 0.07 }}
        >
          / {targets.kcalCible} kcal
        </text>
      </svg>

      <div className="grid gap-2 text-xs min-w-[120px]">
        {rings.map((r) => {
          const pct = r.target > 0 ? Math.round((r.current / r.target) * 100) : 0;
          return (
            <div key={r.key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: r.color }}
              />
              <span className="muted flex-1">{r.label}</span>
              <span className="font-mono tabular-nums font-medium">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
