import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCcw, Send } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Callback appelé quand une erreur est capturée — utile pour Sentry. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary : capture les erreurs de rendu React et affiche une page
 * amicale au lieu du classique écran blanc "Application error".
 *
 * Appelle `onError` si fourni (pour forwarder vers Sentry / logs externes).
 * Stocke aussi l'erreur dans localStorage pour debug a posteriori si
 * besoin (l'utilisateur peut l'envoyer via le bouton "Signaler").
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log console (visible en DevTools + Sentry si configuré)
    console.error('[ErrorBoundary] captured:', error, info);
    // Persist minimal info pour le bouton "Signaler"
    try {
      localStorage.setItem(
        'lastRenderError',
        JSON.stringify({
          message: error.message,
          stack: error.stack?.slice(0, 2000),
          componentStack: info.componentStack?.slice(0, 2000),
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        })
      );
    } catch {
      /* localStorage indispo, on s'en fiche */
    }
    // Forward vers Sentry / autre logger externe
    this.props.onError?.(error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  handleReport = () => {
    try {
      const raw = localStorage.getItem('lastRenderError');
      const parsed = raw ? JSON.parse(raw) : null;
      const body = encodeURIComponent(
        `Bonjour,\n\nMa Diét vient de planter. Voici les infos techniques :\n\n${
          parsed ? JSON.stringify(parsed, null, 2) : '(pas de détails)'
        }\n\nMerci !`
      );
      const subject = encodeURIComponent('[BUG] Ma Diét plante');
      window.location.href = `mailto:lentreprise@lentreprise.ai?subject=${subject}&body=${body}`;
    } catch {
      window.location.href = 'mailto:lentreprise@lentreprise.ai?subject=[BUG] Ma Diét plante';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6 text-center">
          <div className="max-w-md">
            <div className="inline-flex h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 grid place-items-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Oups, Ma Diét a planté</h1>
            <p className="muted mb-6 text-sm leading-relaxed">
              Un bug inattendu s'est produit. Tes données sont en sécurité (stockées en local
              et synchronisées). Recharge la page, ou signale le bug pour qu'il soit fixé vite.
            </p>
            {this.state.error?.message && (
              <div className="text-xs muted font-mono bg-[var(--bg-subtle)] p-2 rounded mb-6 text-left break-all">
                {this.state.error.message.slice(0, 200)}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="btn-primary" onClick={this.handleReload}>
                <RefreshCcw size={14} /> Recharger
              </button>
              <button type="button" className="btn-outline" onClick={this.handleHome}>
                <Home size={14} /> Accueil
              </button>
              <button type="button" className="btn-outline" onClick={this.handleReport}>
                <Send size={14} /> Signaler
              </button>
            </div>
            <p className="text-[11px] muted mt-6">
              Erreur enregistrée localement. Tu peux copier-coller le détail ci-dessus si tu
              m'écris à lentreprise@lentreprise.ai — ça m'aidera à fixer.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
