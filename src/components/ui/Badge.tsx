import React from 'react';
import { cn } from '../../lib/utils';
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeVariant } from './StatusBadge';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'text-foreground border-border',
    destructive: 'border-transparent bg-red-700 text-white hover:bg-red-800',
    success: 'border-transparent bg-emerald-700 text-white hover:bg-emerald-800',
    warning: 'border-transparent bg-amber-700 text-white hover:bg-amber-800',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
