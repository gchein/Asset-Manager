# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SolarOps is a B2B platform for managing solar engineering, permitting, and panel removal/reinstallation (R&R) services. It serves solar installers, roofing contractors, internal operations staff, and engineers.

## Commands

```bash
npm run dev       # Start development server (hot reload)
npm run build     # Build for production (client + server)
npm start         # Run production build
npm run check     # TypeScript type checking
npm run db:push   # Push Drizzle schema changes to PostgreSQL
```

## Architecture

**Stack**: Full-stack TypeScript with React frontend and Express backend

### Directory Structure
- `client/src/` - React frontend (Vite, Wouter routing, TanStack Query, shadcn/ui)
- `server/` - Express backend (routes.ts for API, storage.ts for DB access)
- `shared/` - Shared types and schemas used by both client and server
  - `schema.ts` - Drizzle ORM table definitions
  - `routes.ts` - API route type definitions

### Key Patterns

**API Development**: Define endpoint types in `shared/routes.ts`, implement in `server/routes.ts`

**Database**: Drizzle ORM with PostgreSQL. Schema in `shared/schema.ts`. Run `npm run db:push` after schema changes.

**Frontend Data Fetching**: Use hooks from `client/src/hooks/use-data.ts` which wrap TanStack Query

**Authentication**: Replit Auth via OpenID Connect. Protected routes use `isAuthenticated` middleware. Auth code in `server/replit_integrations/auth/`

### Data Models

Core entities: Users → Profiles → Companies → Projects → Jobs

- **Profiles**: Role-based (installer, roofer, ops, engineer) linked to companies
- **Jobs**: Work requests with status lifecycle (new → submitted → assigned → in_progress → needs_revision → completed/cancelled)
- Related: Messages, JobHistory (audit trail), Warranties, CommissionItems

### Access Control
- **Installers/Roofers**: Only their company's projects and jobs
- **Operations**: Full access
- **Engineers**: Only jobs assigned to them

## Environment

Requires `DATABASE_URL` environment variable for PostgreSQL connection.
