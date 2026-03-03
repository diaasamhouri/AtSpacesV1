"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../../lib/auth-context";
import { createBooking, checkAvailability, verifyPromoCode } from "../../lib/bookings";
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
  AvailabilityResponse,
} from "../../lib/types";

interface BookingModalProps {
  branchId: string;
  branchName: string;
  services: ServiceItem[];
  operatingHours?: Record<string, { open: string; close: string } | null> | null;
  isOpen: boolean;
  onClose: () => void;
}

type Step = "service" | "schedule" | "review" | "success";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; subtitle?: string; logo: React.ReactNode }[] = [
  {
    value: "VISA",
    label: "Visa",
    logo: (
      <svg viewBox="0 0 48 32" className="h-8 w-12" fill="none">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <path d="M19.5 21h-3l1.88-11.5h3L19.5 21Zm-5.12-11.5-2.85 7.88-.34-1.72-.99-5.08s-.12-1.08-1.42-1.08H4.1l-.06.21s1.45.3 3.14 1.32l2.61 10.87h3.13l4.78-12.4h-3.32Zm25.05 11.5h2.76l-2.41-11.5h-2.42c-1.08 0-1.34.84-1.34.84l-4.49 10.66h3.14l.63-1.72h3.83l.3 1.72Zm-3.3-4.1 1.58-4.35.89 4.35h-2.47Zm-5.11-4.67-0.43 2.63s-1.33-.64-2.79-.64c-1.5 0-1.59.78-1.59 1 0 1.1 4.32 1.25 4.32 4.29 0 2.82-2.67 3.49-4.26 3.49-2.14 0-3.37-.73-3.37-.73l.45-2.73s1.62.73 2.87.73c.87 0 1.37-.44 1.37-1.01 0-1.22-4.3-1.33-4.3-4.07 0-2.53 2.16-3.63 4.22-3.63 1.64 0 3.51.67 3.51.67Z" fill="#fff" />
      </svg>
    ),
  },
  {
    value: "MASTERCARD",
    label: "Mastercard",
    logo: (
      <svg viewBox="0 0 48 32" className="h-8 w-12" fill="none">
        <rect width="48" height="32" rx="4" fill="#252525" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" />
        <path d="M24 9.87a8 8 0 0 1 0 12.26 8 8 0 0 1 0-12.26Z" fill="#FF5F00" />
      </svg>
    ),
  },
  {
    value: "APPLE_PAY",
    label: "Apple Pay",
    logo: (
      <svg viewBox="0 0 48 32" className="h-8 w-12" fill="none">
        <rect width="48" height="32" rx="4" fill="#000" />
        <path d="M16.32 11.2c-.44.52-1.15.93-1.86.87-.09-.72.26-1.48.67-1.95.44-.53 1.21-.92 1.83-.95.08.74-.22 1.5-.64 2.03Zm.63.99c-1.03-.06-1.91.59-2.4.59-.49 0-1.24-.56-2.05-.54-1.06.02-2.03.61-2.57 1.56-1.1 1.9-.28 4.72.78 6.27.52.76 1.15 1.61 1.97 1.58.79-.03 1.09-.51 2.04-.51.96 0 1.23.51 2.06.5.85-.02 1.39-.77 1.91-1.53.6-.87.84-1.72.86-1.76-.02-.01-1.65-.63-1.67-2.52-.01-1.57 1.29-2.33 1.35-2.36-.74-1.09-1.89-1.21-2.28-1.28Z" fill="#fff" />
        <path d="M25.08 10.72v10.42h1.62v-3.56h2.24c2.04 0 3.48-1.4 3.48-3.44 0-2.04-1.41-3.42-3.42-3.42h-3.92Zm1.62 1.36h1.86c1.4 0 2.2.75 2.2 2.07s-.8 2.08-2.21 2.08H26.7v-4.15Zm8.86 9.14c1.02 0 1.96-.51 2.39-1.33h.03v1.25h1.5V15.7c0-1.5-1.2-2.47-3.05-2.47-1.71 0-2.95.99-3 2.34h1.46c.12-.65.72-1.07 1.49-1.07 .96 0 1.5.45 1.5 1.27v.56l-1.96.12c-1.82.11-2.81.86-2.81 2.16 0 1.32 1.02 2.21 2.45 2.21Zm.43-1.23c-.84 0-1.37-.4-1.37-1.02 0-.64.51-1.01 1.49-1.07l1.74-.11v.57c0 .95-.8 1.63-1.86 1.63Zm5.3 3.9c1.58 0 2.32-.6 2.97-2.44l2.83-7.95h-1.65l-1.9 6.13h-.03l-1.9-6.13h-1.7l2.73 7.55-.15.46c-.25.79-.65 1.09-1.37 1.09-.13 0-.38-.01-.48-.03v1.26c.1.03.42.06.65.06Z" fill="#fff" />
      </svg>
    ),
  },
  {
    value: "CASH",
    label: "Cash",
    subtitle: "Pay at location",
    logo: (
      <svg viewBox="0 0 48 32" className="h-8 w-12" fill="none">
        <rect width="48" height="32" rx="4" fill="#059669" />
        <rect x="8" y="8" width="32" height="16" rx="2" stroke="#fff" strokeWidth="1.5" fill="none" />
        <circle cx="24" cy="16" r="4" stroke="#fff" strokeWidth="1.5" fill="none" />
        <path d="M24 13.5v1m0 3v1" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
        <path d="M22.5 14.5c0-.55.67-1 1.5-1s1.5.45 1.5 1-.67 1-1.5 1-1.5.45-1.5 1 .67 1 1.5 1 1.5-.45 1.5-1" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="#fff" opacity="0.5" />
        <circle cx="36" cy="16" r="1" fill="#fff" opacity="0.5" />
      </svg>
    ),
  },
];

export function BookingModal({
  branchName,
  services,
  operatingHours,
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
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Step 3: Review
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VISA");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");
  const [verifyingPromo, setVerifyingPromo] = useState(false);

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
      setAvailabilityResult(null);
      setCheckingAvailability(false);
      setPaymentMethod("VISA");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardName("");
      setNotes("");
      setPromoCode("");
      setPromoDiscount(null);
      setPromoError("");
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

  // Derive operating hours for the selected day
  const selectedDayHours = useMemo(() => {
    if (!operatingHours || !date) return undefined;
    const d = new Date(date + "T00:00:00");
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[d.getDay()]!;
    return operatingHours[dayName] ?? null;
  }, [operatingHours, date]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runAvailabilityCheck() {
    if (!selectedService || !startTimeIso || !endTimeIso) return;
    setCheckingAvailability(true);
    setError("");
    try {
      const result = await checkAvailability(
        selectedService.id,
        startTimeIso,
        endTimeIso,
        numberOfPeople,
      );
      setAvailabilityResult(result);
      setIsAvailable(result.available);
      setAvailabilityMsg(
        result.available
          ? `Available (${result.remainingSpots} spots remaining)`
          : result.reason || `Fully booked (${result.currentBookings}/${result.capacity})`,
      );
    } catch {
      setAvailabilityMsg("Could not check availability");
      setIsAvailable(null);
      setAvailabilityResult(null);
    } finally {
      setCheckingAvailability(false);
    }
  }

  // Auto-trigger availability check with debounce
  useEffect(() => {
    if (step !== "schedule" || !selectedService || !date || !startHour || !selectedInterval) return;
    // Clear previous state immediately
    setIsAvailable(null);
    setAvailabilityMsg("");
    setAvailabilityResult(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runAvailabilityCheck();
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, startHour, numberOfPeople, selectedService?.id, selectedInterval, step]);

  async function handleVerifyPromo() {
    if (!promoCode || !selectedService) return;
    setVerifyingPromo(true);
    setPromoError("");
    setPromoDiscount(null);
    try {
      const result = await verifyPromoCode(promoCode, selectedService.id);
      if (result.valid) {
        setPromoDiscount(result.discountPercent);
      }
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Invalid promo code");
      setPromoDiscount(null);
    } finally {
      setVerifyingPromo(false);
    }
  }

  // Card detail helpers
  const requiresCardDetails = paymentMethod === "VISA" || paymentMethod === "MASTERCARD";

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  const cardDigits = cardNumber.replace(/\D/g, "");
  const isCardNumberValid = cardDigits.length === 16;
  const expiryDigits = cardExpiry.replace(/\D/g, "");
  const isExpiryValid = (() => {
    if (expiryDigits.length !== 4) return false;
    const month = parseInt(expiryDigits.slice(0, 2), 10);
    const year = parseInt(expiryDigits.slice(2), 10) + 2000;
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const expDate = new Date(year, month); // first of the month AFTER expiry
    return expDate > now;
  })();
  const isCvvValid = /^\d{3,4}$/.test(cardCvv);
  const isCardNameValid = cardName.trim().length >= 2;
  const isCardFormValid = !requiresCardDetails || (isCardNumberValid && isExpiryValid && isCvvValid && isCardNameValid);

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
        promoCode: promoCode || undefined,
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative h-full w-full sm:mx-4 sm:h-auto sm:max-w-lg sm:max-h-[90vh] sm:rounded-2xl rounded-none bg-dark-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-float overflow-y-auto flex flex-col">
        {/* Sticky header on mobile */}
        <div className="sticky top-0 z-10 bg-dark-900 border-b border-slate-200 dark:border-slate-800 sm:border-b-0 px-6 pt-6 pb-4 sm:pb-0 flex items-center justify-between shrink-0">
          {/* Header */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === "success" ? "Booking Confirmed" : `Book at ${branchName}`}
          </h2>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors -mr-2"
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
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto">

        {/* Step indicator */}
        {step !== "success" && (
          <div className="mt-4 flex gap-2">
            {(["service", "schedule", "review"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === s
                    ? "bg-brand-500 text-white"
                    : (["service", "schedule", "review"] as const).indexOf(
                      step,
                    ) > i
                      ? "bg-brand-500/20 text-brand-500"
                      : "bg-dark-800 text-slate-500"
                    }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className="h-px w-8 bg-slate-700" />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === "service" && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a service and pricing plan
            </p>
            {services.map((service) => (
              <div
                key={service.id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${selectedService?.id === service.id
                  ? "border-brand-500 bg-brand-500/5"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-600"
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
                        className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedInterval === p.interval
                          ? "bg-brand-500 text-white"
                          : "bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-dark-700"
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
              className="w-full rounded-lg bg-brand-500 active:scale-95 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600  disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === "schedule" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pick your date, time, and group size
              </p>
              {/* Real-time status indicator */}
              <span className="flex items-center gap-1.5 text-xs font-medium">
                {checkingAvailability ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400" />
                    </span>
                    <span className="text-slate-400">Checking...</span>
                  </>
                ) : isAvailable === true ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                    </span>
                    <span className="text-green-400">Available</span>
                  </>
                ) : isAvailable === false ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                    </span>
                    <span className="text-red-400">Unavailable</span>
                  </>
                ) : null}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Date
              </label>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-850 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500"
              />
              {/* Operating hours hint or closed warning */}
              {date && selectedDayHours === null && operatingHours && (
                <p className="mt-1 text-xs font-medium text-red-400">
                  Branch is closed on this day
                </p>
              )}
              {date && selectedDayHours && (
                <p className="mt-1 text-xs text-slate-500">
                  Open: {selectedDayHours.open} - {selectedDayHours.close}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Start time
                {selectedDayHours && (
                  <span className="ml-1 text-xs text-slate-500 font-normal">
                    ({selectedDayHours.open} - {selectedDayHours.close})
                  </span>
                )}
              </label>
              <input
                type="time"
                value={startHour}
                min={selectedDayHours?.open}
                max={selectedDayHours?.close}
                onChange={(e) => setStartHour(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-850 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Number of people
              </label>
              <input
                type="number"
                min={1}
                max={selectedService?.capacity || 1}
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Number(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-850 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Max {selectedService?.capacity || 1}
              </p>
            </div>

            {/* Visual capacity bar */}
            {availabilityResult && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">
                    {availabilityResult.currentBookings} booked
                  </span>
                  <span className="text-slate-500">
                    {availabilityResult.capacity} total
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-dark-800 overflow-hidden">
                  {(() => {
                    const pct = availabilityResult.capacity > 0
                      ? (availabilityResult.currentBookings / availabilityResult.capacity) * 100
                      : 0;
                    const color = pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500";
                    return (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    );
                  })()}
                </div>
                {availabilityResult.remainingSpots > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    {availabilityResult.remainingSpots} {availabilityResult.remainingSpots === 1 ? "spot" : "spots"} remaining
                  </p>
                )}
              </div>
            )}

            {/* Availability reason alert */}
            {availabilityMsg && isAvailable === false && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                {availabilityMsg}
              </div>
            )}
            {availabilityMsg && isAvailable === true && (
              <p className="text-sm font-medium text-green-400">
                {availabilityMsg}
              </p>
            )}

            {/* Suggested time slots */}
            {availabilityResult?.suggestedSlots && availabilityResult.suggestedSlots.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Try these available times:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availabilityResult.suggestedSlots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const d = new Date(slot.startTime);
                        const yr = d.getFullYear();
                        const mo = String(d.getMonth() + 1).padStart(2, "0");
                        const dy = String(d.getDate()).padStart(2, "0");
                        setDate(`${yr}-${mo}-${dy}`);
                        const hh = String(d.getHours()).padStart(2, "0");
                        const mm = String(d.getMinutes()).padStart(2, "0");
                        setStartHour(`${hh}:${mm}`);
                      }}
                      className="rounded-lg bg-brand-500/10 border border-brand-500/30 px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/20 transition-colors"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Re-check button (secondary) */}
            <button
              type="button"
              disabled={!date || checkingAvailability}
              onClick={runAvailabilityCheck}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-dark-850 disabled:opacity-50"
            >
              {checkingAvailability ? "Checking..." : "Re-check Availability"}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("service")}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-dark-850"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!date || isAvailable !== true}
                onClick={() => setStep("review")}
                className="flex-1 rounded-lg bg-brand-500 active:scale-95 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600  disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === "review" && selectedPricing && selectedService && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review your booking details
            </p>

            {/* Summary card */}
            <div className="rounded-xl bg-dark-850 border border-slate-200 dark:border-slate-800 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Service</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Date</span>
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
                  <span className="text-slate-500 dark:text-slate-400">Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">{startHour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">Per {formatPricingInterval(selectedInterval!)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">People</span>
                  <span className="font-medium text-gray-900 dark:text-white">{numberOfPeople}</span>
                </div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div className="flex justify-between text-base font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <div className="text-right">
                    {promoDiscount !== null && selectedPricing && (
                      <div className="text-sm line-through text-slate-500">
                        {formatPrice(selectedPricing.price, selectedPricing.currency)}
                      </div>
                    )}
                    <span className="text-brand-500">
                      {selectedPricing ? formatPrice(
                        promoDiscount !== null
                          ? Math.max(0, Number(selectedPricing.price) - (Number(selectedPricing.price) * promoDiscount / 100))
                          : selectedPricing.price,
                        selectedPricing.currency,
                      ) : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Promo Code <span className="text-xs text-slate-500">(optional)</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    if (promoDiscount || promoError) {
                      setPromoDiscount(null);
                      setPromoError("");
                    }
                  }}
                  placeholder="e.g. SUMMER20"
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-850 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500 uppercase"
                />
                <button
                  type="button"
                  disabled={!promoCode || verifyingPromo}
                  onClick={handleVerifyPromo}
                  className="rounded-lg bg-dark-800 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-dark-700 disabled:opacity-50"
                >
                  {verifyingPromo ? "..." : "Apply"}
                </button>
              </div>
              {promoDiscount !== null && (
                <p className="mt-2 text-sm text-green-400">
                  Promo code applied! {promoDiscount}% discount.
                </p>
              )}
              {promoError && (
                <p className="mt-2 text-sm text-red-400">
                  {promoError}
                </p>
              )}
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Payment method
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm transition-all duration-200 ${paymentMethod === pm.value
                      ? "border-brand-500 bg-brand-500/5 shadow-[0_0_12px_rgba(20,184,166,0.15)]"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500"
                      }`}
                  >
                    {paymentMethod === pm.value && (
                      <div className="absolute top-1.5 right-1.5">
                        <svg className="h-4 w-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {pm.logo}
                    <div className="text-center">
                      <span className={`block text-xs font-semibold ${paymentMethod === pm.value ? "text-gray-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                        {pm.label}
                      </span>
                      {pm.subtitle && (
                        <span className="block text-[10px] text-slate-500 mt-0.5">{pm.subtitle}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card details (Visa / Mastercard) */}
            {requiresCardDetails && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-850 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-500">Card details are secure and encrypted</span>
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Card number</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-900 pl-4 pr-12 py-2.5 text-sm text-gray-900 dark:text-white font-mono tracking-wider focus:border-brand-500 focus:ring-brand-500"
                    />
                    {/* Card brand icon in the input */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {paymentMethod === "VISA" ? (
                        <svg viewBox="0 0 48 32" className="h-5 w-8" fill="none">
                          <rect width="48" height="32" rx="4" fill="#1A1F71" />
                          <path d="M19.5 21h-3l1.88-11.5h3L19.5 21Zm-5.12-11.5-2.85 7.88-.34-1.72-.99-5.08s-.12-1.08-1.42-1.08H4.1l-.06.21s1.45.3 3.14 1.32l2.61 10.87h3.13l4.78-12.4h-3.32Zm25.05 11.5h2.76l-2.41-11.5h-2.42c-1.08 0-1.34.84-1.34.84l-4.49 10.66h3.14l.63-1.72h3.83l.3 1.72Zm-3.3-4.1 1.58-4.35.89 4.35h-2.47Zm-5.11-4.67-0.43 2.63s-1.33-.64-2.79-.64c-1.5 0-1.59.78-1.59 1 0 1.1 4.32 1.25 4.32 4.29 0 2.82-2.67 3.49-4.26 3.49-2.14 0-3.37-.73-3.37-.73l.45-2.73s1.62.73 2.87.73c.87 0 1.37-.44 1.37-1.01 0-1.22-4.3-1.33-4.3-4.07 0-2.53 2.16-3.63 4.22-3.63 1.64 0 3.51.67 3.51.67Z" fill="#fff" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 48 32" className="h-5 w-8" fill="none">
                          <rect width="48" height="32" rx="4" fill="#252525" />
                          <circle cx="19" cy="16" r="8" fill="#EB001B" />
                          <circle cx="29" cy="16" r="8" fill="#F79E1B" />
                          <path d="M24 9.87a8 8 0 0 1 0 12.26 8 8 0 0 1 0-12.26Z" fill="#FF5F00" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expiry + CVV row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Expiry date</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono tracking-wider focus:border-brand-500 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">CVV</label>
                    <div className="relative">
                      <input
                        type="password"
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="***"
                        maxLength={4}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono tracking-wider focus:border-brand-500 focus:ring-brand-500"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cardholder name */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cardholder name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Full name on card"
                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Apple Pay notice */}
            {paymentMethod === "APPLE_PAY" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-850 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-slate-400" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.53-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Apple Pay</p>
                  <p className="text-xs text-slate-500">You&apos;ll be redirected to Apple Pay to complete your payment securely.</p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                Notes{" "}
                <span className="text-xs text-slate-500">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-850 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500"
                placeholder="Any special requirements..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-dark-850"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading || !isCardFormValid}
                onClick={handleConfirmBooking}
                className="flex-1 rounded-lg bg-brand-500 active:scale-95 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600  disabled:opacity-50"
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && booking && (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
              <svg
                className="h-8 w-8 text-green-400"
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
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {booking.status === "CONFIRMED"
                  ? "Your payment was processed successfully."
                  : "Please pay at the location upon arrival."}
              </p>
            </div>
            <div className="rounded-xl bg-dark-850 border border-slate-200 dark:border-slate-800 p-4 text-left text-sm">
              <p className="text-slate-500 dark:text-slate-400">
                Booking ID:{" "}
                <span className="font-mono text-gray-900 dark:text-white">
                  {booking.id.slice(0, 8)}
                </span>
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Total:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(booking.totalPrice, booking.currency)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-brand-500 active:scale-95 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600 "
            >
              Done
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
