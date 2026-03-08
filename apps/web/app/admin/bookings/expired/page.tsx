"use client";

import AdminStatusBookingsPage from "../_components/status-bookings-page";

export default function AdminExpiredBookingsPage() {
  return (
    <AdminStatusBookingsPage
      status="EXPIRED"
      title="Expired Bookings"
      emptyMessage="No expired bookings found."
      exportFilename="admin-EXPIRED-bookings"
    />
  );
}
