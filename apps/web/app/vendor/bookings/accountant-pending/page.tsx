"use client";
import StatusBookingsPage from "../_components/status-bookings-page";

export default function AccountantPendingPage() {
  return (
    <StatusBookingsPage
      status="PENDING_APPROVAL"
      title="Accountant Pending"
      subtitle="Bookings awaiting accountant approval ({count} found)"
      emptyMessage="No bookings awaiting accountant approval"
      exportFilename="accountant-pending-bookings"
      exportTitle="Accountant Pending"
      accountantApproved={false}
      approvalType="accountant"
    />
  );
}
