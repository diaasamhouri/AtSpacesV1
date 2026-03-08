"use client";

import AdminStatusBookingsPage from "../_components/status-bookings-page";

export default function AdminNoShowBookingsPage() {
  return (
    <AdminStatusBookingsPage
      status="NO_SHOW"
      title="No Show Bookings"
      emptyMessage="No no-show bookings found."
      exportFilename="admin-NO_SHOW-bookings"
    />
  );
}
