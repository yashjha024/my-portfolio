import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isDestructive = true,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="bg-background fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="border-border bg-card shadow-soft w-full max-w-md rounded-2xl border p-6"
        >
          <div className="mb-5 flex items-start gap-4">
            <div
              className={`shrink-0 rounded-xl p-3 ${
                isDestructive ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
            </div>
          </div>

          <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="bg-secondary text-foreground hover:bg-secondary rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`shadow-soft flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all ${
                isDestructive
                  ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-500'
                  : 'bg-primary shadow-subtle hover:bg-primary/90'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
