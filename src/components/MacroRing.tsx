import { useEffect, useRef } from 'react';

interface MacroRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  unit?: string;
  animate?: boolean;
}

export function MacroRing({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color,
  label,
  unit = 'g',
  animate = true,
}: MacroRingProps) {
  const pathRef = useRef<SVGCircleElement>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const remaining = max - value;

  useEffect(() => {
    if (pathRef.current && animate) {
      pathRef.current.style.transition = 'none';
      pathRef.current.style.strokeDashoffset = `${circumference}`;
      requestAnimationFrame(() => {
        if (pathRef.current) {
          pathRef.current.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
          pathRef.current.style.strokeDashoffset = `${circumference * (1 - progress)}`;
        }
      });
    }
  }, [value, max, circumference, progress, animate]);

  const isOver = value > max;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            ref={pathRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isOver ? 'var(--danger)' : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-semibold tabular-nums leading-none"
            style={{ fontSize: size * 0.2, color: isOver ? 'var(--danger)' : 'var(--text-primary)' }}
          >
            {Math.round(value)}
          </span>
          <span
            className="text-[10px] mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            / {max}{unit !== 'kcal' ? unit : ''}
          </span>
        </div>
      </div>
      <span
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <span
        className="text-[11px] tabular-nums"
        style={{ color: isOver ? 'var(--danger)' : 'var(--text-muted)' }}
      >
        {isOver ? `${Math.abs(Math.round(remaining))} over` : `${Math.round(remaining)} left`}
      </span>
    </div>
  );
}
