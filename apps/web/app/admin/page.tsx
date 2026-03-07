"use client";

import { useEffect, useState } from "react";
import { getAdminStats, getAdminBookings, getAdminVendors } from "../../lib/admin";
import { getFinancialStats } from "../../lib/invoices";
import { useAuth } from "../../lib/auth-context";
import { format } from "date-fns";
import StatusBadge from "../components/ui/status-badge";
import StatCard from "../components/ui/stat-card";
import SidebarIcon from "../components/ui/sidebar-icon";
import Link from "next/link";
import type { AdminBooking, AdminVendor, FinancialReport } from "../../lib/types";

function DashboardCard({ label, value, link, color = "brand" }: { label: string; value: string | number; link?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    brand: "border-brand-500/30 bg-brand-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    green: "border-green-500/30 bg-green-500/5",
    red: "border-red-500/30 bg-red-500/5",
    yellow: "border-yellow-500/30 bg-yellow-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
    orange: "border-orange-500/30 bg-orange-500/5",
    indigo: "border-indigo-500/30 bg-indigo-500/5",
  };

  const content = (
    <div className={`rounded-xl border ${colorMap[color] || colorMap.brand} p-4 transition-all hover:shadow-lg`}>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
      {link && (
        <span className="inline-block mt-2 text-[10px] font-bold text-brand-500 uppercase tracking-wider">
          Show Details &rarr;
        </span>
      )}
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</h2>
  );
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentBookings, setRecentBookings] = useState<AdminBooking[]>([]);
  const [recentVendors, setRecentVendors] = useState<AdminVendor[]>([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAdminStats(token),
      getFinancialStats(token).catch(() => null),
      getAdminBookings(token, { page: 1, limit: 5 }),
      getAdminVendors(token, { page: 1, limit: 5 }),
    ])
      .then(([statsData, financialData, bookingsRes, vendorsRes]) => {
        setStats(statsData);
        setFinancial(financialData);
        setRecentBookings(bookingsRes.data);
        setRecentVendors(vendorsRes.data);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load dashboard data."); setLoading(false); });
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

      {/* Section A: Financial Report */}
      <div>
        <SectionHeader title="Financial Report" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            label="Today's Predicted Payments"
            value={`JOD ${financial?.todayPayments?.toFixed(2) ?? "0.00"}`}
            link="/admin/payments"
            color="green"
          />
          <DashboardCard
            label="7-Day Payment Forecast"
            value={`JOD ${financial?.weekForecast?.toFixed(2) ?? "0.00"}`}
            link="/admin/payments"
            color="blue"
          />
          <DashboardCard
            label="Monthly Payment Forecast"
            value={`JOD ${financial?.monthForecast?.toFixed(2) ?? "0.00"}`}
            link="/admin/payments"
            color="purple"
          />
          <DashboardCard
            label="Yearly Payment Forecast"
            value={`JOD ${financial?.yearForecast?.toFixed(2) ?? "0.00"}`}
            link="/admin/payments"
            color="indigo"
          />
          <DashboardCard
            label="Due Payments Until Today"
            value={`JOD ${financial?.duePayments?.toFixed(2) ?? "0.00"}`}
            link="/admin/payments"
            color="red"
          />
          <DashboardCard
            label="Stumbling Accounts"
            value={financial?.stumblingAccounts ?? 0}
            link="/admin/payments"
            color="orange"
          />
          <DashboardCard
            label="Invoices Total"
            value={`JOD ${financial?.invoicesTotal?.toFixed(2) ?? "0.00"}`}
            link="/admin/invoices"
            color="brand"
          />
          <DashboardCard
            label="Payment Receipts Total"
            value={`JOD ${financial?.receiptsTotal?.toFixed(2) ?? "0.00"}`}
            link="/admin/payments"
            color="green"
          />
        </div>
      </div>

      {/* Section B: Properties Overview */}
      <div>
        <SectionHeader title="Properties Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            label="All Properties"
            value={stats.branches ?? 0}
            link="/admin/branches"
            color="blue"
          />
          <DashboardCard
            label="Offices"
            value={stats.offices ?? 0}
            link="/admin/services"
            color="purple"
          />
          <DashboardCard
            label="Meeting Rooms"
            value={stats.meetingRooms ?? 0}
            link="/admin/services"
            color="brand"
          />
          <DashboardCard
            label="Available Units"
            value={stats.availableUnits ?? 0}
            link="/admin/services"
            color="green"
          />
        </div>
      </div>

      {/* Section C: Booking Overview */}
      <div>
        <SectionHeader title="Booking Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            label="Active Bookings"
            value={stats.activeBookings ?? 0}
            link="/admin/bookings/confirmed"
            color="green"
          />
          <DashboardCard
            label="Expiring Soon (7 days)"
            value={stats.expiringSoon ?? 0}
            link="/admin/bookings/expired"
            color="yellow"
          />
          <DashboardCard
            label="Expired"
            value={stats.expired ?? 0}
            link="/admin/bookings/expired"
            color="red"
          />
          <DashboardCard
            label="Pending Approval"
            value={stats.pendingApprovals ?? 0}
            link="/admin/approvals"
            color="orange"
          />
        </div>
      </div>

      {/* Section D: System Shortcuts */}
      <div>
        <SectionHeader title="Quick Access" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: "System Settings", href: "/admin/settings", icon: "Settings" },
            { label: "User Management", href: "/admin/users", icon: "Users" },
            { label: "Vendor Management", href: "/admin/vendors", icon: "Building" },
            { label: "Branch Management", href: "/admin/branches", icon: "MapPin" },
            { label: "Invoices", href: "/admin/invoices", icon: "FileText" },
            { label: "Entities", href: "/admin/entities", icon: "Users" },
            { label: "Approvals", href: "/admin/approvals", icon: "CheckCircle" },
            { label: "Analytics", href: "/admin/analytics", icon: "TrendingUp" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-4 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all"
            >
              <SidebarIcon name={item.icon} className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 py-4">No recent bookings.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800/50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.customer?.name || "Anonymous"}</div>
                    <div className="text-xs font-medium text-slate-500">{b.branch?.name} &middot; {format(new Date(b.startTime), "MMM d")}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Vendor Signups */}
        <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Vendor Signups</h2>
          {recentVendors.length === 0 ? (
            <p className="text-sm font-medium text-slate-500 py-4">No recent signups.</p>
          ) : (
            <div className="space-y-3">
              {recentVendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800/50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{v.companyName}</div>
                    <div className="text-xs font-medium text-slate-500">{v.owner?.name} &middot; {format(new Date(v.createdAt), "MMM d")}</div>
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
