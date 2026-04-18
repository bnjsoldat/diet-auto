import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Star, TrendingUp } from 'lucide-react';
import { foods, foodsByName, searchFoods } from '@/lib/foods';
import { useFavorites } from '@/store/useFavorites';
import { useCustomFoods } from '@/store/useCustomFoods';
import { useDayPlan } from '@/store/useDayPlan';
import { useProfile } from '@/store/useProfile';
import { calcTargets } from '@/lib/calculations';
import { totalsForItems } from '@/lib/optimizer';
import type { Food } from '@/types';
import { cn } from '@/lib/utils';
import { CATEGORIES, categorieOfFood, foodsByCategorie } from '@/lib/categories';
import { shortName } from '@/lib/shortNames';

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
  const profile = useProfile((s) => s.getActive());
  const current = useDayPlan((s) => s.current());

  /**
   * Macro dominante en déficit sur le plan actuel. Sert à reclasser les
   * résultats : un aliment riche en protéines remonte si le plan manque de
   * protéines. Retourne null si on est dans la tolérance ou si on ne peut
   * pas calculer (pas de profil/plan).
   */
  const deficitMacro = useMemo<'prot' | 'gluc' | 'lip' | 'kcal' | null>(() => {
    if (!profile || !current) return null;
    const targets = calcTargets(profile);
    const items = current.meals.flatMap((m) => m.items);
    if (items.length === 0) return null; // Plan vide : pas de biais
    const t = totalsForItems(items, foodsByName);
    const gaps = {
      prot: (targets.prot - t.prot) / targets.prot,
      gluc: (targets.gluc - t.gluc) / targets.gluc,
      lip: (targets.lip - t.lip) / targets.lip,
      kcal: (targets.kcalCible - t.kcal) / targets.kcalCible,
    };
    // Seul un déficit > 8 % déclenche le reclassement
    const entries = (Object.entries(gaps) as [keyof typeof gaps, number][])
      .filter(([, v]) => v > 0.08);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [profile, current]);

  /** Si l'utilisateur n'a aucun favori, le filtre "favoris" vide redirige vers "all". */
  useEffect(() => {
    if (filter === 'favoris' && favs.length === 0) setFilter('all');
  }, [favs, filter]);

  /**
   * Re-ordonne une liste de Food pour remonter les aliments qui comblent
   * la macro en déficit. On garde l'ordre relatif pour les ex æquo (tri
   * stable) — on bonus juste ceux qui ont une densité pertinente.
   */
  function rerankForDeficit(list: Food[]): Food[] {
    if (!deficitMacro) return list;
    return list
      .map((f, i) => {
        let bonus = 0;
        if (deficitMacro === 'prot' && f.prot >= 10) bonus = f.prot;
        else if (deficitMacro === 'gluc' && f.gluc >= 15) bonus = f.gluc;
        else if (deficitMacro === 'lip' && f.lip >= 8) bonus = f.lip;
        else if (deficitMacro === 'kcal' && f.kcal >= 150) bonus = f.kcal / 10;
        return { f, i, score: bonus };
      })
      // Tri : bonus décroissant, puis ordre original (stable)
      .sort((a, b) => (b.score - a.score) || (a.i - b.i))
      .map((x) => x.f);
  }

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
      if (filter === 'all') return rerankForDeficit(raw).slice(0, 40);
      return raw.filter((f) => categorieOfFood(f) === filter).slice(0, 40);
    }
    // Pas de query : on montre par catégorie
    if (filter === 'favoris') {
      const favSet = new Set(favs);
      return foods.filter((f) => favSet.has(f.nom)).slice(0, 40);
    }
    if (filter === 'all') return rerankForDeficit(foods.slice()).slice(0, 40);
    return (foodsByCategorie[filter] ?? []).slice(0, 80);
    // `customs` et `deficitMacro` sont listés en dépendances pour
    // forcer un recompute quand l'utilisateur scanne un aliment ou
    // modifie son plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, favs, filter, customs, deficitMacro]);

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

          {/* Bandeau "en manque de X" quand la vue Tous est active */}
          {deficitMacro && (filter === 'all' || (q.trim() && filter !== 'favoris')) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-900">
              <TrendingUp size={11} />
              Tri intelligent : aliments riches en{' '}
              {deficitMacro === 'prot'
                ? 'protéines'
                : deficitMacro === 'gluc'
                ? 'glucides'
                : deficitMacro === 'lip'
                ? 'lipides'
                : 'calories'}{' '}
              remontés.
            </div>
          )}

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
                        <span title={f.nom}>{shortName(f.nom)}</span>
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
