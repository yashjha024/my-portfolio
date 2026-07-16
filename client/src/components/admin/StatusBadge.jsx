import React from 'react';

export const StatusBadge = ({ status = 'draft', className = '' }) => {
  const statusConfig = {
    published: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      label: 'Published',
      dot: 'bg-emerald-400',
    },
    draft: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      label: 'Draft',
      dot: 'bg-amber-400',
    },
    archived: {
      bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
      label: 'Archived',
      dot: 'bg-slate-400',
    },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-medium ${config.bg} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
