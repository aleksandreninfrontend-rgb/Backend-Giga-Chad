# Backend Giga Chad

NestJS monorepo:

- **user-service** — auth, users, avatars, transfers
- **notification-service** — Socket.IO push + Kafka consumer

Shared code: `libs/common` (`@app/common`). Stack: Prisma/PostgreSQL, Redis, RustFS (S3), Kafka, Debezium (outbox CDC).

## Prerequisites

- Node.js **24** (`nvm use 24` — Node 20 may hit `ERR_REQUIRE_ESM`)
- Yarn
- Docker (or [Colima](https://github.com/abiosoft/colima) on macOS)

If Colima and new ports don’t open on localhost after `docker compose up`, run `colima restart` then `yarn db:up` again.

## Environment

```bash
cp .env.example .env
```

`.env.example` already has working local values matching `docker-compose.yml`. Both apps load the root `.env`.

| Variable                                  | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                            | Postgres (user-service)                            |
| `JWT_ACCESS_SECRET`                       | Access JWT sign + verify (must match in both apps) |
| `JWT_REFRESH_SECRET`                      | Refresh JWT (user-service)                         |
| `PORT` / `NOTIFICATION_PORT`              | `3000` / `3001`                                    |
| `REDIS_URL`                               | Cache + locks                                      |
| `KAFKA_BROKERS`                           | Nest consumer brokers (`localhost:9092` on host)   |
| `DEBEZIUM_DB_*` / `DEBEZIUM_TOPIC_PREFIX` | Kafka Connect outbox connector (`connect-init`) |
| `OUTBOX_CLEANUP_CRON` / `OUTBOX_CLEANUP_RETENTION_MS` | Outbox purge schedule + retention (default 14d) |
| `S3_*`                                    | RustFS avatars (`minioadmin` / bucket `main`) |

## How to run

```bash
yarn install
yarn db:up                          # Postgres, Redis, RustFS, Kafka, Kafka UI, Connect + register outbox connector
yarn prisma migrate deploy          # or: yarn prisma:migrate
yarn prisma:generate                # if client is stale after pull
yarn start:user                     # terminal 1
yarn start:notification             # terminal 2
```

| URL                       | What                                    |
| ------------------------- | --------------------------------------- |
| http://localhost:3000     | user-service                            |
| http://localhost:3000/api | Swagger                                 |
| http://localhost:3001     | notification-service (HTTP + Socket.IO) |
| http://localhost:8080     | Kafka UI                                |
| http://localhost:8083     | Kafka Connect API                       |

Check Debezium connector: `curl http://localhost:8083/connectors/outbox-connector/status`  
Re-register if needed: `yarn debezium:register`

### Local infrastructure

| Service                    | Port(s)                                 | Why                                      |
| -------------------------- | --------------------------------------- | ---------------------------------------- |
| Postgres                   | `5432`                                  | Data (`wal_level=logical` for Debezium)  |
| Redis                      | `6379`                                  | Cache / locks                            |
| RustFS                     | `19000` / `19001`                       | S3 avatars                               |
| Kafka                      | `9092` (host), `29092` (Docker network) | Event bus                                |
| Kafka UI                   | `8080`                                  | Inspect topics / messages                |
| Connect (Debezium)         | `8083`                                  | Outbox CDC → Kafka                       |
| `s3-init` / `connect-init` | —                                       | One-shot bucket + connector registration |

## Transfers + notifications (short)

```text
POST /users/me/transfer
  → DB TX: update balances + INSERT outbox
  → Debezium reads WAL → Kafka topic transfer.completed
  → notification-service @EventPattern → Socket.IO to both users
```

**Why outbox + Debezium:** avoids dual-write (DB committed but Kafka emit failed). Event is stored in the same transaction as the transfer; Connect publishes it.

**Why Kafka:** decouple user-service from notification-service (fire-and-forget events).

**Outbox cleanup:** Nest cron on user-service + `cron_runs` table. Each replica ticks; only one wins an atomic `UPDATE … RETURNING` for the day, then deletes old rows in batches. Others skip — avoids N concurrent big `DELETE`s locking Postgres. (Avatar cleanup uses Bull/Redis instead.)

```sql
SELECT * FROM cron_runs;  -- started_at = last successful claim
```

1. Register two users (Swagger), set sender balance:

```sql
UPDATE "User" SET balance = 100.00 WHERE login = 'yourlogin';
```

2. Connect Socket.IO to `http://localhost:3001` with `auth.token` = access JWT (or Bearer header).
3. `POST /users/me/transfer` with sender token → both connected users get `notification`.

Payload:

```ts
{ eventId, fromUserId, toUserId, amount, occurredAt }
```

Consumer commits Kafka offsets manually after successful notify (`run.autoCommit: false`).

## Swagger auth

1. http://localhost:3000/api → register/login → copy `access_token` → **Authorize**

Admin routes: set `role = 'ADMIN'` in DB for that user.

## Useful scripts

| Script                        | Description                  |
| ----------------------------- | ---------------------------- |
| `yarn db:up` / `yarn db:down` | Start / stop Docker stack    |
| `yarn debezium:register`      | Re-register outbox connector |
| `yarn prisma:studio`          | DB UI                        |
| `yarn start:user`             | user-service watch           |
| `yarn start:notification`     | notification-service watch   |

Connector config template: `infra/debezium/outbox-connector.template.json` (secrets from env).
