import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-text-2 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`w-full bg-elevated text-text placeholder:text-text-3/60 border rounded-md px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
          error ? 'border-danger focus:ring-danger' : 'border-border hover:border-text-3/40'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-danger font-medium">{error}</span>
      ) : hint ? (
        <span className="text-xs text-text-3">{hint}</span>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
