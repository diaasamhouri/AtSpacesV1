"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth-context";
import { createBooking, checkAvailability } from "../../lib/bookings";
import {
  formatServiceType,
  formatPrice,
  formatPricingInterval,
  formatPaymentMethod,
} from "../../lib/format";
import type {
  ServiceItem,
  PricingInterval,
  PaymentMethod,
  Booking,
} from "../../lib/types";

interface BookingModalProps {
  branchId: string;
  branchName: string;
  services: ServiceItem[];
  isOpen: boolean;
  onClose: () => void;
}

type Step = "service" | "schedule" | "review" | "success";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "APPLE_PAY", label: "Apple Pay" },
  { value: "CASH", label: "Cash (pay at location)" },
];

export function BookingModal({
  branchName,
  services,
  isOpen,
  onClose,
}: BookingModalProps) {
  const { token } = useAuth();
  const [step, setStep] = useState<Step>("service");

  // Step 1: Service selection
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(
    null,
  );
  const [selectedInterval, setSelectedInterval] =
    useState<PricingInterval | null>(null);

  // Step 2: Schedule
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("09:00");
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [availabilityMsg, setAvailabilityMsg] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Step 3: Review
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VISA");
  const [notes, setNotes] = useState("");

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("service");
      setSelectedService(null);
      setSelectedInterval(null);
      setDate("");
      setStartHour("09:00");
      setNumberOfPeople(1);
      setAvailabilityMsg("");
      setIsAvailable(null);
      setPaymentMethod("VISA");
      setNotes("");
      setError("");
      setBooking(null);
    }
  }, [isOpen]);

  // Compute end time based on interval
  const computeEndTime = useCallback(
    (startIso: string, interval: PricingInterval): string => {
      const start = new Date(startIso);
      const hoursMap: Record<PricingInterval, number> = {
        HOURLY: 1,
        HALF_DAY: 4,
        DAILY: 8,
        WEEKLY: 8 * 5,
        MONTHLY: 8 * 22,
      };
      start.setHours(start.getHours() + hoursMap[interval]);
      return start.toISOString();
    },
    [],
  );

  const selectedPricing =
    selectedService && selectedInterval
      ? selectedService.pricing.find((p) => p.interval === selectedInterval)
      : null;

  const startTimeIso =
    date && startHour ? new Date(`${date}T${startHour}:00`).toISOString() : "";
  const endTimeIso =
    startTimeIso && selectedInterval
      ? computeEndTime(startTimeIso, selectedInterval)
      : "";

  // Check availability when schedule changes
  async function handleCheckAvailability() {
    if (!selectedService || !startTimeIso || !endTimeIso) return;
    setLoading(true);
    setError("");
    try {
      const result = await checkAvailability(
        selectedService.id,
        startTimeIso,
        endTimeIso,
      );
      setIsAvailable(result.available);
      setAvailabilityMsg(
        result.available
          ? `Available (${result.currentBookings}/${result.capacity} booked)`
          : `Fully booked (${result.currentBookings}/${result.capacity})`,
      );
    } catch {
      setAvailabilityMsg("Could not check availability");
      setIsAvailable(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBooking() {
    if (!token || !selectedService || !selectedInterval || !selectedPricing)
      return;
    setLoading(true);
    setError("");
    try {
      const result = await createBooking(token, {
        serviceId: selectedService.id,
        startTime: startTimeIso,
        endTime: endTimeIso,
        numberOfPeople,
        pricingInterval: selectedInterval,
        paymentMethod,
        notes: notes || undefined,
      });
      setBooking(result);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  // Tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-900 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {step === "success" ? "Booking Confirmed" : `Book at ${branchName}`}
        </h2>

        {/* Step indicator */}
        {step !== "success" && (
          <div className="mt-4 flex gap-2">
            {(["service", "schedule", "review"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step === s
                      ? "bg-brand-500 text-white"
                      : (["service", "schedule", "review"] as const).indexOf(
                            step,
                          ) > i
                        ? "bg-brand-500/20 text-brand-500"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className="h-px w-8 bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === "service" && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a service and pricing plan
            </p>
            {services.map((service) => (
              <div
                key={service.id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                  selectedService?.id === service.id
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                }`}
                onClick={() => {
                  setSelectedService(service);
                  setSelectedInterval(null);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-500">
                      {formatServiceType(service.type)}
                    </span>
                    <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Capacity: {service.capacity}{" "}
                      {service.capacity === 1 ? "person" : "people"}
                    </p>
                  </div>
                  {selectedService?.id === service.id && (
                    <svg
                      className="h-5 w-5 text-brand-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* Pricing options */}
                {selectedService?.id === service.id && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {service.pricing.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInterval(p.interval);
                        }}
                        className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedInterval === p.interval
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-800 dark:text-gray-300"
                        }`}
                      >
                        <span className="block text-xs capitalize opacity-80">
                          Per {formatPricingInterval(p.interval)}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(p.price, p.currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              disabled={!selectedService || !selectedInterval}
              onClick={() => setStep("schedule")}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500/90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === "schedule" && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pick your date, time, and group size
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setIsAvailable(null);
                  setAvailabilityMsg("");
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-dark-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start time
              </label>
              <input
                type="time"
                value={startHour}
                onChange={(e) => {
                  setStartHour(e.target.value);
                  setIsAvailable(null);
                  setAvailabilityMsg("");
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-dark-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of people
              </label>
              <input
                type="number"
                min={1}
                max={selectedService?.capacity || 1}
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-dark-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                Max {selectedService?.capacity || 1}
              </p>
            </div>

            {/* Availability check */}
            <button
              type="button"
              disabled={!date || loading}
              onClick={handleCheckAvailability}
              className="w-full rounded-lg border border-brand-500 px-4 py-2 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-500/5 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check Availability"}
            </button>

            {availabilityMsg && (
              <p
                className={`text-sm font-medium ${isAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {availabilityMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("service")}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!date || isAvailable === false}
                onClick={() => setStep("review")}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500/90 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === "review" && selectedPricing && selectedService && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review your booking details
            </p>

            {/* Summary card */}
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-dark-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Service
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedService.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Date
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Time
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {startHour}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Duration
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Per {formatPricingInterval(selectedInterval!)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    People
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {numberOfPeople}
                  </span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-base font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-brand-500">
                    {formatPrice(
                      selectedPricing.price,
                      selectedPricing.currency,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment method
              </label>
              <div className="mt-2 space-y-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-colors ${
                      paymentMethod === pm.value
                        ? "border-brand-500 bg-brand-500/5"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        paymentMethod === pm.value
                          ? "border-brand-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {paymentMethod === pm.value && (
                        <div className="h-2 w-2 rounded-full bg-brand-500" />
                      )}
                    </div>
                    <span
                      className={
                        paymentMethod === pm.value
                          ? "font-medium text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }
                    >
                      {formatPaymentMethod(pm.value)}
                      {pm.value === "CASH" && (
                        <span className="ml-1 text-xs text-gray-500">
                          (pay at location)
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes{" "}
                <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-dark-800 dark:text-white"
                placeholder="Any special requirements..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmBooking}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500/90 disabled:opacity-50"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && booking && (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Booking {booking.status === "CONFIRMED" ? "confirmed" : "submitted"}!
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {booking.status === "CONFIRMED"
                  ? "Your payment was processed successfully."
                  : "Please pay at the location upon arrival."}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-left text-sm dark:bg-dark-800">
              <p className="text-gray-500 dark:text-gray-400">
                Booking ID:{" "}
                <span className="font-mono text-gray-900 dark:text-white">
                  {booking.id.slice(0, 8)}
                </span>
              </p>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Total:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(booking.totalPrice, booking.currency)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500/90"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
