"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function CancelledBookingsPage() {
  return <StatusBookingsPage status="CANCELLED" title="Cancelled Bookings" emptyMessage="No cancelled bookings" exportFilename="CANCELLED-bookings" />;
}
