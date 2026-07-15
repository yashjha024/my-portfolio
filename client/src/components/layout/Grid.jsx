import React from 'react';
import { cn } from '../../utils/cn.js';

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  12: 'grid-cols-1 sm:grid-cols-12',
};

const gridGaps = {
  sm: 'gap-4',
  md: 'gap-6 sm:gap-8',
  lg: 'gap-8 sm:gap-12',
};

export const Grid = React.forwardRef(
  ({ className, cols = 3, gap = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gridCols[cols] || gridCols[3],
          gridGaps[gap] || gridGaps.md,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';
