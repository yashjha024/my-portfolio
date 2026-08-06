import React from 'react';
import { cn } from '../../utils/cn.js';

export const Input = React.forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground flex h-12 min-h-[48px] w-full rounded-2xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-destructive focus:border-destructive focus:ring-destructive' : '',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );
});

Input.displayName = 'Input';
