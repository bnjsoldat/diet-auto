import type { Food } from '@/types';

/**
 * Résultat brut d'Open Food Facts pour l'endpoint v2 produit.
 * Seuls les champs utiles sont typés — l'API en renvoie bien plus.
 */
interface OFFProduct {
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  generic_name_fr?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    energy_100g?: number; // parfois en kJ
    energy_unit?: 'kcal' | 'kJ' | string;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  code?: string;
}

interface OFFResponse {
  status: 0 | 1;
  status_verbose?: string;
  product?: OFFProduct;
  code?: string;
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';

/** Requête minimale : on demande seulement les champs qu'on utilise, pour limiter le payload. */
const OFF_FIELDS = 'product_name,product_name_fr,brands,generic_name_fr,nutriments,code';

/**
 * Récupère un produit par code-barres depuis Open Food Facts.
 * Retourne null si le produit n'existe pas ou si les valeurs nutritionnelles
 * minimales (kcal/P/G/L) sont absentes.
 */
export async function fetchOpenFoodFactsProduct(barcode: string): Promise<Food | null> {
  const bc = barcode.trim();
  if (!/^\d{6,14}$/.test(bc)) return null;

  let res: Response;
  try {
    res = await fetch(`${OFF_BASE}/${bc}.json?fields=${encodeURIComponent(OFF_FIELDS)}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('Connexion Open Food Facts impossible. Vérifie ton réseau.');
  }

  if (!res.ok) throw new Error(`Open Food Facts a répondu ${res.status}.`);

  const json = (await res.json()) as OFFResponse;
  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  const n = p.nutriments ?? {};

  // kcal : privilégie energy-kcal_100g, sinon convertit energy_100g si l'unité est kJ
  let kcal = typeof n['energy-kcal_100g'] === 'number' ? n['energy-kcal_100g'] : NaN;
  if (!Number.isFinite(kcal) && typeof n.energy_100g === 'number') {
    kcal = n.energy_unit === 'kJ' || n.energy_unit === 'kj' ? n.energy_100g / 4.184 : n.energy_100g;
  }
  const prot = typeof n.proteins_100g === 'number' ? n.proteins_100g : NaN;
  const gluc = typeof n.carbohydrates_100g === 'number' ? n.carbohydrates_100g : NaN;
  const lip = typeof n.fat_100g === 'number' ? n.fat_100g : NaN;

  if (![kcal, prot, gluc, lip].every((x) => Number.isFinite(x))) {
    return null;
  }

  // Nom affiché : privilégier le nom FR puis marque + nom
  const baseName = p.product_name_fr || p.product_name || p.generic_name_fr || `Produit ${bc}`;
  const nom = p.brands ? `${baseName} (${p.brands.split(',')[0].trim()})` : baseName;

  return {
    nom: nom.trim(),
    groupe: 'perso',
    kcal: Math.round(kcal * 10) / 10,
    prot: Math.round(prot * 10) / 10,
    gluc: Math.round(gluc * 10) / 10,
    lip: Math.round(lip * 10) / 10,
  };
}
