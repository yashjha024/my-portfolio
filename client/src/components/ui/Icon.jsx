import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../utils/cn.js';

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const iconColors = {
  default: 'text-foreground',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
  accent: 'text-accent-foreground',
  destructive: 'text-destructive',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
};

export const Icon = ({
  name,
  size = 'md',
  color = 'default',
  className,
  'aria-hidden': ariaHidden = true,
  ...props
}) => {
  const LucideIcon = LucideIcons[name];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react.`);
    return null;
  }

  return (
    <LucideIcon
      className={cn(
        iconSizes[size] || iconSizes.md,
        iconColors[color] || iconColors.default,
        className
      )}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
};
