/**
 * Intégration Sentry optionnelle (active uniquement si VITE_SENTRY_DSN est
 * défini dans les env vars Vercel).
 *
 * Import dynamique : on ne charge le SDK Sentry QUE s'il est nécessaire.
 * Ça évite d'alourdir le bundle de 50 KB pour les users non-prod.
 *
 * Pour activer en prod :
 *   1. Créer un compte gratuit sur https://sentry.io
 *   2. Créer un projet « Ma Diét » (type React/JS)
 *   3. Copier le DSN (format https://abc@o123.ingest.sentry.io/456)
 *   4. Dans Vercel env vars : VITE_SENTRY_DSN = <le DSN>
 *   5. Redéploiement auto, Sentry s'active sans intervention code
 */

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

// Log utile pour diagnostiquer si le DSN est bien présent après build.
// Visible dans la console du navigateur au chargement de l'app.
if (typeof window !== 'undefined') {
  if (DSN) {
    console.log('[sentry] DSN detected — error tracking enabled');
  } else {
    console.log('[sentry] VITE_SENTRY_DSN absent — error tracking disabled');
  }
}

/** True si Sentry est configuré (DSN présent). */
export const isSentryEnabled = (): boolean => !!DSN;

let captureException: ((error: unknown, context?: Record<string, unknown>) => void) | null = null;
let captureMessage: ((message: string, level?: 'info' | 'warning' | 'error') => void) | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialise Sentry en dynamic import. Appelé une fois au démarrage de l'app.
 * No-op si DSN absent (mode dev local).
 */
export function initSentry(): Promise<void> {
  if (!DSN) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[sentry] loading SDK…');
      const Sentry = await import('@sentry/react');
      console.log('[sentry] SDK loaded, calling init…');
      Sentry.init({
        dsn: DSN,
        environment: import.meta.env.MODE,
        // Sampling : 100 % des erreurs, 10 % des traces de performance
        tracesSampleRate: 0.1,
        // PII : on ne capture PAS les IPs (RGPD-friendly)
        sendDefaultPii: false,
        // Filtre : on ignore les erreurs qu'on ne peut pas fixer
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          /chrome-extension/i,
          /NetworkError/i,
          /Failed to fetch/i,
        ],
        beforeSend(event) {
          if (event.request?.url) {
            event.request.url = event.request.url.replace(/[?&]email=[^&]+/g, '');
          }
          return event;
        },
      });
      captureException = (error, context) =>
        Sentry.captureException(error, context ? { extra: context } : undefined);
      captureMessage = (msg, level = 'info') => Sentry.captureMessage(msg, level);
      console.log('[sentry] ✓ initialized — errors will be forwarded to Sentry.io');
      // Envoie un petit event "app started" pour valider la connexion
      // (visible dans Sentry sous forme de message info).
      Sentry.captureMessage('Ma Diét app started', 'info');
    } catch (err) {
      console.warn('[sentry] init failed', err);
    }
  })();
  return initPromise;
}

/**
 * Capture une exception (via Sentry si dispo, sinon console.error).
 * Utilisable en dehors de React (hors ErrorBoundary).
 */
export function logException(error: unknown, context?: Record<string, unknown>): void {
  if (captureException) {
    captureException(error, context);
  } else {
    console.error('[exception]', error, context);
  }
}

/** Capture un événement / message (info, warning, error). */
export function logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (captureMessage) {
    captureMessage(message, level);
  } else if (level === 'error') {
    console.error('[message]', message);
  } else if (level === 'warning') {
    console.warn('[message]', message);
  } else {
    console.log('[message]', message);
  }
}
