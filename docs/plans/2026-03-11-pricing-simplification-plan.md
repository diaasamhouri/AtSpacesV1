# Pricing Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove `PricingInterval` and `ServicePricing` table; move price and pricingMode directly onto the Service model.

**Architecture:** Delete the `ServicePricing` model and `PricingInterval` enum from Prisma schema. Add `price`, `pricingMode`, `currency` to `Service`. Remove `pricingInterval` from `Booking` and `Quotation`. Update all backend services/DTOs and frontend types/pages to use the simplified model. Pre-launch — no data migration needed, just destructive schema change + seed update.

**Tech Stack:** Prisma ORM, NestJS 11, Next.js 16, TypeScript, Jest

---

### Task 1: Prisma Schema Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

**Step 1: Update schema**

Remove the `PricingInterval` enum (lines 47-53):
```
// DELETE this entire block:
enum PricingInterval {
  HOURLY
  HALF_DAY
  DAILY
  WEEKLY
  MONTHLY
}
```

Remove the `ServicePricing` model (lines 430-446):
```
// DELETE this entire block:
model ServicePricing { ... }
```

Add fields to `Service` model (after `isPublic` on line 392):
```prisma
  price       Decimal     @db.Decimal(10, 3)
  pricingMode PricingMode @default(PER_BOOKING)
  currency    String      @default("JOD")
```

Remove `pricing ServicePricing[]` relation from Service model (line 405).

Remove `pricingInterval PricingInterval?` from Booking model (line 468).

Remove `pricingInterval PricingInterval?` from Quotation model (line 568).

**Step 2: Run migration**

Run: `cd apps/api && npx prisma migrate dev --name remove_pricing_interval_simplify`

This will prompt about destructive changes (dropping ServicePricing table, removing columns). Accept since pre-launch.

**Step 3: Regenerate Prisma client**

Run: `cd apps/api && npx prisma generate`

**Step 4: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat: remove PricingInterval and ServicePricing, add price/pricingMode to Service"
```

---

### Task 2: Update Seed File

**Files:**
- Modify: `apps/api/prisma/seed.ts`

**Step 1: Update seed service creation**

Replace the `pricing: { create: [...] }` nested creates with inline `price` and `pricingMode` on each service.

Hot Desk (line 214-231) — change from:
```typescript
const hotDesk = await prisma.service.create({
  data: {
    branchId: branch.id,
    type: 'HOT_DESK',
    name: `Hot Desk – ${branch.name}`,
    description: 'Flexible open seating with power and Wi-Fi.',
    capacity: 20,
    pricing: {
      create: [
        { interval: 'HOURLY', price: 3.0 },
        { interval: 'HALF_DAY', price: 10.0 },
        { interval: 'DAILY', price: 15.0 },
        { interval: 'WEEKLY', price: 60.0 },
        { interval: 'MONTHLY', price: 200.0 },
      ],
    },
  },
});
```
To:
```typescript
const hotDesk = await prisma.service.create({
  data: {
    branchId: branch.id,
    type: 'HOT_DESK',
    name: `Hot Desk – ${branch.name}`,
    description: 'Flexible open seating with power and Wi-Fi.',
    capacity: 20,
    price: 3.0,
    pricingMode: 'PER_HOUR',
  },
});
```

Private Office (line 234-249) — change to:
```typescript
const privateOffice = await prisma.service.create({
  data: {
    branchId: branch.id,
    type: 'PRIVATE_OFFICE',
    name: `Private Office – ${branch.name}`,
    description: 'Lockable private office for teams of 2-6.',
    capacity: 5,
    price: 40.0,
    pricingMode: 'PER_BOOKING',
  },
});
```

Meeting Room (line 252-268) — change to:
```typescript
const meetingRoom = await prisma.service.create({
  data: {
    branchId: branch.id,
    type: 'MEETING_ROOM',
    name: `Meeting Room – ${branch.name}`,
    description: 'Equipped meeting room with projector and whiteboard, up to 10 people.',
    capacity: 10,
    price: 15.0,
    pricingMode: 'PER_HOUR',
  },
});
```

**Step 2: Re-seed database**

Run: `cd apps/api && npx prisma db seed`

**Step 3: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat: update seed to use inline price/pricingMode on Service"
```

---

### Task 3: Backend — Services DTO and Service

**Files:**
- Modify: `apps/api/src/services/dto/index.ts`
- Modify: `apps/api/src/services/services.service.ts`

**Step 1: Update Services DTO**

In `apps/api/src/services/dto/index.ts`:

Delete the entire `ServicePricingDto` class (lines 6-29).

Remove `PricingInterval` from the Prisma import on line 4. Keep `PricingMode`.

Change the import line to:
```typescript
import { ServiceType, PricingMode, RoomShape, SetupType } from '@prisma/client';
```

Replace `pricing: ServicePricingDto[]` in `CreateServiceDto` (lines 124-128) with:
```typescript
    @ApiProperty({ example: 15.0 })
    @IsNumber()
    price: number;

    @ApiProperty({ enum: PricingMode, required: false, default: 'PER_BOOKING' })
    @IsOptional()
    @IsEnum(PricingMode)
    pricingMode?: PricingMode;
```

Remove `@Type(() => ServicePricingDto)` import usage (no longer needed for pricing).

**Step 2: Update Services Service**

In `apps/api/src/services/services.service.ts`:

In `createService()` — replace the `pricing: { create: ... }` block (lines 63-71) with:
```typescript
                price: dto.price,
                pricingMode: dto.pricingMode ?? 'PER_BOOKING',
```

Remove the pricing validation check (lines 29-31):
```typescript
// DELETE:
if (!dto.pricing || dto.pricing.length === 0) {
    throw new BadRequestException('At least one pricing interval must be provided');
}
```

Change `include: { pricing: true, setupConfigs: true }` to `include: { setupConfigs: true }` on line 80.

In `updateService()` — remove the entire pricing delete/recreate block (lines 134-153). Replace with simple `price`/`pricingMode` in `updateData`:
```typescript
const updateData: any = {
    type: dto.type,
    name: dto.name,
    unitNumber: dto.unitNumber,
    description: dto.description,
    capacity,
    minCapacity,
    isActive: dto.isActive,
    isPublic: dto.isPublic,
    floor: dto.floor,
    profileNameEn: dto.profileNameEn,
    profileNameAr: dto.profileNameAr,
    weight: dto.weight,
    netSize: dto.netSize,
    shape: dto.shape,
    features: dto.features,
    price: dto.price,
    pricingMode: dto.pricingMode,
};
```

Remove the pricing validation check inside `updateService()` (lines 136-138).

Change `include: { pricing: true, setupConfigs: true }` to `include: { setupConfigs: true }` on line 175.

**Step 3: Run tests**

Run: `cd apps/api && npx jest --testPathPatterns services 2>&1`
Expected: PASS (or adjust if service tests exist that reference pricing)

**Step 4: Commit**

```bash
git add apps/api/src/services/
git commit -m "feat: simplify services DTO and service to use inline price/pricingMode"
```

---

### Task 4: Backend — Bookings DTO and Service

**Files:**
- Modify: `apps/api/src/bookings/dto/create-booking.dto.ts`
- Modify: `apps/api/src/bookings/bookings.service.ts`

**Step 1: Update Bookings DTO**

In `apps/api/src/bookings/dto/create-booking.dto.ts`:

Delete the `PricingIntervalParam` enum (lines 14-20).

Delete the `pricingInterval` field from `CreateBookingDto` (lines 68-73).

**Step 2: Update Bookings Service**

In `apps/api/src/bookings/bookings.service.ts`:

Remove the HALF_DAY enforcement block (lines 35-43):
```typescript
// DELETE:
if (dto.pricingInterval === 'HALF_DAY') { ... }
```

Change the service fetch query (line 46-52) — remove `pricing` include:
```typescript
const service = await this.prisma.service.findUnique({
  where: { id: dto.serviceId },
  include: {
    branch: { select: { id: true, status: true, vendorProfileId: true, autoAcceptBookings: true, operatingHours: true } },
  },
});
```

Remove the pricing lookup block (lines 62-70):
```typescript
// DELETE:
const pricing = service.pricing.find((p) => p.interval === dto.pricingInterval);
if (!pricing) { ... }
```

Replace the `unitPrice` and `pricingMode` assignments (lines 128-129) with:
```typescript
const unitPrice = service.price.toNumber();
const pricingMode = service.pricingMode || 'PER_BOOKING';
```

Remove `pricingInterval: dto.pricingInterval,` from the booking create data (line 176).

In `serializeBooking()` (line 909) — remove the `pricingInterval` line:
```typescript
// DELETE:
pricingInterval: booking.pricingInterval ?? null,
```

**Step 3: Run tests**

Run: `cd apps/api && npx jest --testPathPatterns bookings.service 2>&1`
Expected: Fix any test references to `pricingInterval` so all tests PASS.

**Step 4: Commit**

```bash
git add apps/api/src/bookings/
git commit -m "feat: remove pricingInterval from bookings DTO and service"
```

---

### Task 5: Backend — Vendor DTOs and Service

**Files:**
- Modify: `apps/api/src/vendor/dto/booking-day.dto.ts`
- Modify: `apps/api/src/vendor/dto/update-vendor-booking.dto.ts`
- Modify: `apps/api/src/vendor/vendor.service.ts`

**Step 1: Update Vendor Booking Day DTO**

In `apps/api/src/vendor/dto/booking-day.dto.ts`:

Remove `PricingInterval` from imports (line 3):
```typescript
import { SetupType } from '@prisma/client';
```

Delete the `pricingInterval` field (lines 39-41).

**Step 2: Update Vendor Booking Update DTO**

In `apps/api/src/vendor/dto/update-vendor-booking.dto.ts`:

Remove `PricingInterval` from imports (line 6). Remove the entire import line if only PricingInterval was imported.

Delete the `pricingInterval` field (line 15).

**Step 3: Update Vendor Service — createBookingForCustomer**

In `apps/api/src/vendor/vendor.service.ts`, in the `createBookingForCustomer` method:

Replace the `servicePricing.findFirst` lookup (lines 1065-1069):
```typescript
// REPLACE:
const pricingRecord = day.pricingInterval && day.serviceId
    ? await this.prisma.servicePricing.findFirst({
        where: { serviceId: day.serviceId, interval: day.pricingInterval as any, isActive: true },
    })
    : null;
const dayPricingMode = pricingRecord?.pricingMode || 'PER_BOOKING';
```
With:
```typescript
const dayService = await this.prisma.service.findUnique({
    where: { id: day.serviceId },
    select: { price: true, pricingMode: true },
});
const dayPricingMode = dayService?.pricingMode || 'PER_BOOKING';
```

Note: `day.unitPrice` is still used as the price (vendor can override). The pricingMode comes from the service now.

In the booking create data (around line 1182), remove:
```typescript
pricingInterval: day.pricingInterval ?? null,
```

Also in the service validation query (line 1122), remove the `pricing: { where: { isActive: true } }` include:
```typescript
const service = await this.prisma.service.findUnique({
    where: { id: day.serviceId },
    include: { setupConfigs: true },
});
```

**Step 4: Update Vendor Service — updateVendorBooking**

Replace the `finalPricingInterval` logic (line 1387):
```typescript
// DELETE:
const finalPricingInterval = dto.pricingInterval ?? booking.pricingInterval;
```

Replace the pricing record lookup (lines 1425-1431):
```typescript
// REPLACE:
const pricingRecord = finalPricingInterval
    ? await this.prisma.servicePricing.findFirst({
        where: { serviceId: finalServiceId, interval: finalPricingInterval, isActive: true },
    })
    : null;
const unitPrice = pricingRecord ? pricingRecord.price.toNumber() : (booking.unitPrice?.toNumber() ?? 0);
const pricingMode = pricingRecord?.pricingMode || booking.pricingMode || 'PER_BOOKING';
```
With:
```typescript
const resolvedService = await this.prisma.service.findUnique({
    where: { id: finalServiceId },
    select: { price: true, pricingMode: true },
});
const unitPrice = resolvedService ? resolvedService.price.toNumber() : (booking.unitPrice?.toNumber() ?? 0);
const pricingMode = resolvedService?.pricingMode || booking.pricingMode || 'PER_BOOKING';
```

In the service validation query for edit (line 1413), remove the `pricing: { where: { isActive: true } }` include.

In the booking update data (line 1499), remove:
```typescript
pricingInterval: finalPricingInterval,
```

In `getVendorBookingById` serialization, remove the `pricingInterval` line.

In `createBookingForCustomer` response serialization (around line 1577), remove any `pricingInterval` references.

**Step 5: Run tests**

Run: `cd apps/api && npx jest --testPathPatterns vendor.service 2>&1`
Expected: Fix any test references to `pricingInterval` so all tests PASS.

**Step 6: Commit**

```bash
git add apps/api/src/vendor/
git commit -m "feat: remove pricingInterval from vendor DTOs and service"
```

---

### Task 6: Backend — Quotations DTO and Service

**Files:**
- Modify: `apps/api/src/quotations/dto/create-quotation.dto.ts`
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Update Quotations DTO**

In `apps/api/src/quotations/dto/create-quotation.dto.ts`:

Remove `PricingInterval` from imports (line 15):
```typescript
import { DiscountType, PricingMode } from '@prisma/client';
```

Delete the `pricingInterval` field (lines 135-138).

**Step 2: Update Quotations Service**

In `apps/api/src/quotations/quotations.service.ts`:

In `createQuotation` — remove `pricingInterval: dto.pricingInterval,` from the data (line 54).

In `serializeQuotation` — remove `pricingInterval: quotation.pricingInterval ?? null,` (line 657).

Search for any `updateQuotation` method and remove `pricingInterval` references there too.

**Step 3: Run tests**

Run: `cd apps/api && npx jest --testPathPatterns quotations 2>&1`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "feat: remove pricingInterval from quotations DTO and service"
```

---

### Task 7: Backend — Branches Service

**Files:**
- Modify: `apps/api/src/branches/branches.service.ts`
- Modify: `apps/api/src/branches/dto/branch-response.dto.ts`

**Step 1: Update branch list query**

In `apps/api/src/branches/branches.service.ts`:

Change the service select (lines 73-83) — remove the nested `pricing` include. Instead select `price`, `pricingMode` directly from Service:
```typescript
services: {
  where: { isActive: true, isPublic: true },
  select: {
    type: true,
    price: true,
    pricingMode: true,
  },
},
```

Update the `startingPrice` calculation (lines 90-107) — find cheapest from services directly:
```typescript
let data = branches.map((branch) => {
  const serviceTypes = [...new Set(branch.services.map((s) => s.type))];
  const cheapest = [...branch.services].sort((a, b) => a.price.toNumber() - b.price.toNumber())[0];

  return {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    address: branch.address,
    description: branch.description,
    images: branch.images,
    vendor: branch.vendor,
    serviceTypes,
    startingPrice: cheapest ? cheapest.price.toNumber() : null,
    startingPricingMode: cheapest?.pricingMode || null,
  };
});
```

Remove `startingPricingInterval` from the return.

For the branch detail endpoint — update the service include to remove `pricing` relation and instead include `price`, `pricingMode`, `currency` directly. Also update the serialization that maps `service.pricing` to instead return flat price/mode fields.

Check the vendor branches endpoint similarly.

**Step 2: Update branch response DTO**

In `apps/api/src/branches/dto/branch-response.dto.ts`:

Remove `startingPricingInterval` field (line 47).

**Step 3: Commit**

```bash
git add apps/api/src/branches/
git commit -m "feat: update branches service to use inline service pricing"
```

---

### Task 8: Backend — Run All Tests

**Step 1: Run full test suite**

Run: `cd apps/api && npm test 2>&1`

Fix any remaining failures related to:
- References to `pricing` relation on service (should be removed from includes)
- References to `pricingInterval` in test mocks
- References to `ServicePricing` or `servicePricing` in Prisma calls

**Step 2: Commit any test fixes**

```bash
git add apps/api/
git commit -m "fix: update tests for pricing simplification"
```

---

### Task 9: Frontend — Types and Utilities

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/format.ts`
- Modify: `apps/web/lib/bookings.ts`
- Modify: `apps/web/lib/quotations.ts`
- Modify: `apps/web/lib/vendor.ts`

**Step 1: Update types.ts**

Delete `PricingInterval` type (lines 5-10).

Delete `PricingItem` interface (lines 21-29).

Update `ServiceItem` (line 54) — replace `pricing: PricingItem[]` with:
```typescript
  price: number;
  pricingMode: PricingMode;
  currency?: string;
```

Update `BranchListItem` (line 69) — remove `startingPricingInterval`:
```typescript
// DELETE:
startingPricingInterval?: PricingInterval | null;
```

Update `Booking` (line 150) — remove `pricingInterval`:
```typescript
// DELETE:
pricingInterval?: PricingInterval | null;
```

Update `Quotation` (line 713) — remove `pricingInterval`:
```typescript
// DELETE:
pricingInterval?: PricingInterval | null;
```

Update `AdminService` (line 870) — replace `pricing` array with flat fields:
```typescript
  price: number;
  pricingMode: PricingMode;
  currency?: string;
```

**Step 2: Update format.ts**

Delete `formatPricingInterval` function (lines 32-41).

**Step 3: Update bookings.ts**

Remove `PricingInterval` from imports (line 5).

Remove `pricingInterval: PricingInterval` from `CreateBookingData` interface (line 15).

**Step 4: Update quotations.ts**

Remove `pricingInterval` from `createQuotation` and `updateQuotation` data types.

**Step 5: Update vendor.ts**

Remove `pricingInterval` from `updateVendorBooking` data type (line 126).

Remove `pricingInterval` from `createVendorBooking` data type (the `days` array items — `pricingInterval?: string`).

**Step 6: Commit**

```bash
git add apps/web/lib/
git commit -m "feat: remove PricingInterval from frontend types and utilities"
```

---

### Task 10: Frontend — Vendor Booking Create Page

**Files:**
- Modify: `apps/web/app/vendor/bookings/create/page.tsx`

**Step 1: Remove interval state and logic**

Remove `pricingInterval` from the day state object (line 34, 110, 173, 229, 273).

Remove `handlePricingChange` function (line 276-279) — no more interval selection.

When a service is selected, read `service.price` and `service.pricingMode` directly instead of looking up pricing by interval.

Remove the pricing interval dropdown UI (around line 695). Replace with a read-only display showing the service price and mode.

Update the financial calculation to use `service.price` and `service.pricingMode` directly.

Remove `pricingInterval` from the submit handler that calls `createVendorBooking` (line 438).

**Step 2: Verify it compiles**

Run: `cd apps/web && npm run check-types 2>&1`

**Step 3: Commit**

```bash
git add apps/web/app/vendor/bookings/create/
git commit -m "feat: remove pricing interval from vendor booking create page"
```

---

### Task 11: Frontend — Vendor Booking Edit Page

**Files:**
- Modify: `apps/web/app/vendor/bookings/[id]/edit/page.tsx`

**Step 1: Remove interval references**

Remove any `pricingInterval` state, dropdown, or submit field. When the service changes, read `service.price` and `service.pricingMode` directly.

**Step 2: Verify it compiles**

Run: `cd apps/web && npm run check-types 2>&1`

**Step 3: Commit**

```bash
git add apps/web/app/vendor/bookings/
git commit -m "feat: remove pricing interval from vendor booking edit page"
```

---

### Task 12: Frontend — Vendor Quotation Pages

**Files:**
- Modify: `apps/web/app/vendor/quotations/new/page.tsx`
- Modify: `apps/web/app/vendor/quotations/[id]/page.tsx`

**Step 1: Update new quotation page**

Remove pricing interval state and dropdown. When calculating the financial preview, use `service.price` and `service.pricingMode` directly.

Remove `pricingInterval` from the submit handler.

**Step 2: Update quotation detail page**

Remove `editPricingInterval` state (line 36), initialization (line 72), and submit field (line 90).

Remove the pricing interval dropdown in the edit form (lines 411-413).

Update the display section to show `pricingMode` instead of `pricingInterval` (lines 460-465).

**Step 3: Verify it compiles**

Run: `cd apps/web && npm run check-types 2>&1`

**Step 4: Commit**

```bash
git add apps/web/app/vendor/quotations/
git commit -m "feat: remove pricing interval from quotation pages"
```

---

### Task 13: Frontend — Booking Modal (Customer Booking)

**Files:**
- Modify: `apps/web/app/components/booking-modal.tsx`

**Step 1: Remove interval picker**

Remove `selectedInterval` state and the interval selection UI. The customer no longer picks an interval — the service has one price.

Remove `pricingInterval: selectedInterval` from the booking creation API call (line 292).

Update the price display to show `service.price` with `formatPricingMode(service.pricingMode)`.

**Step 2: Verify it compiles**

Run: `cd apps/web && npm run check-types 2>&1`

**Step 3: Commit**

```bash
git add apps/web/app/components/booking-modal.tsx
git commit -m "feat: remove pricing interval from customer booking modal"
```

---

### Task 14: Frontend — Branches, Spaces, and Display Pages

**Files:**
- Modify: `apps/web/app/vendor/branches/[id]/page.tsx`
- Modify: `apps/web/app/vendor/search-booking/page.tsx`
- Modify: `apps/web/app/vendor/bookings/page.tsx`
- Modify: Various spaces pages that display pricing

**Step 1: Vendor branches detail**

Replace `formatPricingInterval(p.interval)` (line 1085) with `formatPricingMode(service.pricingMode)`. Display single price per service instead of pricing table rows.

**Step 2: Vendor search-booking**

Replace `formatPricingInterval(p.interval)` (line 534) with `formatPricingMode(service.pricingMode)`.

**Step 3: Vendor bookings list**

Replace `formatPricingInterval(booking.pricingInterval)` with `formatPricingMode(booking.pricingMode)` in the price display areas (around lines 339, 474).

Remove the `formatPricingInterval` import and add `formatPricingMode` import if not already present.

**Step 4: Admin services pages**

Update admin service forms and lists to show flat `price`/`pricingMode` instead of `pricing[]` array.

**Step 5: Spaces detail page**

Update the service pricing display on public branch/space pages to show single price per service with mode label instead of interval tiers.

**Step 6: Remove all remaining formatPricingInterval imports**

Search for any remaining `formatPricingInterval` imports and remove them.

**Step 7: Verify it compiles**

Run: `cd apps/web && npm run check-types 2>&1`

**Step 8: Commit**

```bash
git add apps/web/
git commit -m "feat: update all display pages for simplified pricing"
```

---

### Task 15: Final Verification

**Step 1: Run all backend tests**

Run: `cd apps/api && npm test 2>&1`
Expected: All tests PASS.

**Step 2: Run frontend type-check**

Run: `cd apps/web && npm run check-types 2>&1`
Expected: No errors.

**Step 3: Run lint**

Run: `cd . && npm run lint 2>&1` (from monorepo root)
Expected: No new errors.

**Step 4: Verify no remaining PricingInterval references**

Run: `grep -r "PricingInterval\|pricingInterval\|formatPricingInterval\|ServicePricing\|servicePricing" apps/ --include="*.ts" --include="*.tsx" -l`

Expected: No results (all references removed).

**Step 5: Commit any remaining fixes**

```bash
git add .
git commit -m "chore: final cleanup for pricing simplification"
```
