import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Global Suspense Fallback Loader Component.
 * Displayed while lazy-loaded route chunks are being fetched or rendered.
 */
export const GlobalPageLoader = ({ message = 'Loading view...' }) => {
  return (
    <div className="animate-fadeIn flex min-h-[65vh] w-full flex-col items-center justify-center bg-transparent p-6">
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-mono text-sm font-bold uppercase tracking-wide text-slate-200">
            {message}
          </span>
          <span className="text-[11px] text-slate-500">
            Optimizing module chunks &amp; verifying code boundaries
          </span>
        </div>
      </div>
    </div>
  );
};
