# Phase 3: Booking Flow — Implementation Plan

## Overview

Build the end-to-end booking flow: customer selects a service on a space detail page, picks date/time/people, sees price calculation, chooses payment method, and confirms. Includes auth context so the frontend knows who's logged in, and Redis-based double-booking prevention on the backend.

## Prerequisite: Frontend Auth Context

The current frontend has no way to know if the user is logged in (token sits in localStorage but is never read). We need a lightweight auth provider before building any booking UI.

---

## Files to Create/Modify

### Backend (apps/api)

#### New files:
1. **`src/bookings/dto/create-booking.dto.ts`** — Validates: serviceId, startTime, endTime, numberOfPeople, pricingInterval, paymentMethod, notes?
2. **`src/bookings/dto/booking-response.dto.ts`** — Response DTOs for single booking and list
3. **`src/bookings/dto/index.ts`** — Barrel export
4. **`src/bookings/bookings.service.ts`** — Core logic:
   - `createBooking(userId, dto)` — Validates service exists & is active, checks capacity (count overlapping bookings), uses Redis lock during creation, calculates price from ServicePricing, creates Booking + Payment in a transaction
   - `getUserBookings(userId)` — List user's bookings with branch/service info
   - `getBookingById(bookingId, userId)` — Single booking detail
   - `cancelBooking(bookingId, userId)` — Set status to CANCELLED (only if PENDING/CONFIRMED)
5. **`src/bookings/bookings.controller.ts`** — All endpoints require `@UseGuards(JwtAuthGuard)`:
   - `POST /bookings` — Create booking
   - `GET /bookings` — List my bookings
   - `GET /bookings/:id` — Get booking detail
   - `PATCH /bookings/:id/cancel` — Cancel booking
   - `GET /bookings/check-availability` — Check if a service has capacity for a time range
6. **`src/bookings/bookings.module.ts`** — Imports PrismaModule, RedisModule

#### Modified files:
7. **`src/app.module.ts`** — Add `BookingsModule` to imports

### Frontend (apps/web)

#### New files:
8. **`lib/auth-context.tsx`** — React context provider:
   - Reads `accessToken` from localStorage on mount
   - Calls `GET /auth/me` to get user profile
   - Exposes `{ user, token, isLoading, login, logout }`
   - `login(token)` stores token + fetches profile
   - `logout()` clears token + state
9. **`lib/bookings.ts`** — API functions (authenticated):
   - `createBooking(token, data)` — POST /bookings
   - `getMyBookings(token)` — GET /bookings
   - `getBooking(token, id)` — GET /bookings/:id
   - `cancelBooking(token, id)` — PATCH /bookings/:id/cancel
   - `checkAvailability(serviceId, start, end)` — GET /bookings/check-availability
10. **`app/components/booking-modal.tsx`** — Multi-step booking modal:
    - Step 1: Select service + pricing interval
    - Step 2: Pick date + time + number of people (availability check)
    - Step 3: Review price + choose payment method + confirm
    - Shows loading/success/error states
11. **`app/components/auth-provider.tsx`** — Client component wrapper that provides AuthContext

#### Modified files:
12. **`app/layout.tsx`** — Wrap children with `<AuthProvider>`
13. **`app/components/navbar.tsx`** — Show user name + logout when logged in (instead of Login/Signup)
14. **`app/auth/login/page.tsx`** — Wire up the login form to actually call the API and store token
15. **`app/auth/signup/page.tsx`** — Wire up the signup form similarly
16. **`app/spaces/[id]/page.tsx`** — Replace "Sign in to book" link with a client component that opens the booking modal (or redirects to login if not authenticated)
17. **`lib/types.ts`** — Add booking-related types (BookingStatus, PaymentMethod, Booking, etc.)
18. **`lib/format.ts`** — Add `formatBookingStatus`, `formatPaymentMethod`

---

## Implementation Order (Tasks)

### Task 1: Backend — Booking DTOs
Create `create-booking.dto.ts`, `booking-response.dto.ts`, `index.ts` barrel.

### Task 2: Backend — Bookings Service
Create `bookings.service.ts` with:
- Price calculation from ServicePricing based on interval
- Capacity checking (count overlapping PENDING/CONFIRMED/CHECKED_IN bookings)
- Redis lock during booking creation to prevent double-booking
- Prisma transaction for Booking + Payment creation
- getUserBookings, getBookingById, cancelBooking
- checkAvailability query

### Task 3: Backend — Bookings Controller + Module
Create controller (all endpoints behind JwtAuthGuard), module, and register in AppModule.

### Task 4: Frontend — Auth Context + Provider
Create `auth-context.tsx` with AuthContext, `auth-provider.tsx` wrapper. Update `layout.tsx` to wrap with AuthProvider.

### Task 5: Frontend — Wire Login/Signup Forms
Make login page call POST /auth/login/email, store token, redirect. Same for signup with POST /auth/signup/email.

### Task 6: Frontend — Update Navbar for Auth State
Show user avatar/name + dropdown with logout when authenticated. Keep Login/Signup for unauthenticated.

### Task 7: Frontend — Booking Types + API Functions
Add booking types to `lib/types.ts`, formatters to `lib/format.ts`, API functions to `lib/bookings.ts`.

### Task 8: Frontend — Booking Modal Component
Build the multi-step modal with service selection, date/time picker, price review, payment method selector, and confirmation.

### Task 9: Frontend — Integrate Booking into Space Detail
Add a client component on the detail page that checks auth state and either opens the booking modal or redirects to login. Replace the static "Sign in to book" button.

### Task 10: Verify — Type-check + lint + test

---

## Key Design Decisions

1. **Price calculation on backend** — The frontend shows the estimated price, but the authoritative calculation happens server-side using ServicePricing records. Prevents price tampering.

2. **Redis lock scope** — Lock key is `booking:${serviceId}:${startTime}:${endTime}` with 30s TTL. Prevents two users booking the same slot simultaneously.

3. **Capacity check** — For each service, count overlapping bookings where status is PENDING, CONFIRMED, or CHECKED_IN. If count >= service.capacity, reject.

4. **Payment is simulated** — No real payment gateway integration. We create a Payment record with status COMPLETED for card methods (VISA, MASTERCARD, APPLE_PAY) and PENDING for CASH. Real gateway integration would be Phase 7.

5. **Auth context is client-side only** — Uses localStorage + `GET /auth/me`. Server components that need auth data should receive it from client component props.

6. **Booking modal, not page** — Keeps the user on the space detail page for a smoother UX. Uses a dialog/modal overlay.
