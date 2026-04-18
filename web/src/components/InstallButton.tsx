import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { isStandalone, onInstallPromptAvailable, promptInstall } from '@/lib/pwa';

/**
 * Bouton d'installation PWA. Ne s'affiche que si :
 *  - Le navigateur a émis `beforeinstallprompt` (Chrome, Edge, Samsung)
 *  - L'app n'est pas déjà lancée en mode standalone
 */
export function InstallButton() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    return onInstallPromptAvailable(setAvailable);
  }, []);

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={promptInstall}
      className="inline-flex items-center gap-1.5 text-xs px-2.5 h-8 rounded-md border hover:bg-[var(--bg-subtle)] muted"
      title="Installer Ma Diét comme une app"
    >
      <Download size={14} />
      <span className="hidden sm:inline">Installer</span>
    </button>
  );
}
