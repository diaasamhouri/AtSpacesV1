"use client";

import { useEffect, useState } from "react";
import { getAdminStats } from "../../lib/admin";
import { useAuth } from "../../lib/auth-context";
import StatCard from "../components/ui/stat-card";
import SidebarIcon from "../components/ui/sidebar-icon";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getAdminStats(token)
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => { setError("Failed to load admin statistics."); setLoading(false); });
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
    { label: "Total Revenue", value: `JOD ${stats.revenue.toFixed(2)}`, color: "emerald", icon: "DollarSign" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
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
    </div>
  );
}
