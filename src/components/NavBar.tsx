import { Sun, Moon, LogOut, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface NavBarProps {
  currentDate: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

export function NavBar({ currentDate, onPrevDay, onNextDay, onToday }: NavBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isDemo } = useAuth();

  const dateObj = new Date(currentDate + 'T12:00:00');
  const isToday = currentDate === new Date().toISOString().split('T')[0];

  const dayLabel = isToday
    ? 'Today'
    : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header
      className="sticky top-0 z-40 glass border-b"
      style={{
        background: theme === 'dark' ? 'rgba(13, 18, 16, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-sm"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            N
          </div>
          <span className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Nouri
          </span>
          {isDemo && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}
            >
              DEMO
            </span>
          )}
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevDay}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1 rounded-lg text-sm font-medium transition-colors min-w-[100px] text-center"
            style={{
              background: isToday ? 'var(--accent-soft)' : 'transparent',
              color: isToday ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            {dayLabel}
          </button>
          <button
            onClick={onNextDay}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: isToday ? 'var(--text-muted)' : 'var(--text-secondary)' }}
            disabled={isToday}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && (
            <button
              onClick={signOut}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
