import { formatEnumLabel } from "../../../lib/format";

const statusColorMap: Record<string, string> = {
  // Booking statuses
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PENDING_APPROVAL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CHECKED_IN: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  NO_SHOW: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",

  // Vendor statuses
  APPROVED: "bg-green-500/10 text-green-500 border-green-500/20",
  SUSPENDED: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
  DRAFT: "bg-blue-500/10 text-blue-400 border-blue-500/20",

  // Branch statuses
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/20",
  UNDER_REVIEW: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",

  // Payment statuses
  FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
  REFUNDED: "bg-purple-500/10 text-purple-400 border-purple-500/20",

  // Notification types
  BOOKING_CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  BOOKING_CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  BOOKING_REMINDER: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  VENDOR_APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
  VENDOR_REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  APPROVAL_REQUEST: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PAYMENT_SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PAYMENT_FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  GENERAL: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",

  // Promo statuses
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  draft: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
};

const fallback = "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  label?: string;
}

export default function StatusBadge({ status, size = "sm", label }: StatusBadgeProps) {
  const colors = statusColorMap[status] || fallback;
  const sizeClasses = size === "md" ? "px-3.5 py-1.5 text-xs" : "px-3 py-1 text-[10px]";

  return (
    <span className={`inline-flex items-center rounded-full border font-bold tracking-wider ${sizeClasses} ${colors}`}>
      {label || formatEnumLabel(status)}
    </span>
  );
}
