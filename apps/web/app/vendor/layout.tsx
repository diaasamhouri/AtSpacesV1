"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import SidebarIcon from "../components/ui/sidebar-icon";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface VendorLink {
    href: string;
    label: string;
    icon: string;
    children?: { href: string; label: string }[];
}

const VENDOR_LINKS: VendorLink[] = [
    { href: "/vendor", label: "Dashboard", icon: "Dashboard" },
    { href: "/vendor/profile", label: "Profile", icon: "Building" },
    { href: "/vendor/branches", label: "Branches", icon: "MapPin" },
    { href: "/vendor/search-booking", label: "New Reservation", icon: "Search" },
    { href: "/vendor/day-view", label: "Day View", icon: "CalendarClock" },
    { href: "/vendor/calendar", label: "Calendar", icon: "CalendarClock" },
    { href: "/vendor/quotations", label: "Quotations", icon: "FileText" },
    {
        href: "/vendor/bookings", label: "Bookings", icon: "Calendar",
        children: [
            { href: "/vendor/bookings", label: "All Bookings" },
            { href: "/vendor/bookings/confirmed", label: "Confirmed" },
            { href: "/vendor/bookings/in-progress", label: "In Progress" },
            { href: "/vendor/bookings/cancelled", label: "Cancelled" },
            { href: "/vendor/bookings/rejected", label: "Rejected" },
            { href: "/vendor/bookings/finished", label: "Finished" },
            { href: "/vendor/bookings/expired", label: "Expired" },
            { href: "/vendor/bookings/no-show", label: "No Show" },
            { href: "/vendor/bookings/overview", label: "Overview" },
            { href: "/vendor/bookings/sales-pending", label: "Sales Pending" },
            { href: "/vendor/bookings/accountant-pending", label: "Accountant Pending" },
            { href: "/vendor/bookings/archived", label: "Archived" },
        ],
    },
    { href: "/vendor/addons", label: "Add-ons", icon: "Package" },
    { href: "/vendor/earnings", label: "Earnings", icon: "DollarSign" },
    { href: "/vendor/reviews", label: "Reviews", icon: "Star" },
    { href: "/vendor/promotions", label: "Promotions", icon: "Tag" },
    { href: "/vendor/analytics", label: "Analytics", icon: "TrendingUp" },
    { href: "/vendor/notifications", label: "Notifications", icon: "Bell" },
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

export default function VendorLayout({ children }: { children: React.ReactNode }) {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
        const set = new Set<string>();
        VENDOR_LINKS.forEach((link) => {
            if (link.children && link.children.some((c) => pathname.startsWith(c.href))) {
                set.add(link.href);
            }
        });
        return set;
    });

    useEffect(() => {
        const saved = localStorage.getItem('vendor-sidebar-collapsed');
        if (saved === 'true') setCollapsed(true);
    }, []);

    useEffect(() => {
        if (isLoading) return;
        if (!user || !token) {
            router.push("/auth/login?redirect=/vendor");
            return;
        }
        fetch(API_BASE_URL + "/auth/me", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.json())
            .then((data) => { setProfile(data); setProfileLoading(false); })
            .catch(() => setProfileLoading(false));
    }, [user, token, isLoading, router]);

    // Close mobile nav on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            localStorage.setItem('vendor-sidebar-collapsed', String(!prev));
            return !prev;
        });
    };

    if (isLoading || profileLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 dark:bg-dark-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    if (!profile?.vendorProfile) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Not a Vendor</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400">You need to register as a vendor to access this dashboard.</p>
                <button onClick={() => router.push("/become-vendor")} className="mt-6 rounded-lg bg-brand-500 active:scale-95 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 shadow-[0_4px_12px_rgba(255,91,4,0.4)] transition-all">
                    Become a Vendor
                </button>
            </div>
        );
    }

    if (profile.vendorProfile.status === "REJECTED") {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Application Rejected</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Your vendor application for <strong className="text-gray-900 dark:text-white">{profile.vendorProfile.companyName}</strong> was not approved.</p>
                {profile.vendorProfile.rejectionReason && (
                    <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-left">
                        <h3 className="text-sm font-bold text-red-400 mb-1">Reason:</h3>
                        <p className="text-sm text-red-600 dark:text-red-300">{profile.vendorProfile.rejectionReason}</p>
                    </div>
                )}
                <div className="mt-6 flex justify-center gap-3">
                    <button onClick={() => router.push("/become-vendor")} className="rounded-lg bg-brand-500 active:scale-95 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors">Re-Apply</button>
                    <button onClick={() => router.push("/")} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">Return to Home</button>
                </div>
            </div>
        );
    }

    if (profile.vendorProfile.status !== "APPROVED") {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Application Pending</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Your vendor application for <strong className="text-gray-900 dark:text-white">{profile.vendorProfile.companyName}</strong> is being reviewed.</p>
                <button onClick={() => router.push("/")} className="mt-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">Return to Home</button>
            </div>
        );
    }

    const companyInitial = profile.vendorProfile.companyName?.charAt(0)?.toUpperCase() || "V";
    const firstName = user?.name?.split(" ")[0] || "Vendor";

    const sidebarContent = (
        <>
            {!collapsed && (
                <div className="mb-6 px-3">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 font-extrabold text-sm border border-brand-500/20 ring-2 ring-brand-500/10">
                            {companyInitial}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xs font-bold leading-6 text-slate-500 uppercase tracking-wider">Vendor Hub</h2>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile.vendorProfile.companyName}</p>
                        </div>
                    </div>
                </div>
            )}
            <nav className="space-y-1.5">
                {VENDOR_LINKS.map((link) => {
                    const isActive = link.children
                        ? pathname === link.href
                        : pathname === link.href || (link.href !== "/vendor" && pathname.startsWith(link.href));
                    const isExpanded = expandedSections.has(link.href);
                    const hasActiveChild = link.children?.some((c) => pathname === c.href || pathname.startsWith(c.href));

                    return (
                        <div key={link.href}>
                            {link.children ? (
                                <button
                                    onClick={() => {
                                        setExpandedSections((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(link.href)) next.delete(link.href);
                                            else next.add(link.href);
                                            return next;
                                        });
                                    }}
                                    title={collapsed ? link.label : undefined}
                                    className={`relative w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'px-2' : 'px-4'} py-3 text-sm font-bold transition-all ${isActive || hasActiveChild ? "bg-brand-500/10 text-gray-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white"}`}
                                >
                                    {(isActive || hasActiveChild) && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-brand-500" />}
                                    <SidebarIcon name={link.icon} className={`h-5 w-5 shrink-0 ${isActive || hasActiveChild ? "text-brand-500" : ""}`} />
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 text-left">{link.label}</span>
                                            <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <Link href={link.href}
                                    title={collapsed ? link.label : undefined}
                                    className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} rounded-xl ${collapsed ? 'px-2' : 'px-4'} py-3 text-sm font-bold transition-all ${isActive ? "bg-brand-500/10 text-gray-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white"}`}>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-brand-500" />}
                                    <SidebarIcon name={link.icon} className={`h-5 w-5 shrink-0 ${isActive ? "text-brand-500" : ""}`} />
                                    {!collapsed && link.label}
                                </Link>
                            )}
                            {/* Children sub-links */}
                            {link.children && isExpanded && !collapsed && (
                                <div className="ml-8 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                                    {link.children.map((child) => {
                                        const childActive = pathname === child.href;
                                        return (
                                            <Link key={child.href} href={child.href}
                                                className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${childActive ? "text-brand-500 bg-brand-500/5" : "text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-850"}`}>
                                                {child.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </>
    );

    return (
        <div className="bg-slate-50 dark:bg-dark-950 min-h-screen pt-24 pb-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center justify-between">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white"
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
                            <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-dark-950 border-r border-slate-200 dark:border-slate-800/50 p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">Navigation</span>
                                    <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2.5 text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white transition-colors">
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

                    {/* Main content */}
                    <main className="min-w-0 flex-1">
                        {/* Greeting bar */}
                        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {firstName}</h2>
                            <span className="text-sm font-medium text-slate-500">{formatDate()}</span>
                        </div>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
