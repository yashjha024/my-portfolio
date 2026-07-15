import React from 'react';
import { cn } from '../../utils/cn.js';

export const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-destructive focus-visible:ring-destructive' : '',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
