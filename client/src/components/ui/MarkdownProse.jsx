import React from 'react';
import { cn } from '../../utils/cn.js';

export const MarkdownProse = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'prose prose-zinc dark:prose-invert max-w-none',
        // Headings styling
        'prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground',
        'prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:mb-6',
        'prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-2',
        'prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3',
        'prose-h4:text-lg sm:prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-2',
        // Paragraphs & Lists
        'prose-p:text-base prose-p:leading-relaxed prose-p:text-muted-foreground prose-p:mb-4',
        'prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-1.5 prose-ul:text-muted-foreground',
        'prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-1.5 prose-ol:text-muted-foreground',
        'prose-li:marker:text-primary/70',
        // Links & Code
        'prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 transition-colors',
        'prose-code:font-mono prose-code:text-xs sm:prose-code:text-sm prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:border prose-pre:border-border',
        // Blockquotes & Callouts
        'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/40 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-foreground/90 prose-blockquote:my-6',
        // Tables
        'prose-table:w-full prose-table:border-collapse prose-table:my-6',
        'prose-th:border-b prose-th:border-border prose-th:text-left prose-th:p-3 prose-th:font-semibold prose-th:text-foreground',
        'prose-td:border-b prose-td:border-border/50 prose-td:p-3 prose-td:text-muted-foreground',
        // Images & Media
        'prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-img:my-8 border-border/40 border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
