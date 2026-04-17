/**
 * Scanner de code-barres unifié : utilise l'API BarcodeDetector native
 * quand elle est disponible (Chrome/Edge Android+desktop), et retombe sur
 * @zxing/browser en dynamic import pour Safari iOS, Firefox et autres.
 */

export interface DetectedBarcode {
  rawValue: string;
  format: string;
}

export type ScannerStopFn = () => void;

interface BarcodeDetectorLike {
  detect(image: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (config?: { formats?: string[] }): BarcodeDetectorLike;
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).BarcodeDetector === 'function';
}

/**
 * Démarre un scanner sur un <video> donné. Le callback `onDetect` reçoit
 * la première valeur lue puis le scanner s'arrête (l'appelant peut
 * relancer si besoin). Renvoie une fonction de stop explicite.
 */
export async function startScanner(
  video: HTMLVideoElement,
  onDetect: (barcode: DetectedBarcode) => void
): Promise<ScannerStopFn> {
  // Voie 1 : BarcodeDetector natif
  if (isBarcodeDetectorSupported()) {
    const Ctor = (window as any).BarcodeDetector as BarcodeDetectorCtor;
    const detector = new Ctor({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
    });
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      if (cancelled) return;
      try {
        const list = await detector.detect(video);
        if (list.length > 0 && !cancelled) {
          cancelled = true;
          onDetect(list[0]);
          return;
        }
      } catch {
        /* ticks peuvent lever, on ignore */
      }
      timer = setTimeout(tick, 400);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }

  // Voie 2 : fallback @zxing/browser (dynamic import, ~150 KB gzip)
  try {
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const reader = new BrowserMultiFormatReader();
    let stopped = false;
    // decodeFromVideoElement appelle son callback à chaque frame décodée
    const controls = await reader.decodeFromVideoElement(video, (result, _err, ctl) => {
      if (stopped) return;
      if (result) {
        stopped = true;
        onDetect({ rawValue: result.getText(), format: String(result.getBarcodeFormat()) });
        ctl.stop();
      }
    });
    return () => {
      stopped = true;
      try {
        controls.stop();
      } catch {
        /* ignore */
      }
    };
  } catch (err) {
    console.warn('@zxing/browser indisponible', err);
    return () => {};
  }
}
