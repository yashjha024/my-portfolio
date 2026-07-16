import React from 'react';
import { cn } from '../../utils/cn.js';

export const FormGroup = ({
  label,
  htmlFor,
  description,
  error,
  required = false,
  className,
  children,
}) => {
  const inputId = htmlFor || (React.isValidElement(children) ? children.props.id : undefined);
  return (
    <div className={cn('flex flex-col space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-foreground text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {description && !error && <p className="text-muted-foreground text-xs">{description}</p>}
      {error && (
        <p className="text-destructive text-xs font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
