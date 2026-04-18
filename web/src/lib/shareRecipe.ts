import type { Recipe, RecipeIngredient } from '@/types';

/**
 * Format compact pour partager une recette via URL : nom, ingrédients
 * (nom + grammes), étapes optionnelles. Le tout encodé en base64url pour
 * éviter les caractères spéciaux dans l'URL.
 *
 * Le destinataire ouvre simplement le lien et reçoit une proposition
 * d'import dans ses propres recettes.
 */
export interface SharedRecipeV1 {
  v: 1;
  n: string; // nom
  i: [string, number][]; // ingrédients [nom, grammes]
  s?: string[]; // étapes
}

function encodeBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64Url(str: string): string {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeRecipeToUrl(recipe: Recipe): string {
  const payload: SharedRecipeV1 = {
    v: 1,
    n: recipe.nom,
    i: recipe.ingredients.map((ing) => [ing.nom, ing.quantite]),
    s: recipe.etapes && recipe.etapes.length > 0 ? recipe.etapes : undefined,
  };
  const json = JSON.stringify(payload);
  return encodeBase64Url(json);
}

export function decodeRecipeFromUrl(
  encoded: string
): { nom: string; ingredients: RecipeIngredient[]; etapes?: string[] } | null {
  try {
    const json = decodeBase64Url(encoded);
    const obj = JSON.parse(json) as SharedRecipeV1;
    if (obj.v !== 1 || !obj.n || !Array.isArray(obj.i)) return null;
    return {
      nom: String(obj.n),
      ingredients: obj.i
        .filter((x) => Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'number')
        .map(([nom, qty]) => ({ nom, quantite: qty })),
      etapes: obj.s && Array.isArray(obj.s) ? obj.s.filter((s) => typeof s === 'string') : undefined,
    };
  } catch {
    return null;
  }
}

export function buildRecipeShareUrl(recipe: Recipe, origin = window.location.origin): string {
  return `${origin}/recipes#recipe=${encodeRecipeToUrl(recipe)}`;
}

export function readRecipeFromLocation(): ReturnType<typeof decodeRecipeFromUrl> {
  const hash = window.location.hash;
  const match = hash.match(/#recipe=([^&]+)/);
  if (!match) return null;
  return decodeRecipeFromUrl(match[1]);
}

export function clearRecipeFromLocation(): void {
  if (window.location.hash.includes('#recipe=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
