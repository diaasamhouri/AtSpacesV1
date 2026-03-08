"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function FinishedBookingsPage() {
  return <StatusBookingsPage status="COMPLETED" title="Finished Bookings" emptyMessage="No finished bookings" exportFilename="COMPLETED-bookings" />;
}
