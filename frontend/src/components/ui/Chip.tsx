import React from 'react';

export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full shrink-0 border select-none transition-colors';

  const sizeStyles: Record<ChipSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold'
  };

  const variantStyles: Record<ChipVariant, string> = {
    default: 'bg-elevated text-text-2 border-border',
    primary: 'bg-primary/10 text-primary-2 border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    neutral: 'bg-elevated text-text-3 border-border'
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
