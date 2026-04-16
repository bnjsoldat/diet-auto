import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { foods, searchFoods } from '@/lib/foods';
import { useFavorites } from '@/store/useFavorites';
import type { Food } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  onSelect: (food: Food) => void;
  placeholder?: string;
}

export function FoodSearch({ onSelect, placeholder = 'Rechercher un aliment…' }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const favs = useFavorites((s) => s.favorites);

  const results = useMemo<Food[]>(() => {
    if (q.trim()) return searchFoods(q, 30);
    // Si vide : montrer les favoris en premier, puis premiers aliments
    const favSet = new Set(favs);
    const favFoods = foods.filter((f) => favSet.has(f.nom));
    if (favFoods.length > 0) return favFoods.slice(0, 30);
    return foods.slice(0, 30);
  }, [q, favs]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  function handleSelect(food: Food) {
    onSelect(food);
    setQ('');
    setOpen(false);
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

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
        <input
          ref={inputRef}
          className="input pl-9"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
        />
      </div>

      {open && results.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-30 mt-1 w-full max-h-80 overflow-auto rounded-md border bg-[var(--card)] shadow-lg"
          role="listbox"
        >
          {!q.trim() && favs.length > 0 && (
            <div className="px-3 py-1.5 text-xs font-semibold muted uppercase tracking-wide border-b">
              Mes favoris
            </div>
          )}
          {results.map((f, i) => {
            const isFav = favs.includes(f.nom);
            return (
              <button
                key={f.nom}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(f)}
                onMouseEnter={() => setIdx(i)}
                className={cn(
                  'w-full text-left px-3 py-2 flex items-center gap-3',
                  i === idx && 'bg-[var(--bg-subtle)]'
                )}
              >
                {isFav && <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />}
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
  );
}
