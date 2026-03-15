# Production Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make AtSpaces production-ready and deployable via Railway + Cloudflare R2 + Cloudflare CDN/DNS.

**Architecture:** Frontend (Next.js) and Backend (NestJS) both deploy on Railway from GitHub `main` branch. File uploads go to Cloudflare R2 via S3-compatible SDK. Cloudflare handles DNS and CDN for `atspaces.io`, `api.atspaces.io`, and `files.atspaces.io`.

**Tech Stack:** NestJS 11, Next.js 16, Railway, Cloudflare R2 (`@aws-sdk/client-s3`), Winston logging, Cloudflare DNS.

---

## Task 1: R2 Storage Service

**Files:**
- Create: `apps/api/src/storage/storage.service.ts`
- Create: `apps/api/src/storage/storage.module.ts`

**Step 1: Install the S3 SDK**

```bash
cd apps/api && npm install @aws-sdk/client-s3
```

**Step 2: Create StorageModule and StorageService**

Create `apps/api/src/storage/storage.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';

@Global()
@Module({
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule {}
```

Create `apps/api/src/storage/storage.service.ts`:

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private s3: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor(private config: ConfigService) {}

    onModuleInit() {
        const accountId = this.config.get<string>('R2_ACCOUNT_ID');
        this.bucket = this.config.get<string>('R2_BUCKET_NAME') || 'atspaces-uploads';
        this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') || '';

        if (!accountId) {
            this.logger.warn('R2_ACCOUNT_ID not set — uploads will fail in production');
            return;
        }

        this.s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID') || '',
                secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY') || '',
            },
        });
        this.logger.log('R2 storage client initialized');
    }

    async upload(file: Express.Multer.File): Promise<{ key: string; url: string }> {
        const key = `${uuid()}${extname(file.originalname)}`;
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        return {
            key,
            url: this.publicUrl ? `${this.publicUrl}/${key}` : key,
        };
    }

    async delete(key: string): Promise<void> {
        await this.s3.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }

    isConfigured(): boolean {
        return !!this.s3;
    }
}
```

**Step 3: Register StorageModule in AppModule**

Modify `apps/api/src/app.module.ts` — add `StorageModule` to imports array (after `RedisModule`).

**Step 4: Commit**

```bash
git add apps/api/src/storage/ apps/api/package.json apps/api/package-lock.json apps/api/src/app.module.ts
git commit -m "feat: add R2 storage service with S3-compatible SDK"
```

---

## Task 2: Rewrite UploadsController to Use R2

**Files:**
- Modify: `apps/api/src/uploads/uploads.controller.ts` (full rewrite)
- Modify: `apps/api/src/uploads/uploads.module.ts`

**Step 1: Rewrite uploads controller**

Replace entire `apps/api/src/uploads/uploads.controller.ts` with:

```typescript
import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly storage: StorageService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Upload a file (images only)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(
                        new BadRequestException('Only image files are allowed'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        const result = await this.storage.upload(file);
        return {
            url: result.url,
            filename: result.key,
            originalName: file.originalname,
            size: file.size,
        };
    }
}
```

Key changes:
- `diskStorage` → `memoryStorage()` (file stays in memory buffer, sent to R2)
- Inject `StorageService` and call `storage.upload(file)`
- Remove `serveFile` GET endpoint (R2 serves files directly via `files.atspaces.io`)
- Remove `fs`, `path` imports and `UPLOAD_DIR` setup

**Step 2: Update UploadsModule to import StorageModule**

`apps/api/src/uploads/uploads.module.ts` — StorageModule is @Global so no import needed, but add StorageService to the controller constructor (already done above).

**Step 3: Update frontend image URL handling**

The profile page (`apps/web/app/profile/page.tsx:72`) currently prepends the API base URL:
```typescript
const imageUrl = `${API_BASE_URL_UPLOAD}${uploadData.url}`;
```

Now `uploadData.url` will be a full R2 URL (e.g., `https://files.atspaces.io/abc.png`), so change to:
```typescript
const imageUrl = uploadData.url;
```

The become-vendor page (`apps/web/app/become-vendor/page.tsx:203`) stores `data.url` directly — this will now be the full R2 URL, which is correct.

**Step 4: Run tests to verify nothing breaks**

```bash
cd apps/api && npm test
cd ../web && npm run check-types
```

**Step 5: Commit**

```bash
git add apps/api/src/uploads/ apps/web/app/profile/page.tsx
git commit -m "feat: rewrite uploads to use R2 storage instead of local disk"
```

---

## Task 3: Global Exception Filter

**Files:**
- Create: `apps/api/src/common/filters/http-exception.filter.ts`
- Modify: `apps/api/src/main.ts:8`

**Step 1: Create the filter**

Create `apps/api/src/common/filters/http-exception.filter.ts`:

```typescript
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'string' ? res : (res as any).message || message;
        } else {
            this.logger.error(
                'Unhandled exception',
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
                ? { stack: exception.stack }
                : {}),
        });
    }
}
```

**Step 2: Register in main.ts**

In `apps/api/src/main.ts`, after line 8 (`const app = ...`), add:

```typescript
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
// ... after app creation:
app.useGlobalFilters(new GlobalExceptionFilter());
```

**Step 3: Commit**

```bash
git add apps/api/src/common/filters/ apps/api/src/main.ts
git commit -m "feat: add global exception filter to sanitize errors in production"
```

---

## Task 4: Environment Validation at Startup

**Files:**
- Modify: `apps/api/src/main.ts`

**Step 1: Add validation before bootstrap**

At the top of the `bootstrap()` function in `apps/api/src/main.ts`, add:

```typescript
// Validate critical environment variables
const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'];
if (process.env.NODE_ENV === 'production') {
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}
```

**Step 2: Update CORS to support multiple origins**

Replace the CORS config in `apps/api/src/main.ts:14-17`:

```typescript
app.enableCors({
    origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
        : 'http://localhost:3000',
    credentials: true,
});
```

This allows `FRONTEND_URL=https://atspaces.io,https://www.atspaces.io` for multiple origins.

**Step 3: Commit**

```bash
git add apps/api/src/main.ts
git commit -m "feat: add env validation at startup and multi-origin CORS"
```

---

## Task 5: Structured Logging with Winston

**Files:**
- Create: `apps/api/src/common/logger/winston.config.ts`
- Create: `apps/api/src/common/middleware/request-logger.middleware.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Install Winston**

```bash
cd apps/api && npm install nest-winston winston
```

**Step 2: Create Winston config**

Create `apps/api/src/common/logger/winston.config.ts`:

```typescript
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig: WinstonModuleOptions = {
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                )
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        const ctx = context ? `[${context}]` : '';
                        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                        return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                    }),
                ),
        }),
    ],
};
```

**Step 3: Create request logging middleware**

Create `apps/api/src/common/middleware/request-logger.middleware.ts`:

```typescript
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const { method, originalUrl } = req;
            const { statusCode } = res;
            if (originalUrl === '/health') return; // skip health check noise
            this.logger.log(`${method} ${originalUrl} ${statusCode} ${duration}ms`);
        });
        next();
    }
}
```

**Step 4: Wire into main.ts and app.module.ts**

In `apps/api/src/main.ts`, replace `NestFactory.create(AppModule)` with:

```typescript
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
});
```

In `apps/api/src/app.module.ts`, add the middleware:

```typescript
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    }
}
```

**Step 5: Run tests**

```bash
cd apps/api && npm test
```

**Step 6: Commit**

```bash
git add apps/api/src/common/logger/ apps/api/src/common/middleware/ apps/api/src/main.ts apps/api/src/app.module.ts apps/api/package.json apps/api/package-lock.json
git commit -m "feat: add Winston structured logging and HTTP request logger"
```

---

## Task 6: Cache-Control Headers on Public Endpoints

**Files:**
- Create: `apps/api/src/common/decorators/cache-header.decorator.ts`
- Modify: `apps/api/src/branches/branches.controller.ts` (GET endpoints)

**Step 1: Create CacheHeader decorator**

Create `apps/api/src/common/decorators/cache-header.decorator.ts`:

```typescript
import { SetMetadata, applyDecorators, UseInterceptors, CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Response } from 'express';

@Injectable()
export class CacheHeaderInterceptor implements NestInterceptor {
    constructor(private maxAge: number) {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            tap(() => {
                const res = context.switchToHttp().getResponse<Response>();
                res.setHeader('Cache-Control', `public, max-age=${this.maxAge}, s-maxage=${this.maxAge}`);
            }),
        );
    }
}

export function CachePublic(maxAgeSeconds = 60) {
    return UseInterceptors(new CacheHeaderInterceptor(maxAgeSeconds));
}
```

**Step 2: Apply to public branch/service list endpoints**

In `apps/api/src/branches/branches.controller.ts`, add `@CachePublic(60)` to:
- `listBranches()` — public listing, 60s cache
- `getBranchById()` — branch detail, 60s cache

**Step 3: Commit**

```bash
git add apps/api/src/common/decorators/ apps/api/src/branches/branches.controller.ts
git commit -m "feat: add Cache-Control headers on public GET endpoints"
```

---

## Task 7: Lazy-Load Heavy Frontend Bundles

**Files:**
- Modify: `apps/web/app/components/map-display.tsx` (dynamic import)
- Modify: `apps/web/app/vendor/quotations/[id]/page.tsx` (dynamic jsPDF import)

**Step 1: Lazy-load Leaflet map**

In `apps/web/app/components/map-display.tsx`, if not already dynamically imported, wrap the Leaflet component:

```typescript
import dynamic from 'next/dynamic';

const MapDisplay = dynamic(() => import('./map-display-inner'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
});
```

Or if the component itself imports Leaflet, use `next/dynamic` with `ssr: false` where it's consumed (e.g., in `apps/web/app/spaces/[id]/page.tsx`).

**Step 2: Lazy-load jsPDF**

In quotation PDF export, use dynamic import:

```typescript
const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    // ... rest of PDF generation
};
```

**Step 3: Verify build**

```bash
cd apps/web && npm run check-types
```

**Step 4: Commit**

```bash
git add apps/web/
git commit -m "perf: lazy-load Leaflet and jsPDF to reduce initial bundle size"
```

---

## Task 8: Update .env.example Files for Production

**Files:**
- Modify: `apps/api/.env.example`
- Modify or create: `apps/web/.env.example`

**Step 1: Update API .env.example**

Add R2 variables and NODE_ENV:

```
# App
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/atspaces?schema=public&connection_limit=20&pool_timeout=30"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=CHANGE_ME_TO_A_RANDOM_SECRET_IN_PRODUCTION
JWT_EXPIRES_IN=7d

# Frontend CORS (comma-separated for multiple origins)
FRONTEND_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Cloudflare R2 Storage (required in production)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=atspaces-uploads
R2_PUBLIC_URL=https://files.atspaces.io
```

**Step 2: Create web .env.example**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Step 3: Commit**

```bash
git add apps/api/.env.example apps/web/.env.example
git commit -m "docs: update .env.example files with R2 and production variables"
```

---

## Task 9: Railway Configuration Files

**Files:**
- Create: `apps/api/Procfile` (or rely on existing Dockerfile)
- Create: `railway.toml` (optional, Railway can auto-detect)

Railway auto-detects Dockerfiles. Ensure the existing `apps/api/Dockerfile` and `apps/web/Dockerfile` are correct.

**Step 1: Verify API Dockerfile has correct build + start**

Read `apps/api/Dockerfile` and verify:
- Runs `npm run build`
- Starts with `node dist/main`
- Runs `prisma generate` during build
- Exposes correct port

**Step 2: Verify Web Dockerfile has correct build + start**

Read `apps/web/Dockerfile` and verify:
- Runs `npm run build`
- Uses `next start` or standalone output
- Exposes port 3000

**Step 3: Add `railway.toml` if needed for monorepo root config**

Only needed if Railway doesn't auto-detect the two services. Usually configured in Railway dashboard by pointing each service to its app directory.

**Step 4: Commit if any changes**

```bash
git add .
git commit -m "chore: verify and update Dockerfiles for Railway deployment"
```

---

## Task 10: Final Verification

**Step 1: Run full backend tests**

```bash
cd apps/api && npm test
```

Expected: All tests pass (132+).

**Step 2: Run frontend type check**

```bash
cd apps/web && npm run check-types
```

Expected: 0 errors.

**Step 3: Run full build**

```bash
cd /path/to/AtSpaces && npm run build
```

Expected: Both apps build successfully.

**Step 4: Final commit and push**

```bash
git add .
git commit -m "chore: production deployment ready"
```

---

## Post-Code: Manual Setup Steps (User)

These are done by the user in browser dashboards, not in code:

1. **Cloudflare**: Add `atspaces.io` domain, get nameservers
2. **Namecheap**: Change nameservers to Cloudflare's
3. **Cloudflare R2**: Create bucket `atspaces-uploads`, set custom domain `files.atspaces.io`
4. **Cloudflare R2**: Create API token (read/write), save credentials
5. **Railway**: Connect GitHub repo, create two services (web + api)
6. **Railway**: Add PostgreSQL and Redis add-ons
7. **Railway**: Set environment variables (from design doc)
8. **Railway**: Set custom domains (`atspaces.io` → web, `api.atspaces.io` → api)
9. **Cloudflare DNS**: Add CNAME records pointing to Railway
10. **Push to main**: Triggers first deployment
