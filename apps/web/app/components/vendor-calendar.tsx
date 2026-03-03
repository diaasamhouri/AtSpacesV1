"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { formatBookingStatus } from "../../lib/format";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    serviceType: "MEETING_ROOM" | "HOT_DESK" | "PRIVATE_OFFICE" | "VIRTUAL_OFFICE" | "EVENT_SPACE" | "PHOTO_STUDIO";
    resourceId: string;
    extendedProps: {
        status: string;
        branchName: string;
        customerEmail: string;
        numberOfPeople: number;
        totalPrice: number;
        notes?: string;
    };
}

interface VendorCalendarProps {
    events: CalendarEvent[];
}

export function VendorCalendar({ events }: VendorCalendarProps) {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const eventPropGetter = useCallback(
        (event: CalendarEvent) => {
            let backgroundColor = "#3b82f6";
            let borderColor = "#2563eb";

            switch (event.serviceType) {
                case "MEETING_ROOM":
                    backgroundColor = "#3b82f6";
                    borderColor = "#2563eb";
                    break;
                case "HOT_DESK":
                    backgroundColor = "#10b981";
                    borderColor = "#059669";
                    break;
                case "PRIVATE_OFFICE":
                    backgroundColor = "#8b5cf6";
                    borderColor = "#7c3aed";
                    break;
                case "VIRTUAL_OFFICE":
                    backgroundColor = "#64748b";
                    borderColor = "#475569";
                    break;
                case "EVENT_SPACE":
                    backgroundColor = "#f59e0b";
                    borderColor = "#d97706";
                    break;
                case "PHOTO_STUDIO":
                    backgroundColor = "#ec4899";
                    borderColor = "#db2777";
                    break;
            }

            return {
                style: {
                    backgroundColor,
                    borderColor,
                    borderRadius: "6px",
                    color: "white",
                    border: `1px solid ${borderColor}`,
                    display: "block",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                },
            };
        },
        []
    );

    return (
        <>
            <div className="h-[700px] w-full bg-dark-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 [&_.rbc-toolbar]:mb-6 [&_.rbc-toolbar_button.rbc-active]:bg-brand-500 [&_.rbc-toolbar_button.rbc-active]:text-white [&_.rbc-toolbar_button.rbc-active]:border-brand-500 [&_.rbc-toolbar_button]:rounded-lg [&_.rbc-toolbar_button]:border-slate-700 [&_.rbc-toolbar_button]:text-slate-300 [&_.rbc-toolbar_button]:bg-dark-850 [&_.rbc-toolbar_button:hover]:bg-dark-800 [&_.rbc-toolbar_button.rbc-active:hover]:bg-brand-600 [&_.rbc-month-view]:border-slate-800 [&_.rbc-month-view]:rounded-xl [&_.rbc-month-view]:overflow-hidden [&_.rbc-day-bg]:border-slate-800 [&_.rbc-header]:border-slate-800 [&_.rbc-header]:py-3 [&_.rbc-header]:font-semibold [&_.rbc-header]:text-slate-300 [&_.rbc-header]:bg-dark-850 [&_.rbc-off-range-bg]:bg-dark-950/50 [&_.rbc-today]:bg-brand-500/5 [&_.rbc-date-cell]:text-slate-400 [&_.rbc-row-bg]:bg-dark-900 [&_.rbc-toolbar-label]:text-white [&_.rbc-toolbar-label]:font-bold [&_.rbc-time-view]:border-slate-800 [&_.rbc-time-header]:border-slate-800 [&_.rbc-time-content]:border-slate-800 [&_.rbc-timeslot-group]:border-slate-800 [&_.rbc-time-slot]:text-slate-500 [&_.rbc-day-slot_.rbc-time-slot]:border-slate-800/50 [&_.rbc-current-time-indicator]:bg-brand-500">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    eventPropGetter={eventPropGetter}
                    onSelectEvent={(event) => setSelectedEvent(event)}
                    views={["month", "week", "day"]}
                    defaultView="month"
                    tooltipAccessor={(e) => `${e.title}\nBranch: ${e.extendedProps.branchName}`}
                />
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedEvent(null)}
                    />
                    <div className="relative mx-4 w-full max-w-md rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 shadow-float">
                        <button
                            type="button"
                            onClick={() => setSelectedEvent(null)}
                            className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            Booking Details
                        </h3>
                        <p className="text-sm font-medium text-brand-500 mb-6">
                            {selectedEvent.title}
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-slate-500 dark:text-slate-400">Branch</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedEvent.extendedProps.branchName}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-slate-500 dark:text-slate-400">Customer Email</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedEvent.extendedProps.customerEmail}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-slate-500 dark:text-slate-400">Status</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                    {formatBookingStatus(selectedEvent.extendedProps.status)}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-slate-500 dark:text-slate-400">Duration</span>
                                <div className="text-right">
                                    <div className="font-medium text-gray-900 dark:text-white">{format(selectedEvent.start, 'MMM d, yyyy h:mm a')}</div>
                                    <div className="font-medium text-gray-900 dark:text-white">to {format(selectedEvent.end, 'MMM d, yyyy h:mm a')}</div>
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-slate-500 dark:text-slate-400">People</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedEvent.extendedProps.numberOfPeople}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-slate-500 dark:text-slate-400">Total Price</span>
                                <span className="font-bold text-gray-900 dark:text-white">JOD {selectedEvent.extendedProps.totalPrice.toFixed(2)}</span>
                            </div>
                            {selectedEvent.extendedProps.notes && (
                                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                                    <span className="text-slate-500 dark:text-slate-400 block mb-1">Notes</span>
                                    <p className="text-sm text-gray-900 dark:text-white bg-dark-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                        {selectedEvent.extendedProps.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="rounded-xl px-6 py-2 bg-dark-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-dark-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
