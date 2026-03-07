"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { useTheme } from "../../lib/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import { AtSpacesLogo } from "./at-spaces-logo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, token, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navLinks = [
    { href: "/spaces", label: "Explore" },
    { href: "/how-it-works", label: "How it Works" },
    { href: "/become-vendor", label: "For Vendors" },
    { href: "/ai-assistant", label: "AI Assistant" },
  ];

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

  // Fetch unread notification count
  useEffect(() => {
    if (!user || !token) return;
    fetch(`${API_BASE_URL}/auth/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setUnreadCount(data.count); })
      .catch(() => {});
  }, [user, token]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-6xl rounded-full glass-nav px-6 py-3 transition-all duration-300">
        <div className="flex items-center justify-between relative">

          {/* Logo — left */}
          <Link href="/" className="flex items-center gap-2">
            <AtSpacesLogo size="sm" />
          </Link>

          {/* Desktop Navigation — centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors whitespace-nowrap ${isActive ? "text-gray-900 dark:text-white font-semibold after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-brand-500" : "text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side CTA & Auth area */}
          <div className="hidden md:flex items-center gap-4">

            {/* Always visible prominent CTA */}
            <Link
              href="/spaces"
              className="text-sm font-bold text-white bg-brand-500 active:scale-95 hover:bg-brand-600 px-6 py-2.5 rounded-full transition-all  drop-shadow-[0_4px_12px_rgba(255,91,4,0.4)]"
            >
              Book Now
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-slate-600 dark:text-slate-400"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>

            {isLoading ? (
              <div className="h-10 w-24 skeleton rounded-full" />
            ) : user ? (
              <div className="relative flex items-center gap-2" ref={dropdownRef}>

                {/* Notification Bell */}
                <Link
                    href={user.role === 'ADMIN' ? '/admin/notifications' : user.role === 'VENDOR' ? '/vendor/notifications' : '/notifications'}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-slate-500 dark:text-slate-400"
                    title="Notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                {/* Profile Avatar Button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:shadow-[0_0_12px_rgba(255,91,4,0.3)] hover:bg-gray-100 dark:hover:bg-dark-800 transition-all"
                >
                  <span className="text-sm font-bold text-brand-500">
                    {initials}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-12 mt-2 w-56 rounded-2xl glass-panel shadow-float origin-top-right overflow-hidden z-50"
                    >
                      <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-dark-850">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                          {user.name || "User"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user.email || user.phone}
                        </p>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          Profile Settings
                        </Link>
                        <Link
                          href="/bookings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                          </svg>
                          My Bookings
                        </Link>
                        <Link
                          href="/favorites"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                          </svg>
                          Favorites
                        </Link>

                        {/* Role Specific Dashboards */}
                        {user.role === 'VENDOR' && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <Link
                              href="/vendor"
                              className="block px-4 py-2 text-sm font-bold text-brand-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                              onClick={() => setDropdownOpen(false)}
                            >
                              Vendor Hub
                            </Link>
                          </div>
                        )}
                        {user.role === 'ADMIN' && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <Link
                              href="/admin"
                              className="block px-4 py-2 text-sm font-bold text-blue-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                              onClick={() => setDropdownOpen(false)}
                            >
                              Admin Console
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm font-medium text-red-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-slate-500 dark:text-slate-400"
                  title="Log in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-full p-2.5 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dark-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile slide-out drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 pointer-events-auto md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-dark-900 border-l border-slate-200 dark:border-slate-800 shadow-float z-50 pointer-events-auto md:hidden overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <AtSpacesLogo size="sm" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-slate-600 dark:text-slate-400"
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {theme === "dark" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer content */}
              <div className="p-6 space-y-2">
                <Link
                  href="/spaces"
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                  Explore Spaces
                </Link>
                <Link
                  href="/how-it-works"
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                  How it Works
                </Link>
                <Link
                  href="/become-vendor"
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
                  For Vendors
                </Link>
                <Link
                  href="/ai-assistant"
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
                  AI Assistant
                </Link>

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                  {user ? (
                    <div className="space-y-1">
                      <div className="px-4 py-3 mb-3 bg-white dark:bg-dark-850 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                        Profile Settings
                      </Link>
                      <Link
                        href="/bookings"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                        My Bookings
                      </Link>
                      {user.role === 'VENDOR' && (
                        <Link
                          href="/vendor"
                          className="flex items-center gap-3 px-4 py-3 text-base font-bold text-brand-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl mt-2 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" /></svg>
                          Vendor Hub
                        </Link>
                      )}
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-3 text-base font-bold text-blue-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl mt-2 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                          Admin Console
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 mt-4 text-left text-base font-medium text-red-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 px-1">
                      <Link
                        href="/spaces"
                        className="flex justify-center rounded-xl bg-brand-500 active:scale-95 px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-600 shadow-[0_4px_12px_rgba(255,91,4,0.4)]  transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Book Now
                      </Link>
                      <Link
                        href="/auth/login"
                        className="flex justify-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-850 px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log In
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
