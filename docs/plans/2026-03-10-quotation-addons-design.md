# Quotation Add-Ons Design

**Date:** 2026-03-10
**Status:** Approved

## Problem

Add-ons (VendorAddOn catalog) are currently only available in bookings via BookingAddOn. Vendors need to include add-ons in quotations as well, so customers see the full cost breakdown before accepting.

## Decision

Create a new `QuotationAddOn` model mirroring `BookingAddOn`, keeping add-ons separate from the existing `QuotationLineItem` (which represents service date entries).

## Data Model

New `QuotationAddOn` model:

| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| quotationId | String | FK → Quotation, cascade delete |
| vendorAddOnId | String? | FK → VendorAddOn, set null on delete |
| name | String | Snapshot of add-on name at creation time |
| unitPrice | Decimal(10,3) | Snapshot of price in JOD |
| quantity | Int (default: 1) | Number of units |
| totalPrice | Decimal(10,3) | unitPrice × quantity |
| serviceTime | String? | Optional timing (e.g., "morning") |
| comments | String? | Optional special instructions |
| createdAt | DateTime | Auto-set |

Relations:
- `Quotation.addOns → QuotationAddOn[]`
- `VendorAddOn.quotationAddOns → QuotationAddOn[]`

## Financial Calculation

Add-on totals are **included in the quotation subtotal**. Discount and tax apply to service + add-ons combined:

```
subtotal = sum(lineItem.totalPrice) + sum(addOn.totalPrice)
discountAmount = calculated from subtotal
taxAmount = calculated from (subtotal - discountAmount)
totalAmount = subtotal - discountAmount + taxAmount
```

## Backend Changes

### DTOs
- New `QuotationAddOnDto`: `vendorAddOnId` (required UUID), `quantity` (default 1), `serviceTime?`, `comments?`
- Add optional `addOns?: QuotationAddOnDto[]` to `CreateQuotationDto`

### Quotation Service
- **createQuotation**: Look up each add-on from VendorAddOn, snapshot name + unitPrice, create QuotationAddOn records.
- **updateQuotation**: Delete existing QuotationAddOn records and recreate (same pattern as line items).
- **convertToBooking**: Iterate QuotationAddOn[], create matching BookingAddOn records on the new booking.
- **generatePdf**: Render add-ons as rows in the existing line items table (after service date rows).
- **serializeQuotation**: Include `addOns` array in response.

No new controller endpoints — add-ons flow through existing create/update quotation endpoints.

## Frontend Changes

### Types (`lib/types.ts`)
- New `QuotationAddOnItem` interface mirroring `BookingAddOnItem`
- Add `addOns?: QuotationAddOnItem[]` to `Quotation` type

### API helpers (`lib/quotations.ts`)
- Add `addOns` to create/update quotation payload types

### New quotation page (`vendor/quotations/new/page.tsx`)
- Fetch vendor's active add-ons catalog via `getVendorAddOns()`
- "Add-Ons" section below date entries — pick from catalog, set quantity, optional serviceTime/comments
- Add-on totals factored into subtotal before discount/tax

### Quotation detail page (`vendor/quotations/[id]/page.tsx`)
- Display add-ons in quotation details
- Allow editing add-ons when status is NOT_SENT

## Quotation → Booking Conversion

When a quotation is accepted and converted to a booking, each `QuotationAddOn` becomes a `BookingAddOn` with the same snapshot data (name, unitPrice, quantity, totalPrice, serviceTime, comments, vendorAddOnId).

## PDF Rendering

Add-ons appear as rows in the existing line items table, after the service date rows. The add-on name is used as the description column value.
