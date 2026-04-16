/**
 * Wrapper minimal autour de l'API BarcodeDetector (Chrome/Edge sur Android +
 * desktop récent). Pour Safari/Firefox qui n'implémentent pas encore l'API,
 * on expose `isBarcodeDetectorSupported()` pour afficher un fallback manuel.
 */

export interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorLike {
  detect(image: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (config?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).BarcodeDetector === 'function';
}

export function createDetector(): BarcodeDetectorLike | null {
  if (!isBarcodeDetectorSupported()) return null;
  const Ctor = (window as any).BarcodeDetector as BarcodeDetectorCtor;
  return new Ctor({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
  });
}
