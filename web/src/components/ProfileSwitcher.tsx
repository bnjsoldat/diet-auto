import { useState } from 'react';
import { ChevronDown, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/store/useProfile';
import { cn } from '@/lib/utils';

export function ProfileSwitcher() {
  const profiles = useProfile((s) => s.profiles);
  const activeId = useProfile((s) => s.activeId);
  const setActive = useProfile((s) => s.setActive);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const active = profiles.find((p) => p.id === activeId);

  if (!active) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-[var(--bg-subtle)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User size={14} />
        <span className="max-w-[120px] truncate">{active.nom}</span>
        <ChevronDown size={14} className="muted" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-[110%] z-30 w-56 rounded-md border bg-[var(--card)] shadow-lg">
            <div className="py-1">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActive(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'block w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-subtle)]',
                    p.id === activeId && 'font-medium text-emerald-600'
                  )}
                >
                  {p.nom}
                  <div className="text-xs muted">
                    {p.poids} kg · {Math.round(p.taille * 100)} cm · {p.age} ans
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/profiles');
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-[var(--bg-subtle)]"
              >
                <Plus size={14} />
                Gérer les profils
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
