import { Droplets, Plus } from 'lucide-react';

interface WaterTrackerProps {
  current: number;
  target?: number;
  onAdd: (ml: number) => void;
}

const QUICK_ADD = [250, 500, 750];

export function WaterTracker({ current, target = 3000, onAdd }: WaterTrackerProps) {
  const progress = Math.min(current / target, 1);
  const glasses = Math.floor(current / 250);

  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: 'var(--surface-raised)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={18} style={{ color: '#3b82f6' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Water
          </span>
        </div>
        <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {(current / 1000).toFixed(1)}L / {(target / 1000).toFixed(1)}L
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden mb-3"
        style={{ background: 'var(--surface-overlay)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
          }}
        />
      </div>

      {/* Glass indicators */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-colors duration-300"
            style={{
              background: i < glasses ? '#3b82f6' : 'var(--surface-overlay)',
              opacity: i < glasses ? 1 : 0.5,
            }}
          />
        ))}
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {QUICK_ADD.map((ml) => (
          <button
            key={ml}
            onClick={() => onAdd(ml)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              background: 'var(--surface-overlay)',
              color: '#3b82f6',
            }}
          >
            <Plus size={12} />
            {ml}ml
          </button>
        ))}
      </div>
    </div>
  );
}
