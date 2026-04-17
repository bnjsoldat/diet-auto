import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CalendarRange,
  ChefHat,
  History as HistoryIcon,
  LayoutTemplate,
  Search,
  ShoppingCart,
  Star,
  User,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  /** Action à effectuer au clic ou à Entrée. */
  action: () => void;
  /** Mots-clés secondaires pour la recherche fuzzy (ex: "kcal" → Cibles). */
  keywords?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Callback à appeler pour lancer l'optimiseur (injecté par la page courante). */
  onOptimize?: () => void;
}

/**
 * Palette de commandes type Linear/Raycast. Ouverte par Cmd+K (ou Ctrl+K),
 * fermée par Escape. Tape pour filtrer la liste des actions. Flèches
 * haut/bas pour naviguer, Entrée pour exécuter.
 */
export function CommandPalette({ open, onClose, onOptimize }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(() => {
    const nav = (to: string) => () => {
      navigate(to);
      onClose();
    };
    const list: Command[] = [
      { id: 'today', label: 'Aujourd\u2019hui', icon: CalendarDays, action: nav('/today'), keywords: ['plan', 'repas', 'jour'] },
      { id: 'week', label: 'Vue semaine', icon: CalendarRange, action: nav('/week'), keywords: ['7 jours', 'hebdo'] },
      { id: 'shopping', label: 'Liste de courses', icon: ShoppingCart, action: nav('/shopping'), keywords: ['achats', 'supermarché'] },
      { id: 'recipes', label: 'Recettes', icon: ChefHat, action: nav('/recipes'), keywords: ['plats', 'compos'] },
      { id: 'history', label: 'Historique', icon: HistoryIcon, action: nav('/history'), keywords: ['courbe', 'graphique'] },
      { id: 'favorites', label: 'Favoris', icon: Star, action: nav('/favorites'), keywords: ['étoile', 'aliments'] },
      { id: 'profiles', label: 'Profils', icon: User, action: nav('/profiles'), keywords: ['utilisateur', 'rappels'] },
    ];
    if (onOptimize) {
      list.unshift({
        id: 'optimize',
        label: 'Optimiser mon plan',
        icon: Wand2,
        action: () => {
          onClose();
          onOptimize();
        },
        keywords: ['ajuster', 'quantités'],
      });
      list.push({
        id: 'template',
        label: 'Charger un modèle de plan',
        icon: LayoutTemplate,
        action: nav('/today'),
        keywords: ['template', 'preset'],
      });
    }
    return list;
  }, [navigate, onClose, onOptimize]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return commands;
    return commands.filter((c) => {
      const hay = (c.label + ' ' + (c.keywords ?? []).join(' ')).toLowerCase();
      return hay.includes(query);
    });
  }, [commands, q]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setIdx(0);
    // Focus après le mount avec un petit délai pour laisser l'animation finir
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setIdx(0), [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[idx]?.action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, idx, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 grid place-items-start pt-24 p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search size={16} className="muted" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Chercher une action ou une page…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="max-h-80 overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm muted text-center">Aucune commande ne correspond.</div>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => c.action()}
                onMouseEnter={() => setIdx(i)}
                className={cn(
                  'w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors',
                  i === idx ? 'bg-[var(--bg-subtle)]' : ''
                )}
              >
                <c.icon size={14} className={i === idx ? 'text-emerald-600' : 'muted'} />
                <span className="flex-1">{c.label}</span>
                {i === idx && <span className="kbd">↵</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
