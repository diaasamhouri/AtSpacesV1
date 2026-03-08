"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function ExpiredBookingsPage() {
  return <StatusBookingsPage status="EXPIRED" title="Expired Bookings" emptyMessage="No expired bookings" exportFilename="EXPIRED-bookings" />;
}
