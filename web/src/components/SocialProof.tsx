import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Affiche discrètement le nombre de profils créés sur Ma Diét.
 * Se cache tant qu'on n'a pas franchi un seuil raisonnable (50 users) :
 * afficher "3 users" fait fuir plus qu'attire.
 *
 * Utilise une RPC Supabase ou une count query simple (non-exposant les
 * données — juste un count). Mis à jour à chaque chargement de la page
 * landing, throttle naturel côté client (1 fetch / session).
 */

const THRESHOLD_BEFORE_SHOW = 50;

export function SocialProof() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      // Count des lignes user_data = count des users actifs (1 ligne / user).
      // RLS bloquerait pour un anon normal mais on utilise la fonction count()
      // qui est OK via l'API Supabase même sans auth.
      const { count: n } = await supabase!
        .from('user_data')
        .select('*', { count: 'exact', head: true });
      if (cancelled) return;
      if (typeof n === 'number') setCount(n);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Caché tant que le seuil n'est pas atteint (évite l'effet "3 users" démotivant).
  if (count === null || count < THRESHOLD_BEFORE_SHOW) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium bg-[var(--card)]/60 backdrop-blur-sm">
      <Users size={12} className="text-emerald-600" />
      <span>
        <strong>{count.toLocaleString('fr-FR')}</strong> sportifs optimisent déjà leurs macros
        avec Ma Diét
      </span>
    </div>
  );
}
