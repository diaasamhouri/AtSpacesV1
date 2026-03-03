"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { BookingModal } from "./booking-modal";
import { AuthDialog } from "./ui/auth-dialog";
import type { ServiceItem } from "../../lib/types";

interface BookNowButtonProps {
  branchId: string;
  branchName: string;
  services: ServiceItem[];
  operatingHours?: Record<string, { open: string; close: string } | null> | null;
}

export function BookNowButton({
  branchId,
  branchName,
  services,
  operatingHours,
}: BookNowButtonProps) {
  const { user, isLoading } = useAuth();
  
  // Two separate modals: one for auth context, one for actual booking
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  function handleClick() {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    setBookingModalOpen(true);
  }

  // Once auth is successful via the dialog, the user might want to book immediately
  function handleAuthSuccessClose() {
    setAuthDialogOpen(false);
    // Since the dialog handles logging them in, `user` state will update.
    // We could automatically open the booking modal, but to be safe, they just click the button again 
    // when it says "Book Now".
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="mt-4 block w-full rounded-full bg-brand-500 active:scale-95 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-apple transition-all hover:bg-brand-600 hover:shadow-apple-hover hover:-translate-y-0.5 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : user ? "Book Space Now" : "Sign in to Book"}
      </button>

      {/* The actual booking form modal */}
      <BookingModal
        branchId={branchId}
        branchName={branchName}
        services={services}
        operatingHours={operatingHours}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />

      {/* The inline auth interceptor */}
      <AuthDialog 
        isOpen={authDialogOpen} 
        onClose={handleAuthSuccessClose} 
        title="Sign in to Book"
        subtitle={`Connect your AtSpaces account to reserve space at ${branchName}.`}
        redirectTo="" // We don't want a hard redirect, stay on the page
      />
    </>
  );
}
