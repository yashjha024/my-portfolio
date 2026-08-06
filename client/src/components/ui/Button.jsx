import React from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const buttonVariants = cva(
  'focus-visible:ring-ring ring-offset-background font-heading inline-flex select-none items-center justify-center rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-foreground text-background hover:bg-foreground/90 shadow-subtle font-bold',
        secondary:
          'bg-secondary text-foreground border-border hover:bg-secondary/80 border font-bold',
        outline:
          'border-border bg-card text-foreground hover:bg-secondary hover:border-foreground/30 shadow-subtle border font-bold',
        ghost: 'hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold',
        link: 'text-foreground font-semibold underline-offset-4 hover:underline',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-subtle font-bold',
        accent:
          'bg-accent text-accent-foreground hover:bg-accent/80 border-border shadow-subtle border font-bold',
      },
      size: {
        default: 'h-11 min-h-[44px] px-5 py-2.5 text-sm',
        sm: 'h-9 min-h-[36px] rounded-xl px-4 text-xs font-semibold',
        lg: 'h-13 min-h-[52px] rounded-2xl px-8 text-base font-bold',
        icon: 'h-11 min-h-[44px] w-11 min-w-[44px] rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Button = React.forwardRef(
  (
    { className, variant, size, isLoading = false, disabled, children, asChild = false, ...props },
    ref
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }));
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ...children.props,
        ref,
        className: cn(classes, children.props.className),
        'aria-disabled': disabled || isLoading || undefined,
        onClick: disabled || isLoading ? (event) => event.preventDefault() : children.props.onClick,
        children: (
          <>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {children.props.children}
          </>
        ),
      });
    }
    return (
      <button className={classes} ref={ref} disabled={disabled || isLoading} {...props}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
