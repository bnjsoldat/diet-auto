import { Star, Trash2 } from 'lucide-react';
import { useFavorites } from '@/store/useFavorites';
import { foodsByName } from '@/lib/foods';
import { FoodSearch } from '@/components/FoodSearch';
import { formatNumber } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { shortName } from '@/lib/shortNames';

export function Favorites() {
  const favs = useFavorites((s) => s.favorites);
  const toggle = useFavorites((s) => s.toggle);

  const items = favs.map((nom) => foodsByName.get(nom.toLowerCase())).filter(Boolean) as NonNullable<
    ReturnType<typeof foodsByName.get>
  >[];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Favoris</h1>
        <p className="muted mt-1">
          Ajoute tes aliments favoris pour les retrouver en tête de la recherche.
        </p>
      </div>

      <div className="card p-4 mb-6">
        <FoodSearch
          onSelect={(food) => {
            if (!favs.includes(food.nom)) toggle(food.nom);
          }}
          placeholder="Ajouter un aliment aux favoris…"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Pas encore de favoris"
          description="Ajoute des aliments via la recherche ci-dessus, ou clique sur l'étoile ⭐ d'un aliment dans ton plan — ils apparaîtront ici et en tête de la recherche."
          tone="amber"
        />
      ) : (
        <div className="grid gap-2">
          {items.map((f) => (
            <div
              key={f.nom}
              className="card p-3 flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                  <div className="font-medium truncate" title={f.nom}>{shortName(f.nom)}</div>
                </div>
                <div className="text-xs muted">
                  {f.groupe} · {formatNumber(f.kcal)} kcal · P {f.prot.toFixed(1)} · G{' '}
                  {f.gluc.toFixed(1)} · L {f.lip.toFixed(1)} (pour 100 g)
                </div>
              </div>
              <button
                onClick={() => toggle(f.nom)}
                className="h-8 w-8 grid place-items-center rounded-md muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Retirer des favoris"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
