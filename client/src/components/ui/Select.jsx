import React from 'react';
import { cn } from '../../utils/cn.js';

export const Select = React.forwardRef(({ className, error, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 min-h-[44px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[40px]',
        error ? 'border-destructive focus-visible:ring-destructive' : '',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';
