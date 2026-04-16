import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { foods, searchFoods } from '@/lib/foods';
import { useFavorites } from '@/store/useFavorites';
import { useCustomFoods } from '@/store/useCustomFoods';
import type { Food } from '@/types';
import { cn } from '@/lib/utils';
import { CATEGORIES, categorieOfFood, foodsByCategorie } from '@/lib/categories';

interface Props {
  onSelect: (food: Food) => void;
  placeholder?: string;
}

type Filter = 'favoris' | 'all' | string; // 'all' = tous les groupes, ou id de catégorie

export function FoodSearch({ onSelect, placeholder = 'Rechercher un aliment…' }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>('favoris');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const favs = useFavorites((s) => s.favorites);
  // Déclencheur de re-render quand les aliments perso changent (scan, ajout, suppr).
  const customs = useCustomFoods((s) => s.customs);

  /** Si l'utilisateur n'a aucun favori, le filtre "favoris" vide redirige vers "all". */
  useEffect(() => {
    if (filter === 'favoris' && favs.length === 0) setFilter('all');
  }, [favs, filter]);

  const results = useMemo<Food[]>(() => {
    const query = q.trim();
    if (query) {
      // Recherche fuzzy sur tout, filtrée par catégorie si choisie
      const raw = searchFoods(query, 60);
      if (filter === 'favoris') {
        const favSet = new Set(favs);
        const favHits = raw.filter((f) => favSet.has(f.nom));
        return favHits.length ? favHits : raw.slice(0, 40);
      }
      if (filter === 'all') return raw.slice(0, 40);
      return raw.filter((f) => categorieOfFood(f) === filter).slice(0, 40);
    }
    // Pas de query : on montre par catégorie
    if (filter === 'favoris') {
      const favSet = new Set(favs);
      return foods.filter((f) => favSet.has(f.nom)).slice(0, 40);
    }
    if (filter === 'all') return foods.slice(0, 40);
    return (foodsByCategorie[filter] ?? []).slice(0, 80);
    // `customs` est listé en dépendance pour forcer un recompute quand
    // l'utilisateur scanne ou supprime un aliment perso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, favs, filter, customs]);

  useEffect(() => {
    setIdx(0);
  }, [q, filter]);

  function handleSelect(food: Food) {
    onSelect(food);
    setQ('');
    // On garde le dropdown ouvert pour permettre d'enchaîner plusieurs ajouts
    setOpen(true);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[idx]) handleSelect(results[idx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => (foodsByCategorie[c.id]?.length ?? 0) > 0),
    // Recompute quand les customs changent (ajoute la cat "perso" dynamiquement).
    [customs]
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
        <input
          ref={inputRef}
          className="input pl-9"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
        />
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute z-30 mt-1 w-full max-h-[28rem] overflow-auto rounded-md border bg-[var(--card)] shadow-lg"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Filtres par catégorie */}
          <div className="sticky top-0 bg-[var(--card)] border-b px-2 py-2 flex flex-wrap gap-1 z-10">
            {favs.length > 0 && (
              <CategoryPill
                active={filter === 'favoris'}
                onClick={() => setFilter('favoris')}
              >
                <Star size={11} className="text-amber-500" fill="currentColor" /> Favoris
              </CategoryPill>
            )}
            <CategoryPill active={filter === 'all'} onClick={() => setFilter('all')}>
              Tous
            </CategoryPill>
            {availableCategories.map((c) => (
              <CategoryPill
                key={c.id}
                active={filter === c.id}
                onClick={() => setFilter(c.id)}
              >
                <span aria-hidden className="leading-none">
                  {c.emoji}
                </span>{' '}
                {c.label}
              </CategoryPill>
            ))}
          </div>

          {results.length === 0 ? (
            <div className="p-4 text-sm muted text-center">
              {q.trim()
                ? 'Aucun aliment ne correspond à cette recherche.'
                : 'Rien dans cette catégorie.'}
            </div>
          ) : (
            <div>
              {results.map((f, i) => {
                const isFav = favs.includes(f.nom);
                return (
                  <button
                    key={f.nom}
                    type="button"
                    onClick={() => handleSelect(f)}
                    onMouseEnter={() => setIdx(i)}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center gap-3 border-b last:border-0',
                      i === idx && 'bg-[var(--bg-subtle)]'
                    )}
                  >
                    {isFav && (
                      <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate flex items-center gap-2">
                        <span>{f.nom}</span>
                        {f.unites && f.unites[0] && (
                          <span className="shrink-0 text-[10px] uppercase tracking-wide muted border rounded px-1 py-0.5">
                            1 {f.unites[0].label} ≈ {f.unites[0].g} g
                          </span>
                        )}
                      </div>
                      <div className="text-xs muted truncate">
                        {Math.round(f.kcal)} kcal · P {f.prot.toFixed(1)} · G {f.gluc.toFixed(1)} · L{' '}
                        {f.lip.toFixed(1)} (pour 100 g)
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2 h-7 rounded-full border transition-colors whitespace-nowrap',
        active
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'muted hover:bg-[var(--bg-subtle)]'
      )}
    >
      {children}
    </button>
  );
}
