# SolarOps Platform

## Overview

SolarOps is an internal B2B web application for managing solar engineering, permitting, and solar panel removal & reinstallation (R&R) services. The platform serves solar installers, roofing contractors, internal operations staff, and engineers to manage projects and jobs end-to-end.

The application follows a full-stack TypeScript architecture with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for solar/energy themed palette
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: REST API with typed route definitions in `shared/routes.ts`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod for input validation, drizzle-zod for schema-to-validator generation
- **Authentication**: Replit Auth via OpenID Connect with Passport.js

### Data Models
Core entities defined in `shared/schema.ts`:
- **Users & Profiles**: Authentication users with role-based profiles (installer, roofer, ops, engineer)
- **Companies**: Organizations with types matching user roles
- **Projects**: Customer projects with address and metadata
- **Jobs**: Work requests (engineering or R&R type) with status lifecycle
- **Messages**: Job-related communication threads
- **Job History**: Audit trail for job changes

### Access Control
- Installers/Roofers: See only their company's projects and jobs
- Internal Ops: Full access to manage everything
- Engineers: See only jobs assigned to them

### Directory Structure
- `client/src/`: React frontend application
- `server/`: Express backend with routes and storage layer
- `shared/`: Shared TypeScript types, schemas, and route definitions
- `server/replit_integrations/auth/`: Replit Auth integration

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database migrations in `./migrations` directory
- **connect-pg-simple**: Session storage in PostgreSQL

### Authentication
- **Replit Auth**: OpenID Connect authentication flow
- **express-session**: Session management with PostgreSQL backing store
- **passport**: Authentication middleware

### UI Libraries
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component collection (configured in `components.json`)
- **Recharts**: Dashboard analytics charts
- **date-fns**: Date formatting utilities

### Build & Development
- **Vite**: Frontend build and development server
- **esbuild**: Production server bundling
- **tsx**: TypeScript execution for development