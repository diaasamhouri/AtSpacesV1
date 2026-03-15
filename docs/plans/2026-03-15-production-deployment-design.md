# Production Deployment Design

**Date:** 2026-03-15
**Status:** Approved

## Architecture

```
Users -> Cloudflare CDN/DNS (atspaces.io)
           |-- atspaces.io       -> Railway (Next.js frontend)
           |-- api.atspaces.io   -> Railway (NestJS backend)
           |                         |-- Railway PostgreSQL
           |                         |-- Railway Redis
           +-- files.atspaces.io -> Cloudflare R2 (file uploads)
```

- **Frontend**: Next.js on Railway, proxied through Cloudflare CDN
- **Backend**: NestJS on Railway, api.atspaces.io subdomain
- **Database**: Railway PostgreSQL (connection_limit=20)
- **Cache/Locking**: Railway Redis
- **File Storage**: Cloudflare R2 bucket via S3-compatible SDK
- **DNS**: Cloudflare (nameservers moved from Namecheap)
- **Domain**: atspaces.io (registered on Namecheap)

## CI/CD

- Push to `main` branch -> Railway auto-deploys both services
- Development on `prod` branch -> merge to `main` when ready
- Railway deploys two services from monorepo: `apps/web` and `apps/api`

## File Upload Migration (Local Disk -> R2)

Current: Files saved to `apps/api/uploads/` on local disk.

New:
- Install `@aws-sdk/client-s3` (R2 is S3-compatible)
- Create `R2StorageService` that handles upload/delete
- Update `UploadsController` to pipe files to R2 instead of disk
- Files served via `https://files.atspaces.io` (custom domain on R2 bucket)
- Keep existing: 10MB limit, image MIME validation, UUID filenames
- Frontend image URLs change from `http://localhost:3001/uploads/xxx.png` to `https://files.atspaces.io/xxx.png`

## Production Hardening

### Security
- Global exception filter: sanitize error responses, no stack traces in production
- Environment validation at startup: fail fast if DATABASE_URL, JWT_SECRET, REDIS_URL missing
- CORS update: allow https://atspaces.io and https://api.atspaces.io

### Logging
- Winston for structured JSON logging (Railway displays JSON logs natively)
- HTTP request logging middleware (method, path, status, duration)

### Performance
- Cache-Control headers on public GET endpoints (branches, services)
- Lazy-load heavy frontend bundles (Leaflet, jsPDF, react-big-calendar)

### Deferred (not needed for soft launch)
- Refresh tokens (7-day JWT is fine initially)
- Redis query caching (DB handles early traffic)
- Liveness/readiness probes (Railway doesn't need them)

## Environment Variables

### Railway API Service
- `DATABASE_URL` — auto-injected by Railway Postgres
- `REDIS_URL` — auto-injected by Railway Redis
- `JWT_SECRET` — generate with `openssl rand -base64 32`
- `FRONTEND_URL=https://atspaces.io`
- `NODE_ENV=production`
- `PORT=3001`
- `R2_ACCOUNT_ID` — from Cloudflare dashboard
- `R2_ACCESS_KEY_ID` — from R2 API tokens
- `R2_SECRET_ACCESS_KEY` — from R2 API tokens
- `R2_BUCKET_NAME=atspaces-uploads`
- `R2_PUBLIC_URL=https://files.atspaces.io`

### Railway Web Service
- `NEXT_PUBLIC_API_URL=https://api.atspaces.io`

## Cloudflare DNS Records
- `atspaces.io` -> CNAME to Railway web service
- `api.atspaces.io` -> CNAME to Railway API service
- `files.atspaces.io` -> Custom domain on R2 bucket

## Traffic Expectations
- Soft launch: < 100 daily users
- Scale target: 1,000+ daily users
- Connection pool sized for early stage, expandable via DATABASE_URL parameter
