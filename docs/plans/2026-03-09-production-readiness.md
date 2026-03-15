# Production Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make AtSpaces production-ready by fixing all security vulnerabilities, adding infrastructure, fixing performance bottlenecks, and polishing the frontend.

**Architecture:** Four phases in priority order — security fixes first (hard blockers), then infrastructure (deployment enablers), then performance (scalability), then frontend polish (UX). Each task is self-contained.

**Tech Stack:** NestJS 11, Prisma, Next.js 16, Docker, GitHub Actions, helmet, @nestjs/throttler

---

## Phase 1: Security

### Task 1: Install helmet for security headers

**Files:**
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/package.json` (via npm install)

**Step 1: Install helmet**

Run: `cd apps/api && npm install helmet`

**Step 2: Add helmet to main.ts**

In `apps/api/src/main.ts`, add import and use after app creation:

```typescript
import helmet from 'helmet';
```

After `const app = await NestFactory.create(AppModule);`, add:

```typescript
app.use(helmet());
```

**Step 3: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 4: Commit**

```bash
git add apps/api/src/main.ts apps/api/package.json apps/api/package-lock.json
git commit -m "feat(security): add helmet for HTTP security headers"
```

---

### Task 2: Fix file upload path traversal vulnerability

**Files:**
- Modify: `apps/api/src/uploads/uploads.controller.ts`

**Step 1: Sanitize filename in serveFile**

In `apps/api/src/uploads/uploads.controller.ts`, update the `serveFile` method. The current code at line 78 takes the raw filename param and joins it to UPLOAD_DIR — an attacker could use `../../etc/passwd` to read arbitrary files.

Add path validation:

```typescript
import { basename } from 'path';

// In serveFile method, replace the filename usage:
serveFile(@Param('filename') filename: string, @Res() res: Response) {
    // Sanitize: strip any directory traversal, only keep the base filename
    const safeName = basename(filename);
    if (safeName !== filename || safeName.includes('..')) {
        throw new BadRequestException('Invalid filename');
    }
    const filePath = join(UPLOAD_DIR, safeName);
    if (!existsSync(filePath)) {
        throw new BadRequestException('File not found');
    }
    return res.sendFile(filePath);
}
```

**Step 2: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 3: Commit**

```bash
git add apps/api/src/uploads/uploads.controller.ts
git commit -m "fix(security): prevent path traversal in file upload serving"
```

---

### Task 3: Add rate limiting

**Files:**
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/package.json` (via npm install)

**Step 1: Install throttler**

Run: `cd apps/api && npm install @nestjs/throttler`

**Step 2: Add ThrottlerModule to AppModule**

In `apps/api/src/app.module.ts`, add to imports:

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 minute window
      limit: 100,   // 100 requests per minute per IP (general)
    }]),
    // ... existing imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... existing providers
  ],
})
```

**Step 3: Add stricter limits on auth endpoints**

In `apps/api/src/auth/auth.controller.ts`, add tighter rate limits on sensitive endpoints:

```typescript
import { Throttle } from '@nestjs/throttler';

// On login endpoint:
@Throttle([{ default: { ttl: 60000, limit: 5 } }])
@Post('login/email')

// On OTP send:
@Throttle([{ default: { ttl: 60000, limit: 3 } }])
@Post('otp/send')

// On OTP verify:
@Throttle([{ default: { ttl: 60000, limit: 5 } }])
@Post('otp/verify')
```

**Step 4: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 5: Commit**

```bash
git add apps/api/src/main.ts apps/api/src/app.module.ts apps/api/src/auth/auth.controller.ts apps/api/package.json apps/api/package-lock.json
git commit -m "feat(security): add rate limiting with stricter auth endpoint limits"
```

---

### Task 4: Replace custom card inputs with payment notice

**Files:**
- Modify: `apps/web/app/components/booking-modal.tsx`

**Step 1: Read the booking modal**

Read `apps/web/app/components/booking-modal.tsx` fully. Find the card input section (card number, expiry, CVV, cardholder name inputs around lines 936-1013).

**Step 2: Replace card inputs with payment gateway placeholder**

Remove the card number, expiry, CVV, and cardholder name input fields. Replace with a notice that payment will be processed via a payment gateway:

```tsx
{requiresCardDetails && (
  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-center">
    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
      Online payment processing will be available soon.
    </p>
    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
      Please select Cash as payment method, or contact the vendor directly.
    </p>
  </div>
)}
```

Also remove the card-related state variables (`cardNumber`, `cardExpiry`, `cardCvv`, `cardName`) and their validation logic.

Keep the payment method selection (VISA, MASTERCARD, APPLE_PAY, CASH) but disable VISA/MASTERCARD/APPLE_PAY options or default to CASH.

**Step 3: Verify**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/app/components/booking-modal.tsx
git commit -m "fix(security): replace custom card inputs with payment gateway placeholder"
```

---

### Task 5: Generate production JWT_SECRET reminder

**Files:**
- Modify: `apps/api/.env.example`

**Step 1: Update .env.example with clear instructions**

In `apps/api/.env.example`, update the JWT_SECRET line:

```
# IMPORTANT: Generate a real secret for production. Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="CHANGE_ME_TO_A_RANDOM_SECRET_IN_PRODUCTION"
```

**Step 2: Add startup validation for JWT_SECRET**

In `apps/api/src/main.ts`, add before app.listen:

```typescript
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'CHANGE_ME_TO_A_RANDOM_SECRET_IN_PRODUCTION') {
  console.warn('⚠️  WARNING: JWT_SECRET is not set or is using the default placeholder. Set a real secret before deploying to production.');
}
```

**Step 3: Commit**

```bash
git add apps/api/.env.example apps/api/src/main.ts
git commit -m "feat(security): add JWT_SECRET validation warning on startup"
```

---

## Phase 2: Infrastructure

### Task 6: Add health check endpoint

**Files:**
- Modify: `apps/api/src/app.controller.ts`
- Modify: `apps/api/src/app.service.ts`

**Step 1: Add health endpoint to controller**

In `apps/api/src/app.controller.ts`, add a `/health` GET endpoint:

```typescript
@Get('health')
@ApiOperation({ summary: 'Health check' })
health() {
  return this.appService.healthCheck();
}
```

**Step 2: Add health check logic to service**

In `apps/api/src/app.service.ts`, add:

```typescript
async healthCheck() {
  const checks: Record<string, string> = { status: 'ok' };

  try {
    await this.prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    checks.status = 'degraded';
  }

  try {
    await this.redis.getClient().ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
    checks.status = 'degraded';
  }

  return checks;
}
```

Inject PrismaService and RedisService into AppService constructor.

**Step 3: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 4: Commit**

```bash
git add apps/api/src/app.controller.ts apps/api/src/app.service.ts
git commit -m "feat: add /health endpoint with database and Redis checks"
```

---

### Task 7: Create Dockerfiles for both apps

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`

**Step 1: Create API Dockerfile**

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/
RUN npm ci --workspace=apps/api

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN cd apps/api && npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**Step 2: Create Web Dockerfile**

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/
RUN npm ci --workspace=apps/web

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=apps/web

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

**Step 3: Add `.dockerignore`**

Create `.dockerignore` at repo root:

```
node_modules
.next
dist
.git
*.md
.env
.env.*
```

**Step 4: Create production docker-compose**

Create `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-atspaces}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-atspaces}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-atspaces}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:?Set REDIS_PASSWORD} --appendonly yes
    volumes:
      - redisdata:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER:-atspaces}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-atspaces}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET:?Set JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL:?Set FRONTEND_URL}
      PORT: 3001
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${API_PUBLIC_URL:?Set API_PUBLIC_URL}
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

**Step 5: Commit**

```bash
git add apps/api/Dockerfile apps/web/Dockerfile .dockerignore docker-compose.prod.yml
git commit -m "feat(infra): add Dockerfiles and production docker-compose"
```

---

### Task 8: Add CI/CD pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: atspaces_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: cd apps/api && npx prisma generate
      - run: cd apps/api && npx tsc --noEmit
      - run: cd apps/api && npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/atspaces_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ci-test-secret

  check-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: cd apps/web && npx tsc --noEmit
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat(infra): add CI pipeline with backend tests and frontend type checking"
```

---

### Task 9: Add Redis error handling and graceful shutdown

**Files:**
- Modify: `apps/api/src/redis/redis.service.ts`

**Step 1: Read the current redis service**

Read `apps/api/src/redis/redis.service.ts` fully.

**Step 2: Add connection error handling and retry logic**

Update the `onModuleInit` to handle connection errors:

```typescript
onModuleInit() {
  const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
  this.redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
    lazyConnect: false,
  });

  this.redisClient.on('error', (err) => {
    this.logger.error(`Redis connection error: ${err.message}`);
  });

  this.redisClient.on('connect', () => {
    this.logger.log('Redis connected');
  });
}

async onModuleDestroy() {
  if (this.redisClient) {
    await this.redisClient.quit();
  }
}
```

Also add a `getClient()` method if it doesn't exist (needed by health check):

```typescript
getClient(): Redis {
  return this.redisClient;
}
```

**Step 3: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 4: Commit**

```bash
git add apps/api/src/redis/redis.service.ts
git commit -m "fix(infra): add Redis error handling, retry logic, and graceful shutdown"
```

---

## Phase 3: Performance

### Task 10: Fix N+1 query in searchAvailable

**Files:**
- Modify: `apps/api/src/bookings/bookings.service.ts`

**Step 1: Read the searchAvailable method**

Read `apps/api/src/bookings/bookings.service.ts`, find the `searchAvailable` method (around line 759). The current implementation loops over services and dates, making a separate `booking.count` query per service per date.

**Step 2: Replace N+1 with single batched query**

Instead of:
```typescript
for (const service of filteredServices) {
  for (const dateStr of datesToCheck) {
    const bookingCount = await this.prisma.booking.count({ ... });
  }
}
```

Use a single `groupBy` query to get all booking counts at once:

```typescript
// Get all booking counts in ONE query
const bookingCounts = await this.prisma.booking.groupBy({
  by: ['serviceId'],
  where: {
    serviceId: { in: filteredServices.map(s => s.id) },
    status: { in: ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'] },
    OR: datesToCheck.map(dateStr => {
      const dayStart = new Date(`${dateStr}T${query.startTime || '00:00'}`);
      const dayEnd = new Date(`${dateStr}T${query.endTime || '23:59'}`);
      return { startTime: { lt: dayEnd }, endTime: { gt: dayStart } };
    }),
  },
  _count: { id: true },
});

// Build a lookup map
const countMap = new Map(bookingCounts.map(bc => [bc.serviceId, bc._count.id]));

// Filter services by availability
const available = filteredServices.filter(service => {
  const booked = countMap.get(service.id) || 0;
  const capacity = service.capacity || 1;
  return booked < capacity;
});
```

This replaces 70+ queries with 1 query.

**Step 3: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 4: Commit**

```bash
git add apps/api/src/bookings/bookings.service.ts
git commit -m "perf: fix N+1 query in searchAvailable — 70+ queries reduced to 1"
```

---

### Task 11: Add pagination to unbounded queries

**Files:**
- Modify: `apps/api/src/vendor/vendor.service.ts`
- Modify: `apps/api/src/admin/admin.service.ts`

**Step 1: Fix vendor service unbounded queries**

In `apps/api/src/vendor/vendor.service.ts`, find these unbounded `findMany` calls and add limits:

a) `getEarnings` (around line 297): Add `take: 500` to payment query and paginate if needed. Or add date range filtering.

b) Calendar/day-view queries (around lines 519, 560): Add `take: 1000` to booking queries.

c) Reviews query (around line 440): Add `take: 50` limit.

**Step 2: Fix admin broadcast notification**

In `apps/api/src/admin/admin.service.ts`, find the broadcast notification method (around line 803). Replace the single batch with chunked batching:

```typescript
// Instead of loading ALL users at once:
const batchSize = 1000;
let skip = 0;
let hasMore = true;

while (hasMore) {
  const users = await this.prisma.user.findMany({
    select: { id: true },
    take: batchSize,
    skip,
  });

  if (users.length === 0) {
    hasMore = false;
    break;
  }

  await this.prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      type: data.type || 'GENERAL',
      title: data.title,
      message: data.message,
    })),
  });

  skip += batchSize;
  if (users.length < batchSize) hasMore = false;
}
```

**Step 3: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 4: Commit**

```bash
git add apps/api/src/vendor/vendor.service.ts apps/api/src/admin/admin.service.ts
git commit -m "perf: add pagination to unbounded queries, chunk broadcast notifications"
```

---

### Task 12: Add missing database indexes

**Files:**
- Create: new Prisma migration

**Step 1: Add composite indexes to schema.prisma**

In `apps/api/prisma/schema.prisma`, add these missing indexes:

On the **Booking** model (after existing indexes):
```prisma
@@index([branchId, status, startTime])
@@index([status, createdAt])
```

On the **Branch** model:
```prisma
@@index([vendorProfileId, status])
```

On the **Notification** model (add to existing):
```prisma
@@index([userId, isRead, createdAt])
```

On the **Payment** model:
```prisma
@@index([status, createdAt])
```

**Step 2: Generate migration**

Run: `cd apps/api && npx prisma migrate dev --name add_composite_indexes`

**Step 3: Verify**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "perf: add composite database indexes for common query patterns"
```

---

### Task 13: Configure Prisma connection pooling

**Files:**
- Modify: `apps/api/.env.example`

**Step 1: Update .env.example with connection pool settings**

Update the DATABASE_URL in `apps/api/.env.example`:

```
# Add ?connection_limit=20&pool_timeout=30 for production
DATABASE_URL="postgresql://postgres:password@localhost:5432/atspaces?connection_limit=20&pool_timeout=30"
```

**Step 2: Document in .env.example**

Add a comment:
```
# Connection pool: connection_limit controls max connections per Prisma instance
# For production with multiple replicas, calculate: total_db_connections / num_instances
# Default PostgreSQL max_connections is 100, so with 4 instances: connection_limit=20
```

**Step 3: Commit**

```bash
git add apps/api/.env.example
git commit -m "feat(perf): document connection pool configuration in .env.example"
```

---

## Phase 4: Frontend Polish

### Task 14: Add error boundaries

**Files:**
- Create: `apps/web/app/error.tsx`
- Create: `apps/web/app/vendor/error.tsx`
- Create: `apps/web/app/admin/error.tsx`

**Step 1: Create global error boundary**

Create `apps/web/app/error.tsx`:

```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Create vendor error boundary**

Create `apps/web/app/vendor/error.tsx` with the same pattern but with a "Back to Dashboard" link.

**Step 3: Create admin error boundary**

Create `apps/web/app/admin/error.tsx` — same pattern with "Back to Admin Dashboard" link.

**Step 4: Verify**

Run: `cd apps/web && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add apps/web/app/error.tsx apps/web/app/vendor/error.tsx apps/web/app/admin/error.tsx
git commit -m "feat: add error boundaries for global, vendor, and admin routes"
```

---

### Task 15: Add loading skeletons

**Files:**
- Create: `apps/web/app/loading.tsx`
- Create: `apps/web/app/spaces/loading.tsx`
- Create: `apps/web/app/vendor/loading.tsx`
- Create: `apps/web/app/admin/loading.tsx`

**Step 1: Create loading skeletons**

Each loading.tsx shows a skeleton UI appropriate for its section. Example for global:

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

For `/spaces/loading.tsx` — show card grid skeleton.
For `/vendor/loading.tsx` — show dashboard skeleton with stat cards.
For `/admin/loading.tsx` — show admin dashboard skeleton.

**Step 2: Verify**

Run: `cd apps/web && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add apps/web/app/loading.tsx apps/web/app/spaces/loading.tsx apps/web/app/vendor/loading.tsx apps/web/app/admin/loading.tsx
git commit -m "feat: add loading skeletons for main routes"
```

---

### Task 16: Fix accessibility — form labels

**Files:**
- Modify: `apps/web/app/auth/login/page.tsx`
- Modify: `apps/web/app/auth/signup/page.tsx`
- Modify: `apps/web/app/components/filter-sidebar.tsx`

**Step 1: Read each file and find unlabeled inputs**

**Step 2: Add proper labels**

For login/signup pages, wrap inputs with `<label>` tags or add `aria-label` attributes:

```tsx
<label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
  Email address
</label>
<input id="email" type="email" ... />
```

For filter-sidebar buttons, add `aria-label`:

```tsx
<button aria-label={`Filter by ${city}`} ...>
```

**Step 3: Verify**

Run: `cd apps/web && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add apps/web/app/auth/login/page.tsx apps/web/app/auth/signup/page.tsx apps/web/app/components/filter-sidebar.tsx
git commit -m "fix(a11y): add form labels and aria attributes for screen readers"
```

---

### Task 17: Final verification

**Step 1: Run all backend checks**

Run: `cd apps/api && npx tsc --noEmit && npm test`

**Step 2: Run frontend checks**

Run: `cd apps/web && npx tsc --noEmit`

**Step 3: Run full build**

Run: `npm run build`

**Step 4: Test Docker build (if Docker available)**

Run: `docker compose -f docker-compose.prod.yml build`

---

## Summary

| Phase | Tasks | What it fixes |
|-------|-------|---------------|
| 1: Security | Tasks 1-5 | Helmet headers, path traversal, rate limiting, card inputs, JWT validation |
| 2: Infrastructure | Tasks 6-9 | Health check, Dockerfiles, CI/CD, Redis resilience |
| 3: Performance | Tasks 10-13 | N+1 queries, unbounded fetches, indexes, connection pooling |
| 4: Frontend | Tasks 14-17 | Error boundaries, loading skeletons, accessibility, final verification |
