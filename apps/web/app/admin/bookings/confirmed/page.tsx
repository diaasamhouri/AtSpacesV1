"use client";

import AdminStatusBookingsPage from "../_components/status-bookings-page";

export default function AdminConfirmedBookingsPage() {
  return (
    <AdminStatusBookingsPage
      status="CONFIRMED"
      title="Confirmed Bookings"
      emptyMessage="No confirmed bookings found."
      exportFilename="admin-CONFIRMED-bookings"
    />
  );
}
