import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn.js';

export const badgeVariants = cva(
  'focus:ring-ring inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'text-foreground border-border hover:bg-accent border',
        success: 'bg-success/15 text-success border-success/30 border',
        warning: 'bg-warning/15 text-warning border-warning/30 border',
        destructive: 'bg-destructive/15 text-destructive border-destructive/30 border',
        info: 'bg-info/15 text-info border-info/30 border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const Badge = ({ className, variant, ...props }) => {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
};
