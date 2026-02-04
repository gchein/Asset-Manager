# SolarOps

SolarOps is an internal B2B web application for managing solar engineering, permitting, and panel removal & reinstallation (R&R) services. It serves solar installers, roofing contractors, internal operations staff, and engineers.

This guide helps new engineers understand the project, install dependencies, set up the database, and run the app for the full experience.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Database setup](#database-setup)
- [Environment variables](#environment-variables)
- [Running the application](#running-the-application)
- [Authentication](#authentication)
- [Data model overview](#data-model-overview)
- [Development workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **PostgreSQL** 16 (used by the app and by Drizzle for schema push)
- **npm** (comes with Node)

Check versions:

```bash
node -v    # v20.x or v22.x
npm -v
psql --version   # 16.x
```

---

## Quick start

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd solar-ops
   npm install
   ```

2. **Create a PostgreSQL database** (see [Database setup](#database-setup)).

3. **Configure environment** (see [Environment variables](#environment-variables)):

   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL (and optional auth vars)
   ```

4. **Apply the schema**

   ```bash
   npm run db:push
   ```

5. **Start the app**

   ```bash
   npm run dev
   ```

   Open **http://localhost:3000** (dev script uses `PORT=3000`; override with `PORT` in `.env` if needed).

**Local dev uses local auth by default:** you only need `DATABASE_URL`. After the app starts, go to `/api/login` for the local dev login form, enter any user ID (e.g. `dev-user-1`), and submit to sign in. No Replit or `REPL_ID`/`SESSION_SECRET` required. For Replit Auth (e.g. when deploying to Replit or testing Replit login locally), use `npm run dev:replit` and set the Replit env vars; see [Authentication](#authentication).

---

## Project structure

```
solar-ops/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx         # App root, routing, protected routes
│   │   ├── components/     # UI (layout/, ui/)
│   │   ├── hooks/          # use-auth, use-data (API hooks)
│   │   ├── lib/            # queryClient, utils
│   │   └── pages/          # Route-level pages
│   ├── index.html
│   └── public/
├── server/                  # Express backend
│   ├── index.ts            # App entry, middleware, static/Vite
│   ├── routes.ts           # API + access control
│   ├── storage.ts          # DB access (Drizzle)
│   ├── db.ts               # PostgreSQL connection
│   ├── static.ts           # Serve built client in production
│   ├── vite.ts             # Vite dev middleware
│   └── replit_integrations/
│       └── auth/           # Auth: localAuth.ts (local dev) or replitAuth.ts (when REPLIT_AUTH=true)
├── shared/                  # Shared types and API contract
│   ├── schema.ts           # Drizzle tables, relations, Zod schemas
│   ├── routes.ts           # API path/method/input/output types
│   └── models/
│       └── auth.ts         # users, sessions tables
├── script/
│   └── build.ts            # Production build (Vite + esbuild)
├── drizzle.config.ts       # Drizzle Kit config (schema, migrations output)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

- **API**: Types live in `shared/routes.ts`; implementation and auth in `server/routes.ts`.
- **Database**: Schema in `shared/schema.ts` and `shared/models/auth.ts`; access in `server/storage.ts`; connection in `server/db.ts`.
- **Frontend**: Data via hooks in `client/src/hooks/use-data.ts`; auth via `client/src/hooks/use-auth.ts`.

---

## Tech stack

| Layer        | Technology |
|-------------|------------|
| Frontend    | React 18, TypeScript, Vite, Wouter, TanStack Query, shadcn/ui (Radix), Tailwind CSS |
| Backend     | Express 5, TypeScript |
| Database    | PostgreSQL 16, Drizzle ORM |
| Validation  | Zod, drizzle-zod |
| Auth        | Local auth (dev default) or Replit Auth when `REPLIT_AUTH=true`; express-session, connect-pg-simple (sessions in Postgres) |
| Build       | Vite (client), esbuild (server in production) |

---

## Database setup

The app expects a **PostgreSQL 16** database and uses **Drizzle** for schema and access. There are no migration files; the schema is applied with **push**.

### Option A: Local PostgreSQL

1. Install PostgreSQL 16 (e.g. [postgresapp](https://postgresapp.com/), Homebrew, or your OS package manager).

2. Create a database and (optional) user:

   ```bash
   # Using psql as postgres superuser
   createdb solar_ops
   # Or inside psql:
   # CREATE DATABASE solar_ops;
   # CREATE USER solar_ops_user WITH PASSWORD 'your_password';
   # GRANT ALL PRIVILEGES ON DATABASE solar_ops TO solar_ops_user;
   ```

3. Set the connection string in `.env`:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/solar_ops
   ```

   Examples:

   - Default local user, no password: `postgresql://localhost:5432/solar_ops`
   - With user/password: `postgresql://solar_ops_user:your_password@localhost:5432/solar_ops`

### Option B: Replit (or other hosted Postgres)

- On Replit, add the **PostgreSQL** resource; Replit sets `DATABASE_URL` for you.
- For other hosts (e.g. Neon, Supabase, Railway), create a database and set `DATABASE_URL` in `.env` to their connection string.

### Option C: Docker (local Postgres container)

Run the official PostgreSQL 16 image and pass your `.env` so the container creates the same user, password, and database your app expects:

```bash
docker run -d -p 5432:5432 --env-file .env --name solar-ops-db postgres:16
```

Ensure `.env` includes `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` (the postgres image uses these to init the DB) and `DATABASE_URL` (your app uses this to connect). Then run `npm run db:push` to create tables. To stop and remove the container:

```bash
docker stop solar-ops-db
docker rm solar-ops-db
```

### Apply the schema

From the project root:

```bash
npm run db:push
```

This reads `shared/schema.ts` and `shared/models/auth.ts`, connects using `DATABASE_URL` from your environment, and creates/updates tables. Required tables include:

- **Auth (Replit)**: `sessions`, `users`
- **App**: `companies`, `profiles`, `projects`, `jobs`, `messages`, `job_history`, `warranties`, `commission_items`

If `DATABASE_URL` is missing, `drizzle.config.ts` and `server/db.ts` will throw at runtime. Both `npm run dev` and `npm run db:push` load `.env` automatically when you run them from the project root.

---

## Environment variables

| Variable        | Required | Description |
|----------------|----------|-------------|
| `DATABASE_URL` | **Yes**  | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/dbname`). |
| `PORT`         | No       | Server port. `npm run dev` uses `3000`; `npm start` uses `5000` if unset. Override in `.env` if needed. |
| `REPLIT_AUTH`  | No       | When `"true"`, use Replit Auth (OIDC). When unset or not `"true"`, use local auth (dev login form at `/api/login`). Production on Replit should set this (or use a script that sets it). |
| `SESSION_SECRET` | For Replit auth | Secret for signing session cookies. Required when `REPLIT_AUTH=true`. Local auth uses a default if unset (dev only). |
| `REPL_ID`      | For Replit auth | Replit application (repl) identifier; OAuth client_id for Replit Auth. Replit sets this when the app runs on Replit. Required when `REPLIT_AUTH=true`. |
| `ISSUER_URL`   | No       | Replit OIDC issuer; default `https://replit.com/oidc`. Only used when `REPLIT_AUTH=true`. |

**Local dev (default):** Set `DATABASE_URL` (and optionally `PORT`). Run `npm run dev`. Auth uses local auth; go to `/api/login` to sign in with any user ID. No `REPLIT_AUTH`, `REPL_ID`, or `SESSION_SECRET` needed.

**Replit Auth (Replit or `npm run dev:replit`):** Set `REPLIT_AUTH=true`, `REPL_ID`, and `SESSION_SECRET`. On Replit, these are usually set for you. For local dev with Replit login, run `npm run dev:replit` and put the real `REPL_ID` and `SESSION_SECRET` from your Replit project in `.env`.

---

## Running the application

### Development (hot reload)

```bash
npm run dev
```

- Starts Express and Vite dev server (single process). Uses **local auth** (no Replit). Port **3000** unless `PORT` is set in `.env`.
- Serves the API and the React app at http://localhost:3000 (or your `PORT`).
- Sign in via the local dev login form at **http://localhost:3000/api/login** (enter any user ID, e.g. `dev-user-1`).
- Client code hot-reloads; server restarts on file changes if you use a watcher.

To use **Replit Auth** instead (e.g. to test Replit login locally or match Replit deployment):

```bash
npm run dev:replit
```

- Same server and port behavior, but auth uses Replit OIDC. Requires `REPL_ID` and `SESSION_SECRET` in `.env` (copy from your Replit project Secrets).

### Production build and run

```bash
npm run build
npm start
```

- `npm run build`: builds the client with Vite and the server with esbuild into `dist/`.
- `npm start`: runs `node dist/index.cjs` (set `NODE_ENV=production` if your host doesn’t).

### Other commands

| Command             | Description |
|---------------------|-------------|
| `npm run check`     | TypeScript type check (`tsc`). |
| `npm run db:push`   | Push Drizzle schema to the database (loads `.env` via dotenv-cli). |
| `npm run dev:replit` | Same as `npm run dev` but with `REPLIT_AUTH=true` (Replit OIDC login). |

---

## Authentication

Auth mode is controlled by **`REPLIT_AUTH`**: when unset or not `"true"`, the app uses **local auth** (login form at `/api/login`); when `REPLIT_AUTH=true`, it uses **Replit Auth (OIDC)**. See [Local development](#local-development) for steps.

- **Provider (Replit mode)**: Replit Auth (OpenID Connect).
- **Flow**: User clicks “Sign in with Replit” → `/api/login` → Replit OIDC → callback at `/api/callback` → session created and stored in PostgreSQL (`sessions` table). User record is created/updated in `users`.
- **Session**: Stored in Postgres via `connect-pg-simple`; secret from `SESSION_SECRET`; cookie is httpOnly, secure.

See [Local development](#local-development) for local auth (Option A) or Replit Auth locally (Option B). On Replit, set `REPLIT_AUTH=true` and add PostgreSQL; Replit sets `DATABASE_URL`, `REPL_ID`, and often `SESSION_SECRET`. To actually log in, you need Replit Auth configured: set `SESSION_SECRET` and `REPL_ID` (and optionally `ISSUER_URL`). Easiest is to run the same project on Replit and use its env; alternatively you can point local app to Replit’s OIDC using Replit’s `REPL_ID` and a tunnel if your Replit app is configured for that callback URL.

After first login, users without a **profile** are redirected to **/onboarding** to set role and company; then they can use the app.

### Local development

**Option A – Local auth (simplest):**

1. Set `DATABASE_URL` in `.env` (and optionally `PORT`).
2. Run `npm run db:push` then `npm run dev`.
3. Open http://localhost:3000. To sign in, go to **http://localhost:3000/api/login**, enter a user ID (e.g. `dev-user-1`), and submit. You're in; complete onboarding if prompted.

No `REPL_ID`, `SESSION_SECRET`, or Replit project needed.

**Option B – Replit Auth locally:**

1. Create a Replit project with this repo and add PostgreSQL. Copy `REPL_ID` and `SESSION_SECRET` from Replit Secrets into your local `.env`. Set `DATABASE_URL` (local Postgres or Replit's).
2. In `.env` set `REPLIT_AUTH=true` (or use the script: `npm run dev:replit`).
3. Run `npm run db:push` then `npm run dev:replit`. Open the app and click "Sign in with Replit." Whether localhost is allowed as a redirect URI depends on Replit; if login fails, test the login flow on Replit and use local auth for the rest of your local work.

---

## Data model overview

- **users** (auth): id, email, firstName, lastName, profileImageUrl. Synced from Replit Auth.
- **profiles**: userId, role (`installer` | `roofer` | `ops` | `engineer`), companyId. One per user; created in onboarding.
- **companies**: name, type (same as role). Installers/roofers/ops belong to a company.
- **projects**: customerName, address, city, state, zipCode, utility, companyId. Belong to a company.
- **jobs**: projectId, type (`engineering` | `r_and_r`), status (e.g. new → submitted → assigned → in_progress → completed/cancelled), assignedEngineerId, details (JSONB). Linked to project.
- **messages**: jobId, userId, content, isRevisionRequest. Thread per job.
- **job_history**: jobId, userId, action, details. Audit trail for job changes.
- **warranties**, **commission_items**: per job.

Relations and Zod schemas are in `shared/schema.ts`. Access control:

- **Ops**: See all projects/jobs.
- **Installers / roofers**: See only their company’s projects and jobs.
- **Engineers**: See only jobs assigned to them.

---

## Development workflow

1. **Schema changes**: Edit `shared/schema.ts` (and `shared/models/auth.ts` if auth tables change). Run `npm run db:push` to apply.
2. **API changes**: Add or update types in `shared/routes.ts`, then implement in `server/routes.ts`. Use Zod schemas from `shared/schema.ts` for validation.
3. **Frontend**: Add or use hooks in `client/src/hooks/use-data.ts` for API calls; use `useAuth` for auth state. Pages live under `client/src/pages/`.
4. **Type check**: Run `npm run check` before committing.

---

## Troubleshooting

- **“DATABASE_URL must be set”**
  Set `DATABASE_URL` in `.env` (or export it). Ensure the same env is used for `npm run db:push` and `npm run dev`.

- **“relation … does not exist”**
  Run `npm run db:push` so all tables (including `sessions`, `users`, `companies`, etc.) exist.

- **Login redirect fails or "Unauthorized"**
  - **Local auth mode** (default): Go to `/api/login` and enter a user ID to sign in. No special env vars needed.
  - **Replit auth mode** (`REPLIT_AUTH=true`): Requires `SESSION_SECRET` and `REPL_ID`. On Replit these are usually set automatically. For local dev with Replit auth, copy these from your Replit project Secrets or use local auth instead.

- **Port in use**
  Set `PORT` in `.env` (e.g. `3001`) and restart. Dev default is `3000`.

- **Schema out of sync**
  After pulling changes that touch `shared/schema.ts` or `shared/models/auth.ts`, run `npm run db:push` again.

- **Type errors after shared changes**
  Run `npm run check`. Fix any issues in `server/` or `client/` that use the updated types.

---

For more context for AI assistants, see `CLAUDE.md`. For Replit-specific setup, see `replit.md`.
