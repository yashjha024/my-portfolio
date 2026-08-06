import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Global Suspense Fallback Loader Component.
 * Displayed while lazy-loaded route chunks are being fetched or rendered.
 */
export const GlobalPageLoader = ({ message = 'Loading view...' }) => {
  return (
    <div className="animate-fadeIn flex min-h-[65vh] w-full flex-col items-center justify-center bg-transparent p-6">
      <div className="border-border bg-card shadow-soft text-card-foreground flex flex-col items-center justify-center gap-4 rounded-2xl border p-6">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-foreground font-mono text-sm font-bold uppercase tracking-wide">
            {message}
          </span>
          <span className="text-muted-foreground text-[11px]">
            Optimizing module chunks &amp; verifying code boundaries
          </span>
        </div>
      </div>
    </div>
  );
};
