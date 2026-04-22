import { useState } from 'react';
import { ChevronDown, Plus, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/store/useProfile';
import { effectiveAge } from '@/lib/age';
import { cn } from '@/lib/utils';

/**
 * Switcher multi-profils en haut à droite du header.
 *
 * Comportements :
 *  - Clic sur le profil ACTIF (nom en vert) → navigue vers /profiles (page
 *    de gestion — modifier / supprimer / créer).
 *  - Clic sur un autre profil → bascule dessus.
 *  - Bouton « Nouveau profil » → /profiles?new=1 → ouvre directement le
 *    formulaire de création (pas besoin de re-cliquer sur la page).
 *  - Bouton « Gérer » (icône engrenage) → /profiles (page de gestion).
 */
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
          <div className="absolute right-0 top-[110%] z-30 w-60 rounded-md border bg-[var(--card)] shadow-lg">
            <div className="py-1">
              {profiles.map((p) => {
                const isCurrent = p.id === activeId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setOpen(false);
                      if (isCurrent) {
                        // Déjà actif → on ouvre la page de gestion du profil
                        navigate('/profiles');
                      } else {
                        setActive(p.id);
                      }
                    }}
                    title={isCurrent ? 'Ouvrir mon profil' : `Activer ${p.nom}`}
                    className={cn(
                      'block w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-subtle)]',
                      isCurrent && 'font-medium text-emerald-600'
                    )}
                  >
                    {p.nom}
                    <div className="text-xs muted">
                      {p.poids} kg · {Math.round(p.taille * 100)} cm · {effectiveAge(p)} ans
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t p-1 space-y-0.5">
              <button
                onClick={() => {
                  setOpen(false);
                  // ?new=1 → Profiles.tsx auto-ouvre le formulaire de création
                  navigate('/profiles?new=1');
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-[var(--bg-subtle)]"
              >
                <Plus size={14} />
                Nouveau profil
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/profiles');
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-[var(--bg-subtle)] muted"
              >
                <Settings size={14} />
                Gérer les profils
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
