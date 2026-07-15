import React from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const buttonVariants = cva(
  'focus-visible:ring-ring ring-offset-background inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border-input bg-background hover:bg-accent hover:text-accent-foreground border shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        accent:
          'bg-accent text-accent-foreground hover:bg-accent/80 border-border/50 border shadow-sm',
      },
      size: {
        default: 'h-10 min-h-[44px] px-4 py-2',
        sm: 'h-9 min-h-[36px] rounded-md px-3 text-xs',
        lg: 'h-12 min-h-[48px] rounded-md px-8 text-base',
        icon: 'h-10 min-h-[44px] w-10 min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, isLoading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
