import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, KeyRound, Loader2, LogIn, Mail, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { isCloudEnabled } from '@/lib/supabase';

/**
 * Page unifiée Login / Signup / Magic link.
 * Comportement : si Supabase n'est pas configuré, redirige vers / avec
 * un message d'info (l'app continue en mode 100 % local).
 */
type Mode = 'login' | 'signup' | 'magic';

export function Login() {
  const navigate = useNavigate();
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);
  const magicLink = useAuth((s) => s.signInMagicLink);
  const signInGoogle = useAuth((s) => s.signInGoogle);
  const loading = useAuth((s) => s.loading);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isCloudEnabled()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Sparkles size={32} className="text-emerald-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Mode 100 % local</h1>
        <p className="muted mb-6">
          Ma Diét fonctionne actuellement sans compte — tes données sont stockées uniquement sur
          cet appareil. La synchronisation multi-appareil arrive bientôt.
        </p>
        <Link className="btn-primary" to="/today">Aller au plan du jour</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (mode === 'magic') {
      const { error } = await magicLink(email);
      if (error) setMsg({ type: 'error', text: error });
      else setMsg({ type: 'success', text: 'Email envoyé ! Clique sur le lien pour te connecter.' });
      return;
    }
    if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) {
        setMsg({ type: 'error', text: error });
      } else {
        setMsg({
          type: 'success',
          text: 'Compte créé ! Vérifie ta boîte mail pour confirmer.',
        });
      }
      return;
    }
    const { error } = await signIn(email, password);
    if (error) setMsg({ type: 'error', text: error });
    else navigate('/today');
  }

  async function handleGoogle() {
    setMsg(null);
    const { error } = await signInGoogle();
    if (error) setMsg({ type: 'error', text: error });
  }

  const title =
    mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer un compte' : 'Lien magique';

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="text-center mb-8">
        <Sparkles size={28} className="text-emerald-600 mx-auto mb-3" />
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        <p className="muted text-sm mt-1">
          {mode === 'signup'
            ? 'Crée ton compte pour synchroniser tes plans sur tous tes appareils.'
            : mode === 'magic'
            ? 'Reçois un lien par email, aucun mot de passe à retenir.'
            : 'Retrouve ton plan, tes recettes et ton suivi sur tous tes appareils.'}
        </p>
      </div>

      <div className="card p-5 space-y-4">
        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="btn-outline w-full"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.33-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3 text-xs muted">
          <div className="flex-1 border-t" />
          <span>ou</span>
          <div className="flex-1 border-t" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Email</span>
            <div className="relative">
              <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9"
                placeholder="toi@exemple.fr"
                autoComplete="email"
              />
            </div>
          </label>

          {mode !== 'magic' && (
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Mot de passe</span>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9"
                  placeholder="Au moins 6 caractères"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>
            </label>
          )}

          {msg && (
            <div
              className={
                'text-sm rounded-md p-2.5 ' +
                (msg.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900')
              }
            >
              {msg.text}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : mode === 'signup' ? (
              <>
                <UserPlus size={14} /> Créer mon compte
              </>
            ) : mode === 'magic' ? (
              <>
                <Mail size={14} /> Recevoir un lien magique
              </>
            ) : (
              <>
                <LogIn size={14} /> Me connecter
              </>
            )}
          </button>
        </form>

        <div className="text-xs muted text-center space-y-1">
          {mode === 'login' && (
            <>
              <button
                type="button"
                className="underline hover:text-[var(--text)]"
                onClick={() => setMode('magic')}
              >
                Se connecter par lien magique
              </button>
              <div>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  className="underline text-emerald-600 hover:text-emerald-700"
                  onClick={() => setMode('signup')}
                >
                  Crée-en un
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <div>
              Déjà un compte ?{' '}
              <button
                type="button"
                className="underline text-emerald-600 hover:text-emerald-700"
                onClick={() => setMode('login')}
              >
                Se connecter
              </button>
            </div>
          )}
          {mode === 'magic' && (
            <button
              type="button"
              className="underline hover:text-[var(--text)]"
              onClick={() => setMode('login')}
            >
              Revenir au mot de passe
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] muted text-center mt-6 max-w-sm mx-auto">
        En continuant, tu acceptes nos{' '}
        <Link to="/cgu" className="underline">conditions d'utilisation</Link> et notre{' '}
        <Link to="/confidentialite" className="underline">politique de confidentialité</Link>. Tes
        données restent privées et ne sont jamais partagées.
      </p>
    </div>
  );
}
