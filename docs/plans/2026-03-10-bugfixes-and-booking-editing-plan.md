# Bug Fixes & Vendor Booking Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two calculation bugs (hardcoded tax rate, quotation rounding), then add vendor booking editing with full price recalculation.

**Architecture:** Bug fixes are simple value changes. Booking editing adds a new `PATCH /vendor/bookings/:id` endpoint that reuses existing calculation helpers (`calculateSubtotal`, `calculateTaxFromVendorProfile`) and a new `UpdateVendorBookingDto`. Frontend gets a new edit page at `/vendor/bookings/[id]/edit`.

**Tech Stack:** NestJS, Prisma, class-validator DTOs, Next.js React pages, TypeScript

---

## PART 1: BUG FIXES

### Task 1: Fix hardcoded tax rate in vendor booking creation page

**Files:**
- Modify: `apps/web/app/vendor/bookings/create/page.tsx`

**Step 1: Read the file and find the hardcoded tax rate**

Line 345: `const taxRate = subjectToTax ? 16 : 0;`

**Step 2: Add vendor profile state and fetch tax rate**

Near the existing state declarations (around line 124), check if vendor profile is already available. If not, add:

```typescript
const [vendorTaxRate, setVendorTaxRate] = useState<number>(16);
```

In the existing useEffect that fetches data (around line 140), add:

```typescript
getVendorProfile(token).then(profile => {
  if (profile.taxRate != null) setVendorTaxRate(Number(profile.taxRate));
}).catch(() => {});
```

Make sure `getVendorProfile` is imported from `@/lib/vendor`.

**Step 3: Replace the hardcoded 16**

Change line 345 from:
```typescript
const taxRate = subjectToTax ? 16 : 0;
```
to:
```typescript
const taxRate = subjectToTax ? vendorTaxRate : 0;
```

Add `vendorTaxRate` to the useMemo dependency array (line 350).

**Step 4: Commit**

```bash
git add apps/web/app/vendor/bookings/create/page.tsx
git commit -m "fix: use vendor profile tax rate instead of hardcoded 16%"
```

---

### Task 2: Fix quotation rounding from 2 to 3 decimal places

**Files:**
- Modify: `apps/web/app/vendor/quotations/new/page.tsx`

**Step 1: Find and fix the rounding**

Line 153: Change from:
```typescript
return { total: Math.round(total * 100) / 100, breakdown, unitPrice: pricing.price };
```
to:
```typescript
return { total: Math.round(total * 1000) / 1000, breakdown, unitPrice: pricing.price };
```

**Step 2: Commit**

```bash
git add apps/web/app/vendor/quotations/new/page.tsx
git commit -m "fix: round quotation total to 3 decimal places (JOD fils)"
```

---

## PART 2: VENDOR BOOKING EDITING

### Task 3: Create UpdateVendorBookingDto

**Files:**
- Create: `apps/api/src/vendor/dto/update-vendor-booking.dto.ts`
- Modify: `apps/api/src/vendor/dto/index.ts`

**Step 1: Create the DTO file**

```typescript
import {
  IsOptional,
  IsUUID,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PricingInterval } from '@prisma/client';
import { BookingDayAddOnDto } from './booking-day.dto';

export class UpdateVendorBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfPeople?: number;

  @ApiPropertyOptional({ enum: PricingInterval })
  @IsOptional()
  @IsEnum(PricingInterval)
  pricingInterval?: PricingInterval;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestedSetup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDayAddOnDto)
  addOns?: BookingDayAddOnDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  subjectToTax?: boolean;
}
```

**Step 2: Export from index.ts**

Add to `apps/api/src/vendor/dto/index.ts`:
```typescript
export { UpdateVendorBookingDto } from './update-vendor-booking.dto';
```

**Step 3: Commit**

```bash
git add apps/api/src/vendor/dto/
git commit -m "feat: add UpdateVendorBookingDto for booking editing"
```

---

### Task 4: Add updateVendorBooking method to VendorService

**Files:**
- Modify: `apps/api/src/vendor/vendor.service.ts`

**Step 1: Add the method after createBookingForCustomer (after line ~1290)**

```typescript
async updateVendorBooking(vendorUserId: string, bookingId: string, dto: UpdateVendorBookingDto) {
  // 1. Get vendor profile
  const vp = await this.prisma.vendorProfile.findUnique({
    where: { userId: vendorUserId },
    select: { id: true, taxRate: true, taxEnabled: true },
  });
  if (!vp) throw new BadRequestException('Vendor profile not found');

  // 2. Fetch existing booking with relations
  const booking = await this.prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      branch: { select: { id: true, vendorProfileId: true } },
      service: { select: { id: true, capacity: true, type: true, pricing: true } },
      payment: true,
      addOns: true,
    },
  });
  if (!booking) throw new NotFoundException('Booking not found');

  // 3. Verify vendor owns the booking's branch
  if (booking.branch.vendorProfileId !== vp.id) {
    throw new ForbiddenException('You do not own this booking');
  }

  // 4. Verify status allows editing
  const editableStatuses = ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED'];
  if (!editableStatuses.includes(booking.status)) {
    throw new BadRequestException(`Cannot edit booking in ${booking.status} status`);
  }

  // 5. Resolve final field values (use dto value if provided, else keep existing)
  const finalBranchId = dto.branchId ?? booking.branchId;
  const finalServiceId = dto.serviceId ?? booking.serviceId;
  const finalStartTimeStr = dto.startTime;
  const finalEndTimeStr = dto.endTime;

  // Parse times
  const finalStartTime = finalStartTimeStr ? new Date(finalStartTimeStr) : booking.startTime;
  const finalEndTime = finalEndTimeStr ? new Date(finalEndTimeStr) : booking.endTime;
  const finalNumberOfPeople = dto.numberOfPeople ?? booking.numberOfPeople;
  const finalNotes = dto.notes !== undefined ? dto.notes : booking.notes;
  const finalSetup = dto.requestedSetup !== undefined ? dto.requestedSetup : booking.requestedSetup;

  // 6. If branch changed, verify vendor owns the new branch
  if (dto.branchId && dto.branchId !== booking.branchId) {
    const newBranch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      select: { vendorProfileId: true },
    });
    if (!newBranch || newBranch.vendorProfileId !== vp.id) {
      throw new BadRequestException('Branch not found or not owned by vendor');
    }
  }

  // 7. If service changed, validate the new service belongs to the branch
  let service = booking.service;
  if (dto.serviceId && dto.serviceId !== booking.serviceId) {
    const newService = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { pricing: true },
    });
    if (!newService || newService.branchId !== finalBranchId) {
      throw new BadRequestException('Service not found or does not belong to the branch');
    }
    if (!newService.isActive) {
      throw new BadRequestException('Service is not active');
    }
    service = newService as any;
  }

  // 8. Resolve pricing interval and look up pricing
  const finalPricingInterval = dto.pricingInterval ?? booking.pricingInterval;
  let unitPrice = booking.unitPrice ? booking.unitPrice.toNumber() : 0;
  let pricingMode = booking.pricingMode || 'PER_BOOKING';

  if (finalPricingInterval) {
    const pricingRecord = await this.prisma.servicePricing.findFirst({
      where: { serviceId: finalServiceId, interval: finalPricingInterval as any, isActive: true },
    });
    if (pricingRecord) {
      unitPrice = pricingRecord.price.toNumber();
      pricingMode = pricingRecord.pricingMode || 'PER_BOOKING';
    }
  }

  // 9. Check availability (exclude current booking)
  if (dto.startTime || dto.endTime || dto.serviceId) {
    const capacity = service.capacity ?? 0;
    const overlappingCount = await this.prisma.booking.count({
      where: {
        serviceId: finalServiceId,
        id: { not: bookingId },
        status: { in: ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'] },
        startTime: { lt: finalEndTime },
        endTime: { gt: finalStartTime },
      },
    });
    if (overlappingCount >= capacity) {
      throw new ConflictException('No availability for the selected time slot');
    }
  }

  // 10. Recalculate financials
  const durationHours = Math.max(
    (finalEndTime.getTime() - finalStartTime.getTime()) / (1000 * 60 * 60),
    0,
  );
  let subtotal = calculateSubtotal(unitPrice, pricingMode, finalNumberOfPeople, durationHours);

  // Add add-on totals to subtotal
  let addOnItems: { vendorAddOnId: string; name: string; unitPrice: number; quantity: number; totalPrice: number; serviceTime?: string; comments?: string }[] = [];
  if (dto.addOns !== undefined) {
    for (const addOn of dto.addOns) {
      const vendorAddOn = await this.prisma.vendorAddOn.findUnique({
        where: { id: addOn.vendorAddOnId },
      });
      if (!vendorAddOn || vendorAddOn.vendorProfileId !== vp.id) {
        throw new BadRequestException(`Add-on ${addOn.vendorAddOnId} not found`);
      }
      const addOnTotal = vendorAddOn.unitPrice.toNumber() * addOn.quantity;
      subtotal += addOnTotal;
      addOnItems.push({
        vendorAddOnId: addOn.vendorAddOnId,
        name: vendorAddOn.name,
        unitPrice: vendorAddOn.unitPrice.toNumber(),
        quantity: addOn.quantity,
        totalPrice: addOnTotal,
        serviceTime: addOn.serviceTime,
        comments: addOn.comments,
      });
    }
  } else {
    // Keep existing add-ons in subtotal
    for (const existing of booking.addOns) {
      subtotal += existing.totalPrice.toNumber();
    }
  }

  // 11. Recalculate discount
  const discountType = dto.discountType !== undefined ? dto.discountType : (booking.discountType || 'NONE');
  const discountValue = dto.discountValue !== undefined ? dto.discountValue : (booking.discountValue ? booking.discountValue.toNumber() : 0);
  let discountAmount = 0;

  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === 'FIXED' && discountValue > 0) {
    discountAmount = Math.min(discountValue, subtotal);
  } else if (discountType === 'PROMO_CODE' && discountValue > 0) {
    discountAmount = subtotal * (discountValue / 100);
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  // 12. Recalculate tax
  const subjectToTax = dto.subjectToTax !== undefined ? dto.subjectToTax : (vp.taxEnabled ?? false);
  const taxRate = subjectToTax ? (vp.taxRate as any).toNumber?.() ?? Number(vp.taxRate) : 0;
  const taxAmount = taxRate > 0 ? (afterDiscount * taxRate) / 100 : 0;
  const totalPrice = afterDiscount + taxAmount;

  // 13. Update booking record
  const updated = await this.prisma.booking.update({
    where: { id: bookingId },
    data: {
      branchId: finalBranchId,
      serviceId: finalServiceId,
      startTime: finalStartTime,
      endTime: finalEndTime,
      numberOfPeople: finalNumberOfPeople,
      notes: finalNotes,
      requestedSetup: finalSetup,
      pricingInterval: finalPricingInterval,
      pricingMode: pricingMode as any,
      unitPrice,
      subtotal,
      discountType: discountType as any,
      discountValue,
      discountAmount,
      taxRate: taxRate || null,
      taxAmount,
      totalPrice,
    },
    include: {
      branch: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, type: true } },
      payment: true,
      addOns: true,
    },
  });

  // 14. Update add-ons if provided
  if (dto.addOns !== undefined) {
    await this.prisma.bookingAddOn.deleteMany({ where: { bookingId } });
    for (const item of addOnItems) {
      await this.prisma.bookingAddOn.create({
        data: {
          bookingId,
          vendorAddOnId: item.vendorAddOnId,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          serviceTime: item.serviceTime,
          comments: item.comments,
        },
      });
    }
  }

  // 15. Update payment amount if it exists and total changed
  if (updated.payment && updated.payment.status === 'PENDING') {
    await this.prisma.payment.update({
      where: { id: updated.payment.id },
      data: { amount: totalPrice },
    });
  }

  // Re-fetch with updated add-ons
  const final = await this.prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      branch: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, type: true } },
      payment: true,
      addOns: true,
    },
  });

  return this.serializeVendorBooking(final);
}
```

Make sure these imports are at the top of the file:
- `NotFoundException`, `ForbiddenException`, `ConflictException` from `@nestjs/common`
- `calculateSubtotal` from `../bookings/booking-creation.helper`
- `UpdateVendorBookingDto` from `./dto/update-vendor-booking.dto`

Check if a `serializeVendorBooking` method exists. If not, use the same serialization pattern as `createBookingForCustomer` returns. The method should convert Decimal fields to numbers.

**Step 2: Run tests**

```bash
cd apps/api && npx jest --testPathPatterns=vendor
```

**Step 3: Commit**

```bash
git add apps/api/src/vendor/
git commit -m "feat: add updateVendorBooking service method with recalculation"
```

---

### Task 5: Add PATCH endpoint to VendorController

**Files:**
- Modify: `apps/api/src/vendor/vendor.controller.ts`

**Step 1: Add the endpoint after the existing `POST /vendor/bookings/create` (around line 184)**

```typescript
@Patch('bookings/:id')
@UseGuards(JwtAuthGuard)
async updateBooking(@Request() req, @Param('id') bookingId: string, @Body() dto: UpdateVendorBookingDto) {
  return this.vendorService.updateVendorBooking(req.user.sub, bookingId, dto);
}
```

Make sure `UpdateVendorBookingDto` is imported from the dto directory and `Param` is imported from `@nestjs/common`.

**Step 2: Commit**

```bash
git add apps/api/src/vendor/vendor.controller.ts
git commit -m "feat: add PATCH /vendor/bookings/:id endpoint"
```

---

### Task 6: Backend tests for updateVendorBooking

**Files:**
- Modify: `apps/api/src/vendor/vendor.service.spec.ts`

**Step 1: Read the existing spec file to understand its mock structure**

**Step 2: Add tests for the update method**

Key test cases:
- Should update booking time and recalculate price
- Should reject edit for CHECKED_IN status
- Should reject edit when vendor doesn't own the booking
- Should update add-ons (delete old, create new)
- Should recalculate with PER_PERSON mode when numberOfPeople changes
- Should check availability excluding current booking
- Should update payment amount when total changes

**Step 3: Run tests**

```bash
cd apps/api && npx jest --testPathPatterns=vendor
```

**Step 4: Commit**

```bash
git add apps/api/src/vendor/vendor.service.spec.ts
git commit -m "test: add updateVendorBooking service tests"
```

---

### Task 7: Frontend API helper and types

**Files:**
- Modify: `apps/web/lib/vendor.ts`
- Modify: `apps/web/lib/types.ts`

**Step 1: Add updateVendorBooking function to vendor.ts (after updateBookingStatus around line 108)**

```typescript
export async function updateVendorBooking(
  token: string,
  bookingId: string,
  data: {
    branchId?: string;
    serviceId?: string;
    startTime?: string;
    endTime?: string;
    numberOfPeople?: number;
    pricingInterval?: string;
    notes?: string;
    requestedSetup?: string;
    addOns?: { vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[];
    discountType?: string;
    discountValue?: number;
    subjectToTax?: boolean;
  },
): Promise<VendorBooking> {
  return apiFetch<VendorBooking>(`/vendor/bookings/${bookingId}`, {
    token,
    method: 'PATCH',
    body: data,
  });
}
```

**Step 2: Add getVendorBookingById function (if not existing)**

```typescript
export async function getVendorBookingById(
  token: string,
  bookingId: string,
): Promise<VendorBooking> {
  return apiFetch<VendorBooking>(`/bookings/${bookingId}`, { token });
}
```

**Step 3: Commit**

```bash
git add apps/web/lib/vendor.ts apps/web/lib/types.ts
git commit -m "feat: add updateVendorBooking API helper"
```

---

### Task 8: Frontend — Vendor Booking Edit Page

**Files:**
- Create: `apps/web/app/vendor/bookings/[id]/edit/page.tsx`

**Step 1: Create the edit page**

This page should:
1. Fetch the existing booking by ID via `getVendorBookingById`
2. Fetch vendor branches (for service/branch selection) via `getVendorBranches`
3. Fetch vendor add-ons via `getVendorAddOns`
4. Fetch vendor profile for tax rate via `getVendorProfile`
5. Pre-populate a form with all current booking values
6. Show a financial preview with recalculated totals (same `useMemo` pattern as create page but using vendor profile tax rate instead of hardcoded 16)
7. On submit, call `updateVendorBooking` with changed fields
8. Redirect back to the booking list on success

The form structure should match the create page (`apps/web/app/vendor/bookings/create/page.tsx`) but simplified for single-booking editing (no multi-day support needed — each booking is one day).

**Key sections:**
- Branch + Service selection (dropdowns)
- Date + Start Time + End Time
- Number of People
- Pricing Interval selection (from service pricing)
- Setup Type (if applicable)
- Notes
- Add-Ons picker (same pattern as create page)
- Discount (type + value)
- Tax toggle
- Financial summary preview
- Save / Cancel buttons

**Step 2: Run type check**

```bash
cd apps/web && npm run check-types
```

**Step 3: Commit**

```bash
git add apps/web/app/vendor/bookings/
git commit -m "feat: add vendor booking edit page"
```

---

### Task 9: Frontend — Add Edit button to booking list and detail views

**Files:**
- Modify: `apps/web/app/vendor/bookings/_components/status-bookings-page.tsx`

**Step 1: Add an "Edit" link/button to the booking table**

In the table columns (around line 146), add an Edit action column that links to `/vendor/bookings/{bookingId}/edit`. Only show for editable statuses:

```tsx
{
  header: '',
  cell: ({ row }) => {
    const editable = ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED'].includes(row.original.status);
    if (!editable) return null;
    return (
      <Link href={`/vendor/bookings/${row.original.id}/edit`} className="text-teal-600 hover:text-teal-800 text-sm font-medium">
        Edit
      </Link>
    );
  },
}
```

Import `Link` from `next/link`.

**Step 2: Commit**

```bash
git add apps/web/app/vendor/bookings/
git commit -m "feat: add Edit button to vendor booking list for editable statuses"
```

---

### Task 10: Final Verification

**Step 1: Run all backend tests**

```bash
cd apps/api && npx jest
```

**Step 2: Run frontend type check**

```bash
cd apps/web && npm run check-types
```

**Step 3: Run lint**

```bash
npm run lint
```

**Step 4: Fix any issues found**

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address lint and type issues"
```
