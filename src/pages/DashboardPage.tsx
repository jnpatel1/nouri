import { useState } from 'react';
import { Plus, Camera, Mic, TrendingUp, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFood } from '../contexts/FoodContext';
import { NavBar } from '../components/NavBar';
import { CalorieBar } from '../components/CalorieBar';
import { MacroRing } from '../components/MacroRing';
import { MealSection } from '../components/MealSection';
import { WaterTracker } from '../components/WaterTracker';
import { FoodSearchModal } from '../components/FoodSearchModal';
import type { MealType } from '../types';

export function DashboardPage() {
  const { user, targets } = useAuth();
  const { entries, waterMl, removeEntry, addWater } = useFood();
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMeal, setSearchMeal] = useState<MealType>('breakfast');

  const todayEntries = entries.filter((e) => e.date === currentDate);
  const consumed = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.macros.calories,
      protein: acc.protein + e.macros.protein,
      carbs: acc.carbs + e.macros.carbs,
      fat: acc.fat + e.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const navigateDay = (offset: number) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    const today = new Date().toISOString().split('T')[0];
    const target = d.toISOString().split('T')[0];
    if (target <= today) setCurrentDate(target);
  };

  const openSearch = (meal: MealType) => {
    setSearchMeal(meal);
    setSearchOpen(true);
  };

  // Calculate a daily "score" based on macro adherence
  const macroScore = (() => {
    if (consumed.calories === 0) return null;
    const calPct = Math.min(consumed.calories / targets.calories, 1);
    const protPct = Math.min(consumed.protein / targets.protein, 1);
    const calAccuracy = 1 - Math.abs(1 - consumed.calories / targets.calories);
    const score = Math.round((calAccuracy * 0.4 + protPct * 0.4 + calPct * 0.2) * 100);
    return Math.max(0, Math.min(100, score));
  })();

  return (
    <div className="min-h-dvh" style={{ background: 'var(--surface)' }}>
      <NavBar
        currentDate={currentDate}
        onPrevDay={() => navigateDay(-1)}
        onNextDay={() => navigateDay(1)}
        onToday={() => setCurrentDate(new Date().toISOString().split('T')[0])}
      />

      <main className="max-w-lg mx-auto px-4 pb-28">
        {/* Greeting */}
        <div className="pt-5 pb-2">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {getGreeting()}, <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.display_name?.split(' ')[0]}</span>
          </p>
        </div>

        {/* Calorie bar */}
        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: 'var(--surface-raised)', boxShadow: 'var(--shadow-sm)' }}
        >
          <CalorieBar consumed={consumed.calories} target={targets.calories} />

          {/* Macro rings */}
          <div className="flex justify-center gap-6 mt-6">
            <MacroRing
              value={consumed.protein}
              max={targets.protein}
              color="var(--protein)"
              label="Protein"
              size={96}
              strokeWidth={6}
            />
            <MacroRing
              value={consumed.carbs}
              max={targets.carbs}
              color="var(--carbs)"
              label="Carbs"
              size={96}
              strokeWidth={6}
            />
            <MacroRing
              value={consumed.fat}
              max={targets.fat}
              color="var(--fat)"
              label="Fat"
              size={96}
              strokeWidth={6}
            />
          </div>

          {/* Daily score */}
          {macroScore !== null && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Target size={14} style={{ color: macroScore >= 80 ? 'var(--accent)' : macroScore >= 50 ? 'var(--warning)' : 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Daily score:
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{
                  color: macroScore >= 80 ? 'var(--accent)' : macroScore >= 50 ? 'var(--warning)' : 'var(--danger)',
                }}
              >
                {macroScore}
              </span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => openSearch('snack')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
            style={{
              background: 'var(--accent)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
            }}
          >
            <Plus size={18} />
            Log Food
          </button>
          <button
            onClick={() => openSearch('snack')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <Camera size={18} />
            Scan
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <Mic size={18} />
            Voice
          </button>
        </div>

        {/* Meal sections */}
        <div className="space-y-5 mb-6">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
            <MealSection
              key={meal}
              mealType={meal}
              entries={todayEntries.filter((e) => e.meal_type === meal)}
              onRemove={removeEntry}
              onAdd={() => openSearch(meal)}
            />
          ))}
        </div>

        {/* Water tracker */}
        <div className="mb-6">
          <WaterTracker current={waterMl} onAdd={addWater} />
        </div>

        {/* Daily insight */}
        {consumed.calories > 0 && (
          <div
            className="p-4 rounded-xl flex items-start gap-3 animate-fade-in-up"
            style={{ background: 'var(--surface-raised)' }}
          >
            <TrendingUp size={18} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {consumed.protein >= targets.protein
                  ? 'Protein target hit!'
                  : `${targets.protein - consumed.protein}g protein remaining`}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {consumed.protein >= targets.protein
                  ? 'Great job hitting your protein goal today. Keep it up.'
                  : `Try adding a high-protein food like Greek yogurt (20g) or a protein shake (24g) to close the gap.`}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Food search modal */}
      <FoodSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        defaultMeal={searchMeal}
      />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
