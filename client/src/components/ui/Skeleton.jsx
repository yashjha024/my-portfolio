import React from 'react';
import { cn } from '../../utils/cn.js';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={cn('bg-muted/80 animate-pulse rounded-md', className)}
      {...props}
    />
  );
};

export const CaseStudyCardSkeleton = () => (
  <div className="border-border bg-card flex flex-col justify-between space-y-4 rounded-xl border p-6">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="border-border/60 flex items-center justify-between border-t pt-4">
      <div className="flex gap-1.5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  </div>
);

export const ArticleCardSkeleton = () => (
  <div className="border-border bg-card flex flex-col justify-between space-y-4 rounded-xl border p-6">
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="flex items-center justify-between pt-3">
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="w-18 h-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  </div>
);

export const PrdCardSkeleton = () => (
  <div className="border-border bg-card flex flex-col justify-between space-y-4 rounded-xl border p-6">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="border-border/60 flex items-center justify-between border-t pt-4">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  </div>
);

export const DetailPageSkeleton = () => (
  <div className="mx-auto max-w-4xl space-y-12 px-4 py-8">
    <div className="border-border space-y-4 border-b pb-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-4/5 sm:h-12" />
      <Skeleton className="h-6 w-2/3" />
      <div className="flex flex-wrap gap-4 pt-4">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-36 rounded-lg" />
      </div>
    </div>
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
    </div>
    <div className="space-y-6 pt-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  </div>
);
