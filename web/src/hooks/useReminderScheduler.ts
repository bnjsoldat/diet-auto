import { useEffect } from 'react';
import { useReminders } from '@/store/useReminders';
import { markFired, shouldFireReminder, showReminder } from '@/lib/reminders';

/**
 * Installe un timer global qui vérifie chaque minute si un rappel doit être
 * déclenché. À monter une seule fois au niveau de l'app (dans App.tsx).
 */
export function useReminderScheduler() {
  const reminders = useReminders((s) => s.reminders);

  useEffect(() => {
    if (reminders.length === 0) return;

    const check = () => {
      for (const r of reminders) {
        if (shouldFireReminder(r)) {
          showReminder(r);
          markFired(r.id);
        }
      }
    };

    // Check immédiat (au cas où l'utilisateur ouvre l'app juste après une heure de rappel)
    check();
    // Puis toutes les 60 s
    const id = window.setInterval(check, 60_000);

    // Sur retour de focus / visibilité, check aussi pour rattraper
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reminders]);
}
