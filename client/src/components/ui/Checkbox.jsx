import React from 'react';
import { cn } from '../../utils/cn.js';

export const Checkbox = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      className={cn(
        'border-input text-primary focus-visible:ring-ring ring-offset-background accent-primary h-4 w-4 cursor-pointer rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-destructive' : '',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );
});

Checkbox.displayName = 'Checkbox';
