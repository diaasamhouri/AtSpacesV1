"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { formatServiceType, formatPricingMode } from "../../../lib/format";
import { SERVICE_TYPE_OPTIONS, SETUP_TYPES } from "../../../lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface BranchOption { id: string; name: string }
interface SetupConfigItem {
  setupType: string;
  minPeople: number;
  maxPeople: number;
}
interface AvailableUnit {
  id: string;
  name: string;
  unitNumber: string | null;
  type: string;
  capacity: number;
  minCapacity: number;
  floor: string | null;
  description: string | null;
  features: string[];
  netSize: number | null;
  branchName: string;
  branchId: string;
  available: boolean;
  remainingSpots: number;
  price: number;
  pricingMode: string;
  currency: string;
  setupConfigs: SetupConfigItem[];
}

const UNIT_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  ...SERVICE_TYPE_OPTIONS,
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatSetupLabel(setupType: string): string {
  const found = SETUP_TYPES.find((s) => s.value === setupType);
  return found ? found.label : setupType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function MultiDateCalendar({
  selectedDates,
  onToggleDate,
}: {
  selectedDates: string[];
  onToggleDate: (date: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded p-1 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 text-sm"
        >
          &larr;
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {monthName} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded p-1 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 text-sm"
        >
          &rarr;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-[10px] font-medium text-slate-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }
          const dateStr = formatDateStr(viewYear, viewMonth, day);
          const isSelected = selectedDates.includes(dateStr);
          const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onToggleDate(dateStr)}
              className={`rounded-md py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : isToday
                  ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20"
                  : "text-gray-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchBookingPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [unitType, setUnitType] = useState("");
  const [dateType, setDateType] = useState("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [multipleDates, setMultipleDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [results, setResults] = useState<AvailableUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  function toggleMultipleDate(date: string) {
    setMultipleDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
    );
  }

  function removeMultipleDate(date: string) {
    setMultipleDates((prev) => prev.filter((d) => d !== date));
  }

  const canSearch =
    dateType === "multiple"
      ? multipleDates.length > 0
      : !!startDate;

  async function handleSearch() {
    if (!token || !canSearch) return;
    setLoading(true);
    setSearched(true);
    setCurrentPage(1);
    try {
      const params = new URLSearchParams();
      if (branchId) params.set("branchId", branchId);
      if (capacity) params.set("capacity", capacity);
      if (unitType) params.set("unitType", unitType);

      if (dateType === "multiple") {
        params.set("dates", multipleDates.join(","));
      } else {
        params.set("startDate", startDate);
        if (dateType === "range" && endDate) params.set("endDate", endDate);
      }

      params.set("startTime", startTime);
      params.set("endTime", endTime);

      const res = await fetch(`${API}/bookings/search-available?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : data.data || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function buildActionParams(unit: AvailableUnit) {
    const p: Record<string, string> = {
      branchId: unit.branchId,
      serviceId: unit.id,
      startTime,
      endTime,
    };
    if (capacity) p.capacity = capacity;
    if (unitType) p.serviceType = unitType;
    if (dateType === "multiple") {
      p.dates = multipleDates.join(",");
    } else {
      p.startDate = startDate;
      if (dateType === "range" && endDate) p.endDate = endDate;
    }
    return new URLSearchParams(p);
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(results.length / rowsPerPage));
  const paginatedResults = results.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function handleRowsPerPageChange(value: number) {
    setRowsPerPage(value);
    setCurrentPage(1);
  }

  // Generate page numbers for pagination display
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="rounded-lg p-2 text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors" title="Go back">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Reservation</h1>
          <p className="text-sm text-slate-500 mt-1">Find available spaces, then create a quotation or booking</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Capacity (min people)</label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Unit Type</label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {UNIT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date Type</label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="single">Single Date</option>
              <option value="range">Date Range</option>
              <option value="multiple">Multiple Dates</option>
            </select>
          </div>
          {dateType !== "multiple" && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {dateType === "range" ? "Start Date" : "Date"}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          )}
          {dateType === "range" && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          </div>
        </div>

        {/* Multiple date calendar picker */}
        {dateType === "multiple" && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-500">Select Dates</label>
            <div className="max-w-xs">
              <MultiDateCalendar selectedDates={multipleDates} onToggleDate={toggleMultipleDate} />
            </div>
            {multipleDates.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {multipleDates.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2.5 py-1 text-xs font-medium"
                  >
                    {date}
                    <button
                      type="button"
                      onClick={() => removeMultipleDate(date)}
                      className="ml-0.5 hover:text-green-600 dark:hover:text-green-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={!canSearch || loading}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Filter"}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {results.length} Available Unit(s)
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                {ROWS_PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          {results.length === 0 ? (
            <div className="rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-8 text-center">
              <p className="text-sm text-slate-500">No available units match your criteria. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-0">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-dark-900">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Branch</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Unit Name</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Unit #</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Floor</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Setup Types</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Capacity</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Pricing</th>
                        <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedResults.map((unit) => (
                        <tr key={unit.id} className="hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors">
                          <td className="px-3 py-3 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                            {unit.branchName}
                          </td>
                          <td className="px-3 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                            <div>{unit.name}</div>
                            <div className="text-xs text-slate-500">{formatServiceType(unit.type)}</div>
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                            {unit.unitNumber || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                            {unit.floor || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {unit.setupConfigs && unit.setupConfigs.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {unit.setupConfigs.map((sc, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300"
                                  >
                                    <span className="rounded bg-slate-100 dark:bg-dark-800 px-1.5 py-0.5 font-medium">
                                      {formatSetupLabel(sc.setupType)}
                                    </span>
                                    <span className="text-slate-400">
                                      ({sc.minPeople}–{sc.maxPeople})
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-slate-300 whitespace-nowrap">
                            {unit.minCapacity && unit.capacity
                              ? `${unit.minCapacity}–${unit.capacity}`
                              : unit.capacity || "-"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {unit.available ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                                Available ({unit.remainingSpots})
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
                                Unavailable
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {unit.price != null ? (
                              <span className="rounded-lg bg-slate-100 dark:bg-dark-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {unit.price} {unit.currency}{unit.pricingMode !== "PER_BOOKING" ? ` (${formatPricingMode(unit.pricingMode)})` : ""}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                                onClick={() => {
                                  const params = buildActionParams(unit);
                                  params.set("mode", "quote");
                                  router.push(`/vendor/bookings/create?${params}`);
                                }}
                              >
                                Quote
                              </button>
                              <button
                                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                                onClick={() => {
                                  const params = buildActionParams(unit);
                                  params.set("mode", "book");
                                  router.push(`/vendor/bookings/create?${params}`);
                                }}
                              >
                                Book
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, results.length)} of {results.length} results
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-dark-850 transition-colors"
                    >
                      Previous
                    </button>
                    {getPageNumbers().map((pg, i) =>
                      pg === "..." ? (
                        <span key={`dots-${i}`} className="px-1.5 text-xs text-slate-400">...</span>
                      ) : (
                        <button
                          key={pg}
                          onClick={() => setCurrentPage(pg)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            currentPage === pg
                              ? "bg-brand-500 text-white"
                              : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850"
                          }`}
                        >
                          {pg}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-dark-850 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
