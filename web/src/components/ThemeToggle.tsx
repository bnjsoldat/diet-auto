import { Coffee, Moon, Sun } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import type { Theme } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Sélecteur de thème à 3 options : Clair / Pastel / Sombre.
 * Le thème "system" (suivi auto de l'OS) a été retiré — les utilisateurs
 * préfèrent en général un choix explicite, et ça réduit la largeur du
 * toggle dans le header (précieux sur mobile).
 *
 * Si un user avait "system" stocké en settings, useSettings applique
 * silencieusement un fallback en "light" (voir store/useSettings.ts).
 */
export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Clair' },
    { value: 'pastel', icon: Coffee, label: 'Pastel' },
    { value: 'dark', icon: Moon, label: 'Sombre' },
  ];

  return (
    <div className="inline-flex items-center rounded-md border p-0.5">
      {options.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            className={cn(
              'h-7 w-7 grid place-items-center rounded-sm transition-colors',
              active ? 'bg-[var(--bg-subtle)] text-[var(--text)]' : 'muted hover:text-[var(--text)]'
            )}
            title={o.label}
            aria-label={`Thème ${o.label}`}
          >
            <o.icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
