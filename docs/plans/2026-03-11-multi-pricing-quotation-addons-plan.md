# Multi-Pricing, Quotation Delete & Quotation Add-ons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow each service/unit to have three optional prices (per-booking, per-person, per-hour), add quotation deletion, and enable add-ons in quotations.

**Architecture:** Replace single `price`+`pricingMode` on Service with three optional Decimal columns. Add DELETE endpoint for quotations. Remove `!isQuote` guards on add-ons UI. All pre-launch, no data migration needed.

**Tech Stack:** Prisma, NestJS, Next.js, Jest

---

### Task 1: Schema Migration — Multi-Pricing on Service

**Files:**
- Modify: `apps/api/prisma/schema.prisma:385-386` (Service model)
- Create: `apps/api/prisma/migrations/20260311100000_multi_pricing_on_service/migration.sql`

**Step 1: Update Service model in schema.prisma**

Replace lines 385-386:
```prisma
  price       Decimal     @db.Decimal(10, 3)
  pricingMode PricingMode @default(PER_BOOKING)
```

With:
```prisma
  pricePerBooking Decimal? @db.Decimal(10, 3)
  pricePerPerson  Decimal? @db.Decimal(10, 3)
  pricePerHour    Decimal? @db.Decimal(10, 3)
```

**Step 2: Run migration**

```bash
cd apps/api && npx prisma migrate dev --name multi_pricing_on_service
```

**Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

---

### Task 2: Update Seed Data

**Files:**
- Modify: `apps/api/prisma/seed.ts`

**Step 1: Update seed service records**

Replace `price` and `pricingMode` fields with the new columns. Example:

Hot Desk: `pricePerHour: 3.0, pricePerBooking: 20.0`
Private Office: `pricePerBooking: 40.0`
Meeting Room: `pricePerHour: 15.0, pricePerPerson: 8.0, pricePerBooking: 100.0`

**Step 2: Verify seed runs**

```bash
cd apps/api && npx prisma db seed
```

---

### Task 3: Backend — Service DTO & Service Layer

**Files:**
- Modify: `apps/api/src/services/dto/index.ts:99-106`
- Modify: `apps/api/src/services/services.service.ts:59-60, 121-122`

**Step 1: Update CreateServiceDto**

Replace the `price` (required number) and `pricingMode` (optional enum) fields with:

```typescript
@IsOptional()
@IsNumber()
@Min(0)
pricePerBooking?: number;

@IsOptional()
@IsNumber()
@Min(0)
pricePerPerson?: number;

@IsOptional()
@IsNumber()
@Min(0)
pricePerHour?: number;
```

Add a custom validation: at least one price must be provided. Use `@ValidateIf` or validate in the service layer.

**Step 2: Update services.service.ts createService**

Replace line 59-60:
```typescript
price: dto.price,
pricingMode: dto.pricingMode ?? 'PER_BOOKING',
```

With:
```typescript
pricePerBooking: dto.pricePerBooking ?? null,
pricePerPerson: dto.pricePerPerson ?? null,
pricePerHour: dto.pricePerHour ?? null,
```

Add validation before create:
```typescript
if (dto.pricePerBooking == null && dto.pricePerPerson == null && dto.pricePerHour == null) {
    throw new BadRequestException('At least one price must be set');
}
```

**Step 3: Update services.service.ts updateService**

Replace lines 121-122 similarly — only update price fields that are provided in the DTO.

**Step 4: Run tests**

```bash
cd apps/api && npx jest
```

---

### Task 4: Backend — Bookings Service (Price Lookup by Mode)

**Files:**
- Modify: `apps/api/src/bookings/bookings.service.ts:107-108`

**Step 1: Update public booking creation price lookup**

Replace:
```typescript
const unitPrice = service.price.toNumber();
const pricingMode = service.pricingMode || 'PER_BOOKING';
```

With a helper that resolves pricing from the service based on a requested mode or defaults to the first available:

```typescript
function getServicePrice(service: any, requestedMode?: string): { unitPrice: number; pricingMode: string } {
    const prices: Record<string, number | null> = {
        PER_BOOKING: service.pricePerBooking?.toNumber() ?? null,
        PER_PERSON: service.pricePerPerson?.toNumber() ?? null,
        PER_HOUR: service.pricePerHour?.toNumber() ?? null,
    };

    if (requestedMode && prices[requestedMode] != null) {
        return { unitPrice: prices[requestedMode]!, pricingMode: requestedMode };
    }

    // Default: first available price
    for (const [mode, price] of Object.entries(prices)) {
        if (price != null) return { unitPrice: price, pricingMode: mode };
    }

    throw new BadRequestException('Service has no pricing configured');
}
```

Use this helper in `createBooking()`. The `pricingMode` field already exists on Booking — it will be set from the chosen mode.

**Step 2: Update service select/include**

In Prisma queries that fetch service for booking, replace `price: true, pricingMode: true` with `pricePerBooking: true, pricePerPerson: true, pricePerHour: true`.

**Step 3: Run tests**

```bash
cd apps/api && npx jest bookings
```

---

### Task 5: Backend — Vendor Service (Vendor Booking Creation)

**Files:**
- Modify: `apps/api/src/vendor/vendor.service.ts:1067-1069`

**Step 1: Update createBookingForCustomer pricing lookup**

Replace the single `price`/`pricingMode` lookup at line 1067-1069 with the same `getServicePrice()` helper pattern. The vendor booking DTO already has a `pricingMode` field per day — use it as the requested mode.

If the day's `pricingMode` isn't set, default to the first available price on the service.

**Step 2: Update updateVendorBooking similarly**

Same pattern — look up price by the chosen pricingMode from the three columns.

**Step 3: Update service queries**

Replace `select: { price: true, pricingMode: true }` with `select: { pricePerBooking: true, pricePerPerson: true, pricePerHour: true }` in all vendor service Prisma queries.

**Step 4: Run tests**

```bash
cd apps/api && npx jest vendor
```

---

### Task 6: Backend — Branches Service (Starting Price) & Reviews Service

**Files:**
- Modify: `apps/api/src/branches/branches.service.ts:88-100`
- Modify: `apps/api/src/reviews/reviews.service.ts:137-138`

**Step 1: Update branch listing startingPrice calculation**

Replace line 88:
```typescript
const cheapest = [...branch.services].sort((a, b) => a.price.toNumber() - b.price.toNumber())[0];
```

With:
```typescript
function getLowestPrice(service: any): number | null {
    const prices = [
        service.pricePerBooking?.toNumber(),
        service.pricePerPerson?.toNumber(),
        service.pricePerHour?.toNumber(),
    ].filter((p): p is number => p != null);
    return prices.length > 0 ? Math.min(...prices) : null;
}

const cheapest = [...branch.services]
    .map(s => ({ ...s, lowest: getLowestPrice(s) }))
    .filter(s => s.lowest != null)
    .sort((a, b) => a.lowest! - b.lowest!)[0];
```

Update response: `startingPrice: cheapest?.lowest ?? null`

**Step 2: Update service select fields in both branches and reviews services**

Replace `price: true, pricingMode: true` with `pricePerBooking: true, pricePerPerson: true, pricePerHour: true` in all Prisma selects.

**Step 3: Run tests**

```bash
cd apps/api && npx jest
```

---

### Task 7: Backend — Quotations Service (Price Lookup + Delete)

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts`
- Modify: `apps/api/src/quotations/quotations.controller.ts`

**Step 1: Update createQuotation price handling**

The quotation already snapshots `pricingMode` — just make sure the service query selects the three price columns instead of the old single one.

**Step 2: Add deleteQuotation method to service**

```typescript
async deleteQuotation(userId: string, quotationId: string) {
    const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    if (quotation.createdById !== userId) throw new ForbiddenException('Not your quotation');
    if (!['NOT_SENT', 'REJECTED'].includes(quotation.status)) {
        throw new BadRequestException('Only NOT_SENT or REJECTED quotations can be deleted');
    }
    await this.prisma.quotation.delete({ where: { id: quotationId } });
    return { message: 'Quotation deleted' };
}
```

**Step 3: Add DELETE endpoint to controller**

```typescript
@Delete(':id')
@ApiOperation({ summary: 'Delete a quotation' })
async deleteQuotation(@Req() req: any, @Param('id') id: string) {
    return this.quotationsService.deleteQuotation(req.user.id, id);
}
```

**Step 4: Run tests**

```bash
cd apps/api && npx jest quotations
```

---

### Task 8: Backend — Quotation DTO (Add-ons already supported, verify pricingMode pass-through)

**Files:**
- Modify: `apps/api/src/quotations/dto/create-quotation.dto.ts`

**Step 1: Verify addOns DTO field exists**

The `QuotationAddOnDto` class and `addOns` array already exist in the DTO (lines 44-60 and 147-150). Verify the service layer creates QuotationAddOn records — it already does at lines 73-94. No changes needed here unless the addOns aren't being included in the response.

**Step 2: Ensure quotation responses include addOns**

Check that `getQuotation` and `getQuotations` include `addOns` in their Prisma queries. Add `addOns: { include: { vendorAddOn: true } }` to the include if missing.

**Step 3: Add pricingMode to the booking-day DTO**

In `apps/api/src/vendor/dto/booking-day.dto.ts`, add an optional `pricingMode` field so vendor booking creation can specify which mode to use per day:

```typescript
@IsOptional()
@IsEnum(PricingMode)
pricingMode?: PricingMode;
```

**Step 4: Run all tests**

```bash
cd apps/api && npx jest
```

---

### Task 9: Frontend — Types & API Helpers

**Files:**
- Modify: `apps/web/lib/types.ts:38-39` (ServiceItem)
- Modify: `apps/web/lib/quotations.ts`

**Step 1: Update ServiceItem interface**

Replace:
```typescript
price: number;
pricingMode: PricingMode;
```

With:
```typescript
pricePerBooking?: number | null;
pricePerPerson?: number | null;
pricePerHour?: number | null;
```

**Step 2: Add deleteQuotation helper**

In `apps/web/lib/quotations.ts`:

```typescript
export async function deleteQuotation(token: string, id: string) {
    return apiFetch(`/quotations/${id}`, { method: 'DELETE', token });
}
```

**Step 3: Update BranchListItem**

Check if `startingPricingMode` is still referenced — it should work as-is since the backend still returns it.

---

### Task 10: Frontend — Vendor Service Forms (Branch Detail + Admin Services)

**Files:**
- Modify: `apps/web/app/vendor/branches/[id]/page.tsx`
- Modify: `apps/web/app/admin/services/[id]/page.tsx`
- Modify: `apps/web/app/admin/services/new/page.tsx`

**Step 1: Replace single price+pricingMode inputs with three optional price inputs**

Instead of one "Price" input and one "Pricing Mode" select, show three labeled inputs:

```
Price Per Booking (JOD):  [____] (optional)
Price Per Person (JOD):   [____] (optional)
Price Per Hour (JOD):     [____] (optional)
```

Validate that at least one is filled before submit.

**Step 2: Update form state and submit payload**

Replace `price` and `pricingMode` state variables with `pricePerBooking`, `pricePerPerson`, `pricePerHour`. Update the API call payload.

**Step 3: Update service display in branch detail**

Where services are listed, show all configured prices instead of a single one.

---

### Task 11: Frontend — Booking Create Page (Pricing Mode Selector + Add-ons in Quotation)

**Files:**
- Modify: `apps/web/app/vendor/bookings/create/page.tsx`

**Step 1: Update handleServiceChange to populate available pricing modes**

When a service is selected for a day row, determine which pricing modes are available (non-null prices). Default to the first available mode.

**Step 2: Add pricingMode selector per day row**

In the booking days table, add a "Pricing" column dropdown that shows only the available modes for that service. When mode changes, update the `unitPrice` to match.

The day row should track `pricingMode` as a field. Update the `BookingDayRow` interface:
```typescript
interface BookingDayRow {
    // ... existing fields
    pricingMode: string; // NEW
}
```

**Step 3: Remove !isQuote guard on add-ons**

Remove the `!isQuote &&` conditions at:
- Line 729: The "+Add" button — remove `{!isQuote && (` wrapper
- Line 749: The add-ons display section — remove `{!isQuote &&` wrapper

Keep the Tax & Discount section (line 777) behind `!isQuote` — that's booking-only and correct.

**Step 4: Update financial calculation**

The `financial` useMemo already reads `svc?.pricingMode` — update it to read from `day.pricingMode` instead (since each day now chooses its own mode).

**Step 5: Update submit payload**

Include `pricingMode` in the day data sent to the API. For quotation mode, include `addOns` in the quotation payload.

---

### Task 12: Frontend — Booking Edit Page

**Files:**
- Modify: `apps/web/app/vendor/bookings/[id]/edit/page.tsx`

**Step 1: Add pricingMode selector**

Same pattern as create page — show available pricing modes for the selected service, default to the booking's current mode.

**Step 2: Update price display**

Show the three available prices from the service, highlight the selected one.

---

### Task 13: Frontend — Quotation Pages (Detail/Edit + Delete + Add-ons)

**Files:**
- Modify: `apps/web/app/vendor/quotations/page.tsx`
- Modify: `apps/web/app/vendor/quotations/[id]/page.tsx`
- Modify: `apps/web/app/vendor/quotations/new/page.tsx`

**Step 1: Add delete button to quotations list**

In the quotations list page, add a Delete action for quotations with status `NOT_SENT` or `REJECTED`:

```typescript
{(q.status === "NOT_SENT" || q.status === "REJECTED") && (
    <button onClick={() => setDeleteTarget(q.id)} className="text-red-500 ...">Delete</button>
)}
```

Add a confirmation dialog (same pattern as branch delete). Call `deleteQuotation(token, id)` on confirm, then refresh the list.

**Step 2: Add pricingMode selector to quotation new/edit pages**

When a service is selected, show available pricing modes. Let vendor choose which mode to use.

**Step 3: Add add-ons UI to quotation detail/edit page**

Show add-ons section with the same grid layout used on the booking create/edit pages.

---

### Task 14: Frontend — Public Pages (Space Card, Branch Detail, Booking Modal)

**Files:**
- Modify: `apps/web/app/components/space-card.tsx:66-75`
- Modify: `apps/web/app/components/booking-modal.tsx`
- Modify: `apps/web/app/spaces/[id]/page.tsx`

**Step 1: Update space-card starting price display**

The backend still returns `startingPrice` as a number — the card just shows "from X JOD". This should work as-is if the backend correctly calculates the lowest price. Verify.

**Step 2: Update booking modal**

Replace single `service.price` / `service.pricingMode` references with multi-price logic. Show available pricing modes and let customer choose. Update price calculation.

**Step 3: Update branch detail service listing**

Show all available prices per service (e.g., "15 JOD/hr | 100 JOD flat").

---

### Task 15: Run Full Test Suite & Type Check

**Step 1: Run backend tests**
```bash
cd apps/api && npx jest
```

**Step 2: Run frontend type check**
```bash
cd apps/web && npm run check-types
```

**Step 3: Fix any remaining compilation errors**

---
