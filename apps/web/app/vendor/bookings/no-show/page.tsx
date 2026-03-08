"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function NoShowBookingsPage() {
  return <StatusBookingsPage status="NO_SHOW" title="No Show Bookings" emptyMessage="No no-show bookings" exportFilename="NO_SHOW-bookings" />;
}
