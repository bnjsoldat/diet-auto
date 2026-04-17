/**
 * Petit wrapper autour de navigator.vibrate pour déclencher un feedback
 * tactile sur mobile (Android). Silencieux quand l'API n'existe pas
 * (iOS Safari, desktop) — on ne bloque jamais sur cette fonctionnalité.
 *
 * Trois patterns : 'light' pour les actions fréquentes (ajout d'aliment),
 * 'medium' pour les actions importantes (optimisation terminée),
 * 'success' pour les moments "positifs" (cible atteinte).
 */
const PATTERNS = {
  light: 10,
  medium: 20,
  success: [15, 30, 60],
} as const;

export function vibrate(pattern: keyof typeof PATTERNS = 'light') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern] as number | number[]);
  } catch {
    /* certains navigateurs throw sur certains types d'entrée, on ignore */
  }
}
