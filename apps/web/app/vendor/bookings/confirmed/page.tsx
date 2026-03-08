"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function ConfirmedBookingsPage() {
  return <StatusBookingsPage status="CONFIRMED" title="Confirmed Bookings" emptyMessage="No confirmed bookings" exportFilename="CONFIRMED-bookings" />;
}
