"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { getVendorCalendar, getVendorBranches } from "../../../lib/vendor";
import { formatServiceType } from "../../../lib/format";
import StatusBadge from "../../components/ui/status-badge";
import { VendorCalendar, CalendarEvent } from "../../components/vendor-calendar";

export default function VendorCalendarPage() {
    const { token } = useAuth();
    const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");

    useEffect(() => {
        if (!token) return;
        Promise.all([
            getVendorCalendar(token),
            getVendorBranches(token),
        ])
            .then(([calData, branchData]) => {
                const mappedEvents: CalendarEvent[] = calData.map((item: any) => ({
                    ...item,
                    start: new Date(item.start),
                    end: new Date(item.end),
                    extendedProps: {
                        ...item.extendedProps,
                        serviceName: item.title?.split(" - ")[0] || "",
                    },
                }));
                setAllEvents(mappedEvents);
                setBranches(branchData.data.map((b: any) => ({ id: b.id, name: b.name })));
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [token]);

    const events = selectedBranch
        ? allEvents.filter((e) => e.resourceId === selectedBranch)
        : allEvents;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bookings Calendar</h1>
                <p className="text-slate-400">
                    View and manage all your confirmed and checked-in bookings visually.
                </p>
            </div>

            {events.length === 0 && !selectedBranch ? (
                <div className="rounded-2xl bg-white dark:bg-dark-900 border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 mb-4 border border-brand-500/20">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Bookings Yet</h2>
                    <p className="text-sm font-medium text-slate-400 max-w-md mx-auto">
                        Your calendar will populate as customers book your spaces. Confirmed and checked-in bookings will appear here.
                    </p>
                </div>
            ) : (
                <>
                    {/* Mobile list view */}
                    <div className="md:hidden space-y-6">
                        {(() => {
                            const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
                            const grouped: Record<string, CalendarEvent[]> = {};
                            sorted.forEach((e) => {
                                const key = e.start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
                                if (!grouped[key]) grouped[key] = [];
                                grouped[key]!.push(e);
                            });
                            return Object.entries(grouped).map(([dateLabel, dayEvents]) => (
                                <div key={dateLabel}>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 sticky top-0 bg-white dark:bg-dark-950 py-1">{dateLabel}</h3>
                                    <div className="space-y-3">
                                        {dayEvents.map((ev) => (
                                            <div key={ev.id} className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-4">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{ev.title}</div>
                                                    <StatusBadge status={ev.extendedProps.status} />
                                                </div>
                                                <div className="text-xs text-slate-400 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="h-3.5 w-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                                        {ev.start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - {ev.end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                                    </div>
                                                    <div>{formatServiceType(ev.serviceType)} &middot; {ev.extendedProps.branchName}</div>
                                                    <div>{ev.extendedProps.customerEmail}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Desktop calendar with filters */}
                    <div className="hidden md:block">
                        <VendorCalendar
                            events={events}
                            branches={branches}
                            selectedBranch={selectedBranch}
                            onBranchChange={setSelectedBranch}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
