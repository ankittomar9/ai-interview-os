import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text-2 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-text-3 pointer-events-none shrink-0">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-elevated text-text placeholder:text-text-3/60 border rounded-md py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            icon ? 'pl-9 pr-3.5' : 'px-3.5'
          } ${
            error ? 'border-danger focus:ring-danger' : 'border-border hover:border-text-3/40'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-xs text-danger font-medium">{error}</span>
      ) : hint ? (
        <span className="text-xs text-text-3">{hint}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
