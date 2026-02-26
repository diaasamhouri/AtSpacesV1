"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { BookingModal } from "./booking-modal";
import type { ServiceItem } from "../../lib/types";

interface BookNowButtonProps {
  branchId: string;
  branchName: string;
  services: ServiceItem[];
}

export function BookNowButton({
  branchId,
  branchName,
  services,
}: BookNowButtonProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  function handleClick() {
    if (!user) {
      router.push(`/auth/login?redirect=/spaces/${branchId}`);
      return;
    }
    setModalOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="mt-4 block w-full rounded-lg bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-500/90 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : user ? "Book Now" : "Sign in to book"}
      </button>

      <BookingModal
        branchId={branchId}
        branchName={branchName}
        services={services}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
