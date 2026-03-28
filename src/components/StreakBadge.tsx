import { Flame } from 'lucide-react';

interface StreakProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakBadge({ currentStreak, longestStreak }: StreakProps) {
  if (currentStreak === 0) return null;

  const isOnFire = currentStreak >= 7;
  const isMilestone = currentStreak % 7 === 0;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{
        background: isOnFire ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'var(--surface-overlay)',
      }}
    >
      <Flame
        size={16}
        style={{ color: isOnFire ? 'white' : 'var(--warning)' }}
        fill={currentStreak >= 3 ? (isOnFire ? 'white' : 'var(--warning)') : 'none'}
      />
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: isOnFire ? 'white' : 'var(--text-primary)' }}
      >
        {currentStreak}
      </span>
      <span
        className="text-xs"
        style={{ color: isOnFire ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
      >
        day streak
      </span>
      {isMilestone && currentStreak > 0 && (
        <span className="text-xs">🎉</span>
      )}
    </div>
  );
}
