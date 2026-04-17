/**
 * Effet de confetti ponctuel quand l'utilisateur atteint sa cible kcal
 * pour la 1re fois de la journée (clé par date en localStorage).
 * Import dynamique pour ne pas embarquer canvas-confetti dans l'entry.
 */
const SEEN_KEY = 'celebrate:lastDay';

export async function celebrateTargetIfFirstTime(date: string) {
  try {
    const last = localStorage.getItem(SEEN_KEY);
    if (last === date) return;
    localStorage.setItem(SEEN_KEY, date);
    const mod = await import('canvas-confetti');
    const confetti = mod.default;
    // Tir doux depuis le bas-centre
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      origin: { y: 0.8 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#3b82f6', '#a855f7'],
      ticks: 200,
      gravity: 1,
      scalar: 0.9,
    });
  } catch {
    /* canvas-confetti absent ou storage KO → on n'embête pas l'utilisateur */
  }
}

/** Réinitialise la mémoire (tests, ou si l'utilisateur change de jour). */
export function resetCelebrateMemory() {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {}
}
