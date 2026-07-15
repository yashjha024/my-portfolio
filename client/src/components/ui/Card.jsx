import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn.js';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border-border bg-card text-card-foreground rounded-xl border shadow-sm transition-all',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export const InteractiveCard = React.forwardRef(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
    className={cn(
      'border-border bg-card text-card-foreground hover:shadow-card-hover hover:border-border/80 cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all',
      className
    )}
    {...props}
  />
));
InteractiveCard.displayName = 'InteractiveCard';

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-foreground text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-muted-foreground text-sm leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';
