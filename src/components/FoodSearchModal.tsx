import { useState, useRef, useEffect } from 'react';
import { Search, X, Camera, Mic, Plus, Check, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { useFood } from '../contexts/FoodContext';
import type { FoodItem, MealType } from '../types';
import { MEAL_LABELS } from '../types';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMeal?: MealType;
}

export function FoodSearchModal({ isOpen, onClose, defaultMeal = 'breakfast' }: FoodSearchModalProps) {
  const { searchFoods, addEntry } = useFood();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState('1');
  const [mealType, setMealType] = useState<MealType>(defaultMeal);
  const [showAI, setShowAI] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedFood(null);
      setServings('1');
      setResults(searchFoods(''));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, searchFoods]);

  useEffect(() => {
    setResults(searchFoods(query));
  }, [query, searchFoods]);

  const handleLog = () => {
    if (!selectedFood) return;
    addEntry(selectedFood, mealType, parseFloat(servings) || 1);
    setSelectedFood(null);
    setServings('1');
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  const servingsNum = parseFloat(servings) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 glass"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--surface-overlay)' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search foods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAI(!showAI)}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: showAI ? 'var(--accent-soft)' : 'var(--surface-overlay)',
              color: showAI ? 'var(--accent)' : 'var(--text-muted)',
            }}
            title="AI Food Recognition"
          >
            <Camera size={20} />
          </button>
          <button
            className="p-2 rounded-xl"
            style={{ background: 'var(--surface-overlay)', color: 'var(--text-muted)' }}
            title="Voice Search"
          >
            <Mic size={20} />
          </button>
          <button onClick={onClose}>
            <X size={22} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Meal type selector */}
        <div className="flex gap-1 p-3" style={{ background: 'var(--surface-raised)' }}>
          {(Object.keys(MEAL_LABELS) as MealType[]).map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: mealType === type ? 'var(--accent)' : 'transparent',
                color: mealType === type ? 'white' : 'var(--text-secondary)',
              }}
            >
              {MEAL_LABELS[type]}
            </button>
          ))}
        </div>

        {/* AI Photo Section */}
        {showAI && (
          <div
            className="p-4 border-b animate-fade-in-up"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-raised)' }}
          >
            <div
              className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed cursor-pointer hover:border-solid transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <div className="p-3 rounded-full" style={{ background: 'var(--accent-soft)' }}>
                <Sparkles size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Snap a photo of your meal
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  AI will identify foods and estimate macros
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Take Photo or Upload
              </button>
            </div>
          </div>
        )}

        {/* Selected food detail */}
        {selectedFood ? (
          <div className="p-4 border-b animate-fade-in-up" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {selectedFood.name}
                </h3>
                {selectedFood.brand && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selectedFood.brand}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedFood(null)}>
                <X size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Servings input */}
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Servings
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setServings(String(Math.max(0.25, servingsNum - 0.25)))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                  style={{ background: 'var(--surface-overlay)', color: 'var(--text-primary)' }}
                >
                  -
                </button>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-16 h-8 text-center rounded-lg text-sm font-medium bg-transparent outline-none"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  step="0.25"
                  min="0.25"
                />
                <button
                  onClick={() => setServings(String(servingsNum + 0.25))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                  style={{ background: 'var(--surface-overlay)', color: 'var(--text-primary)' }}
                >
                  +
                </button>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                ({selectedFood.serving_size}{selectedFood.serving_unit} each)
              </span>
            </div>

            {/* Macro preview */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Cal', value: selectedFood.macros.calories * servingsNum, color: 'var(--calories)' },
                { label: 'Protein', value: selectedFood.macros.protein * servingsNum, color: 'var(--protein)' },
                { label: 'Carbs', value: selectedFood.macros.carbs * servingsNum, color: 'var(--carbs)' },
                { label: 'Fat', value: selectedFood.macros.fat * servingsNum, color: 'var(--fat)' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="text-center py-2 rounded-lg"
                  style={{ background: 'var(--surface-overlay)' }}
                >
                  <div className="text-sm font-semibold tabular-nums" style={{ color: m.color }}>
                    {Math.round(m.value)}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleLog}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Check size={18} />
              Log to {MEAL_LABELS[mealType]}
            </button>
          </div>
        ) : (
          /* Search results list */
          <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '50vh' }}>
            {results.length === 0 ? (
              <div className="flex flex-col items-center py-12" style={{ color: 'var(--text-muted)' }}>
                <Search size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No foods found</p>
                <button className="mt-3 text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <Plus size={14} /> Add custom food
                </button>
              </div>
            ) : (
              results.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className="w-full text-left p-3 rounded-xl mb-1 transition-colors hover:scale-[1.005] active:scale-[0.995]"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-raised)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {food.name}
                        </span>
                        {food.verified ? (
                          <ShieldCheck size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        ) : food.source === 'community' ? (
                          <Users size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {food.brand && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {food.brand}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {food.serving_size}{food.serving_unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {food.macros.calories}
                      </div>
                      <div className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        P{food.macros.protein} C{food.macros.carbs} F{food.macros.fat}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
