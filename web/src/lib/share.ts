import type { DayPlan } from '@/types';
import { uid, todayKey } from './utils';

/**
 * Format compact d'un plan pour encodage URL.
 * v = version, n = nom, m = repas [{n: nom, i: [[nom, qty, verrou?]]}]
 */
interface SharedPlanV1 {
  v: 1;
  n?: string;
  m: Array<{ n: string; i: Array<[string, number, 0 | 1]> }>;
}

/** Encode un plan en base64-URL-safe. */
export function encodePlanToUrl(plan: DayPlan): string {
  const compact: SharedPlanV1 = {
    v: 1,
    m: plan.meals.map((m) => ({
      n: m.nom,
      i: m.items.map((i) => [i.nom, Math.round(i.quantite), i.verrou ? 1 : 0]),
    })),
  };
  const json = JSON.stringify(compact);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  // base64 → base64url (safe in URL)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Décode un plan depuis un hash URL. Retourne null si invalide. */
export function decodePlanFromUrl(encoded: string): DayPlan | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const raw = JSON.parse(json) as SharedPlanV1;
    if (!raw || raw.v !== 1 || !Array.isArray(raw.m)) return null;

    return {
      date: todayKey(),
      profileId: '',
      updatedAt: Date.now(),
      meals: raw.m.map((m) => ({
        id: uid('meal'),
        nom: typeof m.n === 'string' ? m.n : 'Repas',
        items: (m.i ?? [])
          .filter((it): it is [string, number, 0 | 1] => Array.isArray(it) && it.length >= 2)
          .map(([nom, qty, verrou]) => ({
            id: uid('itm'),
            nom: String(nom),
            quantite: Math.max(1, Math.round(Number(qty) || 0)),
            verrou: verrou === 1,
          })),
      })),
    };
  } catch {
    return null;
  }
}

/** Construit l'URL complète de partage à partir de l'URL actuelle. */
export function buildShareUrl(plan: DayPlan): string {
  const encoded = encodePlanToUrl(plan);
  const base = window.location.origin + window.location.pathname;
  return `${base}#plan=${encoded}`;
}

/** Extrait l'encoded du hash actuel. */
export function readPlanFromLocation(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#plan=')) return null;
  return hash.slice('#plan='.length);
}

export function clearPlanFromLocation() {
  if (window.location.hash.startsWith('#plan=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
