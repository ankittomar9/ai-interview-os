import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardVariant = 'default' | 'elevated' | 'glass';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  variant?: CardVariant;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  variant = 'default',
  bordered = true,
  className = '',
  children,
  ...props
}) => {
  const paddingStyles: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8'
  };

  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-surface',
    elevated: 'bg-elevated shadow-lg shadow-black/40',
    glass: 'bg-surface/80 backdrop-blur-md'
  };

  return (
    <div
      className={`rounded-lg ${bordered ? 'border border-border' : ''} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
