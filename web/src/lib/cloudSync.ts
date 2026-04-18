import { supabase, isCloudEnabled } from './supabase';
import { storage } from './storage';

/**
 * Sync bidirectionnel entre IndexedDB (local, rapide, offline) et Supabase
 * (cloud, multi-appareil). Stratégie pragmatique :
 *
 *   - Lecture : toujours depuis IndexedDB (déjà en place partout).
 *   - Écriture : IndexedDB immédiatement (comportement actuel inchangé)
 *     puis push asynchrone vers Supabase via pushAll().
 *   - Au login : pullAll() récupère la ligne user_data la plus récente
 *     du cloud et remplace le contenu IndexedDB. Si le cloud est vide
 *     et le local plein, on push d'abord (1re migration).
 *
 * On ne fait pas de merge 3-way ni de CRDT : last-write-wins. Pour une
 * app solo multi-device ça suffit largement.
 */

/** Snapshot complet des données utilisateur, prêt à envoyer/recevoir. */
export interface CloudSnapshot {
  profiles: unknown;
  activeProfileId: unknown;
  dayPlans: Record<string, unknown>;
  favorites: Record<string, unknown>;
  weights: Record<string, unknown>;
  recipes: Record<string, unknown>;
  customFoods: unknown;
  customTemplates: unknown;
  reminders: unknown;
  settings: unknown;
}

/**
 * Construit un snapshot depuis l'état IndexedDB actuel. Les profils et
 * activeProfileId sont globaux ; les plans/favoris/poids/recettes sont
 * par profil → on stocke un map { profileId → data }.
 */
async function buildLocalSnapshot(): Promise<CloudSnapshot> {
  const profiles = await storage.getProfiles();
  const activeProfileId = await storage.getActiveProfileId();
  const dayPlans: Record<string, unknown> = {};
  const favorites: Record<string, unknown> = {};
  const weights: Record<string, unknown> = {};
  const recipes: Record<string, unknown> = {};
  for (const p of profiles) {
    dayPlans[p.id] = await storage.getDayPlans(p.id);
    favorites[p.id] = await storage.getFavorites(p.id);
    weights[p.id] = await storage.getWeights(p.id);
    recipes[p.id] = await storage.getRecipes(p.id);
  }
  const customFoods = await storage.getCustomFoods();
  const customTemplates = await storage.getCustomTemplates();
  const reminders = await storage.getReminders();
  const settings = await storage.getSettings();
  return {
    profiles,
    activeProfileId,
    dayPlans,
    favorites,
    weights,
    recipes,
    customFoods,
    customTemplates,
    reminders,
    settings: settings ?? {},
  };
}

/** Écrit un snapshot cloud dans IndexedDB, écrasant le contenu existant. */
async function applySnapshotToLocal(snap: CloudSnapshot): Promise<void> {
  // Sécurité : on valide que les champs critiques existent
  const profiles = (snap.profiles ?? []) as Parameters<typeof storage.saveProfiles>[0];
  const activeProfileId = (snap.activeProfileId ?? null) as string | null;
  await storage.saveProfiles(profiles);
  await storage.setActiveProfileId(activeProfileId);
  for (const p of profiles) {
    const dp = (snap.dayPlans?.[p.id] ?? {}) as Parameters<typeof storage.saveDayPlans>[1];
    await storage.saveDayPlans(p.id, dp);
    const favs = (snap.favorites?.[p.id] ?? []) as string[];
    await storage.saveFavorites(p.id, favs);
    const ws = (snap.weights?.[p.id] ?? []) as Parameters<typeof storage.saveWeights>[1];
    await storage.saveWeights(p.id, ws);
    const rs = (snap.recipes?.[p.id] ?? []) as unknown[];
    await storage.saveRecipes(p.id, rs);
  }
  const customFoods = (snap.customFoods ?? []) as Parameters<typeof storage.saveCustomFoods>[0];
  await storage.saveCustomFoods(customFoods);
  const customTemplates = (snap.customTemplates ?? []) as Parameters<
    typeof storage.saveCustomTemplates
  >[0];
  await storage.saveCustomTemplates(customTemplates);
  const reminders = (snap.reminders ?? []) as Parameters<typeof storage.saveReminders>[0];
  await storage.saveReminders(reminders);
  if (snap.settings && typeof snap.settings === 'object' && Object.keys(snap.settings).length > 0) {
    await storage.saveSettings(snap.settings as Parameters<typeof storage.saveSettings>[0]);
  }
}

/** Push complet de l'état local vers le cloud (débounced par l'appelant si besoin). */
export async function pushAll(userId: string): Promise<void> {
  if (!supabase) return;
  const snap = await buildLocalSnapshot();
  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        profiles: snap.profiles,
        active_profile_id: snap.activeProfileId,
        day_plans: snap.dayPlans,
        favorites: snap.favorites,
        weights: snap.weights,
        recipes: snap.recipes,
        custom_foods: snap.customFoods,
        custom_templates: snap.customTemplates,
        reminders: snap.reminders,
        settings: snap.settings,
      },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error('Sync push error: ' + error.message);
}

/**
 * Pull depuis le cloud et écrit dans IndexedDB. Retourne true si un
 * snapshot non vide a été appliqué (l'UI doit recharger ses stores).
 * Retourne false si le cloud est vide pour ce user (premier login).
 */
export async function pullAll(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('Sync pull error: ' + error.message);
  if (!data) return false;
  const snap: CloudSnapshot = {
    profiles: data.profiles ?? [],
    activeProfileId: data.active_profile_id,
    dayPlans: data.day_plans ?? {},
    favorites: data.favorites ?? {},
    weights: data.weights ?? {},
    recipes: data.recipes ?? {},
    customFoods: data.custom_foods ?? [],
    customTemplates: data.custom_templates ?? [],
    reminders: data.reminders ?? [],
    settings: data.settings ?? {},
  };
  // Snapshot "vide" = 0 profils côté cloud : on considère que c'est un
  // premier login, on ne touche pas au local (qui peut contenir les
  // données créées avant l'inscription).
  const isEmpty = Array.isArray(snap.profiles) && (snap.profiles as unknown[]).length === 0;
  if (isEmpty) return false;
  await applySnapshotToLocal(snap);
  return true;
}

/**
 * Orchestration complète au login : pull d'abord. Si cloud vide mais
 * local plein, push pour qu'à la prochaine connexion sur un autre
 * appareil on puisse pull.
 */
export async function syncOnLogin(userId: string): Promise<'pulled' | 'pushed' | 'noop'> {
  if (!isCloudEnabled()) return 'noop';
  try {
    const pulled = await pullAll(userId);
    if (pulled) return 'pulled';
    const snap = await buildLocalSnapshot();
    const hasLocalData = Array.isArray(snap.profiles) && (snap.profiles as unknown[]).length > 0;
    if (hasLocalData) {
      await pushAll(userId);
      return 'pushed';
    }
    return 'noop';
  } catch (err) {
    console.error('Cloud sync failed', err);
    return 'noop';
  }
}

/**
 * Push léger appelé après chaque mutation importante. Débouncé pour ne
 * pas saturer le réseau : on attend 1.5 s après la dernière modif.
 */
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function schedulePush(userId: string): void {
  if (!isCloudEnabled()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushAll(userId).catch((err) => console.warn('Push failed', err));
  }, 1500);
}
