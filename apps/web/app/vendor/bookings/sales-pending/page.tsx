"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function SalesPendingPage() {
  return (
    <StatusBookingsPage
      status="PENDING_APPROVAL"
      title="Sales Pending"
      subtitle="Bookings awaiting sales approval ({count} found)"
      emptyMessage="No bookings awaiting sales approval"
      exportFilename="sales-pending-bookings"
      exportTitle="Sales Pending"
      salesApproved={false}
      approvalType="sales"
    />
  );
}
