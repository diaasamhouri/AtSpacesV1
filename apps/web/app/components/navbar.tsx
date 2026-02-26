"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-dark-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-teal-400">
                At
              </span>
              <span className="text-gray-900 dark:text-white">Spaces</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/spaces"
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors dark:text-gray-300"
            >
              Browse Spaces
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors dark:text-gray-300"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors dark:text-gray-300"
            >
              Contact
            </Link>
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-dark-800"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {initials}
                  </span>
                  <span className="max-w-[120px] truncate">
                    {user.name || user.email || "User"}
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-dark-800">
                    <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-700">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {user.name || "User"}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {user.email || user.phone}
                      </p>
                    </div>
                    <Link
                      href="/bookings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-dark-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:text-red-400 dark:hover:bg-dark-700"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-brand-500 transition-colors px-4 py-2 dark:text-gray-300"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium text-white bg-brand-500 hover:bg-brand-500/90 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:text-brand-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/spaces"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-500 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Spaces
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-500 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-500 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <hr className="border-gray-200 dark:border-gray-700" />
            {user ? (
              <>
                <Link
                  href="/bookings"
                  className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-500 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:text-red-500 rounded-md"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-500 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-500/90 rounded-md text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
