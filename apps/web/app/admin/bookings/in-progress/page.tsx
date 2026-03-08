"use client";

import AdminStatusBookingsPage from "../_components/status-bookings-page";

export default function AdminInProgressBookingsPage() {
  return (
    <AdminStatusBookingsPage
      status="CHECKED_IN"
      title="In Progress Bookings"
      emptyMessage="No in-progress bookings found."
      exportFilename="admin-CHECKED_IN-bookings"
    />
  );
}
