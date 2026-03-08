"use client";

import AdminStatusBookingsPage from "../_components/status-bookings-page";

export default function AdminFinishedBookingsPage() {
  return (
    <AdminStatusBookingsPage
      status="COMPLETED"
      title="Finished Bookings"
      emptyMessage="No finished bookings found."
      exportFilename="admin-COMPLETED-bookings"
    />
  );
}
