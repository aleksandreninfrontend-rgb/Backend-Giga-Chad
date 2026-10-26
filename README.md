# Backend Giga Chad

NestJS + Prisma + PostgreSQL homework API: auth (JWT access/refresh), users (CRUD-ish with soft delete), roles (USER/ADMIN), avatars (S3), Redis cache/locks, scheduled avatar cleanup, balance transfers, and Swagger docs.

## Prerequisites

- Node.js 20+
- Yarn
- Docker (or [Colima](https://github.com/abiosoft/colima) on macOS) for Postgres, Redis, and RustFS (S3-compatible storage)

## Environment

`.env` is **not** committed to git. Copy the example and adjust if needed:

```bash
cp .env.example .env
```

`.env.example` includes:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (matches `docker-compose.yml`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing |
| `PORT` | API port (default `3000`) |
| `REDIS_URL` | Redis for cache + avatar upload lock (`redis://localhost:6379`) |
| `CACHE_TTL_SECONDS` | User list / me cache TTL |
| `AVATAR_CLEANUP_CRON` | Cron for soft-deleted avatar cleanup job |
| `AVATAR_CLEANUP_RETENTION_MS` | How long soft-deleted avatars are kept before hard delete |
| `S3_ENDPOINT` | RustFS S3 API (`http://127.0.0.1:19000`) |
| `S3_REGION` | AWS SDK region (e.g. `us-east-1`) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Must match RustFS (`minioadmin` / `minioadmin`) |
| `S3_BUCKET` | Bucket name (`main`) — created automatically by `s3-init` on `docker compose up` |
| `S3_FORCE_PATH_STYLE` | Path-style URLs for local S3 (`true`) |

## How to run

```bash
# 1. Install dependencies
yarn install

# 2. Start Postgres + Redis + RustFS (+ auto-create S3 bucket `main`)
yarn db:up
# same as: docker compose up -d

# 3. Apply migrations & generate Prisma client
yarn prisma migrate deploy
# or for local dev: yarn prisma:migrate

# 4. Start the API (watch mode)
yarn start:dev
```

App: [http://localhost:3000](http://localhost:3000)

### Local infrastructure

| Service | Port(s) | Notes |
|---|---|---|
| Postgres | `5432` | DB `backend_giga_chad` |
| Redis | `6379` | Cache + locks |
| RustFS S3 API | `19000` | Avatars |
| RustFS Console | `19001` | Optional UI |
| `s3-init` | — | One-shot container that creates bucket `main` after RustFS is healthy |

If avatar upload fails with a missing-bucket error after a fresh start, re-run:

```bash
docker compose up s3-init
```

## Swagger

Interactive API docs:

- UI: [http://localhost:3000/api](http://localhost:3000/api)
- OpenAPI JSON: [http://localhost:3000/api-json](http://localhost:3000/api-json)

1. Open the UI  
2. Register or login under **auth**  
3. Copy `access_token`  
4. Click **Authorize** → paste the token (Bearer)  
5. Call protected **users** endpoints  

Admin-only routes need a user with `role = ADMIN` (set in Prisma Studio / DB after register):

```sql
UPDATE "User" SET role = 'ADMIN' WHERE login = 'yourlogin';
```

## Testing transfers (balance)

New users start with balance `0.00`. There is no top-up API — set balance in the DB, then call `POST /users/me/transfer`:

```bash
# Prisma Studio
yarn prisma:studio
```

Or SQL:

```sql
UPDATE "User" SET balance = 100.00 WHERE login = 'yourlogin';
```

Then transfer to another user’s `id` via Swagger or:

```bash
curl -X POST http://localhost:3000/users/me/transfer \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"<other-user-uuid>","amount":"10.00"}'
```

## Useful scripts

| Script | Description |
|---|---|
| `yarn db:up` / `yarn db:down` | Start / stop Postgres, Redis, RustFS (+ bucket init) |
| `yarn prisma:studio` | Browse DB in the browser |
| `yarn start:dev` | Nest watch mode |
