import { useEffect, useRef, useState } from 'react';

const DRAFT_PREFIX = 'draft:';

/**
 * Hook de persistance "brouillon" pour formulaires multi-champs.
 *
 * Cas d'usage : un utilisateur commence à remplir un formulaire (création
 * de compte, profil), quitte l'app au milieu, revient plus tard → ses
 * valeurs sont restaurées automatiquement.
 *
 * Stratégie :
 *  - Lecture initiale synchrone depuis localStorage (1er render = valeur
 *    déjà restaurée, pas de flicker).
 *  - Sauvegarde debouncée à 300 ms (évite d'écrire à chaque keystroke).
 *  - Merge avec `defaults` à la lecture (résiste à un schéma qui s'élargit
 *    entre 2 versions de l'app).
 *  - `clear()` à appeler après un submit réussi pour nettoyer.
 *
 * Usage :
 *   const draft = useDraft('profile-form', { nom: '', poids: 70 });
 *   const [nom, setNom] = useState(draft.initial.nom);
 *   const [poids, setPoids] = useState(draft.initial.poids);
 *   useEffect(() => draft.save({ nom, poids }), [nom, poids]);
 *   // Au submit réussi : draft.clear();
 *
 * Sécurité : NE PAS UTILISER pour des champs sensibles (mots de passe,
 * tokens). Le contenu est en clair dans localStorage.
 */
export interface DraftHandle<T> {
  /** Valeur initiale restaurée (ou `defaults` si rien en cache). */
  initial: T;
  /** À appeler à chaque changement d'état. Sauvegarde debouncée. */
  save: (value: T) => void;
  /** À appeler après un submit réussi pour nettoyer le brouillon. */
  clear: () => void;
}

export function useDraft<T extends object>(
  key: string,
  defaults: T,
  options?: { enabled?: boolean }
): DraftHandle<T> {
  const enabled = options?.enabled ?? true;
  const fullKey = DRAFT_PREFIX + key;

  // Lecture initiale lazy (une seule fois, au mount).
  const [initial] = useState<T>(() => {
    if (!enabled) return defaults;
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      // Merge : protège contre les schémas v1 → v2 (nouvelles clés ajoutées
      // depuis la dernière sauvegarde sont fournies par defaults).
      return { ...defaults, ...parsed } as T;
    } catch {
      return defaults;
    }
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function save(value: T) {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(value));
      } catch {
        /* localStorage plein ou désactivé : on ignore */
      }
    }, 300);
  }

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    try {
      localStorage.removeItem(fullKey);
    } catch {
      /* ignore */
    }
  }

  // Cleanup : flush le timer si le composant démonte avant la sauvegarde.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { initial, save, clear };
}
