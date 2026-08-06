import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn.js';

export const sectionVariants = cva(
  'relative w-full py-20 transition-colors duration-200 sm:py-24 md:py-32',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        muted: 'bg-secondary text-foreground border-border border-y',
        accent: 'bg-secondary text-foreground border-border border-y',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const Section = React.forwardRef(({ className, variant, id, children, ...props }, ref) => {
  return (
    <section ref={ref} id={id} className={cn(sectionVariants({ variant }), className)} {...props}>
      {children}
    </section>
  );
});

Section.displayName = 'Section';
