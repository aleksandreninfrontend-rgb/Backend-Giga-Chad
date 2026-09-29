# Backend Giga Chad

NestJS + Prisma + PostgreSQL homework API: auth (JWT access/refresh), users (CRUD-ish with soft delete), roles (USER/ADMIN), and Swagger docs.

## Prerequisites

- Node.js 20+
- Yarn
- Docker (or [Colima](https://github.com/abiosoft/colima) on macOS) for Postgres

## Environment

`.env` is **not** committed to git (as usual). For local / teacher review, create a `.env` in the project root with:

```env
DATABASE_URL="postgresql://backend_giga_chad:backend_giga_chad@localhost:5432/backend_giga_chad?schema=public"
JWT_ACCESS_SECRET="access_secret"
JWT_REFRESH_SECRET="refresh_secret"
```

These match `docker-compose.yml` (user / password / db: `backend_giga_chad`).

## How to run

```bash
# 1. Install dependencies
yarn install

# 2. Start Postgres
yarn db:up

# 3. Apply migrations & generate Prisma client
yarn prisma migrate deploy
# or for local dev: yarn prisma:migrate

# 4. Start the API (watch mode)
yarn start:dev
```

App: [http://localhost:3000](http://localhost:3000)

## Swagger

Interactive API docs:

- UI: [http://localhost:3000/api](http://localhost:3000/api)
- OpenAPI JSON: [http://localhost:3000/api-json](http://localhost:3000/api-json)

1. Open the UI  
2. Register or login under **auth**  
3. Copy `access_token`  
4. Click **Authorize** → paste the token (Bearer)  
5. Call protected **users** endpoints  

Admin-only routes need a user with `role = ADMIN` (set in Prisma Studio / DB after register).

## Useful scripts

| Script | Description |
|---|---|
| `yarn db:up` / `yarn db:down` | Start / stop Postgres |
| `yarn prisma:studio` | Browse DB in the browser |
| `yarn start:dev` | Nest watch mode |
