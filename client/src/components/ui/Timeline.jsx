import React from 'react';
import { cn } from '../../utils/cn.js';

export const Timeline = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('border-border/80 relative ml-3 space-y-8 border-l pl-6', className)}
    {...props}
  >
    {children}
  </div>
));
Timeline.displayName = 'Timeline';

export const TimelineItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('group relative', className)} {...props}>
    {children}
  </div>
));
TimelineItem.displayName = 'TimelineItem';

export const TimelineDot = React.forwardRef(({ className, active = false, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'border-background absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full border-2 transition-colors',
      active
        ? 'bg-primary ring-primary/20 ring-4'
        : 'bg-muted-foreground/30 group-hover:bg-primary/60',
      className
    )}
    {...props}
  />
));
TimelineDot.displayName = 'TimelineDot';

export const TimelineContent = React.forwardRef(
  ({ className, title, date, description, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1', className)} {...props}>
      {date && (
        <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {date}
        </span>
      )}
      {title && <h4 className="text-foreground text-base font-semibold">{title}</h4>}
      {description && (
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
);
TimelineContent.displayName = 'TimelineContent';
