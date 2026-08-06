import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn.js';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border-border bg-card text-card-foreground shadow-subtle rounded-3xl border transition-all duration-200',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const InteractiveCard = React.forwardRef(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{ y: -5, transition: { duration: 0.18, ease: 'easeOut' } }}
    className={cn(
      'border-border bg-card text-card-foreground shadow-subtle hover:border-foreground/30 hover:shadow-card cursor-pointer overflow-hidden rounded-3xl border transition-all duration-200',
      className
    )}
    {...props}
  />
));
InteractiveCard.displayName = 'InteractiveCard';

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-2 p-6 sm:p-8', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-heading text-foreground text-xl font-bold leading-snug tracking-tight sm:text-2xl',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-muted-foreground text-sm leading-relaxed sm:text-base', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0 sm:p-8', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0 sm:p-8', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';
