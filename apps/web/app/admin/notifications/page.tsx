"use client";

import { useEffect, useState } from "react";
import { getAdminNotifications, sendNotification, getAdminUsers, markAdminNotificationRead, markAllAdminNotificationsRead } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { format } from "date-fns";
import StatusBadge from "../../components/ui/status-badge";
import type { AdminNotification, AdminUser } from "../../../lib/types";

export default function AdminNotificationsPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSend, setShowSend] = useState(false);
    const [form, setForm] = useState({ title: "", message: "", userId: "" });
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [sending, setSending] = useState(false);

    useEffect(() => { if (token) loadNotifications(); }, [token]);

    const loadNotifications = () => {
        setLoading(true);
        getAdminNotifications(token!)
            .then((data) => { setNotifications(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    const openSendModal = async () => {
        setShowSend(true);
        if (users.length === 0) {
            const res = await getAdminUsers(token!);
            setUsers(res.data);
        }
    };

    const handleSend = async () => {
        if (!form.title || !form.message) return;
        setSending(true);
        try {
            await sendNotification(token!, {
                title: form.title,
                message: form.message,
                ...(form.userId ? { userId: form.userId } : {}),
            });
            setShowSend(false);
            setForm({ title: "", message: "", userId: "" });
            loadNotifications();
        } catch { toast("Failed to send notification.", "error"); }
        setSending(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Notifications
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                            {notifications.filter(n => !n.isRead).length}
                        </span>
                    )}
                </h1>
                <div className="flex items-center gap-3">
                    {notifications.some(n => !n.isRead) && (
                        <button onClick={async () => {
                            try {
                                await markAllAdminNotificationsRead(token!);
                                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            } catch { /* ignore */ }
                        }}
                            className="text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
                            Mark all as read
                        </button>
                    )}
                    <button onClick={openSendModal}
                        className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors shadow-[0_4px_12px_rgba(255,91,4,0.3)]">
                        Send Notification
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-float">No notifications yet.</div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <div key={n.id}
                            className={`rounded-2xl p-4 shadow-float border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer ${n.isRead ? "bg-dark-900" : "bg-dark-900 border-l-4 border-l-brand-500"}`}
                            onClick={async () => {
                                if (!n.isRead) {
                                    try {
                                        await markAdminNotificationRead(token!, n.id);
                                        setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
                                    } catch { /* ignore */ }
                                }
                            }}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{n.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs text-slate-500">{format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">&rarr; {n.user?.name || n.user?.email || "\u2014"}</span>
                                        <StatusBadge status={n.type} label={n.type} />
                                    </div>
                                </div>
                                {!n.isRead && <span className="h-2.5 w-2.5 rounded-full bg-brand-500 shrink-0 mt-1.5 ring-4 ring-brand-500/10" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Send Modal */}
            {showSend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSend(false)}>
                    <div className="w-full max-w-md rounded-3xl bg-dark-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Notification</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Recipient</label>
                                <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500 transition-colors">
                                    <option value="">All Users (Broadcast)</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Title</label>
                                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500 transition-colors"
                                    placeholder="e.g. System Maintenance" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Message</label>
                                <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500 transition-colors resize-none"
                                    placeholder="Write your message..." />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowSend(false)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white bg-dark-850 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">Cancel</button>
                            <button onClick={handleSend} disabled={!form.title || !form.message || sending}
                                className="rounded-xl px-6 py-3 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition-colors">
                                {sending ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
