"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

const VARIANT_STYLES = {
  danger: {
    button: "bg-red-500 hover:bg-red-600",
    icon: "text-red-500",
  },
  warning: {
    button: "bg-yellow-500 hover:bg-yellow-600",
    icon: "text-yellow-500",
  },
  default: {
    button: "bg-brand-500 hover:bg-brand-600",
    icon: "text-brand-500",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const styles = VARIANT_STYLES[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-dark-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 border border-slate-200 dark:border-slate-700/50"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white bg-dark-850 hover:bg-gray-100 dark:hover:bg-dark-800 hover:border-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white transition-colors disabled:opacity-50 ${styles.button}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
