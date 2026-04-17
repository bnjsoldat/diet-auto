/**
 * Micro event bus pour les interactions transverses entre la command
 * palette (globale) et les pages (locales). Alternative à un contexte
 * React, plus léger pour des events ponctuels.
 *
 * Utilisation :
 *   - emit('optimize:run')
 *   - on('optimize:run', handler) → renvoie la fonction de désinscription
 */
type Handler = () => void;

const listeners = new Map<string, Set<Handler>>();

export function on(event: string, handler: Handler): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function emit(event: string): void {
  const set = listeners.get(event);
  if (!set) return;
  set.forEach((h) => {
    try {
      h();
    } catch (err) {
      console.error('eventBus handler error', err);
    }
  });
}
