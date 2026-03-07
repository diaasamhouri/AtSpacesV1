"use client";

import type { DayViewRoom } from "../../lib/types";

interface GanttTimelineProps {
  rooms: DayViewRoom[];
  onBookingClick?: (bookingId: string) => void;
}

const HOUR_START = 6;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_WIDTH = 80; // px per hour

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-blue-500/80",
  CHECKED_IN: "bg-green-500/80",
  PENDING: "bg-yellow-500/80",
  PENDING_APPROVAL: "bg-amber-500/80",
  COMPLETED: "bg-slate-500/80",
  CANCELLED: "bg-red-500/40",
  NO_SHOW: "bg-red-500/60",
  EXPIRED: "bg-slate-600/60",
  REJECTED: "bg-red-600/60",
};

function timeToOffset(time: string | Date): number {
  const d = typeof time === "string" ? new Date(time) : time;
  const hours = d.getHours() + d.getMinutes() / 60;
  return Math.max(0, (hours - HOUR_START) / TOTAL_HOURS) * 100;
}

function timeToDuration(start: string | Date, end: string | Date): number {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const hours = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
  return Math.max(0, hours / TOTAL_HOURS) * 100;
}

export function GanttTimeline({ rooms, onBookingClick }: GanttTimelineProps) {
  const timeLabels: string[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? "PM" : "AM";
    timeLabels.push(`${hour12}:00 ${ampm}`);
  }

  return (
    <div className="overflow-auto rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800">
      <div style={{ minWidth: `${TOTAL_HOURS * SLOT_WIDTH + 200}px` }}>
        {/* Time header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-dark-900 z-10">
          <div className="w-[200px] shrink-0 px-4 py-3 text-xs font-bold text-slate-500 uppercase border-r border-slate-200 dark:border-slate-800">
            Room
          </div>
          <div className="flex-1 flex">
            {timeLabels.map((label, i) => (
              <div
                key={i}
                className="text-center text-[10px] text-slate-500 py-3 border-r border-slate-200/50 dark:border-slate-800/50"
                style={{ width: `${SLOT_WIDTH}px` }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Room rows */}
        {rooms.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No rooms found for this date.
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="flex border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100/30 dark:hover:bg-dark-850/30 transition-colors">
              <div className="w-[200px] shrink-0 px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{room.name}</p>
                <p className="text-xs text-slate-500 truncate">{room.branch}</p>
              </div>
              <div className="flex-1 relative" style={{ height: "48px" }}>
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {timeLabels.map((_, i) => (
                    <div key={i} className="border-r border-slate-200/30 dark:border-slate-800/30" style={{ width: `${SLOT_WIDTH}px` }} />
                  ))}
                </div>
                {/* Booking bars */}
                {room.bookings.map((booking) => {
                  const left = timeToOffset(booking.startTime);
                  const width = timeToDuration(booking.startTime, booking.endTime);
                  const color = STATUS_COLORS[booking.status] || "bg-brand-500/80";
                  return (
                    <div
                      key={booking.id}
                      className={`absolute top-1.5 h-[32px] rounded-md ${color} flex items-center px-2 cursor-pointer hover:brightness-110 transition-all`}
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 2)}%`,
                      }}
                      title={`${booking.ref} - ${booking.customer || "Unknown"}`}
                      onClick={() => onBookingClick?.(booking.id)}
                    >
                      <span className="text-[10px] font-medium text-white truncate">
                        {booking.ref}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
