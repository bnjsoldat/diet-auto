import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase initialisé depuis les variables d'env Vite.
 * Si les variables ne sont pas définies, l'app fonctionne en 100 % local
 * (mode "offline-first sans compte") — c'est le cas pendant le dev local
 * quand Supabase n'est pas encore configuré.
 *
 * Pour activer le cloud :
 *  1. Créer un projet sur https://supabase.com
 *  2. Récupérer Project URL et anon key (Settings > API)
 *  3. Définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local
 *     ou dans les variables d'environnement Vercel.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null si Supabase n'est pas configuré (mode local). */
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // pour les magic links
        },
      })
    : null;

export const isCloudEnabled = (): boolean => supabase !== null;
