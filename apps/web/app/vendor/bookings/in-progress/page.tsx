"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function InProgressBookingsPage() {
  return <StatusBookingsPage status="CHECKED_IN" title="In Progress Bookings" emptyMessage="No bookings in progress" exportFilename="CHECKED_IN-bookings" />;
}
