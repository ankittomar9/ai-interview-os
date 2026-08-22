import React from 'react';

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  disabled = false
}) => {
  const sizeStyles = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-xs sm:text-sm'
  };

  const itemSizeStyles = {
    sm: 'px-2.5 py-1 gap-1.5',
    md: 'px-3 py-1.5 gap-2'
  };

  return (
    <div
      className={`inline-flex items-center self-start w-fit flex-wrap gap-1 bg-elevated border border-border rounded-md ${sizeStyles[size]} ${className}`}
      role="radiogroup"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center font-semibold rounded transition-all duration-150 select-none shrink-0 cursor-pointer ${
              itemSizeStyles[size]
            } ${
              isSelected
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-3 hover:text-text hover:bg-surface/60'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
