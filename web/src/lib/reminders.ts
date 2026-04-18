import type { Reminder } from '@/types';

/**
 * Demande la permission de notification, retourne true si accordée.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

export function isNotificationGranted(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

/** Affiche la notification (via SW si dispo pour meilleure compatibilité mobile, sinon directe). */
export async function showReminder(reminder: Reminder) {
  const title = 'Ma Diét';
  const body = reminder.message || `C’est l’heure de ${reminder.label.toLowerCase()} !`;
  const options: NotificationOptions = {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: `reminder-${reminder.id}`,
    silent: false,
  };

  // Priorité au SW (notifications persistantes) si enregistré
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      try {
        await reg.showNotification(title, options);
        return;
      } catch {
        // fallback en-dessous
      }
    }
  }

  try {
    new Notification(title, options);
  } catch {
    /* silently ignore — permission révoquée ou navigateur non supporté */
  }
}

/**
 * Parse "HH:MM" en minutes depuis minuit.
 */
export function parseTimeToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

export function minutesNow(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const LAST_FIRED_KEY = 'reminders:lastFired';

/** Retourne le dict { [id]: 'YYYY-MM-DD' } des derniers déclenchements. */
function readLastFired(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LAST_FIRED_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLastFired(map: Record<string, string>) {
  try {
    localStorage.setItem(LAST_FIRED_KEY, JSON.stringify(map));
  } catch {
    /* quota exceeded, ignore */
  }
}

/**
 * Vérifie si un rappel doit se déclencher maintenant.
 * Fenêtre : déclenche si l'heure courante a dépassé la cible de moins de 30 min
 * ET qu'il n'a pas déjà été déclenché aujourd'hui.
 */
export function shouldFireReminder(reminder: Reminder): boolean {
  if (!reminder.enabled) return false;
  const target = parseTimeToMinutes(reminder.time);
  if (target == null) return false;
  const now = minutesNow();
  if (now < target) return false;
  if (now - target > 30) return false; // fenêtre 30 min pour éviter les spams tardifs

  const lastFired = readLastFired();
  const today = todayDateKey();
  if (lastFired[reminder.id] === today) return false;
  return true;
}

export function markFired(reminderId: string) {
  const map = readLastFired();
  map[reminderId] = todayDateKey();
  writeLastFired(map);
}
