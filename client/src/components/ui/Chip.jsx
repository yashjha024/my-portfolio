import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const Chip = ({ label, active = false, onClick, onRemove, className, ...props }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring inline-flex min-h-[32px] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:min-h-[28px]',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border/50 border',
        className
      )}
      {...props}
    >
      <span>{label}</span>
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label);
          }}
          className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove filter ${label}`}
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </button>
  );
};
