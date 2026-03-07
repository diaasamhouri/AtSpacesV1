"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth-context";
import { GanttTimeline } from "../../components/gantt-timeline";
import { format } from "date-fns";
import type { DayViewRoom } from "../../../lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DayViewPage() {
  const { token } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<DayViewRoom[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch branches
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/vendor/branches`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        setBranches(list.map((b: any) => ({ id: b.id, name: b.name })));
      })
      .catch(() => {});
  }, [token]);

  // Fetch day view data
  useEffect(() => {
    if (!token || !date) return;
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (branchId) params.set("branchId", branchId);

    fetch(`${API}/vendor/day-view?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setRooms(data.rooms || []);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [token, date, branchId]);

  const dayName = format(new Date(date + "T00:00:00"), "EEEE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Day View</h1>
          <p className="text-sm text-slate-500 mt-1">
            {dayName} - {format(new Date(date + "T00:00:00"), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-sm font-bold text-brand-500">
            {dayName}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
        <button
          onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Gantt Chart */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <GanttTimeline rooms={rooms} />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { label: "Confirmed", color: "bg-blue-500" },
          { label: "Checked In", color: "bg-green-500" },
          { label: "Pending", color: "bg-yellow-500" },
          { label: "Completed", color: "bg-slate-500" },
          { label: "Cancelled", color: "bg-red-500/40" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${item.color}`} />
            <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
