"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { getMyBookings } from "../../lib/bookings";
import {
  formatBookingStatus,
  formatCity,
  formatServiceType,
  formatPrice,
  bookingStatusColor,
} from "../../lib/format";
import type { Booking } from "../../lib/types";

type Tab = "all" | "upcoming" | "past" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

function filterBookings(bookings: Booking[], tab: Tab): Booking[] {
  const now = new Date();
  switch (tab) {
    case "upcoming":
      return bookings.filter(
        (b) =>
          new Date(b.startTime) > now &&
          !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(b.status),
      );
    case "past":
      return bookings.filter(
        (b) =>
          ["COMPLETED", "NO_SHOW"].includes(b.status) ||
          (new Date(b.endTime) < now && b.status !== "CANCELLED"),
      );
    case "cancelled":
      return bookings.filter((b) => b.status === "CANCELLED");
    default:
      return bookings;
  }
}

export default function BookingsPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (isLoading) return;
    if (!user || !token) {
      router.push("/auth/login?redirect=/bookings");
      return;
    }

    getMyBookings(token)
      .then((res) => setBookings(res.data))
      .catch(() => setError("Failed to load bookings. Please try again."))
      .finally(() => setLoading(false));
  }, [user, token, isLoading, router]);

  if (isLoading || (!user && !loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const filtered = filterBookings(bookings, tab);

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          My Bookings
        </h1>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-2 rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${tab === t.key
                  ? "bg-dark-800 text-gray-900 dark:text-white shadow-float border border-slate-200 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-850"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl bg-dark-900 border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-16 text-center bg-dark-900">
            <svg
              className="mx-auto h-12 w-12 text-slate-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              {tab === "all"
                ? "You don't have any bookings yet."
                : `No ${tab} bookings.`}
            </p>
            <Link
              href="/spaces"
              className="mt-6 inline-block rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Browse Spaces
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="group block rounded-3xl border border-slate-200 dark:border-slate-800 bg-dark-900 p-6 transition-all duration-300 hover:border-brand-500/50 hover:bg-gray-50 dark:hover:bg-dark-850 hover:shadow-[0_10px_40px_rgba(255,91,4,0.1)] hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-3 py-1.5 rounded-full">
                        {formatServiceType(booking.service.type)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${bookingStatusColor(booking.status)}`}
                      >
                        {formatBookingStatus(booking.status)}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {booking.service.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {booking.branch.name} &middot;{" "}
                      {formatCity(booking.branch.city)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-500">
                      {formatPrice(booking.totalPrice, booking.currency)}
                    </p>
                    {booking.payment && (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {booking.payment.method}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date/time row */}
                <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-6 rounded-2xl bg-dark-850 p-4 text-sm sm:text-base font-medium text-slate-200 border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-brand-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    {new Date(booking.startTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-brand-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {new Date(booking.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-brand-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    {booking.numberOfPeople}{" "}
                    {booking.numberOfPeople === 1 ? "person" : "people"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
