import { useEffect, useRef } from 'react';

interface CalorieBarProps {
  consumed: number;
  target: number;
}

export function CalorieBar({ consumed, target }: CalorieBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const progress = Math.min(consumed / target, 1.15); // Allow slight overshoot visually
  const remaining = target - consumed;
  const isOver = consumed > target;

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = '0%';
      requestAnimationFrame(() => {
        if (barRef.current) {
          barRef.current.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
          barRef.current.style.width = `${Math.min(progress * 100, 100)}%`;
        }
      });
    }
  }, [consumed, target, progress]);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span
            className="font-display text-4xl font-bold tabular-nums tracking-tight"
            style={{ color: isOver ? 'var(--danger)' : 'var(--text-primary)' }}
          >
            {Math.round(consumed)}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            / {target} kcal
          </span>
        </div>
        <span
          className="text-sm font-medium tabular-nums"
          style={{ color: isOver ? 'var(--danger)' : 'var(--accent)' }}
        >
          {isOver
            ? `${Math.abs(Math.round(remaining))} over`
            : `${Math.round(remaining)} remaining`}
        </span>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ background: 'var(--surface-overlay)' }}
      >
        <div
          ref={barRef}
          className="h-full rounded-full transition-colors duration-300"
          style={{
            background: isOver
              ? 'var(--danger)'
              : `linear-gradient(90deg, var(--accent), #4ade80)`,
            width: '0%',
          }}
        />
      </div>
    </div>
  );
}
