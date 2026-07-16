import React from 'react';
import { cn } from '../../utils/cn.js';
import { MarkdownRenderer } from './MarkdownRenderer.jsx';

export const MarkdownProse = ({ className, children, ...props }) => {
  if (typeof children === 'string') {
    return <MarkdownRenderer content={children} className={className} {...props} />;
  }

  return (
    <div
      className={cn(
        'prose prose-zinc dark:prose-invert max-w-none',
        'prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground',
        'prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:mb-6',
        'prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2',
        'prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3',
        'prose-p:text-base prose-p:leading-relaxed prose-p:text-muted-foreground prose-p:mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
