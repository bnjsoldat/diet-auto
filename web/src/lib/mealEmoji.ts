/**
 * Devine un emoji contextuel pour un nom de repas donné. Évite de rendre
 * l'UI puérile : l'emoji reste petit et précède juste le nom, pour aider
 * le scan visuel rapide ("ah c'est mon petit-déj").
 */
export function emojiForMeal(nom: string): string {
  const n = nom.toLowerCase();
  if (/matin|petit.?d[ée]j|r[ée]veil|breakfast/.test(n)) return '☕';
  if (/midi|d[ée]jeuner|lunch|repas 2/.test(n)) return '🍽️';
  if (/soir|d[îi]ner|dinner|repas 3/.test(n)) return '🌙';
  if (/collation|go[uû]ter|snack/.test(n)) return '🍎';
  if (/ap[ée]ro|cocktail/.test(n)) return '🍷';
  if (/nuit|late/.test(n)) return '🌜';
  if (/post.?training|post.?workout|apr[eé]s.?sport/.test(n)) return '💪';
  if (/pre.?training|avant.?sport/.test(n)) return '⚡';
  // Par défaut, un emoji générique d'assiette pour indiquer "repas"
  return '🍽️';
}
