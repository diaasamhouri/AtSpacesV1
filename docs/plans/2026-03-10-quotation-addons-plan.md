# Quotation Add-Ons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow vendors to attach add-ons from their catalog to quotations, include them in financial calculations, render them in PDFs, and transfer them to bookings on conversion.

**Architecture:** New `QuotationAddOn` Prisma model mirroring `BookingAddOn`. Add-ons are snapshots of `VendorAddOn` at creation time. They flow through create/update/serialize/PDF/convert-to-booking in the quotation service.

**Tech Stack:** Prisma, NestJS (class-validator DTOs), pdfkit, Next.js React pages, TypeScript

---

### Task 1: Prisma Schema — Add QuotationAddOn Model

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

**Step 1: Add the QuotationAddOn model after QuotationLineItem (after line 872)**

```prisma
model QuotationAddOn {
  id            String       @id @default(uuid())
  quotationId   String
  vendorAddOnId String?
  name          String
  unitPrice     Decimal      @db.Decimal(10, 3)
  quantity      Int          @default(1)
  totalPrice    Decimal      @db.Decimal(10, 3)
  serviceTime   String?
  comments      String?
  createdAt     DateTime     @default(now())

  quotation     Quotation    @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  vendorAddOn   VendorAddOn? @relation(fields: [vendorAddOnId], references: [id], onDelete: SetNull)

  @@index([quotationId])
}
```

**Step 2: Add relation to Quotation model (near line 573, after `lineItems`)**

```prisma
  addOns          QuotationAddOn[]
```

**Step 3: Add relation to VendorAddOn model (near line 837, after `bookingAddOns`)**

```prisma
  quotationAddOns QuotationAddOn[]
```

**Step 4: Run migration**

Run from `apps/api/`:
```bash
npx prisma migrate dev --name add_addons_to_quotation
```
Expected: Migration created and applied successfully.

**Step 5: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat: add QuotationAddOn model to Prisma schema"
```

---

### Task 2: Backend DTO — Add QuotationAddOnDto

**Files:**
- Modify: `apps/api/src/quotations/dto/create-quotation.dto.ts`

**Step 1: Add QuotationAddOnDto class (before CreateQuotationDto, after QuotationLineItemDto around line 41)**

```typescript
export class QuotationAddOnDto {
  @IsUUID()
  vendorAddOnId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @IsOptional()
  @IsString()
  serviceTime?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
```

Make sure `IsUUID`, `IsInt`, `Min` are imported from `class-validator` (check existing imports at top of file).

**Step 2: Add addOns field to CreateQuotationDto (after the lineItems field, around line 131)**

```typescript
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuotationAddOnDto)
  addOns?: QuotationAddOnDto[];
```

Make sure `ValidateNested` and `Type` are imported (they should already be imported for lineItems).

**Step 3: Commit**

```bash
git add apps/api/src/quotations/dto/
git commit -m "feat: add QuotationAddOnDto to create-quotation DTO"
```

---

### Task 3: Backend Service — Create Quotation with Add-Ons

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Update createQuotation method (around lines 25-73)**

After the existing quotation creation with lineItems (around line 67), add add-on handling. Inside the method, after the quotation is created but before the return:

```typescript
    // After quotation creation, create add-on records
    if (dto.addOns && dto.addOns.length > 0) {
      for (const addOn of dto.addOns) {
        const vendorAddOn = await this.prisma.vendorAddOn.findUnique({
          where: { id: addOn.vendorAddOnId },
        });
        if (vendorAddOn) {
          await this.prisma.quotationAddOn.create({
            data: {
              quotationId: quotation.id,
              vendorAddOnId: addOn.vendorAddOnId,
              name: vendorAddOn.name,
              unitPrice: vendorAddOn.unitPrice,
              quantity: addOn.quantity ?? 1,
              totalPrice: vendorAddOn.unitPrice.toNumber() * (addOn.quantity ?? 1),
              serviceTime: addOn.serviceTime,
              comments: addOn.comments,
            },
          });
        }
      }
    }
```

Also update the final `findUnique` call that fetches the quotation to include `addOns`:

Find the include block that has `lineItems: true` and add `addOns: true` next to it.

**Step 2: Run existing tests to verify no regression**

Run from `apps/api/`:
```bash
npm test -- --testPathPattern=quotations
```
Expected: All existing tests pass.

**Step 3: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "feat: handle add-ons in quotation creation"
```

---

### Task 4: Backend Service — Update Quotation with Add-Ons

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Update updateQuotation method (around lines 190-234)**

After the existing lineItems delete/recreate block (around lines 210-225), add the same pattern for addOns:

```typescript
    if (dto.addOns !== undefined) {
      await this.prisma.quotationAddOn.deleteMany({
        where: { quotationId: id },
      });

      if (dto.addOns.length > 0) {
        for (const addOn of dto.addOns) {
          const vendorAddOn = await this.prisma.vendorAddOn.findUnique({
            where: { id: addOn.vendorAddOnId },
          });
          if (vendorAddOn) {
            await this.prisma.quotationAddOn.create({
              data: {
                quotationId: id,
                vendorAddOnId: addOn.vendorAddOnId,
                name: vendorAddOn.name,
                unitPrice: vendorAddOn.unitPrice,
                quantity: addOn.quantity ?? 1,
                totalPrice: vendorAddOn.unitPrice.toNumber() * (addOn.quantity ?? 1),
                serviceTime: addOn.serviceTime,
                comments: addOn.comments,
              },
            });
          }
        }
      }
    }
```

Also update the final `findUnique` include block to include `addOns: true`.

**Step 2: Run tests**

```bash
npm test -- --testPathPattern=quotations
```

**Step 3: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "feat: handle add-ons in quotation update"
```

---

### Task 5: Backend Service — Serialize Add-Ons in Response

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Update serializeQuotation method (around lines 489-527)**

Add `addOns` to the returned object, after the `lineItems` mapping (around line 525):

```typescript
      addOns: quotation.addOns?.map((a: any) => ({
        id: a.id,
        vendorAddOnId: a.vendorAddOnId,
        name: a.name,
        unitPrice: a.unitPrice.toNumber(),
        quantity: a.quantity,
        totalPrice: a.totalPrice.toNumber(),
        serviceTime: a.serviceTime ?? null,
        comments: a.comments ?? null,
      })) ?? [],
```

**Step 2: Update all findUnique/findMany calls that include lineItems to also include addOns**

Search for `lineItems: true` in the quotations service and add `addOns: true` alongside each occurrence. This includes:
- `getQuotation` method
- `getQuotations` method (list)
- Any other find calls that include lineItems

**Step 3: Run tests**

```bash
npm test -- --testPathPattern=quotations
```

**Step 4: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "feat: serialize quotation add-ons in API response"
```

---

### Task 6: Backend Service — Convert Quotation Add-Ons to Booking Add-Ons

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Update convertToBooking method (around lines 250-299)**

After the booking is created (around line 277), before updating the quotation's bookingId, add:

```typescript
    // Transfer add-ons from quotation to booking
    const quotationWithAddOns = await this.prisma.quotation.findUnique({
      where: { id },
      include: { addOns: true },
    });

    if (quotationWithAddOns?.addOns?.length) {
      for (const addOn of quotationWithAddOns.addOns) {
        await this.prisma.bookingAddOn.create({
          data: {
            bookingId: booking.id,
            vendorAddOnId: addOn.vendorAddOnId,
            name: addOn.name,
            unitPrice: addOn.unitPrice,
            quantity: addOn.quantity,
            totalPrice: addOn.totalPrice,
            serviceTime: addOn.serviceTime,
            comments: addOn.comments,
          },
        });
      }
    }
```

**Step 2: Run tests**

```bash
npm test -- --testPathPattern=quotations
```

**Step 3: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "feat: transfer quotation add-ons to booking on conversion"
```

---

### Task 7: Backend Service — Render Add-Ons in PDF

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.ts`

**Step 1: Update generatePdf method (around lines 301-475)**

In the line items table section (around lines 413-428), after rendering lineItems, add the add-ons as additional rows in the same table:

```typescript
    // After the lineItems loop, render add-ons
    if (quotation.addOns && quotation.addOns.length > 0) {
      for (const addOn of quotation.addOns) {
        position += 20;
        if (position > 700) {
          doc.addPage();
          position = 50;
        }
        doc
          .fontSize(10)
          .text(addOn.name, col1, position)
          .text(`JOD ${addOn.unitPrice.toNumber().toFixed(3)}`, col2, position, { align: 'right', width: 70 })
          .text(String(addOn.quantity), col3, position, { align: 'right', width: 40 })
          .text(`JOD ${addOn.totalPrice.toNumber().toFixed(3)}`, col4, position, { align: 'right', width: 80 });
      }
    }
```

Also ensure the quotation query in generatePdf includes `addOns: true` in its include block (alongside `lineItems: true`).

**Step 2: Verify manually by calling the PDF endpoint for a quotation with add-ons (after full integration)**

**Step 3: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "feat: render quotation add-ons in PDF"
```

---

### Task 8: Frontend Types and API Helpers

**Files:**
- Modify: `apps/web/lib/types.ts`
- Modify: `apps/web/lib/quotations.ts`

**Step 1: Add QuotationAddOnItem type (in types.ts, after QuotationLineItem around line 516)**

```typescript
export interface QuotationAddOnItem {
  id: string;
  vendorAddOnId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  serviceTime: string | null;
  comments: string | null;
}
```

**Step 2: Add addOns to Quotation interface (around line 702, after lineItems)**

```typescript
  addOns?: QuotationAddOnItem[];
```

**Step 3: Update createQuotation in quotations.ts (around line 47, add addOns to data type)**

Add to the data parameter type:

```typescript
    addOns?: { vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[];
```

**Step 4: Update updateQuotation in quotations.ts similarly**

Add same `addOns` field to the update data parameter type.

**Step 5: Commit**

```bash
git add apps/web/lib/types.ts apps/web/lib/quotations.ts
git commit -m "feat: add QuotationAddOnItem type and API helper support"
```

---

### Task 9: Frontend — Add-On Picker in New Quotation Page

**Files:**
- Modify: `apps/web/app/vendor/quotations/new/page.tsx`

**Step 1: Add state for add-ons**

Near the existing state declarations, add:

```typescript
const [vendorAddOns, setVendorAddOns] = useState<VendorAddOn[]>([]);
const [selectedAddOns, setSelectedAddOns] = useState<{ vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[]>([]);
```

Import `VendorAddOn` from `@/lib/types` and `getVendorAddOns` from `@/lib/vendor`.

**Step 2: Fetch vendor add-ons on mount**

In the existing useEffect that fetches data (or add a new one):

```typescript
getVendorAddOns(token).then(setVendorAddOns).catch(() => {});
```

**Step 3: Add "Add-Ons" UI section in the form**

After the date entries section and before the financial summary / submit button, add an add-ons section:

```tsx
{/* Add-Ons Section */}
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-lg font-semibold mb-4">Add-Ons</h2>
  {vendorAddOns.filter(a => a.isActive).length === 0 ? (
    <p className="text-gray-500 text-sm">No add-ons available. Create add-ons in the Add-Ons page first.</p>
  ) : (
    <>
      {selectedAddOns.map((selected, idx) => {
        const addOn = vendorAddOns.find(a => a.id === selected.vendorAddOnId);
        return (
          <div key={idx} className="flex items-center gap-3 mb-3">
            <select
              className="border rounded px-3 py-2 flex-1"
              value={selected.vendorAddOnId}
              onChange={e => {
                const updated = [...selectedAddOns];
                updated[idx] = { ...updated[idx], vendorAddOnId: e.target.value };
                setSelectedAddOns(updated);
              }}
            >
              {vendorAddOns.filter(a => a.isActive).map(a => (
                <option key={a.id} value={a.id}>{a.name} — JOD {a.unitPrice.toFixed(3)}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="border rounded px-3 py-2 w-20"
              value={selected.quantity}
              onChange={e => {
                const updated = [...selectedAddOns];
                updated[idx] = { ...updated[idx], quantity: Math.max(1, parseInt(e.target.value) || 1) };
                setSelectedAddOns(updated);
              }}
              placeholder="Qty"
            />
            <span className="text-sm text-gray-600 w-28 text-right">
              JOD {((addOn?.unitPrice ?? 0) * selected.quantity).toFixed(3)}
            </span>
            <button
              type="button"
              className="text-red-500 hover:text-red-700"
              onClick={() => setSelectedAddOns(selectedAddOns.filter((_, i) => i !== idx))}
            >
              Remove
            </button>
          </div>
        );
      })}
      <button
        type="button"
        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
        onClick={() => {
          const firstActive = vendorAddOns.find(a => a.isActive);
          if (firstActive) {
            setSelectedAddOns([...selectedAddOns, { vendorAddOnId: firstActive.id, quantity: 1 }]);
          }
        }}
      >
        + Add an add-on
      </button>
    </>
  )}
</div>
```

**Step 4: Include add-on totals in subtotal calculation**

Find where the subtotal / effectiveTotal is calculated. Add the add-on totals:

```typescript
const addOnsTotal = selectedAddOns.reduce((sum, s) => {
  const addOn = vendorAddOns.find(a => a.id === s.vendorAddOnId);
  return sum + (addOn?.unitPrice ?? 0) * s.quantity;
}, 0);
```

Factor `addOnsTotal` into the subtotal before discount/tax calculations.

**Step 5: Pass add-ons in the submit handler (around lines 273-337)**

Add to the createQuotation call payload:

```typescript
addOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
```

**Step 6: Run type check**

Run from `apps/web/`:
```bash
npm run check-types
```

**Step 7: Commit**

```bash
git add apps/web/app/vendor/quotations/new/
git commit -m "feat: add-on picker in new quotation form"
```

---

### Task 10: Frontend — Display Add-Ons in Quotation Detail Page

**Files:**
- Modify: `apps/web/app/vendor/quotations/[id]/page.tsx`

**Step 1: Display add-ons in the detail view**

Find the line items table section (around lines 474-504). After it, add an add-ons section:

```tsx
{/* Add-Ons */}
{quotation.addOns && quotation.addOns.length > 0 && (
  <div className="mt-6">
    <h3 className="text-sm font-semibold text-gray-700 mb-2">Add-Ons</h3>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">Name</th>
          <th className="py-2 text-right">Unit Price</th>
          <th className="py-2 text-right">Qty</th>
          <th className="py-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {quotation.addOns.map((addOn) => (
          <tr key={addOn.id} className="border-b">
            <td className="py-2">{addOn.name}</td>
            <td className="py-2 text-right">JOD {addOn.unitPrice.toFixed(3)}</td>
            <td className="py-2 text-right">{addOn.quantity}</td>
            <td className="py-2 text-right">JOD {addOn.totalPrice.toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

**Step 2: Run type check**

```bash
cd apps/web && npm run check-types
```

**Step 3: Commit**

```bash
git add apps/web/app/vendor/quotations/
git commit -m "feat: display add-ons in quotation detail page"
```

---

### Task 11: Backend Tests — QuotationAddOn Service Tests

**Files:**
- Modify: `apps/api/src/quotations/quotations.service.spec.ts`

**Step 1: Add mock for quotationAddOn to the prisma mock**

In the existing prisma mock setup, add:

```typescript
quotationAddOn: {
  create: jest.fn(),
  deleteMany: jest.fn(),
},
```

**Step 2: Write test for creating quotation with add-ons**

```typescript
it('should create quotation with add-ons', async () => {
  // Arrange: mock vendorAddOn lookup and quotationAddOn create
  prisma.vendorAddOn.findUnique.mockResolvedValue({
    id: 'addon-1',
    name: 'Coffee Service',
    unitPrice: { toNumber: () => 5.0 },
  });
  prisma.quotationAddOn.create.mockResolvedValue({});
  // ... set up other mocks as per existing create test pattern

  // Act
  await service.createQuotation(userId, {
    ...baseDto,
    addOns: [{ vendorAddOnId: 'addon-1', quantity: 3 }],
  });

  // Assert
  expect(prisma.vendorAddOn.findUnique).toHaveBeenCalledWith({
    where: { id: 'addon-1' },
  });
  expect(prisma.quotationAddOn.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      name: 'Coffee Service',
      quantity: 3,
      totalPrice: 15.0,
    }),
  });
});
```

**Step 3: Write test for convert-to-booking transferring add-ons**

```typescript
it('should transfer add-ons when converting quotation to booking', async () => {
  // Mock quotation with addOns
  prisma.quotation.findUnique.mockResolvedValue({
    ...mockQuotation,
    addOns: [{
      id: 'qa-1',
      vendorAddOnId: 'addon-1',
      name: 'Coffee Service',
      unitPrice: { toNumber: () => 5.0 },
      quantity: 3,
      totalPrice: { toNumber: () => 15.0 },
      serviceTime: null,
      comments: null,
    }],
  });
  prisma.bookingAddOn.create.mockResolvedValue({});

  // Act
  await service.convertToBooking(id, userId);

  // Assert
  expect(prisma.bookingAddOn.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      name: 'Coffee Service',
      quantity: 3,
    }),
  });
});
```

**Step 4: Run tests**

```bash
cd apps/api && npm test -- --testPathPattern=quotations
```
Expected: All tests pass.

**Step 5: Commit**

```bash
git add apps/api/src/quotations/
git commit -m "test: add QuotationAddOn service tests"
```

---

### Task 12: Final Verification

**Step 1: Run all backend tests**

```bash
cd apps/api && npm test
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

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint and type issues for quotation add-ons"
```
