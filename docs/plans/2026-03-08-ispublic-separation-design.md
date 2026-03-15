# isPublic/isActive Separation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `isPublic` boolean to Service and ServicePricing so vendors can hide services/pricing from customers while still using them for direct bookings and quotations.

**Architecture:** New `isPublic` field (default true) on Service and ServicePricing. Public-facing queries filter `isActive: true AND isPublic: true`. Vendor booking queries filter only `isActive: true`. Vendor gets two toggles per service/pricing row.

**Tech Stack:** NestJS 11, Prisma, Next.js 16, React, Tailwind CSS

---

### Task 1: Add `isPublic` to Prisma schema and run migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

**Step 1: Add isPublic to Service model**

After `isActive Boolean @default(true)` in the Service model, add:
```prisma
isPublic    Boolean     @default(true)
```

**Step 2: Add isPublic to ServicePricing model**

After `isActive Boolean @default(true)` in the ServicePricing model, add:
```prisma
isPublic    Boolean     @default(true)
```

**Step 3: Run migration**

```bash
cd apps/api && npx prisma migrate dev --name add_is_public_to_service_and_pricing
```

All existing rows get `isPublic = true` (default), no disruption.

**Step 4: Regenerate Prisma client**

```bash
cd apps/api && npx prisma generate
```

Note: If dev server holds lock on query engine, stop it first.

---

### Task 2: Add `isPublic` to backend DTOs

**Files:**
- Modify: `apps/api/src/services/dto/index.ts`

**Step 1: Add isPublic to ServicePricingDto**

After the `isActive` field, add:
```typescript
@ApiProperty({ required: false, default: true })
@IsOptional()
@IsBoolean()
isPublic?: boolean;
```

**Step 2: Add isPublic to UpdateServiceDto**

The UpdateServiceDto extends PartialType(CreateServiceDto), which already includes `isActive`. Add `isPublic` the same way — but since UpdateServiceDto only adds `isActive` explicitly and the rest comes from PartialType, we need to add:
```typescript
@ApiProperty({ required: false })
@IsBoolean()
@IsOptional()
isPublic?: boolean;
```

---

### Task 3: Pass `isPublic` through backend service create/update

**Files:**
- Modify: `apps/api/src/services/services.service.ts`

**Step 1: Update createService — service data**

In the `this.prisma.service.create({ data: { ... } })` call, add after existing fields:
```typescript
isPublic: dto.isPublic ?? true,
```

Note: CreateServiceDto doesn't have isPublic at service level yet. Add it:
In `CreateServiceDto` in dto/index.ts, add:
```typescript
@ApiProperty({ required: false, default: true })
@IsBoolean()
@IsOptional()
isPublic?: boolean;
```

**Step 2: Update createService — pricing map**

Add `isPublic: p.isPublic ?? true` to the pricing create map.

**Step 3: Update updateService — updateData**

Add after `isActive: dto.isActive`:
```typescript
isPublic: dto.isPublic,
```

**Step 4: Update updateService — pricing createMany**

Add `isPublic: p.isPublic ?? true` to the pricing createMany data map.

---

### Task 4: Update public-facing queries to filter `isPublic: true`

**Files:**
- Modify: `apps/api/src/branches/branches.service.ts`

**Step 1: Public branch listing — service filter**

Find all `where: { isActive: true }` in service/pricing queries for public endpoints and change to:
```typescript
where: { isActive: true, isPublic: true }
```

Locations:
- listBranches: services filter (around line 74)
- listBranches: pricing filter (around line 78)
- getBranchById: services filter (around line 159)
- getBranchById: pricing filter (around line 174)

**Step 2: Vendor branch listing — keep showing all**

The vendor endpoint at `getVendorBranches` (around line 228) should NOT filter by isPublic. It should return all services with their `isPublic` field so the vendor UI can display the toggle state. Currently it selects `isActive: true` — keep that select (not filter) and add `isPublic: true` to the select.

Actually, looking at this more carefully: the vendor branch listing needs to return ALL services (active and inactive, public and non-public) so the vendor can manage them. Check if it currently filters or just selects.

---

### Task 5: Update customer booking to check `isPublic`

**Files:**
- Modify: `apps/api/src/bookings/bookings.service.ts`

**Step 1: createBooking — service validation**

After the existing `if (!service || !service.isActive)` check, also check isPublic:
```typescript
if (!service || !service.isActive || !service.isPublic) {
    throw new BadRequestException('Service is not available for booking');
}
```

**Step 2: createBooking — pricing query**

Update the pricing include to filter by isPublic too:
```typescript
pricing: { where: { isActive: true, isPublic: true } }
```

**Step 3: checkAvailability — same filters**

Apply same `isPublic: true` filters to the availability check queries.

---

### Task 6: Update vendor booking to skip `isPublic` check

**Files:**
- Modify: `apps/api/src/vendor/vendor.service.ts`

**Step 1: createBookingForCustomer — service validation**

Change the service validation to only check `isActive`, NOT `isPublic`:
```typescript
if (!service || !service.isActive || service.branchId !== dto.branchId) {
```
(This should already be correct — just verify isPublic is NOT checked.)

**Step 2: createBookingForCustomer — pricing lookup**

Change pricing lookup to only filter `isActive: true`, NOT `isPublic`:
```typescript
where: { serviceId: day.serviceId, interval: day.pricingInterval, isActive: true }
```
(Should already be correct — just verify.)

**Step 3: Vendor branch data — return isPublic field**

Ensure the vendor branches endpoint returns `isPublic` on both services and pricing so the frontend can display toggle state. Check `getVendorBranches` in branches.service.ts.

---

### Task 7: Fix quotation isActive validation

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Add isActive validation to createQuotation**

When creating a quotation, validate the service is active (but NOT isPublic — vendors can quote non-public services):
```typescript
const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
if (!service || !service.isActive) {
    throw new BadRequestException('Service is not active');
}
```

---

### Task 8: Update admin service CRUD to pass `isPublic`

**Files:**
- Modify: `apps/api/src/admin/admin.service.ts`

**Step 1: Include isPublic in response mappings**

Add `isPublic: p.isPublic` to pricing response maps (listing and getById).
Add `isPublic: s.isPublic` to service response maps.

**Step 2: Pass isPublic in create**

Add `isPublic: p.isPublic ?? true` to pricing create map.
Add `isPublic: dto.isPublic ?? true` to service create data.

**Step 3: Pass isPublic in update**

Add `if (dto.isPublic !== undefined) updateData.isPublic = dto.isPublic;` to update data.
Add `isPublic: p.isPublic ?? true` to pricing createMany data.

---

### Task 9: Update vendor branch detail UI — two toggles per pricing row

**Files:**
- Modify: `apps/web/app/vendor/branches/[id]/page.tsx`

**Step 1: Update PricingRow type**

```typescript
type PricingRow = { interval: string; pricingMode: string; price: string; isActive: boolean; isPublic: boolean };
```

**Step 2: Update emptyPricingRow**

```typescript
const emptyPricingRow = (): PricingRow => ({ interval: "", pricingMode: "PER_BOOKING", price: "", isActive: true, isPublic: true });
```

**Step 3: Update startEdit pricing mapping**

Add `isPublic: p.isPublic !== false` to the existing pricing mapping.

**Step 4: Update pricing payloads**

Add `isPublic: r.isPublic` to both handleSubmitService and handleSaveEdit pricing maps.

**Step 5: Add isPublic toggle to pricing rows**

Next to the existing isActive toggle, add a second toggle for isPublic. Use an eye icon indicator:
- Active toggle: power-style (existing green toggle)
- Public toggle: eye-style (new blue/teal toggle)

Label/title the toggles: "Active" and "Public" respectively.

**Step 6: Add service-level isPublic toggle**

In the service edit form, add an "isPublic" toggle alongside the existing controls. This controls Service.isPublic (service-level visibility).

---

### Task 10: Update vendor booking create page — show non-public services

**Files:**
- Modify: `apps/web/app/vendor/bookings/create/page.tsx`

**Step 1: Verify services are not filtered by isPublic**

The vendor booking create page should show ALL active services regardless of isPublic. Check that the service dropdown doesn't filter by isPublic. If it does, remove that filter.

The data comes from `getVendorBranches()` which needs to return non-public services too. This should be handled by Task 6 Step 3 on the backend side.

**Step 2: Visual indicator for non-public services**

Optionally add a small label next to non-public services in the dropdown: `"Room A (hidden from public)"` so the vendor knows it's not customer-visible.

---

### Task 11: Update admin service pages — add isPublic to forms

**Files:**
- Modify: `apps/web/app/admin/services/new/page.tsx`
- Modify: `apps/web/app/admin/services/[id]/page.tsx`

**Step 1: Admin create page**

Add `isPublic` field to pricing rows (same pattern as pricingMode dropdown was added).
Add `isPublic` toggle for the service itself.

**Step 2: Admin edit page**

Same changes. Read `isPublic` from API response and send it back on save.

---

### Task 12: Update frontend types

**Files:**
- Modify: `apps/web/lib/types.ts`

**Step 1: Add isPublic to relevant interfaces**

Add `isPublic?: boolean` to Service-related interfaces and pricing interfaces used in the frontend.

---

### Task 13: Run all tests and final verification

**Step 1: Run backend tests**

```bash
cd apps/api && npm test
```

**Step 2: Run frontend type check**

```bash
cd apps/web && npx tsc --noEmit
```

**Step 3: Fix any failures**
