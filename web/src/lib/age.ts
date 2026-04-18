/**
 * Calcule l'âge à partir d'une date de naissance ISO ("YYYY-MM-DD").
 * Prend en compte le mois/jour : si anniversaire pas encore passé, retourne
 * age - 1. Retourne 0 si la date est invalide ou dans le futur.
 */
export function ageFromBirthDate(birthDate: string | undefined | null, today: Date = new Date()): number {
  if (!birthDate) return 0;
  const d = new Date(birthDate + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return 0;
  if (d > today) return 0;
  let age = today.getFullYear() - d.getFullYear();
  // Si l'anniversaire n'est pas encore passé cette année, on retire 1
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}

/**
 * Retourne l'âge effectif d'un profil : priorité à birthDate (recalculé à
 * chaque render) si présent, sinon fallback sur le champ age stocké.
 */
export function effectiveAge(profile: { age: number; birthDate?: string }): number {
  if (profile.birthDate) return ageFromBirthDate(profile.birthDate);
  return profile.age ?? 0;
}
