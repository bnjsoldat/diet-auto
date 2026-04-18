import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isCloudEnabled } from '@/lib/supabase';

/**
 * État de la session utilisateur Supabase. Offline-first : si Supabase
 * n'est pas configuré (VITE_SUPABASE_URL absent), l'app continue à
 * fonctionner 100 % local et `user` reste null pour toujours.
 */
interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** true tant qu'on n'a pas eu le premier onAuthStateChange */
  initialized: boolean;
  /** true pendant le pull cloud → local au login (évite le flash /setup). */
  syncing: boolean;

  init: () => Promise<void>;
  setSyncing: (v: boolean) => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: !isCloudEnabled(), // si pas de Supabase, on est déjà "initialisé"
  syncing: false,

  setSyncing(v) {
    set({ syncing: v });
  },

  async init() {
    if (!supabase) {
      set({ initialized: true });
      return;
    }
    // 1) Récupère la session courante (depuis le localStorage Supabase)
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, initialized: true });
    // 2) S'abonne aux changements pour tenir le store à jour
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  async signUp(email, password) {
    if (!supabase) return { error: 'Cloud non configuré' };
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/today' },
    });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  async signIn(email, password) {
    if (!supabase) return { error: 'Cloud non configuré' };
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  async signInMagicLink(email) {
    if (!supabase) return { error: 'Cloud non configuré' };
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/today' },
    });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  async signInGoogle() {
    if (!supabase) return { error: 'Cloud non configuré' };
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/today' },
    });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  async resetPassword(email) {
    if (!supabase) return { error: 'Cloud non configuré' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    return { error: error?.message ?? null };
  },

  async deleteAccount() {
    if (!supabase) return { error: 'Cloud non configuré' };
    // Supprime les données (cascade déclenchera la suppression côté DB)
    // Puis supprime le compte auth (l'utilisateur doit être reloggué
    // récemment pour que cette opération passe — limite de Supabase).
    const { error: dataError } = await supabase.from('user_data').delete().neq('user_id', '');
    if (dataError) return { error: dataError.message };
    // L'auth user ne peut pas s'auto-supprimer via l'anon key : on doit
    // passer par une Edge Function ou l'utilisateur fait la demande via
    // support. Pour l'instant on sign out et on affiche un message.
    await supabase.auth.signOut();
    return { error: null };
  },
}));
