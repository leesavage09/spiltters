# Cost Splitter App

A cost-splitting application (similar to Splitwise) built with Ionic React frontend and NestJS backend, fully Dockerized for easy deployment.

## Project Structure

```
├── frontend/          # Ionic React application
├── backend/           # NestJS backend API
├── docker/            # Docker configuration
│   ├── Dockerfile
│   └── Dockerfile.compose
├── .github/workflows/ # CI/CD workflows
├── docker-compose.yml # Multi-container setup
└── README.md         # This file
```

## Tech Stack

**Frontend:**
- Ionic React with TypeScript (strict mode)
- React Query for server state management
- Axios for HTTP requests
- Vite as build tool
- ESLint + Prettier for code quality

**Backend:**
- NestJS with TypeScript (strict mode)
- PostgreSQL database
- Prisma ORM
- ESLint + Prettier for code quality

**DevOps:**
- Docker for containerization
- docker-compose for local development
- GitHub Actions for CI (lint + typecheck)

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker and Docker Compose
- npm

### Development Setup

1. **Clone and Install Dependencies**

   ```bash
   cd frontend && npm install --legacy-peer-deps
   cd ../backend && npm install --legacy-peer-deps
   ```

2. **Run Locally with Docker Compose**

   ```bash
   docker-compose up
   ```

   The application will be available at `http://localhost:3000`

3. **Frontend Development Server**

   ```bash
   cd frontend
   npm run dev
   ```

4. **Backend Development Server**

   ```bash
   cd backend
   npm run start:dev
   ```

## Available Scripts

### Frontend

```bash
npm run dev          # Start development server (Vite)
npm run build        # Build production bundle
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
npm run preview      # Preview production build
```

### Backend

```bash
npm run start        # Start application
npm run start:dev    # Start with watch mode
npm run start:prod   # Start production build
npm run build        # Compile TypeScript
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
npm run test         # Run tests
```

## API Endpoints

- **GET /health** - Health check endpoint, returns `{ "status": "ok" }`

## Docker Setup

### Build and Run

```bash
docker-compose up --build
```

This will:
1. Build the frontend static assets
2. Build the backend NestJS application
3. Start PostgreSQL database
4. Start the NestJS server serving both backend API and frontend assets

### Environment Variables

See `.env.sample` for required environment variables.

## Architecture

- **Frontend:** Built as static assets and served by NestJS
- **Backend:** NestJS serves both API endpoints and static frontend files
- **Database:** PostgreSQL running in Docker
- **Networking:** Docker Compose networking for inter-container communication

## Current Scope

This is a scaffolding project with the following constraints:

- No authentication
- No business logic beyond health check
- No authorization
- No SEO optimizations
- Focus: Frontend fetches and renders backend `/health` response

## CI/CD

GitHub Actions workflow runs on push:
- Installs dependencies for both frontend and backend
- Runs ESLint for code quality checks
- Runs TypeScript type checking

See `.github/workflows/ci.yml` for workflow details.

## TypeScript Strict Mode

Both frontend and backend are configured with TypeScript strict mode enabled:
- No implicit any types
- Strict null checks
- Full type safety across the codebase

## Code Quality

- **ESLint:** TypeScript strict rules enabled
- **Prettier:** Automatic code formatting
- **EditorConfig:** Consistent editor settings

## Next Steps

To extend this scaffold:

1. Add authentication module
2. Create database models and migrations
3. Implement business logic
4. Add comprehensive testing
5. Deploy to production infrastructure
