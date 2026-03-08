"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { getBooking, cancelBooking } from "../../../lib/bookings";
import {
  formatBookingStatus,
  formatCity,
  formatServiceType,
  formatPrice,
  formatPaymentMethod,
  bookingStatusColor,
  formatSetupType,
} from "../../../lib/format";
import type { Booking } from "../../../lib/types";

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user || !token) {
      router.push("/auth/login?redirect=/bookings/" + id);
      return;
    }

    getBooking(token, id)
      .then(setBooking)
      .catch(() => setError("Booking not found"))
      .finally(() => setLoading(false));
  }, [user, token, isLoading, router, id]);

  async function handleCancel() {
    if (!token) return;
    setCancelling(true);
    setError("");
    try {
      const updated = await cancelBooking(token, id);
      setBooking(updated);
      setShowCancelConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-slate-50 dark:bg-dark-950 min-h-screen pt-24 pb-8 flex items-center justify-center">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Booking not found
          </h1>
          <Link
            href="/bookings"
            className="mt-4 inline-block text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors"
          >
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  return (
    <div className="bg-slate-50 dark:bg-dark-950 min-h-screen pt-24 pb-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          My Bookings
        </Link>

        {/* Header */}
        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {booking.service.name}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Booking ID:{" "}
              <span className="font-mono text-slate-600 dark:text-slate-300">{booking.id.slice(0, 8)}</span>
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${bookingStatusColor(booking.status)}`}
          >
            {formatBookingStatus(booking.status)}
          </span>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-500">
            {error}
          </div>
        )}

        {/* Details card */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 shadow-float">
          {/* Space info */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-850 p-6">
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-500">
              Space
            </h2>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
              {booking.branch.name}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {booking.branch.address} &middot; {formatCity(booking.branch.city)}
            </p>
          </div>

          {/* Service info */}
          <div className="border-b border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-500">
              Service
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex rounded-full bg-brand-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-500">
                {formatServiceType(booking.service.type)}
              </span>
              <span className="font-bold text-gray-900 dark:text-white text-lg">
                {booking.service.name}
              </span>
            </div>
            {booking.requestedSetup && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 text-xs font-bold">
                  Requested Setup: {formatSetupType(booking.requestedSetup)}
                </span>
              </div>
            )}
          </div>

          {/* Date & time */}
          <div className="border-b border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-500">
              Date & Time
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
              <div className="rounded-2xl bg-slate-50 dark:bg-dark-850 p-4 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {startDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-brand-500 font-medium">
                  {startDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-dark-850 p-4 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">End</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {endDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-brand-500 font-medium">
                  {endDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              {booking.numberOfPeople}{" "}
              {booking.numberOfPeople === 1 ? "person" : "people"}
            </p>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="border-b border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-500">
                Notes
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-dark-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                {booking.notes}
              </p>
            </div>
          )}

          {/* Payment */}
          <div className="p-6">
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-500">
              Payment
            </h2>
            <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-dark-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-sm">
                {booking.payment ? (
                  <>
                    <p className="font-bold text-gray-900 dark:text-white text-base">
                      {formatPaymentMethod(booking.payment.method)}
                    </p>
                    <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
                      {booking.payment.status === "COMPLETED"
                        ? <span className="text-green-500">Paid</span>
                        : booking.payment.status === "REFUNDED"
                          ? <span className="text-slate-500">Refunded</span>
                          : <span className="text-yellow-500">Payment pending</span>}
                      {booking.payment.paidAt &&
                        ` on ${new Date(booking.payment.paidAt).toLocaleDateString()}`}
                    </p>
                  </>
                ) : (
                  <p className="font-medium text-slate-500 dark:text-slate-400">
                    No payment recorded
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold text-brand-500 shadow-sm">
                {formatPrice(booking.totalPrice, booking.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canCancel && (
          <div className="mt-8">
            {showCancelConfirm ? (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
                <p className="text-base font-bold text-red-500">
                  Are you sure you want to cancel this booking?
                </p>
                {booking.payment?.status === "COMPLETED" && (
                  <p className="mt-2 text-sm font-medium text-red-400">
                    Your payment will be refunded.
                  </p>
                )}
                <div className="mt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-850 hover:border-slate-600 transition-colors"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="w-full rounded-xl border border-red-500/30 bg-white dark:bg-dark-900 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-500/5 hover:border-red-500/50 transition-colors"
              >
                Cancel Booking
              </button>
            )}
          </div>
        )}

        {/* Booked on */}
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Booked on{" "}
          {new Date(booking.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
