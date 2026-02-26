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
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (isLoading) return;
    if (!user || !token) {
      router.push("/auth/login?redirect=/bookings");
      return;
    }

    getMyBookings(token)
      .then((res) => setBookings(res.data))
      .catch(() => {})
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        My Bookings
      </h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-dark-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
              className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {tab === "all"
              ? "You don't have any bookings yet."
              : `No ${tab} bookings.`}
          </p>
          <Link
            href="/spaces"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500/90 transition-colors"
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
              className="block rounded-2xl border border-gray-200 p-5 transition-colors hover:border-brand-500/30 hover:bg-brand-500/5 dark:border-gray-700 dark:hover:border-brand-500/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-500">
                      {formatServiceType(booking.service.type)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${bookingStatusColor(booking.status)}`}
                    >
                      {formatBookingStatus(booking.status)}
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {booking.service.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {booking.branch.name} &middot;{" "}
                    {formatCity(booking.branch.city)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPrice(booking.totalPrice, booking.currency)}
                  </p>
                  {booking.payment && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {booking.payment.method}
                    </p>
                  )}
                </div>
              </div>

              {/* Date/time row */}
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
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
                  {new Date(booking.startTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
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
                <span>
                  {booking.numberOfPeople}{" "}
                  {booking.numberOfPeople === 1 ? "person" : "people"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
