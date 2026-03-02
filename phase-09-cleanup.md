# Phase 9: Remove Old CRUD Endpoints, Final Cleanup

## Goal

Remove the old CRUD write endpoints for splits and expenses (replaced by the sync endpoint). Clean up unused code, update the Dockerfile, and ensure everything builds and deploys correctly.

## Prerequisites

- Phase 1-8 complete (full offline-first system working end-to-end)

## Steps

### 1. Remove write endpoints from SplitsController

**Keep:**
- `GET /api/splits` — read-only, used for split discovery after login

**Remove:**
- `POST /api/splits` — replaced by `create_split` operation via sync
- `PATCH /api/splits/:id` — replaced by `update_split` operation via sync
- `DELETE /api/splits/:id` — replaced by `delete_split` operation via sync

### 2. Remove write endpoints from ExpensesController

**Keep:**
- `GET /api/expenses/:splitId` — read-only, may be useful for web or API consumers

**Remove:**
- `POST /api/expenses/:splitId` — replaced by `create_expense` operation via sync
- `PATCH /api/expenses/:splitId/:expenseId` — replaced by `update_expense` operation via sync
- `DELETE /api/expenses/:splitId/:expenseId` — replaced by `delete_expense` operation via sync

### 3. Clean up backend services

- Remove write methods from `SplitsService` (create, update, delete)
- Remove write methods from `ExpensesService` (create, update, delete)
- Keep read methods and helper methods (assertSplitMembership, etc.) — the sync service may use some of these
- Remove unused DTOs (CreateSplitDto, UpdateSplitDto, CreateExpenseDto, UpdateExpenseDto) if they're no longer referenced

### 4. Remove unused frontend generated API code

After regenerating the OpenAPI spec (which no longer has the write endpoints), the generated API client will no longer include mutation functions. Clean up:

- Remove unused imports in hooks
- Remove any references to old generated mutation functions
- Verify the generated code only includes read endpoints + sync + auth + invitations + notifications

### 5. Update the Dockerfile

The multi-stage Dockerfile builds both frontend and backend. Ensure:

- The root `package.json` with workspaces is copied
- The `packages/domain` directory is included in the build
- `npm install` at the root resolves workspace dependencies
- The domain package is available to both frontend and backend during build

Key changes to the Dockerfile:

```dockerfile
# Copy root workspace config
COPY package.json package-lock.json ./

# Copy all workspace package.json files
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY packages/domain/package.json packages/domain/

# Install all workspace dependencies
RUN npm install

# Copy source code
COPY packages/domain/ packages/domain/
COPY backend/ backend/
COPY frontend/ frontend/

# Build domain package (if using tsup build step)
# RUN cd packages/domain && npm run build

# Build backend
RUN cd backend && npm run build

# ... rest of build stages
```

### 6. Update docker-compose.yml if needed

Ensure the volume mounts and environment variables still work with the new structure.

### 7. Clean up old frontend code

- Remove any unused imports of generated API mutation functions
- Remove `frontend/src/generated/` files that are no longer generated (they'll be gone after `npm run generate:api`)
- Verify all screens work without the removed endpoints

### 8. Update the OpenAPI spec

```bash
cd backend && npm run generate:openapi
cd frontend && npm run generate:api
```

### 9. Final type check and build

```bash
# From root
cd packages/domain && npm run typecheck
cd backend && npm run typecheck && npm run build
cd frontend && npm run typecheck
```

### 10. Clean up plan files

Once everything is working, the phase plan files (`phase-01-*.md` through `phase-09-*.md`) can be moved to a `docs/` directory or deleted. The main `Offline-First_Architecture_Plan.md` should be kept as documentation.

## Files Modified

- `backend/src/splits/splits.controller.ts` — remove write endpoints
- `backend/src/splits/splits.service.ts` — remove write methods
- `backend/src/expenses/expenses.controller.ts` — remove write endpoints
- `backend/src/expenses/expenses.service.ts` — remove write methods
- `backend/src/splits/dto/` — remove unused DTOs
- `backend/src/expenses/dto/` — remove unused DTOs
- `docker/Dockerfile` — update for workspace structure
- `docker/docker-compose.yml` — update if needed
- `frontend/src/generated/` — regenerated (write functions removed)

## Files Potentially Deleted

- `backend/src/splits/dto/create-split.dto.ts`
- `backend/src/splits/dto/update-split.dto.ts`
- `backend/src/expenses/dto/create-expense.dto.ts`
- `backend/src/expenses/dto/update-expense.dto.ts`

## Verification

1. `cd packages/domain && npm run typecheck && npm test` — all pass
2. `cd backend && npm run typecheck && npm run build` — no errors
3. `cd frontend && npm run typecheck` — no errors
4. App works end-to-end: create split, add expense, sync, verify on second device
5. `docker build` succeeds (test the Dockerfile)
6. `docker-compose up` — app runs correctly in container
7. Auth, invitations, and notifications still work via server CRUD
8. No unused code remains (no dead imports, no orphaned files)

## Key Design Decisions

- **Keep read endpoints** — even though the frontend reads from SQLite, the read endpoints are useful for debugging, web clients, or API consumers
- **Don't delete test infrastructure** — keep vitest setup in domain package for ongoing testing
- **Move plan files to docs** — preserves architectural decisions for future reference
