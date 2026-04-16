import { useState } from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import type { DayPlan } from '@/types';
import { buildShareUrl } from '@/lib/share';
import { cn } from '@/lib/utils';

interface Props {
  plan: DayPlan;
}

/**
 * Bouton "Partager" qui génère une URL contenant le plan encodé, puis :
 * - tente l'API `navigator.share` si dispo (mobile),
 * - sinon ouvre une modal avec l'URL copiable.
 */
export function ShareButton({ plan }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const itemsCount = plan.meals.reduce((s, m) => s + m.items.length, 0);
    if (itemsCount === 0) {
      alert('Ajoute au moins un aliment avant de partager.');
      return;
    }

    const link = buildShareUrl(plan);
    setUrl(link);
    setCopied(false);

    // Sur mobile, tenter le partage natif (app messagerie, mail, etc.)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (data: { title: string; text: string; url: string }) => Promise<void> }).share({
          title: 'Mon plan Diét Auto',
          text: 'Voici le plan alimentaire que je te partage :',
          url: link,
        });
        return;
      } catch {
        // utilisateur a annulé ou share a échoué → fallback modal
      }
    }

    setOpen(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignorer, utilisateur peut sélectionner manuellement
    }
  }

  return (
    <>
      <button type="button" className="btn-outline" onClick={handleClick}>
        <Share2 size={14} /> Partager
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-[var(--card)] border shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-emerald-600" />
                <h3 className="font-semibold">Partager ce plan</h3>
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
              <p className="muted">
                Envoie ce lien. En l’ouvrant, l’autre personne verra ton plan et pourra l’importer
                dans son propre suivi.
              </p>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-xs font-mono"
                  value={url}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className={cn('btn-primary min-w-[90px]')}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copié !
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copier
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs muted">
                Le lien contient uniquement les aliments et quantités — aucune donnée personnelle.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
