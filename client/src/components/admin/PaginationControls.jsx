import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PaginationControls = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-b-2xl border-t border-slate-800 bg-slate-900/60 px-4 py-3">
      <span className="font-mono text-xs text-slate-400">
        Page <strong className="text-white">{currentPage}</strong> of{' '}
        <strong className="text-white">{totalPages}</strong>
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
