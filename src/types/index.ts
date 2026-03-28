// ============================================================
// Nouri Type Definitions
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  age?: number;
  sex?: 'male' | 'female';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: ActivityLevel;
  goal?: FitnessGoal;
  created_at: string;
  updated_at: string;
}

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type FitnessGoal =
  | 'lose_fast'    // -1000 kcal
  | 'lose'         // -500 kcal
  | 'lose_slow'    // -250 kcal
  | 'maintain'     //  0
  | 'gain_slow'    // +250 kcal
  | 'gain'         // +500 kcal

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  serving_size: number;
  serving_unit: string;
  macros: Macros;
  source: 'openfoodfacts' | 'community' | 'personal' | 'ai_recognized';
  verification_score: number;
  verified: boolean;
  created_by?: string;
  created_at: string;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  food_item_id?: string;
  food_item?: FoodItem;
  custom_name?: string;
  meal_type: MealType;
  servings: number;
  macros: Macros;
  date: string; // YYYY-MM-DD
  image_url?: string;
  notes?: string;
  created_at: string;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DailySummary {
  date: string;
  consumed: Macros;
  targets: DailyTargets;
  entries: FoodLogEntry[];
  water_ml: number;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  date: string;
  created_at: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  amount_ml: number;
  date: string;
  created_at: string;
}

export interface AIFoodRecognition {
  foods: {
    name: string;
    estimated_amount: string;
    confidence: number;
    macros: Macros;
  }[];
  image_url?: string;
}

// Activity level multipliers for TDEE (Mifflin-St Jeor)
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export const GOAL_ADJUSTMENTS: Record<FitnessGoal, number> = {
  lose_fast: -1000,
  lose: -500,
  lose_slow: -250,
  maintain: 0,
  gain_slow: 250,
  gain: 500,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (desk job, little exercise)',
  lightly_active: 'Light (1-3 days/week)',
  moderately_active: 'Moderate (3-5 days/week)',
  very_active: 'Very Active (6-7 days/week)',
  extremely_active: 'Extreme (2x/day, physical job)',
};

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_fast: 'Lose fast (-1000 kcal/day)',
  lose: 'Lose (-500 kcal/day)',
  lose_slow: 'Lose slowly (-250 kcal/day)',
  maintain: 'Maintain weight',
  gain_slow: 'Gain slowly (+250 kcal/day)',
  gain: 'Gain (+500 kcal/day)',
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};
