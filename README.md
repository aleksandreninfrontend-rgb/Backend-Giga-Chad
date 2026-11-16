# Backend Giga Chad

NestJS monorepo: **user-service** (auth, users, avatars, transfers) and **notification-service** (Socket.IO push). Shared code lives in `libs/common` (`@app/common`: logger, JWT verify, guards, filters). Prisma + PostgreSQL, Redis, S3 (RustFS), scheduled avatar cleanup, Swagger on user-service.

## Prerequisites

- Node.js **24** recommended for Nest CLI locally (Node 20 may hit `ERR_REQUIRE_ESM` with current Nest/schematics)
- Yarn
- Docker (or [Colima](https://github.com/abiosoft/colima) on macOS) for Postgres, Redis, and RustFS (S3-compatible storage)

## Environment

`.env` is **not** committed to git. Copy the example and adjust if needed:

```bash
cp .env.example .env
```

Both apps load the same root `.env` via `ConfigModule`. Important shared vars:

| Variable                                    | Purpose                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                              | Postgres connection (matches `docker-compose.yml`) — user-service                               |
| `JWT_ACCESS_SECRET`                         | Access JWT **sign** (user-service) and **verify** (both services). Must be identical everywhere |
| `JWT_REFRESH_SECRET`                        | Refresh JWT — user-service only                                                                 |
| `PORT`                                      | user-service HTTP (default `3000`)                                                              |
| `NOTIFICATION_PORT`                         | notification-service HTTP + Socket.IO (default `3001`)                                          |
| `REDIS_URL`                                 | Redis for cache + avatar upload lock (`redis://localhost:6379`)                                 |
| `CACHE_TTL_SECONDS`                         | User list / me cache TTL                                                                        |
| `AVATAR_CLEANUP_CRON`                       | Cron for soft-deleted avatar cleanup job                                                        |
| `AVATAR_CLEANUP_RETENTION_MS`               | Soft-deleted avatars older than this are hard-deleted (default `604800000` = 7 days)            |
| `S3_ENDPOINT`                               | RustFS S3 API (`http://127.0.0.1:19000`)                                                        |
| `S3_REGION`                                 | AWS SDK region (e.g. `us-east-1`)                                                               |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Must match RustFS (`minioadmin` / `minioadmin`)                                                 |
| `S3_BUCKET`                                 | Bucket name (`main`) — created automatically by `s3-init` on `docker compose up`                |
| `S3_FORCE_PATH_STYLE`                       | Path-style URLs for local S3 (`true`)                                                           |

Access token TTL is configured in code (`libs/common` → `ACCESS_TOKEN_TTL_SECONDS`), not via env.

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

# 4. Start user-service (watch)
yarn start:user

# 5. Start notification-service (watch) — separate terminal
yarn start:notification
```

- user-service: [http://localhost:3000](http://localhost:3000)
- notification-service: [http://localhost:3001](http://localhost:3001) (HTTP + Socket.IO)

Use `nvm use 24` (or equivalent) if Nest CLI fails with `ERR_REQUIRE_ESM`.

### Local infrastructure

| Service        | Port(s) | Notes                                                                 |
| -------------- | ------- | --------------------------------------------------------------------- |
| Postgres       | `5432`  | DB `backend_giga_chad`                                                |
| Redis          | `6379`  | Cache + locks                                                         |
| RustFS S3 API  | `19000` | Avatars                                                               |
| RustFS Console | `19001` | Optional UI                                                           |
| `s3-init`      | —       | One-shot container that creates bucket `main` after RustFS is healthy |

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

## Notification service (Socket.IO)

Realtime push lives in **notification-service**. Use a **Socket.IO** client (Postman Socket.IO request, `socket.io-client`, etc.) — a raw WebSocket client will not speak the Socket.IO protocol.

### Auth and rooms (stable)

1. Client obtains an **access JWT** from user-service (`/auth/login` or `/auth/register`).
2. Client connects to notification-service and sends the token (preferred: Socket.IO `handshake.auth.token`; Postman may use a `token` or `Authorization: Bearer` header — temporary fallback in the gateway).
3. Server verifies signature + expiry with the same `JWT_ACCESS_SECRET`.
4. On success, `userId` is taken only from JWT claim `sub` (client cannot choose another user’s room).
5. Socket joins room `user:<userId>`. All devices of that user share one room and receive the same pushes.
6. Invalid / missing token → connection is rejected (disconnect before join).

On disconnect, Socket.IO removes the socket from rooms automatically. App-owned resources (timers, maps, subscriptions), if added later, must be cleared in `handleDisconnect`.

### Events (stable)

| Direction       | Event          | Payload                                       |
| --------------- | -------------- | --------------------------------------------- |
| Server → client | `welcome`      | `{ message, socketId }` after successful auth |
| Server → client | `notification` | Transfer-shaped payload (see below)           |
| Client → server | `ping`         | `{ ts }` → server replies `pong`              |

Transfer notification shape:

```ts
type TransferNotification = {
  eventId: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  occurredAt: string; // ISO timestamp
};
```

Delivery API on the gateway: `sendNotification(userId, payload)` → `server.to('user:' + userId).emit('notification', payload)`.  
**Kafka (later)** will call this same path after consuming events; the socket contract above stays.

### Slow-client policy (stable)

- **Inbound:** max packet size ~1 MiB (`maxHttpBufferSize`) — protects the server from huge client messages.
- **Outbound:** if a socket’s WebSocket `bufferedAmount` exceeds ~1 MiB, that socket is force-disconnected. One stuck device must not grow an unbounded send queue in memory.
- Transfer `notification` events are **not** sent as `volatile` (no silent drop of money-related pushes).
- Other devices in the same `user:<id>` room keep receiving events.
- After reconnect + JWT verify + join, the client receives **future** events only. This service does not replay missed notifications from memory; a durable inbox/API sync would be a separate layer if needed.

### Local HTTP test trigger (temporary)

`POST /notifications/test` on port `3001` is a **manual test helper**: requires `Authorization: Bearer <access_token>` and always notifies the authenticated user (`sub`) only — never an arbitrary target chosen by the client. Expect this route to be removed or unused once Kafka drives `sendNotification`.

## Useful scripts

| Script                        | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `yarn db:up` / `yarn db:down` | Start / stop Postgres, Redis, RustFS (+ bucket init) |
| `yarn prisma:studio`          | Browse DB in the browser                             |
| `yarn start:user`             | user-service watch mode                              |
| `yarn start:notification`     | notification-service watch mode                      |
