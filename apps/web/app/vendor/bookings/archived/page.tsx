"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function ArchivedBookingsPage() {
  return <StatusBookingsPage status="COMPLETED" title="Archived Bookings" emptyMessage="No archived bookings" exportFilename="COMPLETED-bookings" />;
}
