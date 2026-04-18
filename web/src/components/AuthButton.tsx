import { Link } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { isCloudEnabled } from '@/lib/supabase';

/**
 * Bouton en topbar : affiche "Se connecter" si pas de session,
 * ou une icône utilisateur cliquable (→ /compte) si connecté.
 * Invisible si Supabase n'est pas configuré (mode 100 % local).
 */
export function AuthButton() {
  const user = useAuth((s) => s.user);
  const initialized = useAuth((s) => s.initialized);

  if (!isCloudEnabled()) return null;
  if (!initialized) return null;

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs px-2.5 h-8 rounded-md border hover:bg-[var(--bg-subtle)] muted"
        title="Se connecter pour synchroniser tes plans entre appareils"
      >
        <LogIn size={14} />
        <span className="hidden sm:inline">Se connecter</span>
      </Link>
    );
  }

  return (
    <Link
      to="/compte"
      className="inline-flex items-center gap-1.5 text-xs px-2.5 h-8 rounded-md border hover:bg-[var(--bg-subtle)]"
      title={user.email ?? 'Mon compte'}
    >
      <User size={14} className="text-emerald-600" />
      <span className="hidden sm:inline max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
    </Link>
  );
}
