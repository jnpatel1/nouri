// ============================================================
// OpenFoodFacts API Integration
// Free, open-source food database with barcode support
// https://world.openfoodfacts.org/
// ============================================================

import type { FoodItem, Macros } from '../types';

const BASE_URL = import.meta.env.VITE_OPENFOODFACTS_API || 'https://world.openfoodfacts.org/api/v2';

interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    fiber_100g?: number;
    fiber_serving?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
}

function parseOFFProduct(product: OFFProduct): FoodItem | null {
  if (!product.product_name || !product.nutriments) return null;

  const n = product.nutriments;
  const hasServing = n['energy-kcal_serving'] != null;
  const servingSize = product.serving_quantity || (hasServing ? 1 : 100);
  const servingUnit = hasServing ? (product.serving_size || 'serving') : 'g';

  const macros: Macros = hasServing
    ? {
        calories: Math.round(n['energy-kcal_serving'] || 0),
        protein: Math.round(n.proteins_serving || 0),
        carbs: Math.round(n.carbohydrates_serving || 0),
        fat: Math.round(n.fat_serving || 0),
        fiber: Math.round(n.fiber_serving || 0),
      }
    : {
        calories: Math.round(n['energy-kcal_100g'] || 0),
        protein: Math.round(n.proteins_100g || 0),
        carbs: Math.round(n.carbohydrates_100g || 0),
        fat: Math.round(n.fat_100g || 0),
        fiber: Math.round(n.fiber_100g || 0),
      };

  // Skip items with obviously bad data
  if (macros.calories === 0 && macros.protein === 0 && macros.carbs === 0) return null;

  return {
    id: `off-${product.code}`,
    name: product.product_name,
    brand: product.brands?.split(',')[0]?.trim(),
    barcode: product.code,
    serving_size: servingSize,
    serving_unit: servingUnit,
    macros,
    source: 'openfoodfacts',
    verification_score: 85,
    verified: true,
    created_at: new Date().toISOString(),
  };
}

/**
 * Search OpenFoodFacts by text query
 */
export async function searchOpenFoodFacts(query: string, page: number = 1): Promise<FoodItem[]> {
  try {
    const url = `${BASE_URL}/search?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=15&page=${page}&fields=code,product_name,brands,serving_size,serving_quantity,nutriments`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Nouri/1.0 (https://nouri.app)',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const products: OFFProduct[] = data.products || [];

    return products
      .map(parseOFFProduct)
      .filter((item): item is FoodItem => item !== null);
  } catch (error) {
    console.error('OpenFoodFacts search error:', error);
    return [];
  }
}

/**
 * Lookup a product by barcode
 */
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=code,product_name,brands,serving_size,serving_quantity,nutriments`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Nouri/1.0 (https://nouri.app)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    return parseOFFProduct(data.product);
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return null;
  }
}
