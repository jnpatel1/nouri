import { Trash2, Plus } from 'lucide-react';
import type { FoodLogEntry, MealType } from '../types';
import { MEAL_LABELS } from '../types';

interface MealSectionProps {
  mealType: MealType;
  entries: FoodLogEntry[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export function MealSection({ mealType, entries, onRemove, onAdd }: MealSectionProps) {
  const totalCals = entries.reduce((s, e) => s + e.macros.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.macros.protein, 0);

  return (
    <div className="animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{MEAL_ICONS[mealType]}</span>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {MEAL_LABELS[mealType]}
          </h3>
          {entries.length > 0 && (
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {totalCals} kcal · {totalProtein}g protein
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--surface-overlay)', color: 'var(--accent)' }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <button
          onClick={onAdd}
          className="w-full py-4 rounded-xl border-2 border-dashed text-sm transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          Tap to add food
        </button>
      ) : (
        <div
          className="rounded-xl overflow-hidden divide-y"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-3 py-2.5 group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {entry.food_item?.name || entry.custom_name || 'Unknown'}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.servings !== 1 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {entry.servings}× serving
                    </span>
                  )}
                  <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    P{entry.macros.protein} · C{entry.macros.carbs} · F{entry.macros.fat}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {entry.macros.calories}
                </span>
                <button
                  onClick={() => onRemove(entry.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
