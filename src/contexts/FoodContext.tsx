import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { FoodItem, FoodLogEntry, MealType, Macros } from '../types';
import { searchOpenFoodFacts, lookupBarcode } from '../lib/openfoodfacts';

// -------------------------------------------------------------------
// Demo food database
// -------------------------------------------------------------------
const DEMO_FOODS: FoodItem[] = [
  { id: 'f1', name: 'Greek Yogurt (2% Fage)', brand: 'Fage', serving_size: 200, serving_unit: 'g', macros: { calories: 130, protein: 20, carbs: 8, fat: 3, fiber: 0 }, source: 'openfoodfacts', verification_score: 95, verified: true, created_at: '' },
  { id: 'f2', name: 'Brown Rice (cooked)', serving_size: 195, serving_unit: 'g', macros: { calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 3 }, source: 'openfoodfacts', verification_score: 90, verified: true, created_at: '' },
  { id: 'f3', name: 'Banana (medium)', serving_size: 118, serving_unit: 'g', macros: { calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 }, source: 'openfoodfacts', verification_score: 98, verified: true, created_at: '' },
  { id: 'f4', name: 'Paneer Tikka', serving_size: 150, serving_unit: 'g', macros: { calories: 320, protein: 22, carbs: 5, fat: 24, fiber: 1 }, source: 'community', verification_score: 82, verified: true, created_at: '' },
  { id: 'f5', name: 'Whey Protein Shake', brand: 'ON Gold Standard', serving_size: 31, serving_unit: 'g', macros: { calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0 }, source: 'openfoodfacts', verification_score: 96, verified: true, created_at: '' },
  { id: 'f6', name: 'Peanut Butter', brand: 'Kraft', serving_size: 32, serving_unit: 'g', macros: { calories: 190, protein: 7, carbs: 7, fat: 16, fiber: 2 }, source: 'openfoodfacts', verification_score: 93, verified: true, created_at: '' },
  { id: 'f7', name: 'Whole Wheat Bread', serving_size: 43, serving_unit: 'g', macros: { calories: 110, protein: 4, carbs: 20, fat: 2, fiber: 3 }, source: 'openfoodfacts', verification_score: 88, verified: true, created_at: '' },
  { id: 'f8', name: 'Chickpeas (cooked)', serving_size: 164, serving_unit: 'g', macros: { calories: 269, protein: 15, carbs: 45, fat: 4, fiber: 12 }, source: 'openfoodfacts', verification_score: 91, verified: true, created_at: '' },
  { id: 'f9', name: 'Scrambled Tofu', serving_size: 200, serving_unit: 'g', macros: { calories: 210, protein: 18, carbs: 6, fat: 13, fiber: 2 }, source: 'community', verification_score: 78, verified: false, created_at: '' },
  { id: 'f10', name: 'Oatmeal (cooked)', serving_size: 234, serving_unit: 'g', macros: { calories: 154, protein: 6, carbs: 27, fat: 3, fiber: 4 }, source: 'openfoodfacts', verification_score: 95, verified: true, created_at: '' },
  { id: 'f11', name: 'Lentil Soup (Dal)', serving_size: 250, serving_unit: 'ml', macros: { calories: 230, protein: 14, carbs: 35, fat: 4, fiber: 8 }, source: 'community', verification_score: 80, verified: true, created_at: '' },
  { id: 'f12', name: 'Almonds (raw)', serving_size: 28, serving_unit: 'g', macros: { calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3 }, source: 'openfoodfacts', verification_score: 97, verified: true, created_at: '' },
];

const today = new Date().toISOString().split('T')[0];

function scaleMacros(m: Macros, factor: number): Macros {
  return {
    calories: Math.round(m.calories * factor),
    protein: Math.round(m.protein * factor),
    carbs: Math.round(m.carbs * factor),
    fat: Math.round(m.fat * factor),
    fiber: m.fiber ? Math.round(m.fiber * factor) : undefined,
  };
}

// Generate demo trend history (last 7 days)
function generateDemoTrends() {
  const history: { date: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    history.push({
      date: d.toISOString().split('T')[0],
      calories: 1800 + Math.floor(Math.random() * 600),
      protein: 120 + Math.floor(Math.random() * 60),
      carbs: 180 + Math.floor(Math.random() * 80),
      fat: 50 + Math.floor(Math.random() * 30),
    });
  }
  return history;
}

// Generate demo weight entries (last 30 days)
function generateDemoWeightHistory() {
  const entries: { date: string; weight: number; smoothed: number }[] = [];
  let weight = 76.2;
  let smoothed = weight;
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weight += (Math.random() - 0.55) * 0.4;
    smoothed = 0.15 * weight + 0.85 * smoothed;
    entries.push({
      date: d.toISOString().split('T')[0],
      weight: parseFloat(weight.toFixed(1)),
      smoothed: parseFloat(smoothed.toFixed(1)),
    });
  }
  return entries;
}

const DEMO_ENTRIES: FoodLogEntry[] = [
  { id: 'e1', user_id: 'demo', food_item_id: 'f10', food_item: DEMO_FOODS[9], meal_type: 'breakfast', servings: 1, macros: DEMO_FOODS[9].macros, date: today, created_at: '' },
  { id: 'e2', user_id: 'demo', food_item_id: 'f3', food_item: DEMO_FOODS[2], meal_type: 'breakfast', servings: 1, macros: DEMO_FOODS[2].macros, date: today, created_at: '' },
  { id: 'e3', user_id: 'demo', food_item_id: 'f5', food_item: DEMO_FOODS[4], meal_type: 'breakfast', servings: 1, macros: DEMO_FOODS[4].macros, date: today, created_at: '' },
  { id: 'e4', user_id: 'demo', food_item_id: 'f11', food_item: DEMO_FOODS[10], meal_type: 'lunch', servings: 1.5, macros: scaleMacros(DEMO_FOODS[10].macros, 1.5), date: today, created_at: '' },
  { id: 'e5', user_id: 'demo', food_item_id: 'f2', food_item: DEMO_FOODS[1], meal_type: 'lunch', servings: 1, macros: DEMO_FOODS[1].macros, date: today, created_at: '' },
];

// -------------------------------------------------------------------
// Context type
// -------------------------------------------------------------------
interface FoodContextType {
  foods: FoodItem[];
  entries: FoodLogEntry[];
  waterMl: number;
  weightHistory: { date: string; weight: number; smoothed: number }[];
  trendData: { date: string; calories: number; protein: number; carbs: number; fat: number }[];
  currentStreak: number;
  longestStreak: number;
  searchFoods: (query: string) => FoodItem[];
  searchOnline: (query: string) => Promise<FoodItem[]>;
  scanBarcode: (barcode: string) => Promise<FoodItem | null>;
  addEntry: (food: FoodItem, mealType: MealType, servings: number) => void;
  addQuickEntry: (name: string, macros: Macros, mealType: MealType) => void;
  removeEntry: (id: string) => void;
  addWater: (ml: number) => void;
  addWeight: (weight: number) => void;
  addCustomFood: (food: Omit<FoodItem, 'id' | 'created_at' | 'verification_score' | 'verified'>) => FoodItem;
}

const FoodContext = createContext<FoodContextType>({} as FoodContextType);

export function FoodProvider({ children }: { children: ReactNode }) {
  const [foods, setFoods] = useState<FoodItem[]>(DEMO_FOODS);
  const [entries, setEntries] = useState<FoodLogEntry[]>(DEMO_ENTRIES);
  const [waterMl, setWaterMl] = useState(1500);
  const [weightHistory, setWeightHistory] = useState(generateDemoWeightHistory);
  const [trendData] = useState(generateDemoTrends);
  const [onlineCache, setOnlineCache] = useState<FoodItem[]>([]);

  // Streak calculation
  const currentStreak = (() => {
    const todayHasEntries = entries.some((e) => e.date === today);
    if (!todayHasEntries) return 0;
    let streak = 1;
    for (let i = 1; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasData = entries.some((e) => e.date === dateStr) || trendData.some((t) => t.date === dateStr);
      if (hasData) streak++;
      else break;
    }
    return streak;
  })();

  const searchFoods = useCallback(
    (query: string): FoodItem[] => {
      const all = [...foods, ...onlineCache];
      if (!query.trim()) return foods.slice(0, 8);
      const q = query.toLowerCase();
      const seen = new Set<string>();
      return all
        .filter((f) => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q);
        })
        .sort((a, b) => b.verification_score - a.verification_score)
        .slice(0, 20);
    },
    [foods, onlineCache]
  );

  const searchOnline = useCallback(async (query: string): Promise<FoodItem[]> => {
    try {
      const results = await searchOpenFoodFacts(query);
      setOnlineCache((prev) => {
        const ids = new Set(prev.map((f) => f.id));
        return [...prev, ...results.filter((f) => !ids.has(f.id))];
      });
      return results;
    } catch {
      return [];
    }
  }, []);

  const scanBarcode = useCallback(async (barcode: string): Promise<FoodItem | null> => {
    return lookupBarcode(barcode);
  }, []);

  const addEntry = useCallback((food: FoodItem, mealType: MealType, servings: number) => {
    const entry: FoodLogEntry = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: 'demo',
      food_item_id: food.id,
      food_item: food,
      meal_type: mealType,
      servings,
      macros: scaleMacros(food.macros, servings),
      date: today,
      created_at: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, entry]);
  }, []);

  const addQuickEntry = useCallback((name: string, macros: Macros, mealType: MealType) => {
    const entry: FoodLogEntry = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: 'demo',
      custom_name: name,
      meal_type: mealType,
      servings: 1,
      macros,
      date: today,
      created_at: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, entry]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addWater = useCallback((ml: number) => {
    setWaterMl((prev) => prev + ml);
  }, []);

  const addWeight = useCallback((weight: number) => {
    setWeightHistory((prev) => {
      const last = prev.length > 0 ? prev[prev.length - 1] : null;
      const smoothed = last ? 0.15 * weight + 0.85 * last.smoothed : weight;
      const existing = prev.findIndex((e) => e.date === today);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date: today, weight, smoothed: parseFloat(smoothed.toFixed(1)) };
        return updated;
      }
      return [...prev, { date: today, weight, smoothed: parseFloat(smoothed.toFixed(1)) }];
    });
  }, []);

  const addCustomFood = useCallback(
    (food: Omit<FoodItem, 'id' | 'created_at' | 'verification_score' | 'verified'>): FoodItem => {
      const newFood: FoodItem = {
        ...food,
        id: `custom-${Date.now()}`,
        verification_score: 0,
        verified: false,
        created_at: new Date().toISOString(),
      };
      setFoods((prev) => [newFood, ...prev]);
      return newFood;
    },
    []
  );

  return (
    <FoodContext.Provider
      value={{
        foods, entries, waterMl, weightHistory, trendData,
        currentStreak, longestStreak: Math.max(currentStreak, 14),
        searchFoods, searchOnline, scanBarcode,
        addEntry, addQuickEntry, removeEntry,
        addWater, addWeight, addCustomFood,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
}

export const useFood = () => useContext(FoodContext);
