- listBranches() at line 16-22 does NOT pass sort to the API call

The backend has the sorting logic ready (BranchesService +
ListBranchesQueryDto both support sort), but it never receives
the parameter. Price sorting buttons in the sidebar do nothing.

---
Consolidated Final Report (with all agent findings)

Here's the updated complete summary, adding vendor-specific
findings from the agents:

Additional vendor page issues I didn't cover initially:

Page: /vendor/branches
Filter: Unit Type dropdown
Status: ⚠️ CLIENT-ONLY
Details: Filters branches.filter() locally after fetch. Backend
  doesn't receive it
────────────────────────────────────────
Page: /vendor/promotions
Filter: Active/Expired status
Status: ⚠️ CLIENT-ONLY
Details: Computed from validUntil/maxUses in JS. No backend
filter
────────────────────────────────────────
Page: /vendor/promotions
Filter: Search
Status: ❌ MISSING
Details: No search field at all
────────────────────────────────────────
Page: /vendor/earnings
Filter: Date range
Status: ❌ MISSING
Details: No date picker. Backend returns all-time data
────────────────────────────────────────
Page: /vendor/earnings
Filter: Branch filter
Status: ❌ MISSING
Details: No dropdown. All branches mixed
────────────────────────────────────────
Page: /vendor/reviews
Filter: All filters
Status: ❌ MISSING
Details: No search, rating filter, or branch filter
────────────────────────────────────────
Page: /vendor/addons
Filter: Search
Status: ❌ MISSING
Details: No search field
────────────────────────────────────────
Page: /vendor/addons
Filter: Active/Inactive filter
Status: ❌ MISSING
Details: Toggle works for changing status but no filter to show
  only active
────────────────────────────────────────
Page: /spaces
Filter: Sort (Price Low/High)
Status: ❌ BROKEN
Details: sort param dropped in lib/branches.ts — never reaches
  backend

Complete Tally

Category: ✅ WORKS end-to-end
Count: ~25
Items: Admin/vendor bookings search+status, admin users/vendors
  search, admin services all 4 filters, vendor search-booking all
  filters, quotation search+status, public spaces
  city+type+search, pagination everywhere
────────────────────────────────────────
Category: ❌ BROKEN (param sent, ignored)
Count: 4
Items: Home search: date/duration/people; Spaces: sort
────────────────────────────────────────
Category: ❌ BROKEN (client-only on paginated data)
Count: 2
Items: Admin branches: status filter, city filter
────────────────────────────────────────
Category: ❌ MISSING (no UI exists)
Count: 7
Items: Payments search, vendor reviews all, vendor earnings
  date/branch, vendor addons search, promotions search
────────────────────────────────────────
Category: ⚠️ CLIENT-ONLY (works but limited)
Count: 3
Items: Vendor branches unit type, promotions active/expired,
  customer bookings tabs
────────────────────────────────────────
Category: ⚠️ Incomplete
Count: 1
Items: Admin bookings status tabs missing
  REJECTED/PENDING_APPROVAL/EXPIRED
