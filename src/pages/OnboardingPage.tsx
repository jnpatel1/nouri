import { useState } from 'react';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ActivityLevel, FitnessGoal } from '../types';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types';
import { calculateDailyTargets } from '../lib/tdee';

interface OnboardingProps {
  onComplete: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingProps) {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: user?.age || 21,
    sex: (user?.sex || 'male') as 'male' | 'female',
    height_cm: user?.height_cm || 178,
    weight_kg: user?.weight_kg || 75,
    activity_level: (user?.activity_level || 'moderately_active') as ActivityLevel,
    goal: (user?.goal || 'lose_slow') as FitnessGoal,
  });

  const steps = [
    {
      title: 'About You',
      subtitle: 'Basic info for accurate calculations',
      content: (
        <div className="space-y-5">
          {/* Sex */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Biological sex (for BMR calculation)
            </label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, sex: s })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: form.sex === s ? 'var(--accent)' : 'var(--surface-overlay)',
                    color: form.sex === s ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {s === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
          </div>
          {/* Age */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Age
            </label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--surface-overlay)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
              min={13}
              max={100}
            />
          </div>
          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Height (cm)
              </label>
              <input
                type="number"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'var(--surface-overlay)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Weight (kg)
              </label>
              <input
                type="number"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                step="0.5"
                style={{
                  background: 'var(--surface-overlay)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Activity Level',
      subtitle: 'How active are you on average?',
      content: (
        <div className="space-y-2">
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setForm({ ...form, activity_level: level })}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                background: form.activity_level === level ? 'var(--accent-soft)' : 'var(--surface-overlay)',
                color: form.activity_level === level ? 'var(--accent-text)' : 'var(--text-primary)',
                border: `1px solid ${form.activity_level === level ? 'var(--accent)' : 'var(--border-subtle)'}`,
              }}
            >
              {ACTIVITY_LABELS[level]}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your Goal',
      subtitle: 'What are you working toward?',
      content: (
        <div className="space-y-2">
          {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((goal) => (
            <button
              key={goal}
              onClick={() => setForm({ ...form, goal })}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                background: form.goal === goal ? 'var(--accent-soft)' : 'var(--surface-overlay)',
                color: form.goal === goal ? 'var(--accent-text)' : 'var(--text-primary)',
                border: `1px solid ${form.goal === goal ? 'var(--accent)' : 'var(--border-subtle)'}`,
              }}
            >
              {GOAL_LABELS[goal]}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your Plan',
      subtitle: 'Calculated using Mifflin-St Jeor',
      content: (() => {
        const targets = calculateDailyTargets(form);
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div
              className="p-5 rounded-2xl text-center"
              style={{ background: 'var(--accent-soft)' }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Daily Calorie Target
                </span>
              </div>
              <div className="font-display text-5xl font-bold" style={{ color: 'var(--accent-text)' }}>
                {targets.calories}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--accent-text)', opacity: 0.7 }}>
                kcal / day
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Protein', value: targets.protein, unit: 'g', color: 'var(--protein)' },
                { label: 'Carbs', value: targets.carbs, unit: 'g', color: 'var(--carbs)' },
                { label: 'Fat', value: targets.fat, unit: 'g', color: 'var(--fat)' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="text-center py-3 rounded-xl"
                  style={{ background: 'var(--surface-overlay)' }}
                >
                  <div className="text-xl font-display font-bold" style={{ color: m.color }}>
                    {m.value}{m.unit}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-center px-4" style={{ color: 'var(--text-muted)' }}>
              Protein set at {form.goal.includes('lose') ? '2.0' : form.goal === 'maintain' ? '1.8' : '1.6'}g/kg
              to {form.goal.includes('lose') ? 'preserve muscle during your cut' : 'support your goals'}.
              These targets adapt as you log weight over time.
            </p>
          </div>
        );
      })(),
    },
  ];

  const isLastStep = step === steps.length - 1;

  const handleFinish = () => {
    updateProfile({
      ...form,
    });
    onComplete();
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--surface)' }}>
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                background: i <= step ? 'var(--accent)' : 'var(--surface-overlay)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-sm mx-auto w-full">
        <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {steps[step].title}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {steps[step].subtitle}
        </p>
        {steps[step].content}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 max-w-sm mx-auto w-full flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center justify-center gap-1 px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--surface-overlay)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <button
          onClick={isLastStep ? handleFinish : () => setStep(step + 1)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          {isLastStep ? "Let's Go" : 'Continue'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
