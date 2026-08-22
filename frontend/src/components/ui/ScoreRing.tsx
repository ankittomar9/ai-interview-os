import React from 'react';

export interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label = 'Score',
  sublabel,
  className = ''
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return '#34D399'; // success
    if (s >= 40) return '#FBBF24'; // warning
    return '#EF4444';             // danger
  };

  const ringColor = getColor(clampedScore);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--color-elevated)"
            strokeWidth={strokeWidth}
          />
          {/* Progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold tracking-tight font-mono" style={{ color: ringColor }}>
            {clampedScore}
          </span>
          <span className="text-[11px] text-text-3 font-semibold uppercase tracking-wider -mt-0.5">
            /100
          </span>
        </div>
      </div>

      {(label || sublabel) && (
        <div className="mt-2 text-center">
          {label && <div className="text-xs font-bold text-text">{label}</div>}
          {sublabel && <div className="text-[11px] text-text-3">{sublabel}</div>}
        </div>
      )}
    </div>
  );
};
