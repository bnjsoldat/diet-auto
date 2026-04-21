import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/store/useAuth';
import { isCloudEnabled } from '@/lib/supabase';

/**
 * Garde de route : force la connexion avant d'accéder à une page "app".
 *
 * Comportement :
 * - Tant que l'auth n'est pas initialisée → loader (évite le flash /login).
 * - Si Supabase pas configuré → on laisse passer (mode dev sans cloud).
 * - Si pas connecté → redirect /login (avec mémoire de la destination pour
 *   revenir automatiquement après connexion).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const initialized = useAuth((s) => s.initialized);
  const user = useAuth((s) => s.user);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <div className="inline-flex h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 grid place-items-center">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  // Mode dev sans cloud : on ne bloque pas (utile si Supabase n'est pas
  // configuré localement ; en prod, isCloudEnabled() retourne true).
  if (!isCloudEnabled()) return <>{children}</>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
