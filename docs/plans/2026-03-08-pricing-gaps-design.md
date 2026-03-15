# Pricing Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 2 pricing gaps: (1) add isActive toggle per pricing row for vendors, (2) add pricingMode dropdown to admin service pages. Gap 3 (editable unit price in vendor direct bookings) already works — the input is editable.

**Architecture:** Vendor branch detail page gets a toggle per pricing row that sends `isActive` in the DTO. Backend preserves `isActive` through the delete/recreate cycle. Admin service pages get a pricingMode `<select>` and backend passes it through to Prisma.

**Tech Stack:** NestJS 11, Prisma, Next.js 16, React, Tailwind CSS

---

### Task 1: Add `isActive` to ServicePricingDto

**Files:**
- Modify: `apps/api/src/services/dto/index.ts:6-19`

**Step 1: Add isActive field to DTO**

In `ServicePricingDto`, add after the `price` field:

```typescript
@ApiProperty({ required: false, default: true })
@IsOptional()
@IsBoolean()
isActive?: boolean;
```

**Step 2: Verify backend compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/api/src/services/dto/index.ts
git commit -m "feat: add isActive to ServicePricingDto"
```

---

### Task 2: Preserve `isActive` in backend service create/update

**Files:**
- Modify: `apps/api/src/services/services.service.ts:66-71` (createService pricing map)
- Modify: `apps/api/src/services/services.service.ts:140-149` (updateService pricing transaction)

**Step 1: Update createService pricing map (line 67-71)**

Change:
```typescript
pricing: {
    create: dto.pricing.map((p) => ({
        interval: p.interval,
        pricingMode: p.pricingMode ?? 'PER_BOOKING',
        price: p.price,
    })),
},
```

To:
```typescript
pricing: {
    create: dto.pricing.map((p) => ({
        interval: p.interval,
        pricingMode: p.pricingMode ?? 'PER_BOOKING',
        price: p.price,
        isActive: p.isActive ?? true,
    })),
},
```

**Step 2: Update updateService pricing transaction (line 142-148)**

Change:
```typescript
this.prisma.servicePricing.createMany({
    data: dto.pricing.map((p) => ({
        serviceId,
        interval: p.interval,
        pricingMode: p.pricingMode ?? 'PER_BOOKING',
        price: p.price,
    })),
}),
```

To:
```typescript
this.prisma.servicePricing.createMany({
    data: dto.pricing.map((p) => ({
        serviceId,
        interval: p.interval,
        pricingMode: p.pricingMode ?? 'PER_BOOKING',
        price: p.price,
        isActive: p.isActive ?? true,
    })),
}),
```

**Step 3: Verify backend compiles**

Run: `cd apps/api && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/api/src/services/services.service.ts
git commit -m "feat: preserve isActive when creating/updating service pricing"
```

---

### Task 3: Add isActive toggle to vendor branch detail pricing UI

**Files:**
- Modify: `apps/web/app/vendor/branches/[id]/page.tsx`

**Step 1: Update PricingRow type (line 53)**

Change:
```typescript
type PricingRow = { interval: string; pricingMode: string; price: string };
```

To:
```typescript
type PricingRow = { interval: string; pricingMode: string; price: string; isActive: boolean };
```

**Step 2: Update emptyPricingRow (line 66)**

Change:
```typescript
const emptyPricingRow = (): PricingRow => ({ interval: "", pricingMode: "PER_BOOKING", price: "" });
```

To:
```typescript
const emptyPricingRow = (): PricingRow => ({ interval: "", pricingMode: "PER_BOOKING", price: "", isActive: true });
```

**Step 3: Update startEdit pricing mapping (line 226-229)**

Change:
```typescript
const existingPricing: PricingRow[] = (svc.pricing || []).map((p: any) => ({
    interval: p.interval || "",
    pricingMode: p.pricingMode || "PER_BOOKING",
    price: p.price != null ? String(Number(p.price)) : "",
}));
```

To:
```typescript
const existingPricing: PricingRow[] = (svc.pricing || []).map((p: any) => ({
    interval: p.interval || "",
    pricingMode: p.pricingMode || "PER_BOOKING",
    price: p.price != null ? String(Number(p.price)) : "",
    isActive: p.isActive !== false,
}));
```

**Step 4: Update pricing payload in handleSubmitService (line 179)**

Change:
```typescript
.map(r => ({ interval: r.interval, pricingMode: r.pricingMode, price: Number(r.price) }));
```

To:
```typescript
.map(r => ({ interval: r.interval, pricingMode: r.pricingMode, price: Number(r.price), isActive: r.isActive }));
```

**Step 5: Update pricing payload in handleSaveEdit (line 251)**

Change:
```typescript
.map(r => ({ interval: r.interval, pricingMode: r.pricingMode, price: Number(r.price) }));
```

To:
```typescript
.map(r => ({ interval: r.interval, pricingMode: r.pricingMode, price: Number(r.price), isActive: r.isActive }));
```

**Step 6: Add toggle switch to "Add Service" pricing rows (after the price input, around line 670-676)**

After the price input and before the Remove button in the new service pricing row, add a toggle:

```tsx
<label className="relative inline-flex cursor-pointer items-center shrink-0" title={row.isActive ? "Active" : "Disabled"}>
    <input type="checkbox" checked={row.isActive} onChange={(e) => { const updated = [...newService.pricing]; updated[idx] = { ...row, isActive: e.target.checked }; setNewService({ ...newService, pricing: updated }); }} className="peer sr-only" />
    <div className="h-5 w-9 rounded-full bg-slate-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
</label>
```

**Step 7: Add toggle switch to "Edit Service" pricing rows (around line 854-860)**

Same toggle pattern as Step 6 but for `editService.pricing`:

```tsx
<label className="relative inline-flex cursor-pointer items-center shrink-0" title={row.isActive ? "Active" : "Disabled"}>
    <input type="checkbox" checked={row.isActive} onChange={(e) => { const updated = [...editService.pricing]; updated[idx] = { ...row, isActive: e.target.checked }; setEditService({ ...editService, pricing: updated }); }} className="peer sr-only" />
    <div className="h-5 w-9 rounded-full bg-slate-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
</label>
```

**Step 8: Gray out disabled rows**

Wrap each pricing row's container div with conditional opacity. For "Add Service" pricing rows, change the row container:

```tsx
<div key={idx} className={`flex items-center gap-2 ${!row.isActive ? "opacity-50" : ""}`}>
```

Same for "Edit Service" pricing rows.

**Step 9: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 10: Commit**

```bash
git add apps/web/app/vendor/branches/[id]/page.tsx
git commit -m "feat: add isActive toggle per pricing row in vendor branch detail"
```

---

### Task 4: Add pricingMode to admin service response mapping

**Files:**
- Modify: `apps/api/src/admin/admin.service.ts:1022` (listing)
- Modify: `apps/api/src/admin/admin.service.ts:1059` (getById)
- Modify: `apps/api/src/admin/admin.service.ts:1092` (create)
- Modify: `apps/api/src/admin/admin.service.ts:1127` (update)

**Step 1: Add pricingMode to listing response (line 1022)**

Change:
```typescript
pricing: s.pricing.map(p => ({ id: p.id, interval: p.interval, price: p.price.toNumber(), currency: p.currency })),
```

To:
```typescript
pricing: s.pricing.map(p => ({ id: p.id, interval: p.interval, pricingMode: p.pricingMode, price: p.price.toNumber(), currency: p.currency })),
```

**Step 2: Add pricingMode to getById response (line 1059)**

Change:
```typescript
pricing: service.pricing.map(p => ({ id: p.id, interval: p.interval, price: p.price.toNumber(), currency: p.currency })),
```

To:
```typescript
pricing: service.pricing.map(p => ({ id: p.id, interval: p.interval, pricingMode: p.pricingMode, price: p.price.toNumber(), currency: p.currency })),
```

**Step 3: Pass pricingMode in createAdminService (line 1092)**

Change:
```typescript
pricing: {
    create: dto.pricing.map(p => ({ interval: p.interval, price: p.price })),
},
```

To:
```typescript
pricing: {
    create: dto.pricing.map(p => ({ interval: p.interval, pricingMode: p.pricingMode ?? 'PER_BOOKING', price: p.price })),
},
```

**Step 4: Pass pricingMode in updateAdminService (line 1127)**

Change:
```typescript
data: dto.pricing.map((p: any) => ({ serviceId: id, interval: p.interval, price: p.price })),
```

To:
```typescript
data: dto.pricing.map((p: any) => ({ serviceId: id, interval: p.interval, pricingMode: p.pricingMode ?? 'PER_BOOKING', price: p.price })),
```

**Step 5: Verify backend compiles**

Run: `cd apps/api && npx tsc --noEmit`

**Step 6: Commit**

```bash
git add apps/api/src/admin/admin.service.ts
git commit -m "feat: include pricingMode in admin service CRUD"
```

---

### Task 5: Add pricingMode dropdown to admin create service page

**Files:**
- Modify: `apps/web/app/admin/services/new/page.tsx`

**Step 1: Add PRICING_MODES constant (after PRICING_INTERVALS, line 27)**

```typescript
const PRICING_MODES = [
  { value: "PER_BOOKING", label: "Per Booking" },
  { value: "PER_PERSON", label: "Per Person" },
  { value: "PER_HOUR", label: "Per Hour" },
];
```

**Step 2: Update form state pricing type (line 41)**

Change:
```typescript
pricing: [{ interval: "HOURLY", price: "" }] as { interval: string; price: string }[],
```

To:
```typescript
pricing: [{ interval: "HOURLY", pricingMode: "PER_BOOKING", price: "" }] as { interval: string; pricingMode: string; price: string }[],
```

**Step 3: Update handleSubmit pricing mapping (line 60)**

Change:
```typescript
const pricing = form.pricing.filter((p) => p.price).map((p) => ({ interval: p.interval, price: Number(p.price) }));
```

To:
```typescript
const pricing = form.pricing.filter((p) => p.price).map((p) => ({ interval: p.interval, pricingMode: p.pricingMode, price: Number(p.price) }));
```

**Step 4: Update addPricing (line 98)**

Change:
```typescript
if (next) setForm({ ...form, pricing: [...form.pricing, { interval: next.value, price: "" }] });
```

To:
```typescript
if (next) setForm({ ...form, pricing: [...form.pricing, { interval: next.value, pricingMode: "PER_BOOKING", price: "" }] });
```

**Step 5: Update updatePricing function signature (line 105)**

Change:
```typescript
const updatePricing = (idx: number, field: "interval" | "price", value: string) => {
```

To:
```typescript
const updatePricing = (idx: number, field: "interval" | "pricingMode" | "price", value: string) => {
```

**Step 6: Add pricingMode select in the pricing row UI (between interval select and price input, lines 259-263)**

After the interval `<select>` and before the price `<input>`, add:

```tsx
<select value={p.pricingMode} onChange={(e) => updatePricing(idx, "pricingMode", e.target.value)} className={`!w-36 shrink-0 ${SELECT_CLASS}`}>
  {PRICING_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
</select>
```

**Step 7: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 8: Commit**

```bash
git add apps/web/app/admin/services/new/page.tsx
git commit -m "feat: add pricingMode dropdown to admin create service page"
```

---

### Task 6: Add pricingMode dropdown to admin edit service page

**Files:**
- Modify: `apps/web/app/admin/services/[id]/page.tsx`

**Step 1: Add PRICING_MODES constant (after PRICING_INTERVALS, line 28)**

```typescript
const PRICING_MODES = [
  { value: "PER_BOOKING", label: "Per Booking" },
  { value: "PER_PERSON", label: "Per Person" },
  { value: "PER_HOUR", label: "Per Hour" },
];
```

**Step 2: Update form state pricing type (line 49)**

Change:
```typescript
pricing: [] as { interval: string; price: string }[],
```

To:
```typescript
pricing: [] as { interval: string; pricingMode: string; price: string }[],
```

**Step 3: Update fetchService pricing mapping (line 74)**

Change:
```typescript
pricing: data.pricing.map((p) => ({ interval: p.interval, price: String(p.price) })),
```

To:
```typescript
pricing: data.pricing.map((p: any) => ({ interval: p.interval, pricingMode: p.pricingMode || "PER_BOOKING", price: String(p.price) })),
```

**Step 4: Update handleSave pricing mapping (line 109)**

Change:
```typescript
pricing: form.pricing.filter((p) => p.price).map((p) => ({ interval: p.interval, price: Number(p.price) })),
```

To:
```typescript
pricing: form.pricing.filter((p) => p.price).map((p) => ({ interval: p.interval, pricingMode: p.pricingMode, price: Number(p.price) })),
```

**Step 5: Update addPricing (line 149)**

Change:
```typescript
setForm({ ...form, pricing: [...form.pricing, { interval: next.value, price: "" }] });
```

To:
```typescript
setForm({ ...form, pricing: [...form.pricing, { interval: next.value, pricingMode: "PER_BOOKING", price: "" }] });
```

**Step 6: Update updatePricing function signature (line 157)**

Change:
```typescript
const updatePricing = (idx: number, field: "interval" | "price", value: string) => {
```

To:
```typescript
const updatePricing = (idx: number, field: "interval" | "pricingMode" | "price", value: string) => {
```

**Step 7: Add pricingMode select in pricing row UI (between interval select and price input, lines 348-352)**

After the interval `<select>` and before the price `<input>`, add:

```tsx
<select value={p.pricingMode} onChange={(e) => updatePricing(idx, "pricingMode", e.target.value)} className={`!w-36 shrink-0 ${SELECT_CLASS}`}>
  {PRICING_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
</select>
```

**Step 8: Verify frontend compiles**

Run: `cd apps/web && npx tsc --noEmit`

**Step 9: Commit**

```bash
git add apps/web/app/admin/services/[id]/page.tsx
git commit -m "feat: add pricingMode dropdown to admin edit service page"
```

---

### Task 7: Run all tests and final verification

**Step 1: Run backend tests**

Run: `cd apps/api && npm test`
Expected: All 78 tests pass

**Step 2: Run frontend type check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit any fixes if needed**
