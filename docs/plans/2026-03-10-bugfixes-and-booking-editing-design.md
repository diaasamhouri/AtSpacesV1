# Bug Fixes & Vendor Booking Editing — Design

**Date:** 2026-03-10
**Status:** Approved

## Part 1: Bug Fixes

### Fix 1: Frontend hardcoded tax rate (Critical)

**Problem:** `apps/web/app/vendor/bookings/create/page.tsx` line 345 hardcodes `const taxRate = subjectToTax ? 16 : 0` instead of using the vendor's actual tax rate from their profile.

**Fix:** The vendor profile is already fetched on the vendor layout/context. Read `taxRate` from the vendor profile API response and use it in the `financial` useMemo calculation instead of `16`.

**Files:**
- Modify: `apps/web/app/vendor/bookings/create/page.tsx` — replace hardcoded `16` with vendor profile tax rate
- May need to fetch vendor profile or pass tax rate from parent layout

### Fix 2: Quotation rounding to 2 decimals instead of 3 (Critical)

**Problem:** `apps/web/app/vendor/quotations/new/page.tsx` line 153 rounds to 2 decimal places (`Math.round(total * 100) / 100`) but JOD uses 3 decimals (fils). Database stores `Decimal(10,3)`.

**Fix:** Change to `Math.round(total * 1000) / 1000` to match the 3-decimal JOD standard used everywhere else.

**Files:**
- Modify: `apps/web/app/vendor/quotations/new/page.tsx` — fix rounding

---

## Part 2: Vendor Booking Editing

### Overview

New capability for vendors to edit booking details on bookings in PENDING, PENDING_APPROVAL, or CONFIRMED status. All fields are editable. Price is recalculated on save.

### Editable Statuses

Only bookings with these statuses can be edited:
- `PENDING`
- `PENDING_APPROVAL`
- `CONFIRMED`

Bookings in `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `REJECTED`, `EXPIRED`, `NO_SHOW` are locked.

### Editable Fields

| Field | Notes |
|-------|-------|
| `startTime` / `endTime` | Must re-check availability (excluding current booking) |
| `numberOfPeople` | Must re-check capacity |
| `serviceId` | Can change service within same branch |
| `branchId` | Can change branch (must be vendor's branch) |
| `notes` | Free text |
| `requestedSetup` | Must be valid for service type |
| `pricingInterval` | Must exist in new service's pricing |
| `unitPrice` | Looked up from ServicePricing or overridden |
| Add-ons | Can add/remove/modify BookingAddOns |

### Backend: New Endpoint

```
PATCH /vendor/bookings/:id
```

**Guard:** `JwtAuthGuard` + `RolesGuard(VENDOR)`

**DTO:** `UpdateVendorBookingDto` — all fields optional:
```typescript
{
  branchId?: string;
  serviceId?: string;
  startTime?: string;       // ISO 8601
  endTime?: string;         // ISO 8601
  numberOfPeople?: number;  // min 1
  pricingInterval?: PricingInterval;
  notes?: string;
  requestedSetup?: SetupType;
  addOns?: { vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[];
}
```

### Backend: Service Method — `updateVendorBooking()`

**Flow:**
1. Fetch booking with relations (service, branch, payment, addOns)
2. Verify vendor owns the booking's branch
3. Verify status is in `['PENDING', 'PENDING_APPROVAL', 'CONFIRMED']`
4. If `serviceId` or `branchId` changed, validate the new service belongs to vendor's branch
5. If `startTime`/`endTime`/`serviceId` changed, re-check availability (exclude current booking from overlap count)
6. If `numberOfPeople` changed, re-check capacity against service
7. Look up `ServicePricing` for the (possibly new) service + pricingInterval → get `unitPrice` and `pricingMode`
8. **Recalculate financials:**
   - `subtotal = calculateSubtotal(unitPrice, pricingMode, numberOfPeople, durationHours)`
   - Add add-on totals to subtotal
   - Apply existing discount (keep current discountType/discountValue, recalculate discountAmount)
   - Recalculate tax from vendor profile on afterDiscount amount
   - `totalPrice = afterDiscount + taxAmount`
9. If add-ons changed: delete existing BookingAddOns, create new ones (snapshot from VendorAddOn catalog)
10. Update the booking record with all new values
11. If payment exists and totalPrice changed, update payment amount
12. Return serialized booking

**Key constraint:** The `checkSlotAvailability` helper must exclude the current booking ID when checking overlaps, so the booking doesn't conflict with itself.

### Frontend: Vendor Booking Edit UI

**Location:** New page or modal accessible from vendor booking detail/list views.

**Approach:** A form pre-populated with current booking data. Same structure as the vendor booking creation form but in "edit mode" — fetches the booking, fills the form, submits via `PATCH /vendor/bookings/:id`.

**Files:**
- New: `apps/web/app/vendor/bookings/[id]/edit/page.tsx` — edit form page
- Modify: `apps/web/lib/vendor.ts` — add `updateVendorBooking()` API helper
- Modify: `apps/web/lib/types.ts` — add `UpdateVendorBookingData` type if needed
- Modify: Vendor booking detail/list pages — add "Edit" button (visible only for editable statuses)

### Price Recalculation Logic

Uses the same helpers from `booking-creation.helper.ts`:
- `calculateSubtotal(unitPrice, pricingMode, numberOfPeople, durationHours)`
- `calculateTaxFromVendorProfile(prisma, vendorProfileId, afterDiscount)`

**Discount handling on edit:**
- Keep existing `discountType` and `discountValue`
- Recalculate `discountAmount` based on new subtotal:
  - PERCENTAGE: `discountAmount = newSubtotal × discountValue / 100`
  - FIXED: `discountAmount = min(discountValue, newSubtotal)`
  - PROMO_CODE: `discountAmount = newSubtotal × discountValue / 100`
- If vendor wants to remove discount, they can set discountType to NONE via a separate mechanism (or include in DTO)

### Availability Check on Edit

The existing `checkSlotAvailability` helper counts overlapping bookings. When editing, we must exclude the booking being edited:

```typescript
const overlappingCount = await prisma.booking.count({
  where: {
    serviceId,
    id: { not: bookingId },  // Exclude current booking
    status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  },
});
```

Either add an optional `excludeBookingId` parameter to the helper, or inline the query in the update method.

### Multi-Day Booking Groups

If a booking belongs to a `bookingGroupId`, editing one booking in the group should only affect that single booking (not the whole group). Each booking in a group is independent after creation.
