"use client";

import { useState } from "react";

interface BookingFiltersProps {
  branches: { id: string; name: string }[];
  onFilter: (filters: BookingFilterValues) => void;
  onReset: () => void;
  showStatusFilter?: boolean;
}

export interface BookingFilterValues {
  search: string;
  branchId: string;
  dateType: "single" | "range";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

const INITIAL_FILTERS: BookingFilterValues = {
  search: "",
  branchId: "",
  dateType: "single",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  status: "",
};

export function BookingFilters({ branches, onFilter, onReset, showStatusFilter = false }: BookingFiltersProps) {
  const [filters, setFilters] = useState<BookingFilterValues>(INITIAL_FILTERS);

  const update = (key: keyof BookingFilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Customer search */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Customer</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Name or email..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
          <select
            value={filters.branchId}
            onChange={(e) => update("branchId", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Date type */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date Type</label>
          <select
            value={filters.dateType}
            onChange={(e) => update("dateType", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="single">Single Date</option>
            <option value="range">Date Range</option>
          </select>
        </div>

        {/* Start date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {filters.dateType === "range" ? "Start Date" : "Date"}
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        {/* End date (range only) */}
        {filters.dateType === "range" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        )}

        {/* Time range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Start Time</label>
            <input
              type="time"
              value={filters.startTime}
              onChange={(e) => update("startTime", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">End Time</label>
            <input
              type="time"
              value={filters.endTime}
              onChange={(e) => update("endTime", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
        </div>

        {/* Status filter (for overview page) */}
        {showStatusFilter && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onFilter(filters)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Filter
        </button>
        <button
          onClick={() => {
            setFilters(INITIAL_FILTERS);
            onReset();
          }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
