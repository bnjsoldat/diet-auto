import { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react';
import { useReminders } from '@/store/useReminders';
import {
  isNotificationGranted,
  requestNotificationPermission,
  showReminder,
} from '@/lib/reminders';
import type { Reminder } from '@/types';
import { InfoTip } from './InfoTip';

/**
 * Carte de gestion des rappels quotidiens. Affiche l'état de la permission,
 * la liste des rappels, chaque rappel est éditable (heure, libellé, message)
 * et activable/désactivable. Test button pour vérifier la notif.
 */
export function RemindersCard() {
  const reminders = useReminders((s) => s.reminders);
  const loaded = useReminders((s) => s.loaded);
  const add = useReminders((s) => s.add);
  const update = useReminders((s) => s.update);
  const remove = useReminders((s) => s.remove);
  const setEnabled = useReminders((s) => s.setEnabled);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    setGranted(isNotificationGranted());
  }, []);

  async function handleEnableAsk() {
    const ok = await requestNotificationPermission();
    setGranted(ok);
    if (!ok) {
      alert('Permission refusée. Tu peux la réactiver dans les réglages du navigateur.');
    }
  }

  async function handleTest(r: Reminder) {
    if (!granted) {
      const ok = await requestNotificationPermission();
      setGranted(ok);
      if (!ok) return;
    }
    showReminder(r);
  }

  if (!loaded) return null;

  const notifSupported = typeof Notification !== 'undefined';

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-emerald-600" />
          <h3 className="font-semibold flex items-center gap-1.5">
            Rappels quotidiens
            <InfoTip>
              Les rappels sont déclenchés par ton navigateur. Pour une meilleure fiabilité,
              installe l'app sur ton écran d'accueil (bouton « Installer ») et garde-la ouverte
              en arrière-plan — tes données restent sur ton appareil, il n'y a aucun serveur
              qui puisse pousser une notification quand l'app est totalement fermée.
            </InfoTip>
          </h3>
        </div>
        <button
          type="button"
          className="btn-outline text-xs"
          onClick={() => add()}
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {!notifSupported ? (
        <p className="text-xs muted">
          Ton navigateur ne supporte pas les notifications. Les rappels seront muets.
        </p>
      ) : !granted ? (
        <div className="rounded-md border bg-[var(--bg-subtle)] p-3 text-xs mb-3">
          <p className="mb-2">
            Autorise les notifications pour recevoir les rappels — l'app doit rester ouverte, ou
            installée sur ton écran d'accueil via le bouton « Installer » en haut à droite.
          </p>
          <button type="button" className="btn-primary text-xs" onClick={handleEnableAsk}>
            <Bell size={12} /> Autoriser les notifications
          </button>
        </div>
      ) : (
        <p className="text-xs muted mb-3">
          Notifications autorisées. Les rappels s’affichent quand l’onglet est ouvert ou en
          arrière-plan récent.
        </p>
      )}

      {reminders.length === 0 ? (
        <p className="text-xs muted">Aucun rappel configuré.</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="rounded-md border p-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnabled(r.id, !r.enabled)}
                  className="h-8 w-8 grid place-items-center rounded hover:bg-[var(--bg-subtle)]"
                  title={r.enabled ? 'Désactiver' : 'Activer'}
                >
                  {r.enabled ? (
                    <Bell size={14} className="text-emerald-600" />
                  ) : (
                    <BellOff size={14} className="muted" />
                  )}
                </button>
                <input
                  className="input h-8 flex-1 min-w-0"
                  value={r.label}
                  onChange={(e) => update(r.id, { label: e.target.value })}
                  placeholder="Libellé"
                />
                <input
                  className="input h-8 w-[100px]"
                  type="time"
                  value={r.time}
                  onChange={(e) => update(r.id, { time: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => handleTest(r)}
                  className="text-xs px-2 h-8 rounded border hover:bg-[var(--bg-subtle)] whitespace-nowrap"
                  title="Tester la notif"
                >
                  Tester
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Supprimer le rappel « ${r.label} » ?`)) remove(r.id);
                  }}
                  className="h-8 w-8 grid place-items-center rounded hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                className="input h-8 mt-2 w-full text-xs"
                value={r.message ?? ''}
                onChange={(e) => update(r.id, { message: e.target.value })}
                placeholder="Message perso (optionnel)"
              />
            </div>
          ))}
        </div>
      )}

    </section>
  );
}
