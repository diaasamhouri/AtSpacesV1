"use client";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";

export function VendorCtaButton({ className, variant = "primary" }: { className?: string, variant?: "primary" | "secondary" }) {
  const { user } = useAuth();
  const ctaLink = user ? "/become-vendor" : "/auth/signup?type=VENDOR";
  
  if (variant === "secondary") {
    return (
      <Link
        href={ctaLink}
        className={className || "inline-flex items-center rounded-full bg-gray-900 px-8 py-3.5 text-sm font-semibold text-gray-900 dark:text-white shadow-apple hover:shadow-apple-hover hover:-translate-y-0.5 transition-all duration-300"}
      >
        {user ? "Continue your application" : "Start your application today"}
        <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href={ctaLink}
      className={className || "rounded-full bg-brand-500 active:scale-95 px-8 py-4 text-sm font-semibold text-white shadow-apple hover:shadow-apple-hover hover:-translate-y-0.5 transition-all duration-300"}
    >
      {user ? "Complete your application" : "Apply as a Vendor"}
    </Link>
  );
}
