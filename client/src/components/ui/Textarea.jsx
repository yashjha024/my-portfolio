import React from 'react';
import { cn } from '../../utils/cn.js';

export const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground flex min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-destructive focus:border-destructive focus:ring-destructive' : '',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
