// ============================================================
// TDEE Calculation Engine
// Uses Mifflin-St Jeor (most validated for general population)
// with macro split recommendations from sports nutrition research
// ============================================================

import {
  ActivityLevel,
  FitnessGoal,
  DailyTargets,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
} from '../types';

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * Mifflin MD, St Jeor ST, et al. (1990) - most accurate for both
 * normal weight and overweight individuals.
 *
 * Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
 * Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
 */
export function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: 'male' | 'female'
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Multiplier + Goal Adjustment
 */
export function calculateTDEE(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: 'male' | 'female',
  activity: ActivityLevel,
  goal: FitnessGoal
): number {
  const bmr = calculateBMR(weight_kg, height_cm, age, sex);
  const maintenanceTDEE = bmr * ACTIVITY_MULTIPLIERS[activity];
  const adjustedTDEE = maintenanceTDEE + GOAL_ADJUSTMENTS[goal];

  // Floor at 1200 for women, 1500 for men (safety minimum)
  const minimum = sex === 'female' ? 1200 : 1500;
  return Math.round(Math.max(adjustedTDEE, minimum));
}

/**
 * Calculate macro targets based on calorie goal and body composition research.
 *
 * Protein: 1.6-2.2g/kg for active individuals (Schoenfeld & Aragon, 2018)
 * We use 2.0g/kg in deficit, 1.8g/kg at maintenance, 1.6g/kg in surplus
 * to prioritize muscle preservation during cuts.
 *
 * Fat: 25-35% of total calories (minimum 0.5g/kg for hormonal health)
 * Carbs: Remainder after protein and fat
 */
export function calculateMacroTargets(
  calories: number,
  weight_kg: number,
  goal: FitnessGoal
): DailyTargets {
  // Protein scaling based on goal
  let proteinPerKg: number;
  if (goal === 'lose_fast' || goal === 'lose') {
    proteinPerKg = 2.0; // Higher protein in deficit preserves lean mass
  } else if (goal === 'lose_slow' || goal === 'maintain') {
    proteinPerKg = 1.8;
  } else {
    proteinPerKg = 1.6; // Surplus needs less relative protein
  }

  const protein = Math.round(weight_kg * proteinPerKg);
  const proteinCals = protein * 4;

  // Fat: 28% of total calories, floored at 0.5g/kg
  const fatFromPercent = Math.round((calories * 0.28) / 9);
  const fatMinimum = Math.round(weight_kg * 0.5);
  const fat = Math.max(fatFromPercent, fatMinimum);
  const fatCals = fat * 9;

  // Carbs: whatever remains
  const carbCals = Math.max(calories - proteinCals - fatCals, 0);
  const carbs = Math.round(carbCals / 4);

  // Fiber: 14g per 1000 kcal (Institute of Medicine recommendation)
  const fiber = Math.round((calories / 1000) * 14);

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
    fiber,
  };
}

/**
 * Full target calculation from user profile
 */
export function calculateDailyTargets(profile: {
  weight_kg: number;
  height_cm: number;
  age: number;
  sex: 'male' | 'female';
  activity_level: ActivityLevel;
  goal: FitnessGoal;
}): DailyTargets {
  const calories = calculateTDEE(
    profile.weight_kg,
    profile.height_cm,
    profile.age,
    profile.sex,
    profile.activity_level,
    profile.goal
  );

  return calculateMacroTargets(calories, profile.weight_kg, profile.goal);
}

/**
 * Adaptive TDEE (Phase 2):
 * Takes 14-day rolling window of weight + calorie data.
 * Uses exponential moving average to smooth weight fluctuations.
 * Calculates actual TDEE from energy balance equation.
 *
 * Actual TDEE = avg_calories - (weight_change_kg × 7700 / days)
 * (7700 kcal ≈ 1 kg of body weight change)
 */
export function calculateAdaptiveTDEE(
  entries: { date: string; weight_kg: number; calories: number }[]
): number | null {
  if (entries.length < 10) return null; // Need at least 10 days

  // Exponential moving average for weight smoothing
  const alpha = 0.1; // Smoothing factor
  let smoothedWeights: number[] = [entries[0].weight_kg];
  for (let i = 1; i < entries.length; i++) {
    smoothedWeights.push(
      alpha * entries[i].weight_kg + (1 - alpha) * smoothedWeights[i - 1]
    );
  }

  const weightChange =
    smoothedWeights[smoothedWeights.length - 1] - smoothedWeights[0];
  const avgCalories =
    entries.reduce((sum, e) => sum + e.calories, 0) / entries.length;
  const days = entries.length;

  // 7700 kcal per kg of body weight
  const dailyWeightCalories = (weightChange * 7700) / days;
  const actualTDEE = avgCalories - dailyWeightCalories;

  return Math.round(actualTDEE);
}
