"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function RejectedBookingsPage() {
  return <StatusBookingsPage status="REJECTED" title="Rejected Bookings" emptyMessage="No rejected bookings" exportFilename="REJECTED-bookings" />;
}
