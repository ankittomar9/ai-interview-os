import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export interface RadarDimension {
  dimension: string;
  score: number;
  fullMark?: number;
}

export interface RadarChartProps {
  dimensions: RadarDimension[];
  height?: number;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  dimensions,
  height = 260,
  className = ''
}) => {
  const data = dimensions.map((d) => ({
    subject: d.dimension.replace(/_/g, ' '),
    score: d.score,
    fullMark: d.fullMark || 100
  }));

  return (
    <div className={`w-full overflow-hidden flex items-center justify-center ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--color-text-3)', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-3)', fontSize: 10 }}
            stroke="var(--color-border)"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-elevated border border-border rounded-md px-3 py-1.5 shadow-lg text-xs">
                    <span className="font-bold text-text">{item.subject}: </span>
                    <span className="font-mono font-bold text-primary-2">{item.score}/100</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--color-primary-2)"
            fill="var(--color-primary)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};
