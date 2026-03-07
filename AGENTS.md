# Repository Guidelines

## Project Structure & Module Organization
`apps/web` contains the Next.js App Router frontend (`app/`, `lib/`, `public/`). `apps/api` contains the NestJS backend (`src/`, `test/`, `prisma/`, `uploads/`). Shared UI lives in `packages/ui`, while `packages/eslint-config` and `packages/typescript-config` provide workspace-wide lint and TypeScript settings. Reference PDFs in `Referances/` are source material, not runtime code.

## Build, Test, and Development Commands
Run commands from the repository root unless noted otherwise.

- `docker compose up -d` starts local Postgres and Redis.
- `npm run dev` runs all Turbo dev tasks.
- `npx turbo dev --filter=web` or `npx turbo dev --filter=api` runs one app.
- `npm run build` builds all workspaces.
- `npm run lint` and `npm run check-types` validate the monorepo.
- `npm run format` formats `*.ts`, `*.tsx`, and `*.md`.
- `npm run test --workspace=api` runs API unit tests.
- `npm run test:e2e --workspace=api` runs Nest end-to-end tests.
- `npx prisma migrate dev --schema apps/api/prisma/schema.prisma` applies schema changes locally.

## Coding Style & Naming Conventions
Use TypeScript everywhere. Follow the existing 2-space indentation, semicolons, and formatter output instead of hand-formatting. Use `PascalCase` for React component exports and Nest classes, `kebab-case` for component files and route folders, and Nest naming patterns such as `*.service.ts`, `*.controller.ts`, `*.module.ts`, and `*.dto.ts`. Keep App Router segments lowercase and use bracketed folders such as `app/spaces/[id]` for dynamic routes.

## Testing Guidelines
API tests use Jest. Place unit tests beside implementation as `*.spec.ts` under `apps/api/src`, and place end-to-end tests under `apps/api/test/*.e2e-spec.ts`. Mirror the existing service specs by mocking Prisma and Redis boundaries and covering validation, pricing, and status-transition paths. No coverage threshold is enforced, but changed backend code should pass `test`, and risky changes should also run `test:cov`. Frontend changes should at minimum pass `lint` and `check-types`.

## Commit & Pull Request Guidelines
Recent history favors short, imperative messages, usually with Conventional Commit prefixes such as `feat:`. Prefer `type: concise summary`, for example `fix: reject bookings outside operating hours`. Pull requests should describe scope, affected workspaces, any schema or environment changes, and the commands used to verify the change. Include screenshots for UI work, and commit Prisma migration files whenever `apps/api/prisma/schema.prisma` changes.

## Security & Configuration Tips
Keep secrets in local `.env` files only. The API reads `DATABASE_URL`, `REDIS_URL`, `FRONTEND_URL`, and `PORT`; document changes to those values in the PR. Do not commit generated output such as `.next`, `dist`, `coverage`, or transient upload files unless they are intentional fixtures.
