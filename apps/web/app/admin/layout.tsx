"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { hasAccess } from "../../lib/admin";
import SidebarIcon from "../components/ui/sidebar-icon";

const ALL_ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', section: 'DASHBOARD', icon: 'Dashboard' },
  { href: '/admin/vendors', label: 'Vendors', section: 'VENDORS', icon: 'Building' },
  { href: '/admin/bookings', label: 'Bookings', section: 'BOOKINGS', icon: 'Calendar' },
  { href: '/admin/payments', label: 'Payments', section: 'PAYMENTS', icon: 'CreditCard' },
  { href: '/admin/branches', label: 'Branches', section: 'BRANCHES', icon: 'MapPin' },
  { href: '/admin/users', label: 'Users', section: 'USERS', icon: 'Users' },
  { href: '/admin/approvals', label: 'Approvals', section: 'APPROVALS', icon: 'CheckCircle' },
  { href: '/admin/notifications', label: 'Notifications', section: 'NOTIFICATIONS', icon: 'Bell' },
  { href: '/admin/analytics', label: 'Analytics', section: 'ANALYTICS', icon: 'TrendingUp' },
  { href: '/admin/settings', label: 'Settings', section: 'DASHBOARD', icon: 'Settings' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Super Admin",
  MODERATOR: "Moderator",
  ACCOUNTANT: "Accountant",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR" || user?.role === "ACCOUNTANT";
    if (!user || !isAdmin || !token) {
      router.push("/");
      return;
    }
    setAuthorized(true);
  }, [user, token, isLoading, router]);

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('admin-sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  if (isLoading || !authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-dark-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const role = user?.role || "CUSTOMER";
  const visibleLinks = ALL_ADMIN_LINKS.filter((link) => hasAccess(role, link.section));
  const firstName = user?.name?.split(" ")[0] || "Admin";

  const sidebarContent = (
    <>
      {!collapsed && (
        <div className="mb-6 px-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 ring-2 ring-brand-500/10">
              <SidebarIcon name="Shield" className="h-5 w-5 text-brand-500" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
                {ROLE_LABELS[role] || role}
              </span>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate">Admin Console</p>
            </div>
          </div>
        </div>
      )}
      <nav className="space-y-1.5">
        {visibleLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'px-2' : 'px-4'} py-3 text-sm font-bold transition-all ${isActive
                ? "bg-brand-500/10 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-brand-500" />}
              <SidebarIcon name={link.icon} className={`h-5 w-5 shrink-0 ${isActive ? "text-brand-500" : ""}`} />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center justify-between">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-dark-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white"
            >
              <svg className="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              Menu
            </button>
          </div>

          {/* Mobile drawer overlay */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <aside className="absolute left-0 top-0 h-full w-72 bg-dark-950 border-r border-slate-200 dark:border-slate-800/50 p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Navigation</span>
                  <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {sidebarContent}
              </aside>
            </div>
          )}

          {/* Desktop sidebar */}
          <aside className={`hidden md:flex flex-col ${collapsed ? 'w-16' : 'w-64'} shrink-0 border-r border-slate-200 dark:border-slate-800/50 pr-2 transition-all duration-300`}>
            {sidebarContent}
            {/* Collapse toggle */}
            <button
              onClick={toggleCollapsed}
              className="mt-4 flex items-center justify-center rounded-xl px-2 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            </button>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            {/* Greeting bar */}
            <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {firstName}</h2>
                <span className="inline-flex items-center rounded-full bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
                  {ROLE_LABELS[role] || role}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-500">{formatDate()}</span>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
