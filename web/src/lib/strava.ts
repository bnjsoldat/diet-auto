/**
 * Client-side helper pour l'intégration Strava OAuth.
 *
 * Flow général :
 *  1. `getAuthorizeUrl()` → on envoie l'utilisateur vers Strava.
 *  2. Strava redirige vers `/integrations/strava/callback?code=XXX`.
 *  3. Le callback appelle `exchangeCode(code)` qui hit l'Edge Function
 *     `strava-oauth/exchange` (qui stocke les tokens en DB côté serveur).
 *  4. Ensuite `sync()` peut être appelé à la demande pour récupérer les
 *     activités du jour.
 *
 * Le Client Secret n'est JAMAIS exposé côté browser — tout passe par
 * l'Edge Function qui a accès à `STRAVA_CLIENT_SECRET` en env var.
 */
import { supabase } from './supabase';

/** Client ID Strava (public, safe à exposer côté browser). */
export const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string | undefined;

/** URL de callback absolue (doit correspondre au "Authorization Callback Domain"). */
function callbackUrl(): string {
  return `${window.location.origin}/integrations/strava/callback`;
}

/** Est-ce que Strava est configuré sur cette instance ? */
export function isStravaConfigured(): boolean {
  return !!STRAVA_CLIENT_ID && !!supabase;
}

/**
 * Construit l'URL d'autorisation Strava. L'utilisateur y est redirigé ;
 * après acceptation, Strava revient sur `callbackUrl()` avec `?code=...`.
 *
 * Scope minimum `activity:read` : nécessaire pour lire les kcal brûlées
 * des activités publiques. `read` : pour afficher le nom/prénom athlète.
 */
export function getAuthorizeUrl(): string {
  if (!STRAVA_CLIENT_ID) throw new Error('STRAVA_CLIENT_ID non configuré');
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: 'read,activity:read',
    approval_prompt: 'auto',
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

/**
 * Appelle l'Edge Function avec l'access token du user courant.
 * On utilise `fetch` directement plutôt que `supabase.functions.invoke()`
 * pour garantir que l'Authorization header contient le JWT user (pas
 * l'anon key qui est le comportement par défaut dans certains cas).
 */
async function callEdge<T = unknown>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('Non connecté — reconnecte-toi');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const url = `${supabaseUrl}/functions/v1/strava-oauth/${action}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // IMPORTANT : c'est bien le JWT user qu'on envoie (pas la anon key),
      // pour que l'Edge Function puisse extraire user_id du payload.
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    parsed = { error: `HTTP ${res.status} — réponse non-JSON` };
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : `Edge error HTTP ${res.status}`;
    throw new Error(msg);
  }
  return parsed as T;
}

/**
 * Échange le code OAuth contre des tokens + stocke en DB (via Edge).
 * Retourne les infos athlète (prénom, nom) en cas de succès.
 */
export async function exchangeCode(code: string): Promise<{ ok: boolean; athlete?: { firstname?: string; lastname?: string; profile?: string } }> {
  return callEdge<{ ok: boolean; athlete?: { firstname?: string; lastname?: string; profile?: string } }>('exchange', { code });
}

/**
 * Déclenche une sync des activités (depuis aujourd'hui 00:00 par défaut,
 * ou depuis la date `start` au format 'YYYY-MM-DD').
 * Les kcal sont agrégées côté serveur et stockées dans `user_data.activities`.
 */
export async function syncActivities(start?: string): Promise<{
  ok: boolean;
  activities: Record<string, { kcal: number; minutes: number; source: 'strava'; items: Array<{ id: string; type: string; name: string; kcal: number; minutes: number; date: string }> }>;
  count: number;
}> {
  return callEdge('sync', start ? { start } : {});
}

/** Déconnecte Strava (supprime les tokens). */
export async function disconnectStrava(): Promise<{ ok: boolean }> {
  return callEdge('disconnect', {});
}

/**
 * Type pour le détail d'une activité individuelle (tel que stocké dans
 * user_data.activities[date].items).
 */
export interface ActivityItem {
  id: string;
  /** Type Strava : Run, Ride, WeightTraining, Swim, Walk, etc. */
  type: string;
  /** Nom donné par l'utilisateur sur Strava ("Course matin", etc.). */
  name: string;
  /** Calories brûlées estimées par Strava. */
  kcal: number;
  /** Durée en minutes. */
  minutes: number;
  /** Date ISO de début d'activité. */
  date: string;
}

/** Entrée journalière d'activité (même structure côté DB et côté client). */
export interface DailyActivity {
  /** Total kcal brûlées dans la journée. */
  kcal: number;
  /** Total minutes d'activité. */
  minutes: number;
  /** Source : Strava ou saisie manuelle. */
  source: 'strava' | 'manual';
  /** Détail des activités (vide pour les entrées manuelles). */
  items?: ActivityItem[];
}

/**
 * Retourne l'emoji + le label FR pour un type d'activité Strava.
 * Utilisé dans le widget pour afficher "🏃 Course" au lieu de "Run".
 */
export function labelForActivityType(type: string): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    Run: { emoji: '🏃', label: 'Course' },
    Ride: { emoji: '🚴', label: 'Vélo' },
    VirtualRide: { emoji: '🚴', label: 'Home trainer' },
    WeightTraining: { emoji: '💪', label: 'Muscu' },
    Workout: { emoji: '🏋️', label: 'Workout' },
    Swim: { emoji: '🏊', label: 'Natation' },
    Walk: { emoji: '🚶', label: 'Marche' },
    Hike: { emoji: '🥾', label: 'Rando' },
    Yoga: { emoji: '🧘', label: 'Yoga' },
    Crossfit: { emoji: '🤸', label: 'Crossfit' },
    Rowing: { emoji: '🚣', label: 'Rameur' },
    Elliptical: { emoji: '⚙️', label: 'Elliptique' },
    StairStepper: { emoji: '🪜', label: 'Stepper' },
    AlpineSki: { emoji: '🎿', label: 'Ski' },
    Surfing: { emoji: '🏄', label: 'Surf' },
    Tennis: { emoji: '🎾', label: 'Tennis' },
    Boxing: { emoji: '🥊', label: 'Boxe' },
    Volleyball: { emoji: '🏐', label: 'Volley' },
    Soccer: { emoji: '⚽', label: 'Foot' },
  };
  return map[type] ?? { emoji: '🏋️', label: type };
}
