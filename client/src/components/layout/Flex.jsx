import React from 'react';
import { cn } from '../../utils/cn.js';

export const Flex = React.forwardRef(
  (
    {
      className,
      direction = 'row',
      align = 'center',
      justify = 'between',
      wrap = 'wrap',
      gap = '4',
      children,
      ...props
    },
    ref
  ) => {
    const directionClass = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    }[direction];

    const alignClass = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    }[align];

    const justifyClass = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    }[justify];

    const wrapClass = {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    }[wrap];

    const gapClass =
      {
        1: 'gap-1',
        2: 'gap-2',
        3: 'gap-3',
        4: 'gap-4',
        6: 'gap-6',
        8: 'gap-8',
      }[gap] || 'gap-4';

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClass,
          alignClass,
          justifyClass,
          wrapClass,
          gapClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';
