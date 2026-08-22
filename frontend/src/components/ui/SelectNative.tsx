import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectNativeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
}

export const SelectNative = React.forwardRef<HTMLSelectElement, SelectNativeProps>(({
  label,
  error,
  options,
  children,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-text-2 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none bg-elevated text-text border rounded-md px-3.5 py-2 pr-9 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? 'border-danger focus:ring-danger' : 'border-border hover:border-text-3/40'
          } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface text-text">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3 text-text-3 pointer-events-none shrink-0">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && <span className="text-xs text-danger font-medium">{error}</span>}
    </div>
  );
});

SelectNative.displayName = 'SelectNative';
