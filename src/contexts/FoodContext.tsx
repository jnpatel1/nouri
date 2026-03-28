import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { FoodItem, FoodLogEntry, MealType, Macros, DailySummary } from '../types';

// -------------------------------------------------------------------
// Demo food database (realistic items, accurate macros)
// -------------------------------------------------------------------
const DEMO_FOODS: FoodItem[] = [
  {
    id: 'f1', name: 'Greek Yogurt (2% Fage)', brand: 'Fage', serving_size: 200, serving_unit: 'g',
    macros: { calories: 130, protein: 20, carbs: 8, fat: 3, fiber: 0 },
    source: 'openfoodfacts', verification_score: 95, verified: true, created_at: '',
  },
  {
    id: 'f2', name: 'Brown Rice (cooked)', serving_size: 195, serving_unit: 'g',
    macros: { calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 3 },
    source: 'openfoodfacts', verification_score: 90, verified: true, created_at: '',
  },
  {
    id: 'f3', name: 'Banana (medium)', serving_size: 118, serving_unit: 'g',
    macros: { calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 },
    source: 'openfoodfacts', verification_score: 98, verified: true, created_at: '',
  },
  {
    id: 'f4', name: 'Paneer Tikka', serving_size: 150, serving_unit: 'g',
    macros: { calories: 320, protein: 22, carbs: 5, fat: 24, fiber: 1 },
    source: 'community', verification_score: 82, verified: true, created_at: '',
  },
  {
    id: 'f5', name: 'Whey Protein Shake', brand: 'ON Gold Standard', serving_size: 31, serving_unit: 'g',
    macros: { calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0 },
    source: 'openfoodfacts', verification_score: 96, verified: true, created_at: '',
  },
  {
    id: 'f6', name: 'Peanut Butter', brand: 'Kraft', serving_size: 32, serving_unit: 'g',
    macros: { calories: 190, protein: 7, carbs: 7, fat: 16, fiber: 2 },
    source: 'openfoodfacts', verification_score: 93, verified: true, created_at: '',
  },
  {
    id: 'f7', name: 'Whole Wheat Bread', serving_size: 43, serving_unit: 'g',
    macros: { calories: 110, protein: 4, carbs: 20, fat: 2, fiber: 3 },
    source: 'openfoodfacts', verification_score: 88, verified: true, created_at: '',
  },
  {
    id: 'f8', name: 'Chickpeas (cooked)', serving_size: 164, serving_unit: 'g',
    macros: { calories: 269, protein: 15, carbs: 45, fat: 4, fiber: 12 },
    source: 'openfoodfacts', verification_score: 91, verified: true, created_at: '',
  },
  {
    id: 'f9', name: 'Scrambled Tofu', serving_size: 200, serving_unit: 'g',
    macros: { calories: 210, protein: 18, carbs: 6, fat: 13, fiber: 2 },
    source: 'community', verification_score: 78, verified: false, created_at: '',
  },
  {
    id: 'f10', name: 'Oatmeal (cooked)', serving_size: 234, serving_unit: 'g',
    macros: { calories: 154, protein: 6, carbs: 27, fat: 3, fiber: 4 },
    source: 'openfoodfacts', verification_score: 95, verified: true, created_at: '',
  },
  {
    id: 'f11', name: 'Lentil Soup (Dal)', serving_size: 250, serving_unit: 'ml',
    macros: { calories: 230, protein: 14, carbs: 35, fat: 4, fiber: 8 },
    source: 'community', verification_score: 80, verified: true, created_at: '',
  },
  {
    id: 'f12', name: 'Almonds (raw)', serving_size: 28, serving_unit: 'g',
    macros: { calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3 },
    source: 'openfoodfacts', verification_score: 97, verified: true, created_at: '',
  },
];

// Demo log entries for today
const today = new Date().toISOString().split('T')[0];

const DEMO_ENTRIES: FoodLogEntry[] = [
  {
    id: 'e1', user_id: 'demo', food_item_id: 'f10', food_item: DEMO_FOODS[9],
    meal_type: 'breakfast', servings: 1, macros: DEMO_FOODS[9].macros, date: today, created_at: '',
  },
  {
    id: 'e2', user_id: 'demo', food_item_id: 'f3', food_item: DEMO_FOODS[2],
    meal_type: 'breakfast', servings: 1, macros: DEMO_FOODS[2].macros, date: today, created_at: '',
  },
  {
    id: 'e3', user_id: 'demo', food_item_id: 'f5', food_item: DEMO_FOODS[4],
    meal_type: 'breakfast', servings: 1, macros: DEMO_FOODS[4].macros, date: today, created_at: '',
  },
  {
    id: 'e4', user_id: 'demo', food_item_id: 'f11', food_item: DEMO_FOODS[10],
    meal_type: 'lunch', servings: 1.5, macros: scaleMacros(DEMO_FOODS[10].macros, 1.5), date: today, created_at: '',
  },
  {
    id: 'e5', user_id: 'demo', food_item_id: 'f2', food_item: DEMO_FOODS[1],
    meal_type: 'lunch', servings: 1, macros: DEMO_FOODS[1].macros, date: today, created_at: '',
  },
];

function scaleMacros(m: Macros, factor: number): Macros {
  return {
    calories: Math.round(m.calories * factor),
    protein: Math.round(m.protein * factor),
    carbs: Math.round(m.carbs * factor),
    fat: Math.round(m.fat * factor),
    fiber: m.fiber ? Math.round(m.fiber * factor) : undefined,
  };
}

function sumMacros(entries: FoodLogEntry[]): Macros {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.macros.calories,
      protein: acc.protein + e.macros.protein,
      carbs: acc.carbs + e.macros.carbs,
      fat: acc.fat + e.macros.fat,
      fiber: (acc.fiber || 0) + (e.macros.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

// -------------------------------------------------------------------
// Context
// -------------------------------------------------------------------
interface FoodContextType {
  foods: FoodItem[];
  entries: FoodLogEntry[];
  dailySummary: DailySummary;
  waterMl: number;
  searchFoods: (query: string) => FoodItem[];
  addEntry: (food: FoodItem, mealType: MealType, servings: number) => void;
  removeEntry: (id: string) => void;
  addWater: (ml: number) => void;
  addCustomFood: (food: Omit<FoodItem, 'id' | 'created_at' | 'verification_score' | 'verified'>) => FoodItem;
}

const FoodContext = createContext<FoodContextType>({} as FoodContextType);

export function FoodProvider({ children }: { children: ReactNode }) {
  const [foods, setFoods] = useState<FoodItem[]>(DEMO_FOODS);
  const [entries, setEntries] = useState<FoodLogEntry[]>(DEMO_ENTRIES);
  const [waterMl, setWaterMl] = useState(1500);

  const searchFoods = useCallback(
    (query: string): FoodItem[] => {
      if (!query.trim()) return foods.slice(0, 8);
      const q = query.toLowerCase();
      return foods
        .filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.brand?.toLowerCase().includes(q)
        )
        .sort((a, b) => b.verification_score - a.verification_score);
    },
    [foods]
  );

  const addEntry = useCallback(
    (food: FoodItem, mealType: MealType, servings: number) => {
      const entry: FoodLogEntry = {
        id: `e-${Date.now()}`,
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
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addWater = useCallback((ml: number) => {
    setWaterMl((prev) => prev + ml);
  }, []);

  const addCustomFood = useCallback(
    (
      food: Omit<FoodItem, 'id' | 'created_at' | 'verification_score' | 'verified'>
    ): FoodItem => {
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

  const consumed = sumMacros(entries);
  const dailySummary: DailySummary = {
    date: today,
    consumed,
    targets: { calories: 2000, protein: 150, carbs: 200, fat: 67, fiber: 28 },
    entries,
    water_ml: waterMl,
  };

  return (
    <FoodContext.Provider
      value={{
        foods,
        entries,
        dailySummary,
        waterMl,
        searchFoods,
        addEntry,
        removeEntry,
        addWater,
        addCustomFood,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
}

export const useFood = () => useContext(FoodContext);
