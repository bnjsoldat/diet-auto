import type { MealSlot } from './constants';

/**
 * Classe un repas (par son nom) dans un des 6 slots sémantiques.
 *
 * Stratégie : détection par mots-clés avec priorité descendante (on teste
 * les patterns les plus spécifiques d'abord). Les collations utilisent
 * l'indice dans le plan pour désambiguïser matin/après-midi/soir si le
 * nom ne le précise pas.
 *
 * Exemples :
 *  - "Petit-déjeuner"       → 'petit-dej'
 *  - "Petit déj"            → 'petit-dej'
 *  - "Déjeuner (midi)"      → 'dejeuner'
 *  - "Dîner"                → 'diner'
 *  - "Souper"               → 'diner'
 *  - "Collation du soir"    → 'collation-soir'
 *  - "Collation" (index 1)  → 'collation-matin'
 *  - "Collation" (index 3)  → 'collation-aprem'
 *  - "Goûter"               → 'collation-aprem'
 *  - Nom inconnu (index 0)  → 'petit-dej' (fallback positionnel)
 */
export function detectMealSlot(
  nom: string,
  indexInPlan: number,
  _totalMeals: number
): MealSlot {
  const n = nom.toLowerCase().trim();

  // Petit-déjeuner (très spécifique, doit être testé AVANT "déjeuner")
  if (/petit[\s-]*d[ée]j/.test(n)) return 'petit-dej';
  if (/breakfast|matinal|matin(?!ée)/.test(n)) return 'petit-dej';

  // Dîner / Souper (soir)
  if (/d[îi]ner|souper|dinner|nuit|soirée/.test(n)) return 'diner';

  // Déjeuner (midi) — après avoir écarté petit-déj
  if (/d[ée]jeuner|midi|lunch/.test(n)) return 'dejeuner';

  // Collations — essayer de désambiguïser par le nom
  if (/collation|snack|go[ûu]ter|en[\s-]*cas/.test(n)) {
    if (/soir|night|soirée|nuit|coucher/.test(n)) return 'collation-soir';
    if (/matin|matinal|morning/.test(n)) return 'collation-matin';
    if (/apr[èe]s[\s-]*midi|afternoon|go[ûu]ter/.test(n)) return 'collation-aprem';
    // Pas de précision → fallback par position dans le plan
    // index 0-1 : plutôt matin, 2-3 : aprem, 4+ : soir
    if (indexInPlan <= 1) return 'collation-matin';
    if (indexInPlan >= 4) return 'collation-soir';
    return 'collation-aprem';
  }

  // Fallback positionnel si aucun mot-clé ne matche
  const positionalSlots: MealSlot[] = [
    'petit-dej',
    'collation-matin',
    'dejeuner',
    'collation-aprem',
    'diner',
    'collation-soir',
  ];
  return positionalSlots[Math.min(indexInPlan, positionalSlots.length - 1)];
}
