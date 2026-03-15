# Pricing Simplification Design

**Date:** 2026-03-11
**Status:** Approved

## Problem

The current pricing model has two concepts: `PricingInterval` (HOURLY, HALF_DAY, DAILY, WEEKLY, MONTHLY) and `PricingMode` (PER_BOOKING, PER_PERSON, PER_HOUR). A service can have multiple `ServicePricing` rows — one per interval. The client wants to simplify: drop intervals entirely, keep only one price and one mode per service.

## Decision

Remove the `ServicePricing` table and `PricingInterval` enum. Move `price`, `pricingMode`, and `currency` directly onto the `Service` model.

## Schema Changes

**Remove:**
- `PricingInterval` enum
- `ServicePricing` model (entire table)
- `pricingInterval` field from `Booking`
- `pricingInterval` field from `Quotation`

**Add to `Service` model:**
- `price Decimal(10,3)` — required, in JOD
- `pricingMode PricingMode @default(PER_BOOKING)`
- `currency String @default("JOD")`

**Keep unchanged:**
- `PricingMode` enum (PER_BOOKING, PER_PERSON, PER_HOUR)
- `pricingMode` on `Booking` (snapshot of mode at booking time)
- `pricingMode` on `Quotation` (snapshot)
- `unitPrice` on `Booking` (snapshot of price at booking time)

## Backend Changes

### Services Module
- `CreateServiceDto`: Replace `pricing: ServicePricingDto[]` array with flat `price: number`, `pricingMode?: PricingMode`. Remove `ServicePricingDto` class.
- `services.service.ts`: Create service with `price`/`pricingMode` directly — no more `ServicePricing.createMany()`.

### Bookings Module
- `create-booking.dto.ts`: Remove `PricingIntervalParam` enum and `pricingInterval` field.
- `bookings.service.ts`: Read `service.price` and `service.pricingMode` directly instead of looking up `ServicePricing` by interval. Remove HALF_DAY duration enforcement. Remove `pricingInterval` from booking creation data.

### Vendor Module
- `update-vendor-booking.dto.ts`: Remove `pricingInterval` field.
- `vendor.service.ts` (booking creation): Replace `servicePricing.findFirst()` with reading `service.price`/`service.pricingMode` directly. Remove `pricingInterval` from stored booking data.
- `vendor.service.ts` (booking editing): Same — read price/mode from service, remove interval logic.

### Quotations Module
- `create-quotation.dto.ts`: Remove `pricingInterval` field.
- `quotations.service.ts`: Remove `pricingInterval` from quotation creation/serialization.

### Branches Module
- Branch detail responses: Return `price`/`pricingMode` from service directly instead of nested `pricing[]` array.

## Frontend Changes

### Types & Utilities
- `lib/types.ts`: Remove `PricingInterval` type, `PricingItem` interface. Add `price`/`pricingMode` to `ServiceItem`. Remove `pricingInterval` from `Booking`, `Quotation`, `BranchListItem`. Update `AdminService`.
- `lib/format.ts`: Remove `formatPricingInterval()`. Use existing `formatPricingMode()` for display labels (PER_HOUR → "per hour", PER_PERSON → "per person", PER_BOOKING → "flat").
- API helpers (`lib/bookings.ts`, `lib/quotations.ts`, `lib/vendor.ts`): Remove `pricingInterval` from data types.

### Pages
- **Vendor booking create**: Remove interval dropdown. Read `price`/`pricingMode` from selected service directly.
- **Vendor booking edit**: Remove interval selection.
- **Vendor quotations new/detail**: Remove interval selection and display.
- **Booking modal**: Remove `selectedInterval` state and interval picker.
- **Vendor branches detail**: Display single price/mode per service instead of pricing table rows.
- **Vendor bookings list**: Replace `formatPricingInterval` with `formatPricingMode`.
- **Vendor search-booking**: Same interval-to-mode formatting replacement.
- **Admin services pages**: Flat price/mode inputs instead of pricing array.
- **Spaces detail**: Single price per service instead of pricing tiers.

## Migration Strategy

Pre-launch, no production data. Clean destructive migration:

1. Drop `ServicePricing` table
2. Remove `PricingInterval` enum
3. Add `price`, `pricingMode`, `currency` columns to `Service`
4. Remove `pricingInterval` from `Booking`
5. Remove `pricingInterval` from `Quotation`

Update seed file to create services with inline `price`/`pricingMode`.

## Display Format

Price display uses `formatPricingMode()` to derive labels:
- PER_HOUR → "5.00 JOD / per hour"
- PER_PERSON → "5.00 JOD / per person"
- PER_BOOKING → "5.00 JOD (flat)"
