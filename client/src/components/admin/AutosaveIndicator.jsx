import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Cloud } from 'lucide-react';

export const AutosaveIndicator = ({ status = 'saved', lastSavedAt = null }) => {
  if (status === 'saving') {
    return (
      <div className="inline-flex animate-pulse items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Autosaving draft...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 font-mono text-xs text-rose-400">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Save error</span>
      </div>
    );
  }

  if (status === 'unsaved') {
    return (
      <div className="border-primary/40 text-primary inline-flex items-center gap-2 rounded-lg border bg-indigo-500/10 px-3 py-1.5 font-mono text-xs">
        <Cloud className="h-3.5 w-3.5" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span>
        Saved{' '}
        {lastSavedAt
          ? `at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
          : 'in cloud'}
      </span>
    </div>
  );
};
