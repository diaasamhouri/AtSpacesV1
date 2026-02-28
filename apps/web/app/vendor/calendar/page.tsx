"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { getVendorCalendar } from "../../../lib/vendor";
import { VendorCalendar, CalendarEvent } from "../../components/vendor-calendar";

export default function VendorCalendarPage() {
    const { token } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            getVendorCalendar(token)
                .then((data) => {
                    // Convert ISO strings in the payload to Date objects required by react-big-calendar
                    const mappedEvents: CalendarEvent[] = data.map((item: any) => ({
                        ...item,
                        start: new Date(item.start),
                        end: new Date(item.end),
                    }));
                    setEvents(mappedEvents);
                    setLoading(false);
                })
                .catch((err) => {
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [token]);

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Loading calendar...</div>;
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
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Bookings Calendar</h1>
                <p className="text-slate-400">
                    View and manage all your confirmed and checked-in bookings visually.
                </p>
            </div>

            <VendorCalendar events={events} />
        </div>
    );
}
