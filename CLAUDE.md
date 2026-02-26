# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AtSpaces is a coworking space booking and vendor management platform. It is a Turborepo monorepo with a Next.js 16 frontend, NestJS 11 backend, PostgreSQL, and Redis.

## Common Commands

### Root-level (Turborepo)
- `npm run dev` — start all apps in dev mode (web on :3000, api on :3001)
- `npm run build` — build all apps and packages
- `npm run lint` — lint all apps and packages
- `npm run check-types` — type-check all apps and packages
- `npm run format` — format with Prettier

### Backend (`apps/api`)
- `npm test` — run unit tests (Jest, matches `*.spec.ts`)
- `npm run test:watch` — run tests in watch mode
- `npm run test:cov` — run tests with coverage
- `npm run test:e2e` — run e2e tests (`test/jest-e2e.json` config)
- `npx prisma migrate dev` — run Prisma migrations
- `npx prisma db seed` — seed the database
- `npx prisma generate` — regenerate Prisma client

### Infrastructure
- `docker compose up -d` — start PostgreSQL (5432) and Redis (6379)

## Architecture

### Monorepo Layout
- **`apps/web`** — Next.js 16 App Router frontend (port 3000). Uses Tailwind with a custom brand palette (teal `#14b8a6`). Geist font family.
- **`apps/api`** — NestJS 11 backend (port 3001). Swagger docs at `/api/docs`. Uses Prisma for ORM and ioredis for Redis.
- **`packages/ui`** — Shared React component library (`@repo/ui`). Import as `@repo/ui/button`, `@repo/ui/card`, etc.
- **`packages/eslint-config`** — Shared ESLint configs: `@repo/eslint-config/base`, `/next-js`, `/react-internal`.
- **`packages/typescript-config`** — Shared tsconfig presets: `@repo/typescript-config/base.json`, `/nextjs.json`, `/react-library.json`.

### Data Model (Prisma — `apps/api/prisma/schema.prisma`)
- **User** — email, role (ADMIN | VENDOR | CUSTOMER)
- **VendorProfile** — belongs to User, has status (DRAFT | PENDING_APPROVAL | APPROVED | REJECTED)
- **Branch** — belongs to VendorProfile, has city (Amman | Irbid | Aqaba)

### Key Backend Details
- `RedisService` (`apps/api/src/redis.service.ts`) implements distributed locking for booking double-prevention, but is not yet wired into `AppModule`.
- Prisma seed (`apps/api/prisma/seed.ts`) creates test vendor and customer users.
- Backend Jest config is in `apps/api/package.json` (rootDir: `src`, transform: `ts-jest`).

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required by Prisma)
- `REDIS_URL` — Redis connection string (defaults to `redis://localhost:6379`)
- `PORT` — NestJS port (defaults to `3001`)

### Tooling Notes
- Package manager: npm 11.8 (workspaces in `apps/*` and `packages/*`)
- TypeScript strict mode with `noUncheckedIndexedAccess` enabled in base config
- API uses `emitDecoratorMetadata` and `experimentalDecorators` for NestJS
- Web `check-types` runs `next typegen` before `tsc --noEmit`
