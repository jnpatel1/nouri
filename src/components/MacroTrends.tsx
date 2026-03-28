import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts';

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroTrendsProps {
  data: DayData[];
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

type Metric = 'calories' | 'protein' | 'carbs' | 'fat';

const METRIC_CONFIG: Record<Metric, { label: string; color: string; unit: string }> = {
  calories: { label: 'Calories', color: 'var(--calories)', unit: 'kcal' },
  protein: { label: 'Protein', color: 'var(--protein)', unit: 'g' },
  carbs: { label: 'Carbs', color: 'var(--carbs)', unit: 'g' },
  fat: { label: 'Fat', color: 'var(--fat)', unit: 'g' },
};

export function MacroTrends({ data, targets }: MacroTrendsProps) {
  const [metric, setMetric] = useState<Metric>('calories');

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: d[metric],
  }));

  const config = METRIC_CONFIG[metric];
  const target = targets[metric];
  const avg = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d[metric], 0) / data.length)
    : 0;

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Weekly Trends
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Avg: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{avg}{config.unit === 'kcal' ? '' : config.unit}</span>
          </span>
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-1 mb-3">
        {(Object.keys(METRIC_CONFIG) as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: metric === m ? METRIC_CONFIG[m].color : 'transparent',
              color: metric === m ? 'white' : 'var(--text-muted)',
              opacity: metric === m ? 1 : 0.7,
            }}
          >
            {METRIC_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={20}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} ${config.unit}`, config.label]}
              />
              <ReferenceLine y={target} stroke={config.color} strokeDasharray="4 4" strokeOpacity={0.4} />
              <Bar
                dataKey="value"
                fill={config.color}
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Start logging to see trends
        </div>
      )}
    </div>
  );
}
