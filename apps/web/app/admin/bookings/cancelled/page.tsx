"use client";

import AdminStatusBookingsPage from "../_components/status-bookings-page";

export default function AdminCancelledBookingsPage() {
  return (
    <AdminStatusBookingsPage
      status="CANCELLED"
      title="Cancelled Bookings"
      emptyMessage="No cancelled bookings found."
      exportFilename="admin-CANCELLED-bookings"
    />
  );
}
