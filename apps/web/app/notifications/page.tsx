"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationLink,
  type Notification,
} from "../../lib/notifications";
import { useAuth } from "../../lib/auth-context";
import { format } from "date-fns";
import StatusBadge from "../components/ui/status-badge";
import type { PaginationMeta } from "../../lib/types";

export default function NotificationsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getNotifications(token, { page, limit: 20 })
      .then((res) => {
        setNotifications(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(token!, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token!);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) await handleMarkRead(n.id);
    const link = getNotificationLink(n, user?.role || "CUSTOMER");
    if (link) router.push(link);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 pt-28 pb-12 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-float">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const link = getNotificationLink(n, user?.role || "CUSTOMER");
              return (
                <div
                  key={n.id}
                  className={`rounded-2xl p-4 shadow-float border border-slate-200 dark:border-slate-800 transition-colors ${
                    link ? "cursor-pointer" : ""
                  } ${
                    n.isRead
                      ? "bg-white dark:bg-dark-900"
                      : "bg-white dark:bg-dark-900 border-l-4 border-l-brand-500"
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge
                          status={n.type}
                          label={n.type.replace(/_/g, " ")}
                        />
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-brand-500" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {n.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(
                          new Date(n.createdAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                          title="Mark as read"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </button>
                      )}
                      {link && (
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm font-medium text-slate-500">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(meta.totalPages, p + 1))
              }
              disabled={page >= meta.totalPages}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
