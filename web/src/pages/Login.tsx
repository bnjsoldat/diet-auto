import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { AtSign, CheckCircle2, KeyRound, Loader2, LogIn, Mail, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { isCloudEnabled } from '@/lib/supabase';
import { useDraft } from '@/hooks/useDraft';

/**
 * Page de connexion — auth OBLIGATOIRE pour accéder à l'app.
 *
 * Parcours principaux (mis en avant) :
 *  1. Google OAuth (1 clic)
 *  2. Lien magique par email (zéro mot de passe)
 *
 * Parcours secondaire (caché dans « Autres options ») :
 *  3. Mot de passe (signup + signin classiques)
 *
 * Si Supabase n'est pas configuré (mode dev local) → affiche un message
 * et laisse passer sur /today.
 */
type Mode = 'magic' | 'signin-password' | 'signup-password';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: { from?: string } };
  const from = location.state?.from ?? '/today';

  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);
  const magicLink = useAuth((s) => s.signInMagicLink);
  const signInGoogle = useAuth((s) => s.signInGoogle);
  const loading = useAuth((s) => s.loading);
  const user = useAuth((s) => s.user);

  // Brouillon : on persiste l'email entré pour qu'un user qui quitte
  // au milieu de la saisie le retrouve à son retour. Le mot de passe
  // n'est JAMAIS persisté (sécurité).
  // Mode par défaut : 'signin-password' depuis 22/04/2026 — feedback user
  // « le lien magique fait peur à certaines personnes ». Le mot de passe
  // étant le plus familier, on en fait le défaut. Lien magique reste
  // accessible via les 3 onglets.
  const draft = useDraft('login-form', { email: '', mode: 'signin-password' as Mode });

  const [mode, setMode] = useState<Mode>(draft.initial.mode);
  const [email, setEmail] = useState(draft.initial.email);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Auto-save du brouillon (email + mode) à chaque changement.
  useEffect(() => {
    draft.save({ email, mode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, mode]);

  // Déjà connecté ? <Navigate> gère ça proprement pendant le render
  // (pas de warning React).
  if (user) return <Navigate to={from} replace />;

  if (!isCloudEnabled()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Sparkles size={32} className="text-emerald-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Mode dev local</h1>
        <p className="muted mb-6">
          Supabase n'est pas configuré sur cette instance. En prod, la connexion est obligatoire.
        </p>
        <Link className="btn-primary" to="/today">Aller au plan (mode dev)</Link>
      </div>
    );
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await magicLink(email);
    if (error) {
      setMsg({ type: 'error', text: error });
    } else {
      setMsg({
        type: 'success',
        text: `Email envoyé à ${email}. Vérifie aussi les spams. Ouvre le lien depuis le MÊME navigateur que cette page (pas dans l'app Gmail).`,
      });
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (mode === 'signup-password') {
      const { error } = await signUp(email, password);
      if (error) {
        setMsg({ type: 'error', text: error });
      } else {
        setMsg({
          type: 'success',
          text: `Compte créé ! Email de confirmation envoyé à ${email}. Ouvre-le depuis le MÊME navigateur que cette page (pas dans l'app Gmail/Mail, sinon la session ne suit pas). Pense à vérifier les spams.`,
        });
      }
      return;
    }
    const { error } = await signIn(email, password);
    if (error) {
      // Messages plus clairs pour les erreurs fréquentes
      let clearText = error;
      if (error.toLowerCase().includes('invalid')) {
        clearText = 'Email ou mot de passe incorrect. Si tu viens de créer ton compte, clique d\'abord sur le lien de confirmation reçu par email.';
      } else if (error.toLowerCase().includes('confirm')) {
        clearText = 'Ton email n\'est pas encore confirmé. Clique sur le lien dans l\'email de confirmation (pense à vérifier les spams).';
      }
      setMsg({ type: 'error', text: clearText });
    } else {
      draft.clear(); // login OK : on nettoie le brouillon
      navigate(from, { replace: true });
    }
  }

  async function handleGoogle() {
    setMsg(null);
    const { error } = await signInGoogle();
    if (error) setMsg({ type: 'error', text: error });
    // Si OK : Supabase redirige vers Google puis revient sur /today
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="text-center mb-6">
        <Sparkles size={28} className="text-emerald-600 mx-auto mb-3" />
        <h1 className="text-2xl sm:text-3xl font-bold">Connecte-toi à Ma Diét</h1>
        <p className="muted text-sm mt-2">
          Tes plans, ton suivi et tes recettes sont sauvegardés et synchronisés sur tous tes
          appareils.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        {/* ---- 1. Google (mis en avant) ---- */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="btn-outline w-full h-11 font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.33-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3 text-xs muted">
          <div className="flex-1 border-t" />
          <span>ou par email</span>
          <div className="flex-1 border-t" />
        </div>

        {/* Onglets : 3 modes visibles directement (plus de « Autres options »).
            Ordre : Se connecter → Créer un compte → Lien magique. Le mot
            de passe (familier) est mis en avant ; le lien magique reste
            disponible avec une note rassurante pour ceux qui ne connaissent
            pas le concept (feedback user 22/04 : « ça fait peur »). */}
        <div className="grid grid-cols-3 gap-1 bg-[var(--bg-subtle)] rounded-md p-1 text-xs">
          <button
            type="button"
            onClick={() => { setMode('signin-password'); setMsg(null); }}
            className={
              'h-8 rounded font-medium transition-colors ' +
              (mode === 'signin-password'
                ? 'bg-[var(--card)] shadow-sm text-[var(--text)]'
                : 'muted hover:text-[var(--text)]')
            }
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup-password'); setMsg(null); }}
            className={
              'h-8 rounded font-medium transition-colors ' +
              (mode === 'signup-password'
                ? 'bg-[var(--card)] shadow-sm text-[var(--text)]'
                : 'muted hover:text-[var(--text)]')
            }
          >
            Créer un compte
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic'); setMsg(null); }}
            className={
              'h-8 rounded font-medium transition-colors ' +
              (mode === 'magic'
                ? 'bg-[var(--card)] shadow-sm text-[var(--text)]'
                : 'muted hover:text-[var(--text)]')
            }
          >
            Lien magique
          </button>
        </div>

        {/* Mode 1 + 2 : email + mot de passe (signin OU signup) */}
        {(mode === 'signin-password' || mode === 'signup-password') && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Email</span>
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9 h-11"
                  placeholder="toi@exemple.fr"
                  autoComplete="email"
                />
              </div>
            </label>
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
                  className="input pl-9 h-11"
                  placeholder={mode === 'signup-password' ? 'Au moins 6 caractères' : 'Ton mot de passe'}
                  autoComplete={mode === 'signup-password' ? 'new-password' : 'current-password'}
                />
              </div>
            </label>
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
            <button type="submit" className="btn-primary w-full h-11" disabled={loading}>
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : mode === 'signup-password' ? (
                <>
                  <UserPlus size={14} /> Créer mon compte
                </>
              ) : (
                <>
                  <LogIn size={14} /> Me connecter
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode 3 : lien magique avec NOTE RASSURANTE */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">Email</span>
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9 h-11"
                  placeholder="toi@exemple.fr"
                  autoComplete="email"
                />
              </div>
            </label>
            {msg && (
              <div
                className={
                  'flex items-start gap-2 text-sm rounded-md p-2.5 ' +
                  (msg.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900')
                }
              >
                {msg.type === 'success' && <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
                <span>{msg.text}</span>
              </div>
            )}
            <button type="submit" className="btn-primary w-full h-11 font-medium" disabled={loading}>
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Mail size={14} /> Recevoir un lien magique
                </>
              )}
            </button>

            {/* Note rassurante */}
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-xs space-y-1.5">
              <div className="font-semibold text-blue-900 dark:text-blue-300">
                C'est quoi un lien magique ?
              </div>
              <p className="text-blue-800 dark:text-blue-300/90 leading-relaxed">
                On t'envoie un email avec un lien <strong>sécurisé à usage unique</strong>{' '}
                (valable 1 h). Tu cliques, tu es connecté. <strong>Pas de mot de passe</strong>{' '}
                à retenir.
              </p>
              <p className="text-blue-800/80 dark:text-blue-300/70 italic">
                C'est ce qu'utilisent Notion, Slack, Stripe et la plupart des outils modernes.
                Plus sûr qu'un mot de passe (rien à voler).
              </p>
            </div>
          </form>
        )}
      </div>

      <p className="text-[11px] muted text-center mt-6 max-w-sm mx-auto">
        En continuant, tu acceptes les{' '}
        <Link to="/cgu" className="underline">conditions d'utilisation</Link> et la{' '}
        <Link to="/confidentialite" className="underline">politique de confidentialité</Link>. Tes
        données sont privées et ne sont jamais revendues.
      </p>
    </div>
  );
}
