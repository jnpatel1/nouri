import { useState } from 'react';
import { Scale, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts';

interface WeightEntry {
  date: string;
  weight: number;
  smoothed: number;
}

interface WeightTrackerProps {
  entries: WeightEntry[];
  onAdd: (weight: number) => void;
  goalWeight?: number;
}

function exponentialMovingAverage(data: { weight: number }[], alpha = 0.15): number[] {
  if (data.length === 0) return [];
  const ema = [data[0].weight];
  for (let i = 1; i < data.length; i++) {
    ema.push(alpha * data[i].weight + (1 - alpha) * ema[i - 1]);
  }
  return ema;
}

export function WeightTracker({ entries, onAdd, goalWeight }: WeightTrackerProps) {
  const [showInput, setShowInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const loggedToday = entries.some((e) => e.date === today);

  const handleSubmit = () => {
    const w = parseFloat(weightInput);
    if (w > 0 && w < 500) {
      onAdd(w);
      setWeightInput('');
      setShowInput(false);
    }
  };

  // Compute trend
  const currentWeight = entries.length > 0 ? entries[entries.length - 1].smoothed : null;
  const weekAgoWeight = entries.length >= 7 ? entries[entries.length - 7].smoothed : null;
  const weeklyChange = currentWeight && weekAgoWeight ? currentWeight - weekAgoWeight : null;

  // Chart data (last 30 entries)
  const chartData = entries.slice(-30).map((e) => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: e.weight,
    trend: parseFloat(e.smoothed.toFixed(1)),
  }));

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={18} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Weight
          </span>
        </div>
        {currentWeight && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-display font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {currentWeight.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>kg</span>
            {weeklyChange !== null && (
              <div
                className="flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: weeklyChange <= 0 ? 'var(--accent-soft)' : 'var(--danger-soft)',
                  color: weeklyChange <= 0 ? 'var(--accent)' : 'var(--danger)',
                }}
              >
                {weeklyChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {Math.abs(weeklyChange).toFixed(1)}/wk
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 2 && (
        <div className="mb-3" style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                hide
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              {goalWeight && (
                <ReferenceLine
                  y={goalWeight}
                  stroke="var(--accent)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
              )}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--border)"
                strokeWidth={1}
                dot={{ r: 2, fill: 'var(--text-muted)' }}
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Input */}
      {showInput ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="e.g. 74.5"
            step="0.1"
            autoFocus
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--surface-overlay)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            Log
          </button>
          <button
            onClick={() => setShowInput(false)}
            className="px-3 py-2 rounded-lg"
            style={{ background: 'var(--surface-overlay)', color: 'var(--text-muted)' }}
          >
            <Minus size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            background: loggedToday ? 'var(--surface-overlay)' : 'var(--accent-soft)',
            color: loggedToday ? 'var(--text-muted)' : 'var(--accent)',
          }}
        >
          <Plus size={14} />
          {loggedToday ? 'Update weight' : 'Log today\'s weight'}
        </button>
      )}
    </div>
  );
}

export { exponentialMovingAverage };
