import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { uid } from '@/lib/utils';
import type { Reminder } from '@/types';

interface RemindersState {
  reminders: Reminder[];
  loaded: boolean;

  load: () => Promise<void>;
  add: (partial?: Partial<Reminder>) => Reminder;
  update: (id: string, patch: Partial<Reminder>) => void;
  remove: (id: string) => void;
  setEnabled: (id: string, enabled: boolean) => void;
}

const DEFAULTS: Reminder[] = [
  { id: uid('rem'), label: 'Petit-déjeuner', time: '07:30', enabled: false, message: 'Pense à préparer ton petit-déj 🍳' },
  { id: uid('rem'), label: 'Déjeuner', time: '12:00', enabled: false, message: 'C’est l’heure de déjeuner 🥗' },
  { id: uid('rem'), label: 'Dîner', time: '19:00', enabled: false, message: 'Temps de passer à table 🍽️' },
];

export const useReminders = create<RemindersState>((set, get) => ({
  reminders: [],
  loaded: false,

  async load() {
    const existing = await storage.getReminders();
    const reminders = existing.length ? existing : DEFAULTS;
    if (!existing.length) storage.saveReminders(reminders);
    set({ reminders, loaded: true });
  },

  add(partial) {
    const rem: Reminder = {
      id: uid('rem'),
      label: partial?.label ?? 'Nouveau rappel',
      time: partial?.time ?? '12:00',
      enabled: partial?.enabled ?? true,
      message: partial?.message,
    };
    const next = [...get().reminders, rem];
    set({ reminders: next });
    storage.saveReminders(next);
    return rem;
  },

  update(id, patch) {
    const next = get().reminders.map((r) => (r.id === id ? { ...r, ...patch } : r));
    set({ reminders: next });
    storage.saveReminders(next);
  },

  remove(id) {
    const next = get().reminders.filter((r) => r.id !== id);
    set({ reminders: next });
    storage.saveReminders(next);
  },

  setEnabled(id, enabled) {
    get().update(id, { enabled });
  },
}));
