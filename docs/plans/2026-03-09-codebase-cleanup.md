# Codebase Cleanup — Full Review Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all security vulnerabilities, broken features, type mismatches, code duplication, dead code, and code quality issues identified in the full codebase review.

**Architecture:** Six phases in dependency order — security first (blocking vulnerabilities), then broken features, then type alignment (enables later work), then duplication removal, dead code cleanup, and finally code quality polish. Each task is self-contained and can be verified independently.

**Tech Stack:** NestJS 11, Prisma, Next.js 16, React 19, TypeScript, Tailwind CSS

---

## Phase 1: Security Fixes

### Task 1: Add ownership verification to invoices controller + service

**Files:**
- Modify: `apps/api/src/invoices/invoices.controller.ts`
- Modify: `apps/api/src/invoices/invoices.service.ts`

**Step 1: Update invoices controller to inject req.user**

In `apps/api/src/invoices/invoices.controller.ts`, every handler must pass `req.user.id` to the service. Update all route handlers:

```typescript
import { Controller, Post, Get, Patch, Param, Body, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { Response } from 'express';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.invoicesService.createInvoice(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    return this.invoicesService.getInvoices(req.user.id, query);
  }

  @Get('stats')
  getFinancialStats(@Req() req: any) {
    return this.invoicesService.getFinancialStats(req.user.id);
  }

  @Get(':id/pdf')
  async generatePdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const pdf = await this.invoicesService.generatePdf(req.user.id, id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="invoice-${id}.pdf"` });
    pdf.pipe(res);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.invoicesService.getInvoice(req.user.id, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.invoicesService.updateInvoice(req.user.id, id, dto);
  }
}
```

**Step 2: Add ownership filtering to invoices service**

In `apps/api/src/invoices/invoices.service.ts`, add a private helper to get vendorProfileId, then use it in every method:

Add this private helper method to the service class:

```typescript
private async getVendorProfileId(userId: string): Promise<string> {
  const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendor) throw new BadRequestException('Vendor profile not found');
  return vendor.id;
}
```

Then update every public method signature to accept `userId: string` as the first parameter, call `getVendorProfileId(userId)`, and add `vendorProfileId` to all Prisma where clauses:

- `createInvoice(userId, dto)` — verify the booking belongs to vendor's branch before creating
- `getInvoices(userId, query)` — add `where: { booking: { branch: { vendorProfileId } } }` filter
- `getInvoice(userId, id)` — add ownership check after fetching: `if (invoice.booking.branch.vendorProfileId !== vendorProfileId) throw new ForbiddenException()`
- `updateInvoice(userId, id, dto)` — same ownership check
- `getFinancialStats(userId)` — scope all aggregations to vendor's invoices
- `generatePdf(userId, id)` — same ownership check

**Step 3: Verify backend compiles**

Run: `cd apps/api && npx tsc --noEmit`

**Step 4: Run tests**

Run: `cd apps/api && npm test`

**Step 5: Commit**

```bash
git add apps/api/src/invoices/
git commit -m "fix(security): add ownership verification to all invoice endpoints"
```

---

### Task 2: Add ownership verification to quotations controller + service

**Files:**
- Modify: `apps/api/src/quotations/quotations.controller.ts`
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Update quotations controller to inject req.user on missing handlers**

In `apps/api/src/quotations/quotations.controller.ts`, the following handlers are missing `req.user`:
- `updateQuotation` (line 63)
- `generatePdf` (line 72)
- `sendQuotation` (line 84)
- `acceptQuotation` (line 90)
- `rejectQuotation` (line 96)

Update each to inject `@Req() req: any` and pass `req.user.id`:

```typescript
@Patch(':id')
updateQuotation(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
  return this.quotationsService.updateQuotation(req.user.id, id, dto);
}

@Get(':id/pdf')
async generatePdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
  const pdf = await this.quotationsService.generatePdf(req.user.id, id);
  res.set({ 'Content-Type': 'application/pdf' });
  pdf.pipe(res);
}

@Post(':id/send')
sendQuotation(@Req() req: any, @Param('id') id: string) {
  return this.quotationsService.sendQuotation(req.user.id, id);
}

@Post(':id/accept')
acceptQuotation(@Req() req: any, @Param('id') id: string) {
  return this.quotationsService.acceptQuotation(req.user.id, id);
}

@Post(':id/reject')
rejectQuotation(@Req() req: any, @Param('id') id: string) {
  return this.quotationsService.rejectQuotation(req.user.id, id);
}
```

**Step 2: Add ownership verification to quotations service**

In `apps/api/src/quotations/quotations.service.ts`, add a private helper:

```typescript
private async verifyQuotationOwnership(userId: string, quotationId: string) {
  const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendor) throw new BadRequestException('Vendor profile not found');
  const quotation = await this.prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { branch: { select: { vendorProfileId: true } } },
  });
  if (!quotation) throw new NotFoundException('Quotation not found');
  if (quotation.branch.vendorProfileId !== vendor.id) throw new ForbiddenException('Not your quotation');
  return quotation;
}
```

Then update the signatures and add verification:
- `updateQuotation(userId, id, dto)` — call `verifyQuotationOwnership` before updating
- `sendQuotation(userId, id)` — call `verifyQuotationOwnership` before updating status
- `acceptQuotation(userId, id)` — call `verifyQuotationOwnership` before updating status
- `rejectQuotation(userId, id)` — call `verifyQuotationOwnership` before updating status
- `generatePdf(userId, id)` — call `verifyQuotationOwnership` before generating
- `convertToBooking(userId, id)` — call `verifyQuotationOwnership` before converting

**Step 3: Add missing imports**

Add `ForbiddenException` and `NotFoundException` to the `@nestjs/common` import if not already present.

**Step 4: Verify and test**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 5: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "fix(security): add ownership verification to all quotation endpoints"
```

---

### Task 3: Add authentication guard to uploads controller

**Files:**
- Modify: `apps/api/src/uploads/uploads.controller.ts`

**Step 1: Add JwtAuthGuard to upload endpoint only (keep serve public)**

In `apps/api/src/uploads/uploads.controller.ts`, add `@UseGuards(JwtAuthGuard)` to the `uploadFile` method only. The `serveFile` GET endpoint should remain public so images can be displayed.

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Add to the uploadFile method only:
@Post()
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', { ... }))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  // ... existing logic
}
```

**Step 2: Verify and test**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 3: Commit**

```bash
git add apps/api/src/uploads/uploads.controller.ts
git commit -m "fix(security): require authentication for file uploads"
```

---

## Phase 2: Fix Broken Features

### Task 4: Fix admin dashboard stats field alignment

**Files:**
- Modify: `apps/web/app/admin/page.tsx`
- Modify: `apps/web/lib/types.ts` (lines 373-382)

**Step 1: Update AdminStats interface to match backend response**

In `apps/web/lib/types.ts`, replace the `AdminStats` interface (lines 373-382) with:

```typescript
export interface AdminStats {
  users: number;
  vendors: number;
  pendingVendors: number;
  branches: number;
  bookings: number;
  activeBookings: number;
  revenue: number;
  platformRevenue: number;
  vendorPayouts: number;
  pendingApprovals: number;
}
```

**Step 2: Update admin dashboard to use correct field names**

In `apps/web/app/admin/page.tsx`, update the stats access:

- Change `stats` variable type from `any` to `AdminStats | null`
- Replace `stats.offices ?? 0` with `0` (backend doesn't return this — remove the stat card or mark as TODO)
- Replace `stats.meetingRooms ?? 0` with `0` (same)
- Replace `stats.availableUnits ?? 0` with `0` (same)
- Replace `stats.expiringSoon ?? 0` with `0` (same)
- Replace `stats.expired ?? 0` with `0` (same)
- Keep `stats.branches`, `stats.activeBookings`, `stats.pendingApprovals` — these match the backend

Remove the stat cards that display hardcoded 0 (offices, meetingRooms, availableUnits, expiringSoon, expired). They display misleading data. If these stats are needed in the future, the backend endpoint should be updated to return them.

**Step 3: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/lib/types.ts apps/web/app/admin/page.tsx
git commit -m "fix: align admin dashboard stats with backend response fields"
```

---

## Phase 3: Type Alignment

### Task 5: Regenerate Prisma client to fix isPublic type casts

**Files:**
- Run command only (no file edits)

**Step 1: Regenerate Prisma client**

Run: `cd apps/api && npx prisma generate`

**Step 2: Remove `as any` casts for isPublic in branches.service.ts**

In `apps/api/src/branches/branches.service.ts`, remove the `as any` casts at lines 74, 78, 159, 174. Change patterns like:

```typescript
where: { isActive: true, isPublic: true } as any
```

To:

```typescript
where: { isActive: true, isPublic: true }
```

**Step 3: Remove `as any` casts in services.service.ts**

Remove `(dto as any).isPublic` casts — use `dto.isPublic` directly since the DTO already has the field.

**Step 4: Remove `as any` casts in admin.service.ts**

Remove `(service as any).isPublic`, `(s as any).isPublic`, `(p as any).isPublic` casts — use direct property access.

**Step 5: Remove `as any` casts in bookings.service.ts**

Remove `(service as any).isPublic` — use direct property access.

**Step 6: Verify backend compiles**

Run: `cd apps/api && npx tsc --noEmit`

If any `isPublic` references still fail compilation, it means the field name differs in the schema. Check `apps/api/prisma/schema.prisma` for the exact field name and adjust accordingly.

**Step 7: Run tests**

Run: `cd apps/api && npm test`

**Step 8: Commit**

```bash
git add apps/api/src/branches/branches.service.ts apps/api/src/services/services.service.ts apps/api/src/admin/admin.service.ts apps/api/src/bookings/bookings.service.ts
git commit -m "fix: remove as-any casts for isPublic after Prisma client regeneration"
```

---

### Task 6: Fix frontend type interfaces to match backend responses

**Files:**
- Modify: `apps/web/lib/types.ts`

**Step 1: Update VendorSummary to include isVerified and socialLinks**

At lines 13-17, change:

```typescript
export interface VendorSummary {
  id: string;
  companyName: string;
  logo: string | null;
}
```

To:

```typescript
export interface VendorSummary {
  id: string;
  companyName: string;
  logo: string | null;
  isVerified: boolean;
  socialLinks?: Record<string, string>;
}
```

**Step 2: Update BranchDetail to include missing fields**

At lines 81-95, add the missing fields:

```typescript
amenities: string[];
googleMapsUrl: string | null;
```

**Step 3: Update ServiceItem to include minCapacity**

At lines 35-53, add:

```typescript
minCapacity?: number;
```

**Step 4: Update VendorProfile to match backend response**

At lines 416-443, remove `taxRate` and `taxEnabled` (backend doesn't return them in getProfile), and add `logo`, `verifiedAt`, `createdAt`.

**Step 5: Fix Quotation interface — remove createdById, ensure createdBy exists**

At line 688, remove `createdById: string` since the backend doesn't return it. The `createdBy` object field is sufficient.

**Step 6: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

Fix any type errors that surface from the interface changes (these are real bugs that were hidden by `any` types).

**Step 7: Commit**

```bash
git add apps/web/lib/types.ts
git commit -m "fix: align frontend type interfaces with actual backend responses"
```

---

### Task 7: Remove `as any` casts in frontend components

**Files:**
- Modify: `apps/web/app/components/space-card.tsx`
- Modify: `apps/web/app/spaces/[id]/page.tsx`

**Step 1: Fix space-card.tsx**

At line 49, now that `VendorSummary` has `isVerified`, change:

```typescript
{(branch.vendor as any).isVerified && (
```

To:

```typescript
{branch.vendor.isVerified && (
```

**Step 2: Fix spaces/[id]/page.tsx**

At line 55, change `let branch: any` to use the proper type:

```typescript
let branch: BranchDetail;
```

Import `BranchDetail` from `../../lib/types` if not already imported.

Remove `as any` casts at lines 62, 65, 88 — these should now work with the updated types:
- `branch.vendor?.socialLinks` (no cast needed, VendorSummary now has it)
- `branch.amenities` (no cast needed, BranchDetail now has it)
- `branch.vendor?.isVerified` (no cast needed)

**Step 3: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/app/components/space-card.tsx apps/web/app/spaces/[id]/page.tsx
git commit -m "fix: remove as-any casts now that types are aligned"
```

---

## Phase 4: Duplication Removal

### Task 8: Consolidate duplicate apiFetch in quotations.ts and invoices.ts

**Files:**
- Modify: `apps/web/lib/quotations.ts`
- Modify: `apps/web/lib/invoices.ts`

**Step 1: Refactor quotations.ts to use shared apiFetch**

In `apps/web/lib/quotations.ts`:
- Remove the local `apiFetch` function (lines 5-19) and the local `API` constant
- Import `apiFetch` from `./api`
- Update all function calls to use the shared `apiFetch` signature: `apiFetch<T>(path, options)` where the token is read from `localStorage.accessToken` inside `apiFetch` automatically

For each function, change patterns like:
```typescript
const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
return apiFetch<T>(`/quotations`, token, { method: 'GET' });
```

To:
```typescript
return apiFetch<T>('/quotations');
```

The shared `apiFetch` already handles auth headers via localStorage.

**Step 2: Refactor invoices.ts to use shared apiFetch**

Same refactoring as Step 1 but for `apps/web/lib/invoices.ts`.

**Step 3: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/lib/quotations.ts apps/web/lib/invoices.ts
git commit -m "refactor: consolidate duplicate apiFetch into shared lib/api import"
```

---

### Task 9: Extract shared booking creation logic in backend

**Files:**
- Create: `apps/api/src/bookings/booking-creation.helper.ts`
- Modify: `apps/api/src/bookings/bookings.service.ts`
- Modify: `apps/api/src/vendor/vendor.service.ts`

**Step 1: Create shared helper**

Create `apps/api/src/bookings/booking-creation.helper.ts` that extracts the common logic:

```typescript
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface BookingCalculationInput {
  service: any; // Prisma service with pricing
  pricingInterval: string;
  numberOfPeople?: number;
  hours?: number;
  promoCode?: string;
  discountType?: string;
  discountValue?: number;
  addOns?: { addOnId: string; quantity: number }[];
}

export interface BookingCalculationResult {
  pricing: any;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  promoCodeRecord?: any;
}

export async function calculateBookingFinancials(
  prisma: PrismaService,
  input: BookingCalculationInput,
): Promise<BookingCalculationResult> {
  // Extract the shared pricing calculation logic from bookings.service.ts createBooking (lines ~120-220)
  // This includes: finding the right pricing tier, calculating per-person/per-hour/per-booking price,
  // applying promo codes, calculating discounts and tax
}

export async function validatePromoCode(
  prisma: PrismaService,
  code: string,
  vendorProfileId: string,
  branchId: string,
  subtotal: number,
): Promise<any> {
  // Extract the shared promo code validation logic
  // Checks: existence, expiry, maxUses, branch scope, minimum spend
}

export async function checkServiceAvailability(
  prisma: PrismaService,
  serviceId: string,
  branchId: string,
  startTime: Date,
  endTime: Date,
  numberOfPeople: number,
): Promise<{ available: boolean; remainingSpots: number }> {
  // Extract the shared availability checking logic
}
```

**Step 2: Refactor bookings.service.ts createBooking**

Replace the inline pricing calculation, promo validation, and availability check with calls to the shared helper functions. The method should shrink from ~280 lines to ~80-100 lines.

**Step 3: Refactor vendor.service.ts createBookingForCustomer**

Same refactoring — replace duplicated logic with calls to the shared helpers.

**Step 4: Verify backend compiles and tests pass**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 5: Commit**

```bash
git add apps/api/src/bookings/booking-creation.helper.ts apps/api/src/bookings/bookings.service.ts apps/api/src/vendor/vendor.service.ts
git commit -m "refactor: extract shared booking creation logic into helper"
```

---

### Task 10: Extract shared constants (VALID_TRANSITIONS, SETUP_ELIGIBLE_TYPES)

**Files:**
- Create: `apps/api/src/common/constants.ts`
- Modify: `apps/api/src/bookings/bookings.service.ts`
- Modify: `apps/api/src/vendor/vendor.service.ts`
- Modify: `apps/api/src/services/services.service.ts`

**Step 1: Create shared constants file**

Create `apps/api/src/common/constants.ts`:

```typescript
export const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  PENDING_APPROVAL: ['CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['COMPLETED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
  NO_SHOW: [],
};

export const SETUP_ELIGIBLE_TYPES = ['MEETING_ROOM', 'EVENT_SPACE'] as const;

export const SIMPLE_CAPACITY_TYPES = ['HOT_DESK', 'PRIVATE_OFFICE'] as const;
```

**Step 2: Replace inline constants in all three service files**

In each file, remove the local constant declaration and import from `../common/constants` (or `../../common/constants` depending on depth).

**Step 3: Remove unused SIMPLE_CAPACITY_TYPES from services.service.ts**

The constant at line 8 of `services.service.ts` is never referenced in that file. After moving to shared constants, only import what's actually used.

**Step 4: Verify and test**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 5: Commit**

```bash
git add apps/api/src/common/constants.ts apps/api/src/bookings/bookings.service.ts apps/api/src/vendor/vendor.service.ts apps/api/src/services/services.service.ts
git commit -m "refactor: extract duplicated constants into shared common/constants"
```

---

### Task 11: Consolidate duplicate vendor booking status pages

**Files:**
- Create: `apps/web/app/vendor/bookings/[status]/page.tsx`
- Delete (after new page works): 10 individual status page files

**Step 1: Create parameterized status page**

Create `apps/web/app/vendor/bookings/[status]/page.tsx` that:
- Reads the `status` param from the URL
- Maps slug to API status value (e.g., `confirmed` → `CONFIRMED`, `no-show` → `NO_SHOW`, `sales-pending` → `SALES_PENDING`)
- Uses a config object for status-specific labels:

```typescript
const STATUS_CONFIG: Record<string, { title: string; emptyMessage: string; apiStatus: string }> = {
  confirmed: { title: 'Confirmed Bookings', emptyMessage: 'No confirmed bookings', apiStatus: 'CONFIRMED' },
  cancelled: { title: 'Cancelled Bookings', emptyMessage: 'No cancelled bookings', apiStatus: 'CANCELLED' },
  rejected: { title: 'Rejected Bookings', emptyMessage: 'No rejected bookings', apiStatus: 'REJECTED' },
  finished: { title: 'Finished Bookings', emptyMessage: 'No finished bookings', apiStatus: 'COMPLETED' },
  'no-show': { title: 'No-Show Bookings', emptyMessage: 'No no-show bookings', apiStatus: 'NO_SHOW' },
  expired: { title: 'Expired Bookings', emptyMessage: 'No expired bookings', apiStatus: 'EXPIRED' },
  'in-progress': { title: 'In-Progress Bookings', emptyMessage: 'No in-progress bookings', apiStatus: 'CHECKED_IN' },
  archived: { title: 'Archived Bookings', emptyMessage: 'No archived bookings', apiStatus: 'ARCHIVED' },
  'sales-pending': { title: 'Sales Pending Bookings', emptyMessage: 'No sales pending bookings', apiStatus: 'SALES_PENDING' },
  'accountant-pending': { title: 'Accountant Pending Bookings', emptyMessage: 'No accountant pending bookings', apiStatus: 'ACCOUNTANT_PENDING' },
};
```

- Uses the same DataTable columns, pagination, and export logic as the existing pages (copy from `confirmed/page.tsx` as the base)
- If status slug is not in config, show 404

**Step 2: Verify the new page works**

Run: `cd apps/web && npx tsc --noEmit`

**Step 3: Delete the old individual status pages**

Delete these files:
- `apps/web/app/vendor/bookings/confirmed/page.tsx`
- `apps/web/app/vendor/bookings/cancelled/page.tsx`
- `apps/web/app/vendor/bookings/rejected/page.tsx`
- `apps/web/app/vendor/bookings/finished/page.tsx`
- `apps/web/app/vendor/bookings/no-show/page.tsx`
- `apps/web/app/vendor/bookings/expired/page.tsx`
- `apps/web/app/vendor/bookings/in-progress/page.tsx`
- `apps/web/app/vendor/bookings/archived/page.tsx`
- `apps/web/app/vendor/bookings/sales-pending/page.tsx`
- `apps/web/app/vendor/bookings/accountant-pending/page.tsx`

**Important:** Do NOT delete `overview/page.tsx` or `create/page.tsx` — those are different pages.

**Step 4: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add apps/web/app/vendor/bookings/
git commit -m "refactor: consolidate 10 vendor booking status pages into parameterized [status] page"
```

---

### Task 12: Consolidate duplicate admin booking status pages

**Files:**
- Create: `apps/web/app/admin/bookings/[status]/page.tsx`
- Delete: 7 individual admin status page files

**Step 1: Create parameterized admin status page**

Same pattern as Task 11 but for admin bookings. Create `apps/web/app/admin/bookings/[status]/page.tsx` with admin-specific config (admin may have different columns or actions).

Note: Be careful not to conflict with `apps/web/app/admin/bookings/[id]/page.tsx` (booking detail page). The `[status]` route should only match known status slugs, and the `[id]` route matches UUIDs. In Next.js App Router, these would conflict — so instead, use a middleware check or restructure the routes.

**Alternative approach if route conflict exists:** Keep the status pages as-is but extract the shared logic into a `StatusBookingsPage` component in `apps/web/app/admin/bookings/_components/status-bookings-page.tsx`, then each status page just does:

```typescript
export default function ConfirmedPage() {
  return <StatusBookingsPage status="CONFIRMED" title="Confirmed Bookings" />;
}
```

This reduces each file to ~3 lines while avoiding route conflicts.

**Step 2: Apply same pattern to vendor pages if route conflict exists**

If the `[status]` dynamic route conflicts with existing routes, use the same extracted component approach for vendor pages too (revising Task 11).

**Step 3: Verify and commit**

Run: `cd apps/web && npx tsc --noEmit`

```bash
git add apps/web/app/admin/bookings/
git commit -m "refactor: consolidate admin booking status pages into shared component"
```

---

### Task 13: Remove duplicate formatSetupType

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/app/vendor/branches/[id]/page.tsx`

**Step 1: Remove formatSetupType from types.ts**

The canonical version should be the one in `format.ts` (uses a lookup map, more consistent with the rest of format.ts). Remove the `formatSetupType` function from `types.ts` (line 201-203).

**Step 2: Update imports**

Find all files that import `formatSetupType` from `types.ts` and change them to import from `format.ts` instead.

Run a search for: `import.*formatSetupType.*from.*types`

**Step 3: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/lib/types.ts apps/web/lib/format.ts apps/web/app/vendor/branches/[id]/page.tsx
git commit -m "refactor: remove duplicate formatSetupType, keep canonical version in format.ts"
```

---

## Phase 5: Dead Code Cleanup

### Task 14: Remove dead code from backend

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts` (remove unused `StreamableFile` import at line 5)
- Modify: `apps/api/src/services/services.service.ts` (remove unused `SIMPLE_CAPACITY_TYPES` if not imported from shared constants)
- Modify: `apps/api/src/vendor/dto/booking-day.dto.ts` (remove unused `DiscountType` import at line 3)

**Step 1: Remove unused imports**

In each file, remove the unused import.

**Step 2: Verify and test**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 3: Commit**

```bash
git add apps/api/src/quotations/quotations.service.ts apps/api/src/services/services.service.ts apps/api/src/vendor/dto/booking-day.dto.ts
git commit -m "chore: remove unused imports (StreamableFile, SIMPLE_CAPACITY_TYPES, DiscountType)"
```

---

### Task 15: Remove dead code from frontend

**Files:**
- Delete: `apps/web/app/components/space-map-section.tsx` (unused — the actual component is at `spaces/[id]/space-map-section.tsx` or the import was checked and the components/ one is the real one used)
- Modify: `apps/web/lib/format.ts` (remove unused `formatUnitType` at line 20)
- Modify: `apps/web/lib/types.ts` (make `SIMPLE_CAPACITY_TYPES` and `SETUP_ELIGIBLE_TYPES` non-exported if only used internally)
- Modify: `apps/web/lib/admin.ts` (remove unused `ADMIN_SECTIONS` export at line 230 — `ROLE_PERMISSIONS` references it inline, so keep the const but remove the export)

**Step 1: Verify which space-map-section is actually used**

Check the import in `apps/web/app/spaces/[id]/page.tsx` — the research showed it imports from `../../components/space-map-section` (the components/ one). If so, do NOT delete it. Only delete if the research confirmed it's unused. The frontend research found that `spaces/[id]/space-map-section.tsx` does NOT exist, so the `components/` version IS the one being used. **Do not delete it.**

**Step 2: Remove formatUnitType from format.ts**

At line 20, remove:
```typescript
export const formatUnitType = formatServiceType;
```

Check if anything imports it first. If nothing does, safe to remove.

**Step 3: Remove ADMIN_SECTIONS export**

In `apps/web/lib/admin.ts`, change `export const ADMIN_SECTIONS` to just `const ADMIN_SECTIONS` (keep it since `ROLE_PERMISSIONS` uses `Object.values(ADMIN_SECTIONS)`).

**Step 4: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add apps/web/lib/format.ts apps/web/lib/types.ts apps/web/lib/admin.ts
git commit -m "chore: remove dead code (unused exports and functions)"
```

---

### Task 16: Remove stale service types from vendor calendar

**Files:**
- Modify: `apps/web/app/components/vendor-calendar.tsx`

**Step 1: Remove VIRTUAL_OFFICE and PHOTO_STUDIO from CalendarEvent type**

At line 27, change:
```typescript
serviceType: "MEETING_ROOM" | "HOT_DESK" | "PRIVATE_OFFICE" | "VIRTUAL_OFFICE" | "EVENT_SPACE" | "PHOTO_STUDIO";
```

To:
```typescript
serviceType: "MEETING_ROOM" | "HOT_DESK" | "PRIVATE_OFFICE" | "EVENT_SPACE";
```

**Step 2: Remove stale switch cases and legend entries**

Remove the `VIRTUAL_OFFICE` and `PHOTO_STUDIO` cases from the color mapping switch (lines 85-96) and from the legend (lines 216-217).

**Step 3: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/app/components/vendor-calendar.tsx
git commit -m "chore: remove stale VIRTUAL_OFFICE and PHOTO_STUDIO from calendar"
```

---

## Phase 6: Code Quality

### Task 17: Remove duplicate API_BASE_URL declarations

**Files:**
- Modify: `apps/web/app/components/navbar.tsx`
- Modify: `apps/web/app/components/ui/auth-dialog.tsx`

**Step 1: Replace local declarations with import**

In both files, remove:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
```

And instead import from the shared module. Check what `lib/api.ts` exports — if it exports `API_BASE_URL`, import that. If it only has `apiFetch`, use `apiFetch` directly instead of raw `fetch` with `API_BASE_URL`.

**Step 2: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add apps/web/app/components/navbar.tsx apps/web/app/components/ui/auth-dialog.tsx
git commit -m "refactor: use shared API_BASE_URL instead of local declarations"
```

---

### Task 18: Add basic types to reviews.ts

**Files:**
- Modify: `apps/web/lib/reviews.ts`

**Step 1: Add return types to all functions**

Replace `apiFetch<any>` with proper types. Use interfaces from `types.ts` where they exist:

```typescript
import { Review } from './types';

interface ReviewsResponse {
  data: Review[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function getBranchReviews(branchId: string, page = 1): Promise<ReviewsResponse> {
  return apiFetch<ReviewsResponse>(`/reviews/branch/${branchId}?page=${page}`);
}

// ... similar for other functions
```

**Step 2: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add apps/web/lib/reviews.ts
git commit -m "fix: add proper return types to reviews.ts (replace any)"
```

---

### Task 19: Fix reviews-section.tsx typing

**Files:**
- Modify: `apps/web/app/components/reviews-section.tsx`

**Step 1: Type the reviews state**

Change:
```typescript
const [reviews, setReviews] = useState<any[]>([]);
```

To:
```typescript
import { Review } from '../../lib/types';
const [reviews, setReviews] = useState<Review[]>([]);
```

**Step 2: Remove `any` annotations from callbacks**

Replace `(r: any)` with `(r: Review)` and `(review: any)` with `(review: Review)`.

**Step 3: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/app/components/reviews-section.tsx
git commit -m "fix: type reviews-section.tsx state and callbacks"
```

---

### Task 20: Final verification

**Step 1: Run all backend tests**

Run: `cd apps/api && npm test`
Expected: All tests pass

**Step 2: Run frontend type check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Run full build**

Run: `npm run build` (from root)
Expected: Build succeeds

**Step 4: Run lint**

Run: `npm run lint` (from root)
Expected: No new lint errors introduced

---

## Summary

| Phase | Tasks | What it fixes |
|-------|-------|---------------|
| 1: Security | Tasks 1-3 | Invoice/quotation ownership, upload auth |
| 2: Broken Features | Task 4 | Admin dashboard showing wrong/zero stats |
| 3: Type Alignment | Tasks 5-7 | Prisma isPublic casts, FE/BE type mismatches, `as any` removal |
| 4: Duplication | Tasks 8-13 | Shared apiFetch, booking logic, booking status pages, constants, formatSetupType |
| 5: Dead Code | Tasks 14-16 | Unused imports, exports, stale types |
| 6: Code Quality | Tasks 17-20 | Duplicate constants, `any` types, reviews typing, final verification |
