import { Moon, Sun, Monitor } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import type { Theme } from '@/types';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Clair' },
    { value: 'dark', icon: Moon, label: 'Sombre' },
    { value: 'system', icon: Monitor, label: 'Système' },
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
