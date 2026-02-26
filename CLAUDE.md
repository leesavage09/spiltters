# Splitters

A full-stack bill-splitting app. Monorepo with separate frontend and backend.

## Tech Stack

- **Frontend**: React 19 + Ionic 8 + TypeScript (strict) + Vite + Tailwind CSS
- **Backend**: NestJS 11 + TypeScript (strict) + Prisma 7 + PostgreSQL 16
- **API**: REST with OpenAPI spec auto-generated via NestJS Swagger
- **API Client**: Orval generates typed Axios client from OpenAPI spec into `frontend/src/generated/`
- **Auth**: JWT in HTTP-only cookies (7-day expiry), bcrypt (12 rounds)
- **Infra**: Docker multi-stage build, Docker Compose, Traefik reverse proxy, GitHub Actions CI/CD
- **Node**: >=22 required (.nvmrc)
- **Package Manager**: npm (both packages)

## Project Structure

```
frontend/src/
  api/client.ts          # Axios instance + interceptors
  pages/                 # Home, Login, Register
  hooks/                 # useAuth, useHealth
  components/            # ProtectedRoute
  generated/             # Orval auto-generated (gitignored)

backend/src/
  auth/                  # Controller, service, guards, strategies, DTOs
  users/                 # UsersService (CRUD)
  health/                # Health check endpoint
  prisma/                # PrismaService (global module)

backend/prisma/
  schema.prisma          # Database schema
  migrations/            # Prisma migrations

docker/
  Dockerfile             # Multi-stage production build
  docker-compose.yml     # Production (postgres + app + traefik)
  docker-compose.dev_db.yml  # Dev database only
```

## Key Commands

```bash
# Frontend
cd frontend && npm run dev          # Vite dev server (port 5173)
cd frontend && npm run build        # Typecheck + production build
cd frontend && npm run generate:api # Rebuild backend OpenAPI → Orval → generated client

# Backend
cd backend && npm run start:dev     # NestJS watch mode (port 3000)
cd backend && npm run build         # Compile
cd backend && npm run generate:openapi  # Generate OpenAPI spec

# Database
docker compose -f docker/docker-compose.dev_db.yml up -d  # Start dev PostgreSQL
cd backend && npx prisma migrate dev    # Run migrations (dev)
cd backend && npx prisma migrate deploy # Run migrations (prod)
```

## API Endpoints

All endpoints prefixed with `/api`.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| POST | /api/auth/logout | Yes | Clear cookie |
| GET | /api/health | No | Health check |

## Architecture Patterns

- **NestJS**: Feature modules (Auth, Users, Health, Prisma). DTOs with class-validator. Global ValidationPipe (whitelist + forbidNonWhitelisted + transform).
- **React**: Functional components, React Query for server state, React Router, ProtectedRoute wrapper.
- **Database**: Prisma with `@prisma/adapter-pg`. Models use `@@map` for snake_case table/column names.
- **CORS**: Allows localhost:3000, localhost:5173, and Capacitor origins.
- **Frontend serves from backend** in production via `@nestjs/serve-static`.

## Code Style

- TypeScript strict mode in both packages
- ESLint + Prettier (2-space indent, LF line endings)
- Backend: single quotes, trailing commas, `no-explicit-any: error`
- NestJS naming: PascalCase + suffix (AuthService, AuthController, LoginDto)
- File naming: PascalCase for components/pages, camelCase for utilities

## Database Schema

Currently one model:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("users")
}
```

## Testing

No test framework currently configured (scaffold was removed).

## Deployment

GitHub Actions on push to master → Docker build → Docker Hub → SSH deploy to server with Traefik SSL termination at `splitters.exp.leesavage.co.uk`.
