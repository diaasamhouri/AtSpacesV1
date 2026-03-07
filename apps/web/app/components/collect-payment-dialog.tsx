"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollectPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { receiptNumber?: string; notes?: string }) => void;
  amount: number;
  currency: string;
  customerName: string;
  loading?: boolean;
  title?: string;
}

export function CollectPaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currency,
  customerName,
  loading = false,
  title = "Collect Cash Payment",
}: CollectPaymentDialogProps) {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");

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

  useEffect(() => {
    if (!isOpen) {
      setReceiptNumber("");
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onConfirm({
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

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
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-dark-900 shadow-2xl ring-1 ring-slate-800 border border-slate-200 dark:border-slate-700/50"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h3>

              <div className="mt-4 text-center">
                <div className="text-3xl font-bold text-brand-400">
                  {amount.toFixed(2)} {currency}
                </div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {customerName}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Receipt Number <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. REC-2026-001"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Notes <span className="text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Any additional notes about this payment..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-dark-850 hover:bg-gray-100 dark:hover:bg-dark-800 hover:border-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    "Collect Payment"
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
