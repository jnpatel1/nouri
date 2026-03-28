import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, Check, RotateCcw } from 'lucide-react';
import { recognizeFoodFromPhoto, isGeminiConfigured } from '../lib/gemini';
import type { RecognizedFood } from '../lib/gemini';
import type { MealType } from '../types';
import { MEAL_LABELS } from '../types';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodsRecognized: (foods: RecognizedFood[], mealType: MealType) => void;
  defaultMeal: MealType;
}

export function CameraCapture({ isOpen, onClose, onFoodsRecognized, defaultMeal }: CameraCaptureProps) {
  const [mode, setMode] = useState<'capture' | 'processing' | 'results'>('capture');
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<RecognizedFood[]>([]);
  const [error, setError] = useState('');
  const [mealType, setMealType] = useState<MealType>(defaultMeal);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode('capture');
    setPreview(null);
    setResults([]);
    setError('');
    setSelectedIndices(new Set());
  };

  const processImage = useCallback(async (file: File) => {
    if (!isGeminiConfigured()) {
      setError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
      return;
    }

    setMode('processing');
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Convert to base64 for Gemini
    const base64Reader = new FileReader();
    base64Reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type || 'image/jpeg';

        const foods = await recognizeFoodFromPhoto(base64, mimeType);

        if (foods.length === 0) {
          setError('Could not identify any foods in this image. Try a clearer photo.');
          setMode('capture');
          return;
        }

        setResults(foods);
        setSelectedIndices(new Set(foods.map((_, i) => i)));
        setMode('results');
      } catch (err: any) {
        setError(err.message || 'Failed to analyze image');
        setMode('capture');
      }
    };
    base64Reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = '';
  };

  const toggleFood = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = results.filter((_, i) => selectedIndices.has(i));
    onFoodsRecognized(selected, mealType);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 glass"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={() => { reset(); onClose(); }}
      />

      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {mode === 'capture' ? 'AI Food Recognition' : mode === 'processing' ? 'Analyzing...' : 'Foods Detected'}
            </span>
          </div>
          <button onClick={() => { reset(); onClose(); }}>
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Meal selector */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'capture' && (
            <div className="space-y-3">
              {/* Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed transition-colors"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
              >
                <Camera size={32} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
                  Take a Photo
                </span>
              </button>

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface-overlay)', color: 'var(--text-secondary)' }}
              >
                <Upload size={16} />
                Upload from Gallery
              </button>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {error && (
                <p className="text-xs text-center px-4" style={{ color: 'var(--danger)' }}>{error}</p>
              )}

              <p className="text-xs text-center px-4" style={{ color: 'var(--text-muted)' }}>
                Point your camera at a meal. Gemini AI will identify the foods and estimate macros.
              </p>
            </div>
          )}

          {mode === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              {preview && (
                <img
                  src={preview}
                  alt="Food"
                  className="w-40 h-40 object-cover rounded-xl opacity-70"
                />
              )}
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Identifying foods and estimating macros...
              </p>
            </div>
          )}

          {mode === 'results' && (
            <div className="space-y-3">
              {/* Image preview */}
              {preview && (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Analyzed food"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 p-1.5 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}

              {/* Detected foods */}
              {results.map((food, i) => (
                <button
                  key={i}
                  onClick={() => toggleFood(i)}
                  className="w-full text-left p-3 rounded-xl transition-all"
                  style={{
                    background: selectedIndices.has(i) ? 'var(--accent-soft)' : 'var(--surface-raised)',
                    border: `1px solid ${selectedIndices.has(i) ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            background: selectedIndices.has(i) ? 'var(--accent)' : 'var(--surface-overlay)',
                            border: selectedIndices.has(i) ? 'none' : '1px solid var(--border)',
                          }}
                        >
                          {selectedIndices.has(i) && <Check size={12} color="white" />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {food.name}
                        </span>
                      </div>
                      <div className="ml-7 mt-1 flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {food.estimated_amount}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {Math.round(food.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {food.macros.calories}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        P{food.macros.protein} C{food.macros.carbs} F{food.macros.fat}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Total */}
              {selectedIndices.size > 0 && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--surface-overlay)' }}>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { l: 'Cal', v: results.filter((_, i) => selectedIndices.has(i)).reduce((s, f) => s + f.macros.calories, 0), c: 'var(--accent)' },
                      { l: 'Protein', v: results.filter((_, i) => selectedIndices.has(i)).reduce((s, f) => s + f.macros.protein, 0), c: 'var(--protein)' },
                      { l: 'Carbs', v: results.filter((_, i) => selectedIndices.has(i)).reduce((s, f) => s + f.macros.carbs, 0), c: 'var(--carbs)' },
                      { l: 'Fat', v: results.filter((_, i) => selectedIndices.has(i)).reduce((s, f) => s + f.macros.fat, 0), c: 'var(--fat)' },
                    ].map((m) => (
                      <div key={m.l}>
                        <div className="text-sm font-bold" style={{ color: m.c }}>{Math.round(m.v)}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={selectedIndices.size === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Log {selectedIndices.size} item{selectedIndices.size !== 1 ? 's' : ''} to {MEAL_LABELS[mealType]}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
