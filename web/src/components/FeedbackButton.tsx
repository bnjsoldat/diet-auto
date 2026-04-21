import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { track } from '@vercel/analytics';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/useAuth';

/**
 * Bouton flottant "Feedback" en bas à droite (mobile-safe, hors zone
 * de la bottom-tab-bar). Ouvre une modale simple qui :
 *  - laisse l'utilisateur écrire son feedback
 *  - propose un mailto: (pas de backend = zéro friction)
 *  - track un évènement `feedback_opened` côté Vercel Analytics
 *
 * Caché sur /login pour ne pas polluer le parcours d'entrée.
 */
export function FeedbackButton() {
  const location = useLocation();
  const user = useAuth((s) => s.user);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');

  // On cache le bouton sur la page de login et /setup initial — pour
  // garder ces parcours propres.
  if (location.pathname === '/login' || location.pathname === '/setup') return null;

  function handleOpen() {
    track('feedback_opened', { page: location.pathname });
    setOpen(true);
  }

  function handleSend() {
    const body = encodeURIComponent(
      `Page : ${location.pathname}\nUser : ${user?.email ?? 'non connecté'}\n\nMessage :\n${msg}`
    );
    const subject = encodeURIComponent('Feedback Ma Diét');
    window.location.href = `mailto:contact@lentreprise.ai?subject=${subject}&body=${body}`;
    track('feedback_sent', { length: msg.length });
    setTimeout(() => {
      setOpen(false);
      setMsg('');
    }, 100);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Envoyer un feedback"
        className={cn(
          'fixed right-4 z-40 h-11 w-11 rounded-full shadow-lg grid place-items-center',
          'bg-emerald-600 text-white hover:bg-emerald-700 transition-colors',
          // Au-dessus de la bottom-tab-bar mobile (h-16 + safe-area)
          'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4'
        )}
      >
        <MessageCircle size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-[var(--card)] border shadow-xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-emerald-600" />
                <h3 className="font-semibold">Donne-moi ton avis</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 grid place-items-center rounded hover:bg-[var(--bg-subtle)]"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <p className="muted text-xs">
                Écris ce que tu veux : un bug, une idée, un aliment manquant, un remerciement…
                Ton message m'est envoyé directement par email à{' '}
                <strong>contact@lentreprise.ai</strong>. Je lis tout et je te réponds.
              </p>
              <textarea
                autoFocus
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={5}
                placeholder="Exemple : « Le scan ne marche pas sur mon iPhone », ou « L'aliment “pâtes fraîches” a des calories fausses », ou « J'adore l'app, merci ! »"
                className="input w-full resize-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!msg.trim()}
                  onClick={handleSend}
                >
                  <Send size={14} /> Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
