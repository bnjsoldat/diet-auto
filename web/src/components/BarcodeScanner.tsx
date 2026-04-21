import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, ScanBarcode, X } from 'lucide-react';
import { isBarcodeDetectorSupported, startScanner, type ScannerStopFn } from '@/lib/barcode';
import { fetchOpenFoodFactsProduct } from '@/lib/openfoodfacts';
import { useCustomFoods } from '@/store/useCustomFoods';
import { vibrate } from '@/lib/haptic';
import type { Food } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (food: Food, grams: number) => void;
}

type Status = 'idle' | 'scanning' | 'searching' | 'found' | 'not-found' | 'error';

/**
 * Modal qui ouvre la webcam, scanne un code-barres (via BarcodeDetector natif),
 * puis interroge Open Food Facts et propose de confirmer + saisir une quantité.
 * Si la caméra ou l'API BarcodeDetector n'est pas dispo, l'utilisateur peut
 * saisir le code manuellement.
 */
export function BarcodeScanner({ open, onClose, onConfirm }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopScannerRef = useRef<ScannerStopFn | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [foundFood, setFoundFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState<number>(100);
  const addCustom = useCustomFoods((s) => s.addOrUpdate);

  // On tente toujours la caméra : si BarcodeDetector natif est absent,
  // @zxing/browser prend le relais via lib/barcode.ts.
  const native = isBarcodeDetectorSupported();
  // Détection iOS : Safari iOS n'a pas BarcodeDetector, tombe sur @zxing
  // qui est plus lent. On montre un message adapté.
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus('scanning');
    setErrorMsg('');
    setFoundFood(null);

    (async () => {
      try {
        // facingMode: string simple plus robuste que { ideal: ... } sur
        // certains iPad/iPhone anciens. Fallback sans facingMode si échec.
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
        } catch {
          // Plan B : sans contrainte de caméra (prend la 1re dispo)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // iOS exige playsinline + muted + autoplay ; on s'assure que play()
          // est explicitement déclenché et que son échec est loggué (certaines
          // versions d'iOS refusent si le site n'a pas été en "touched" mode).
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('video.play() failed on iOS, user may need to tap', playErr);
          }

          const stop = await startScanner(videoRef.current, (barcode) => {
            vibrate('medium');
            stopCamera();
            void lookup(barcode.rawValue);
          });
          if (cancelled) {
            stop();
            return;
          }
          stopScannerRef.current = stop;
        }
      } catch (e: any) {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(
          e?.name === 'NotAllowedError'
            ? 'Accès caméra refusé. Tu peux saisir le code à la main.'
            : 'Impossible d’accéder à la caméra. Saisis le code à la main.'
        );
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Quand la modal se ferme, reset complet
  useEffect(() => {
    if (!open) {
      stopCamera();
      setStatus('idle');
      setErrorMsg('');
      setManualCode('');
      setFoundFood(null);
      setGrams(100);
    }
  }, [open]);

  function stopCamera() {
    if (stopScannerRef.current) {
      stopScannerRef.current();
      stopScannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function lookup(code: string) {
    setStatus('searching');
    setErrorMsg('');
    try {
      const food = await fetchOpenFoodFactsProduct(code);
      if (!food) {
        setStatus('not-found');
        return;
      }
      setFoundFood(food);
      setStatus('found');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message ?? 'Erreur réseau.');
    }
  }

  function handleManualSearch() {
    const c = manualCode.trim();
    if (c.length < 6) return;
    stopCamera();
    lookup(c);
  }

  function handleConfirm() {
    if (!foundFood) return;
    addCustom(foundFood);
    onConfirm(foundFood, Math.max(1, Math.round(grams)));
    onClose();
  }

  function handleRestart() {
    setFoundFood(null);
    setManualCode('');
    setStatus('scanning');
    setErrorMsg('');
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-[var(--card)] border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <ScanBarcode size={18} className="text-emerald-600" />
            <h3 className="font-semibold">Scanner un produit</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded hover:bg-[var(--bg-subtle)]"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Video preview + indicator */}
          {!foundFood && status !== 'error' && (
            <div className="relative aspect-[4/3] bg-black rounded-md overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
              />
              <div className="absolute inset-0 pointer-events-none grid place-items-center">
                <div className="border-2 border-emerald-400/80 rounded-md w-3/4 h-1/3" />
              </div>
              {status === 'scanning' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white bg-black/70 px-3 py-1.5 rounded-md flex items-center gap-1.5 max-w-[90%] text-center">
                  <Camera size={12} className="shrink-0" />
                  <span>
                    {native
                      ? 'Vise le code-barres…'
                      : isIOS
                      ? 'Scan iOS : vise bien centré, lumière correcte, 3–5 s…'
                      : 'Scan en cours — tiens stable…'}
                  </span>
                </div>
              )}
              {status === 'searching' && (
                <div className="absolute inset-0 grid place-items-center bg-black/60 text-white text-sm gap-2">
                  <Loader2 size={28} className="animate-spin" />
                  <span>Recherche sur Open Food Facts…</span>
                </div>
              )}
            </div>
          )}

          {/* Manual input / fallback */}
          {!foundFood && status === 'error' && (
            <div className="space-y-2">
              {errorMsg && <p className="text-xs text-amber-600">{errorMsg}</p>}
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Code-barres (ex : 3017620422003)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleManualSearch}
                  disabled={manualCode.length < 6}
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Saisie manuelle toujours visible (plus gros sur iOS qui a un
              scanner plus lent). Pas caché dans un <details>. */}
          {!foundFood && status !== 'error' && (
            <div className="space-y-1.5">
              <label className="text-xs muted block">
                {isIOS
                  ? 'Tu peux aussi saisir le code à la main (plus rapide que le scan sur iPhone) :'
                  : 'Ou saisis le code à la main :'}
              </label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="13 chiffres (ex : 3017620422003)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleManualSearch}
                  disabled={manualCode.length < 6}
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Not found */}
          {status === 'not-found' && (
            <div className="space-y-2 text-sm">
              <p>Produit inconnu dans Open Food Facts, ou valeurs nutritionnelles manquantes.</p>
              <button
                type="button"
                className="btn"
                onClick={handleRestart}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Found : confirm */}
          {foundFood && (
            <div className="space-y-3">
              <div className="rounded-md border bg-[var(--bg-subtle)] p-3">
                <div className="font-medium text-sm">{foundFood.nom}</div>
                <div className="text-xs muted mt-1">
                  Pour 100 g : {Math.round(foundFood.kcal)} kcal · P{' '}
                  {foundFood.prot.toFixed(1)} · G {foundFood.gluc.toFixed(1)} · L{' '}
                  {foundFood.lip.toFixed(1)}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="text-xs muted block mb-1">Quantité (g)</span>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="2000"
                    value={grams || ''}
                    onChange={(e) => setGrams(Number(e.target.value) || 0)}
                  />
                </label>
                <button
                  type="button"
                  className={cn('btn', !grams && 'opacity-50 cursor-not-allowed')}
                  onClick={handleRestart}
                >
                  Autre
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirm}
                  disabled={!grams}
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
