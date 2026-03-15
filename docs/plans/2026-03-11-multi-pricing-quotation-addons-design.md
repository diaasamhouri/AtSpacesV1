# Multi-Pricing, Quotation Delete & Quotation Add-ons Design

**Date:** 2026-03-11

## Overview

Three changes requested by client:
1. Each service/unit supports all three pricing modes with independent prices
2. Vendors can delete quotations
3. Quotations support add-ons (same as bookings)

## Change 1: Multi-Pricing Per Unit

### Schema Change

Replace single `price` + `pricingMode` on Service with three optional columns:

```prisma
pricePerBooking  Decimal?  @db.Decimal(10, 3)
pricePerPerson   Decimal?  @db.Decimal(10, 3)
pricePerHour     Decimal?  @db.Decimal(10, 3)
```

Remove `price Decimal` and `pricingMode PricingMode` from Service. Keep `currency String @default("JOD")`.

At least one price must be set — validated in DTO layer, not DB constraint.

### Booking/Quotation Flow

When creating a booking or quotation, vendor selects which pricing mode to use. The dropdown only shows modes that have a price configured for that unit. The chosen mode + price are snapshotted onto the booking/quotation record (`pricingMode` + `unitPrice` fields already exist on Booking and Quotation).

### Public Display

Public branch listings show the cheapest available price across the three modes with a "from X JOD" label.

### Affected Files

- `apps/api/prisma/schema.prisma` — Service model
- `apps/api/src/services/dto/index.ts` — CreateServiceDto, UpdateServiceDto
- `apps/api/src/services/services.service.ts` — create/update logic
- `apps/api/src/bookings/bookings.service.ts` — price lookup by chosen mode
- `apps/api/src/vendor/vendor.service.ts` — vendor booking creation price lookup
- `apps/api/src/branches/branches.service.ts` — startingPrice calculation
- `apps/api/src/reviews/reviews.service.ts` — service select fields
- `apps/api/src/quotations/quotations.service.ts` — price lookup by chosen mode
- `apps/api/prisma/seed.ts` — seed data
- `apps/web/lib/types.ts` — ServiceItem type
- `apps/web/app/vendor/branches/[id]/page.tsx` — service form
- `apps/web/app/vendor/bookings/create/page.tsx` — pricing mode selector per day
- `apps/web/app/vendor/bookings/[id]/edit/page.tsx` — pricing mode selector
- `apps/web/app/vendor/quotations/new/page.tsx` — pricing mode selector
- `apps/web/app/vendor/quotations/[id]/page.tsx` — pricing mode selector
- `apps/web/app/admin/services/[id]/page.tsx` — service form
- `apps/web/app/admin/services/new/page.tsx` — service form
- `apps/web/app/spaces/[id]/page.tsx` — public pricing display
- `apps/web/app/components/booking-modal.tsx` — pricing mode selector
- `apps/web/app/components/space-card.tsx` — starting price display

## Change 2: Delete Quotations

### Backend

New endpoint: `DELETE /quotations/:id`
- Vendor ownership check via `quotation.createdById`
- Only allowed when status is `NOT_SENT` or `REJECTED`
- Returns 403 for other statuses
- Cascade deletes line items + add-ons (already configured in schema)

### Frontend

Delete button on quotations list page with confirmation dialog. Only shown for `NOT_SENT` or `REJECTED` quotations.

### Affected Files

- `apps/api/src/quotations/quotations.controller.ts` — new DELETE endpoint
- `apps/api/src/quotations/quotations.service.ts` — deleteQuotation method
- `apps/web/lib/quotations.ts` — deleteQuotation API helper
- `apps/web/app/vendor/quotations/page.tsx` — delete button + confirmation

## Change 3: Add-ons in Quotations

### Schema

`QuotationAddOn` model already exists with all needed fields (vendorAddOnId, name, unitPrice, quantity, totalPrice, serviceTime, comments). Cascade delete already configured.

### Backend

- Accept `addOns[]` in create quotation DTO: `{ vendorAddOnId, quantity, serviceTime?, comments? }`
- Create `QuotationAddOn` records in the create/update quotation service methods
- Include add-ons in quotation responses and PDF export
- Include add-on totals in financial calculations

### Frontend

- Remove `!isQuote` guard on create page that hides "+Add" button and add-on sub-rows
- Show add-ons on quotation detail/edit page (`/vendor/quotations/[id]`)
- Include add-on totals in quotation financial calculations

### Affected Files

- `apps/api/src/quotations/dto/create-quotation.dto.ts` — addOns array
- `apps/api/src/quotations/quotations.service.ts` — create/update with add-ons, include in response
- `apps/web/app/vendor/bookings/create/page.tsx` — remove !isQuote guard
- `apps/web/app/vendor/quotations/[id]/page.tsx` — show add-ons
- `apps/web/lib/quotations.ts` — addOns in create/update types
