# ETHIO-BRIDGE

AI-Powered Ethiopia–China Commercial & Business Platform.

Monorepo implementation per the [ETHIO-BRIDGE SDD v1.0](./docs/SDD.md). Four first-class languages: English, Amharic, Afaan Oromo, Simplified Chinese.

## Repository layout

```
apps/
  api/     NestJS (TypeScript) backend — API v1, business logic, RBAC, tenant isolation
  web/     Next.js (App Router) frontend — 4-language UI, feature-aware navigation
packages/
  shared/  @ethio/shared — permissions, role maps, feature catalog, constants, error codes
docs/
  SDD.md   authoritative Software Design Document (specification, do not modify casually)
  GAP.md   Phase 0 gap analysis
```

## Prerequisites

- Node.js >= 20
- Docker (for local PostgreSQL + Redis)

> **Environment note (this dev host):** a native `postgresql-x64-18` Windows service owns host
> port `5432`, and a pre-existing **ETHIOBRIDGE prototype lives at `D:\ETHIOBRIDGE`** and is
> running on ports `3000` (web) / `3001` (api). It is unrelated to this repository and is left
> untouched. Our local dev stack therefore uses **container postgres on host port `5433`** and
> **API on port `3002`**. Legacy `ethiobridge-*` Docker containers on this host are also left in
> place. Canonical production ports remain `5432 / 3001 / 3000` (see `.env.example`).

## Quick start

```bash
npm install                      # install workspace dependencies
npm run infra:up                 # start postgres (5433) + redis containers
npm run db:setup                 # prisma migrate + seed (permissions, features, platform admin)
npm run dev:api                  # API on http://localhost:3002
npm run dev:web                  # web on http://localhost:3003
```

Default platform admin (dev, from seed):

```
email:    admin@ethio.bridge
password: EhioAdmin!2026
```

> The OTP transport is provider-based. In development the default transport writes the OTP to the API console log.

## Tests

```bash
npm run test:api                 # unit tests
npm run test:api:e2e             # e2e: tenant isolation, feature entitlement, role enforcement, auth flow
```

> `test:api:e2e` uses its own database `ethio_bridge_test` on the same container (port 5433) and
> resets it (`prisma db push --force-reset`) before running. `--forceExit` is set because the
> NestJS+supertest stack leaves an open handle after the suite while all tests already passed.

## Standard error envelope

```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_ENABLED",
    "message": "This feature is not enabled for your organization."
  }
}
```

## Docs

- `docs/SDD.md` — the authoritative specification.
- `docs/GAP.md` — Phase 0 gap analysis + Phase 1 implementation & verification notes.