"use client";

import { useEffect, useState } from "react";
import { getVendorNotifications, markNotificationRead } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import { format } from "date-fns";
import StatusBadge from "../../components/ui/status-badge";

export default function VendorNotificationsPage() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (token) loadNotifications(); }, [token]);

    const loadNotifications = () => {
        setLoading(true);
        getVendorNotifications(token!)
            .then((data) => { setNotifications(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationRead(token!, id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter((n) => !n.isRead);
        for (const n of unread) {
            try { await markNotificationRead(token!, n.id); } catch { /* ignore */ }
        }
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">
                    Notifications
                    {unreadCount > 0 && <span className="ml-2 inline-flex items-center rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{unreadCount}</span>}
                </h1>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">Mark all as read</button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="rounded-2xl bg-dark-900 border border-slate-800 p-8 text-center text-sm text-slate-400 shadow-float">No notifications yet.</div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <div key={n.id}
                            className={`rounded-2xl p-4 shadow-float border border-slate-800 transition-colors cursor-pointer ${n.isRead ? "bg-dark-900" : "bg-dark-900 border-l-4 border-l-brand-500"}`}
                            onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}>
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StatusBadge status={n.type} label={n.type.replace(/_/g, " ")} />
                                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                                    </div>
                                    <h3 className="text-sm font-bold text-white">{n.title}</h3>
                                    <p className="text-sm text-slate-400 mt-0.5">{n.message}</p>
                                    <p className="text-xs text-slate-500 mt-1">{format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
