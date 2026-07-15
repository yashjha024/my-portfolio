import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn.js';

export const sectionVariants = cva('w-full py-12 transition-colors sm:py-16 md:py-20 lg:py-24', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      muted: 'bg-muted/40 text-foreground border-border/40 border-y',
      accent: 'bg-accent text-accent-foreground border-border/50 border-y',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const Section = React.forwardRef(({ className, variant, id, children, ...props }, ref) => {
  return (
    <section ref={ref} id={id} className={cn(sectionVariants({ variant }), className)} {...props}>
      {children}
    </section>
  );
});

Section.displayName = 'Section';
