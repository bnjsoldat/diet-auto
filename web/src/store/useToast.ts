import { create } from 'zustand';

export interface Toast {
  id: string;
  /** Message principal du toast (ex : "Repas supprimé"). */
  message: string;
  /** Label du bouton d'action (ex : "Annuler"). Si absent, pas de bouton. */
  actionLabel?: string;
  /** Action exécutée au clic sur le bouton (undo). */
  onAction?: () => void;
  /** Durée avant auto-dismiss en ms (par défaut 5 000). */
  duration?: number;
  /** Ton visuel : 'info' (défaut), 'success', 'danger'. */
  tone?: 'info' | 'success' | 'danger';
}

interface State {
  toasts: Toast[];
  show: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

/**
 * Store Zustand pour gérer les toasts éphémères (confirmation + undo).
 * Un toast = une petite bannière en bas de l'écran, auto-dismiss après
 * quelques secondes. Le slot d'action (bouton "Annuler") permet à
 * l'utilisateur de revenir en arrière sur une suppression.
 */
export const useToast = create<State>((set, get) => ({
  toasts: [],

  show(t) {
    const id = 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    const toast: Toast = { id, duration: 5000, tone: 'info', ...t };
    set({ toasts: [...get().toasts, toast] });
    // Auto-dismiss
    setTimeout(() => get().dismiss(id), toast.duration);
    return id;
  },

  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
