"use client";

import AdminStatusBookingsPage from "../_components/status-bookings-page";

export default function AdminRejectedBookingsPage() {
  return (
    <AdminStatusBookingsPage
      status="REJECTED"
      title="Rejected Bookings"
      emptyMessage="No rejected bookings found."
      exportFilename="admin-REJECTED-bookings"
    />
  );
}
