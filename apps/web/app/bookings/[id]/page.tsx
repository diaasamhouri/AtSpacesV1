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
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Booking not found
        </h1>
        <Link
          href="/bookings"
          className="mt-4 inline-block text-sm text-brand-500 hover:underline"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
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
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {booking.service.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Booking ID:{" "}
            <span className="font-mono">{booking.id.slice(0, 8)}</span>
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${bookingStatusColor(booking.status)}`}
        >
          {formatBookingStatus(booking.status)}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Details card */}
      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-700">
        {/* Space info */}
        <div className="border-b border-gray-200 p-5 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Space
          </h2>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {booking.branch.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {booking.branch.address} &middot; {formatCity(booking.branch.city)}
          </p>
        </div>

        {/* Service info */}
        <div className="border-b border-gray-200 p-5 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Service
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-500">
              {formatServiceType(booking.service.type)}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {booking.service.name}
            </span>
          </div>
        </div>

        {/* Date & time */}
        <div className="border-b border-gray-200 p-5 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Date & Time
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Start</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {startDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {startDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">End</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {endDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {endDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {booking.numberOfPeople}{" "}
            {booking.numberOfPeople === 1 ? "person" : "people"}
          </p>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="border-b border-gray-200 p-5 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Notes
            </h2>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {booking.notes}
            </p>
          </div>
        )}

        {/* Payment */}
        <div className="p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Payment
          </h2>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm">
              {booking.payment ? (
                <>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatPaymentMethod(booking.payment.method)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {booking.payment.status === "COMPLETED"
                      ? "Paid"
                      : booking.payment.status === "REFUNDED"
                        ? "Refunded"
                        : "Payment pending"}
                    {booking.payment.paidAt &&
                      ` on ${new Date(booking.payment.paidAt).toLocaleDateString()}`}
                  </p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No payment recorded
                </p>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(booking.totalPrice, booking.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canCancel && (
        <div className="mt-6">
          {showCancelConfirm ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Are you sure you want to cancel this booking?
              </p>
              {booking.payment?.status === "COMPLETED" && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Your payment will be refunded.
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="w-full rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Cancel Booking
            </button>
          )}
        </div>
      )}

      {/* Booked on */}
      <p className="mt-6 text-center text-xs text-gray-400">
        Booked on{" "}
        {new Date(booking.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
