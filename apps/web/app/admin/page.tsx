"use client";

import { useEffect, useState } from "react";
import { getAdminStats, getAdminBookings, getAdminVendors } from "../../lib/admin";
import { useAuth } from "../../lib/auth-context";
import { format } from "date-fns";
import StatusBadge from "../components/ui/status-badge";
import StatCard from "../components/ui/stat-card";
import SidebarIcon from "../components/ui/sidebar-icon";
import type { AdminBooking, AdminVendor } from "../../lib/types";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentBookings, setRecentBookings] = useState<AdminBooking[]>([]);
  const [recentVendors, setRecentVendors] = useState<AdminVendor[]>([]);

  useEffect(() => {
    if (!token) return;
    getAdminStats(token)
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => { setError("Failed to load admin statistics."); setLoading(false); });
    getAdminBookings(token, { page: 1, limit: 5 })
      .then((res) => setRecentBookings(res.data))
      .catch(() => {});
    getAdminVendors(token, { page: 1, limit: 5 })
      .then((res) => setRecentVendors(res.data))
      .catch(() => {});
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !stats) {
    return <div className="text-red-500 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>;
  }

  const cards: { label: string; value: string | number; color: any; icon: string }[] = [
    { label: "Total Users", value: stats.users, color: "blue", icon: "Users" },
    { label: "Vendor Profiles", value: stats.vendors, color: "purple", icon: "Building" },
    { label: "Pending Vendors", value: stats.pendingVendors, color: "yellow", icon: "Clock" },
    { label: "Total Branches", value: stats.branches, color: "orange", icon: "MapPin" },
    { label: "Total Bookings", value: stats.bookings, color: "indigo", icon: "Calendar" },
    { label: "Active Bookings", value: stats.activeBookings, color: "teal", icon: "TrendingUp" },
    { label: "Pending Approvals", value: stats.pendingApprovals, color: "brand", icon: "CheckCircle" },
    { label: "Gross Collected", value: `JOD ${stats.revenue.toFixed(2)}`, color: "blue", icon: "DollarSign" },
    { label: "Platform Revenue", value: `JOD ${(stats.platformRevenue || 0).toFixed(2)}`, color: "emerald", icon: "DollarSign" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            color={card.color}
            icon={<SidebarIcon name={card.icon} className="h-6 w-6" />}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 py-4">No recent bookings.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-dark-850 border border-slate-200 dark:border-slate-800/50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.customer?.name || "Anonymous"}</div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{b.branch?.name} &middot; {format(new Date(b.startTime), "MMM d")}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Vendor Signups */}
        <div className="rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Vendor Signups</h2>
          {recentVendors.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 py-4">No recent signups.</p>
          ) : (
            <div className="space-y-3">
              {recentVendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl bg-dark-850 border border-slate-200 dark:border-slate-800/50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{v.companyName}</div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{v.owner?.name} &middot; {format(new Date(v.createdAt), "MMM d")}</div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
