# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AtSpaces is a coworking space booking and vendor management platform for Jordan. Turborepo monorepo with Next.js 16 frontend, NestJS 11 backend, PostgreSQL 16, and Redis 7.

## Common Commands

### Root-level (Turborepo)
- `npm run dev` — start all apps (web :3000, api :3001)
- `npm run build` — build all apps and packages
- `npm run lint` — lint all apps and packages
- `npm run check-types` — type-check all apps and packages
- `npm run format` — format with Prettier

### Backend (`apps/api`)
- `npm test` — run unit tests (Jest, matches `*.spec.ts`)
- `npm test -- --testPathPattern=bookings` — run a single test file by name
- `npm run test:watch` — run tests in watch mode
- `npm run test:cov` — run tests with coverage
- `npm run test:e2e` — run e2e tests (`test/jest-e2e.json` config)
- `npm run start:dev` — start backend only in watch mode
- `npx prisma migrate dev` — run Prisma migrations
- `npx prisma db seed` — seed the database (uses `ts-node prisma/seed.ts`)
- `npx prisma generate` — regenerate Prisma client after schema changes

### Frontend (`apps/web`)
- `npm run dev` — start frontend only on :3000
- `npm run check-types` — runs `next typegen` then `tsc --noEmit`

### Infrastructure
- `docker compose up -d` — start PostgreSQL (5432) and Redis (6379)

## Architecture

### Monorepo Layout
- **`apps/web`** — Next.js 16 App Router frontend (port 3000). Tailwind CSS with teal brand palette (`#14b8a6`). Geist font.
- **`apps/api`** — NestJS 11 backend (port 3001). Swagger at `/api/docs`. Prisma ORM + ioredis.
- **`packages/ui`** — Shared React component library (`@repo/ui`). Import as `@repo/ui/button`, etc.
- **`packages/eslint-config`** — Shared ESLint configs.
- **`packages/typescript-config`** — Shared tsconfig presets. Base has `noUncheckedIndexedAccess: true`.

### Backend Modules (`apps/api/src/`)
Eight NestJS feature modules registered in `AppModule`:

| Module | Prefix | Purpose |
|--------|--------|---------|
| Auth | `/auth` | Email/password, phone OTP, Google OAuth, become-vendor |
| Branches | `/branches` | Public listing + vendor CRUD for locations |
| Bookings | `/bookings` | Availability check, booking creation with Redis locking, vendor approval |
| Services | `/services` | Vendor CRUD for service types and pricing |
| Vendor | `/vendor` | Dashboard stats, earnings, analytics, promos, reviews replies, calendar |
| Admin | `/admin` | Platform management: vendors, users, bookings, payments, analytics |
| Reviews | `/reviews` | Branch reviews/ratings + favorites |
| Uploads | `/uploads` | File upload (local disk at `apps/api/uploads/`, max 10MB) |

Shared services: `PrismaService` (DB), `RedisService` (distributed locking).

### Authentication & Authorization
- **JWT strategy**: Bearer token in `Authorization` header. Payload: `{ sub: userId, email, role }`.
- **Google OAuth**: Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` env vars.
- **Phone OTP**: 6-digit codes with 5-minute TTL.
- **Guards**: `JwtAuthGuard` (authentication), `RolesGuard` (role + section-level authorization).
- **Decorators**: `@Roles(Role.ADMIN)` for role checks, `@RequireSection(AdminSection.DASHBOARD)` for granular admin permissions.
- **Roles**: ADMIN, MODERATOR, ACCOUNTANT, VENDOR, CUSTOMER. Admin sections: DASHBOARD, VENDORS, BOOKINGS, PAYMENTS, BRANCHES, USERS, APPROVALS, NOTIFICATIONS, ANALYTICS.

### Data Model (Prisma — `apps/api/prisma/schema.prisma`)
Key relationships:
- **User** → role (ADMIN | MODERATOR | ACCOUNTANT | VENDOR | CUSTOMER), has Account (OAuth), Session, OtpCode
- **VendorProfile** → belongs to User (1:1), status flow: DRAFT → PENDING_APPROVAL → APPROVED | REJECTED | SUSPENDED
- **Branch** → belongs to VendorProfile, city enum (AMMAN | IRBID | AQABA), has operatingHours (JSON), amenities[], autoAcceptBookings flag
- **Service** → belongs to Branch, type enum (HOT_DESK | PRIVATE_OFFICE | MEETING_ROOM | EVENT_SPACE)
- **ServicePricing** → belongs to Service, interval enum (HOURLY | HALF_DAY | DAILY | WEEKLY | MONTHLY), price as Decimal in JOD
- **Booking** → links User, Branch, Service. Status flow: PENDING → PENDING_APPROVAL → CONFIRMED → CHECKED_IN → COMPLETED (or CANCELLED | REJECTED | NO_SHOW)
- **Payment** → belongs to Booking (1:1), method (VISA | MASTERCARD | APPLE_PAY | CASH), status (PENDING | COMPLETED | FAILED | REFUNDED)
- **Review** → User + Branch (unique pair), 1-5 rating, optional vendorReply
- **Favorite** → User + Branch (unique pair)
- **PromoCode** → belongs to VendorProfile, optional branch scope, discountPercent, maxUses/currentUses, validUntil
- **ApprovalRequest**, **Notification**, **SystemSettings**, **AdminAuditLog** for platform operations

### Frontend Architecture (`apps/web/`)
- **Auth**: React Context (`lib/auth-context.tsx`). Token stored in `localStorage.accessToken`. Auto-fetches `/auth/me` on mount, auto-logout on 401.
- **API layer**: `lib/api.ts` exports `apiFetch<T>()` generic wrapper. Domain helpers in `lib/bookings.ts`, `lib/vendor.ts`, `lib/admin.ts`, `lib/reviews.ts`. Base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).
- **Rendering**: Public pages (spaces list) use server-side rendering. Authenticated pages (vendor, admin, bookings) are client-rendered.
- **Pagination pattern**: API returns `{ data: [], meta: { page, limit, total, totalPages } }`.

Key page routes:
- `/` — Landing with hero, services, cities
- `/spaces` — Browse/filter branches (SSR)
- `/spaces/[id]` — Branch detail with services, reviews, map (Leaflet), booking modal
- `/auth/login`, `/auth/signup`, `/auth/callback` — Authentication
- `/become-vendor` — Multi-step vendor registration form
- `/vendor/*` — Vendor dashboard (stats, branches, services, bookings, earnings, promos)
- `/admin/*` — Admin dashboard (vendors, users, bookings, payments, analytics, settings)
- `/bookings`, `/bookings/[id]` — Customer bookings
- `/profile` — User profile management
- `/favorites` — Favorited branches

### Key Technical Details
- **Double-booking prevention**: `RedisService` acquires a distributed lock before creating bookings, uses Prisma `$transaction()` for atomicity.
- **Global validation pipe**: Whitelist mode with `forbidNonWhitelisted` and `transform` enabled — unknown DTO fields are stripped and rejected.
- **CORS**: Configured via `FRONTEND_URL` env var (defaults to `http://localhost:3000`).
- Backend Jest config is in `apps/api/package.json` (rootDir: `src`, transform: `ts-jest`).
- Web `check-types` runs `next typegen` before `tsc --noEmit`.
- Package manager: npm 11.8, workspaces in `apps/*` and `packages/*`.
- API uses `emitDecoratorMetadata` and `experimentalDecorators` for NestJS DI.

### Environment Variables

**Backend** (`apps/api`):
- `DATABASE_URL` — PostgreSQL connection (required by Prisma)
- `REDIS_URL` — Redis connection (default: `redis://localhost:6379`)
- `PORT` — NestJS port (default: `3001`)
- `JWT_SECRET` — Secret for signing JWTs
- `JWT_EXPIRES_IN` — Token TTL (default: `7d`)
- `FRONTEND_URL` — CORS origin (default: `http://localhost:3000`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` — Google OAuth (optional)

**Frontend** (`apps/web`):
- `NEXT_PUBLIC_API_URL` — Backend URL (default: `http://localhost:3001`)
