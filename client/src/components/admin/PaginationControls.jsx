import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PaginationControls = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="border-border bg-card flex items-center justify-between rounded-b-2xl border-t px-4 py-3">
      <span className="text-muted-foreground font-mono text-xs">
        Page <strong className="text-white">{currentPage}</strong> of{' '}
        <strong className="text-white">{totalPages}</strong>
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="bg-secondary text-foreground hover:bg-secondary rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="bg-secondary text-foreground hover:bg-secondary rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
