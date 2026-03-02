# Offline-First Architecture Plan

## Context

The Splitters app is a financial cost-splitting app (React Native + Expo frontend, NestJS + Prisma + PostgreSQL backend). It currently uses traditional CRUD with no offline support — all state lives in React Query's in-memory cache and is lost on app close. There are no existing users, so this is a clean-slate redesign.

The goal is an **offline-first, server-reconciled** architecture where every user action is an immutable operation, and state is derived by replaying operations. This ensures financial data is never double-counted or silently overwritten.

---

## 1. Operation Model (Event Sourcing Lite)

Every user action produces an **immutable operation** stored in an append-only log. Current state is derived by replaying these operations through pure reducers.

### Operation Types

| Operation | Payload |
|-----------|---------|
| `create_split` | name, emoji |
| `update_split` | name?, emoji? |
| `delete_split` | (none) |
| `add_member` | userId |
| `remove_member` | userId |
| `create_expense` | title, amount, currency, date, paidById, shares[] |
| `update_expense` | title?, amount?, currency?, date?, paidById?, shares[]? |
| `delete_expense` | (none) |

### Operation Envelope

Every operation carries:

```
{
  id:          string    // Client-generated UUID
  type:        string    // Operation type enum
  splitId:     string    // Scoping — all ops belong to a split
  entityId:    string    // The entity being acted on (split ID, expense ID, etc.)
  userId:      string    // Who performed the action
  hlcTimestamp: string   // Hybrid Logical Clock timestamp
  payload:     object    // Type-specific data
  serverSeq?:  number    // Assigned by server on receipt (monotonic per split)
}
```

### Ordering: Hybrid Logical Clocks (HLC)

**Recommended over Lamport clocks** because:
- Preserves wall-clock correlation (useful for "when was this expense added?")
- Still provides causal ordering guarantees
- Simple to implement (~50 lines of TypeScript)
- No external package needed — lives in the shared domain package

Operations are **totally ordered** by: `(hlcTimestamp, operationId)` where `operationId` breaks ties.

---

## 2. Shared Domain Package

A new `packages/domain/` directory, set up as an **npm workspace** (requires adding a root `package.json` with `"workspaces": ["packages/*", "frontend", "backend"]`).

### Structure

```
packages/domain/
├── src/
│   ├── operations/        # Operation type definitions + Zod schemas
│   │   ├── schemas.ts     # Zod schemas for each operation type
│   │   └── types.ts       # TypeScript types derived from schemas
│   ├── reducers/          # Pure: Operation[] → MaterializedState
│   │   ├── split.ts       # Reduces split operations into split state
│   │   └── expense.ts     # Reduces expense operations into expense state
│   ├── validation/        # Business rule validation
│   │   └── invariants.ts  # e.g., shares must sum to amount
│   ├── clock/             # HLC implementation
│   │   └── hlc.ts
│   └── index.ts
├── package.json           # name: "@splitters/domain"
└── tsconfig.json
```

### Key Responsibilities

- **Operation schemas** (Zod): validate operation structure and payload
- **Reducers**: pure functions that fold an operation list into materialized state — used identically on client and server
- **Invariant checks**: business rules (shares sum to amount, member exists in split, etc.)
- **HLC**: timestamp generation and comparison
- **Zero platform dependencies**: no Node APIs, no React Native APIs, no database calls

### Why npm Workspaces

- Minimal setup (one root `package.json`)
- Works with both NestJS and React Native / Metro bundler
- No additional tooling (no Nx, no Turborepo)
- `@splitters/domain` imported as a regular package in both frontend and backend

---

## 3. Local Storage (Mobile-First)

### Recommended: `expo-sqlite`

- **Built into Expo** — no native module linking, no ejecting
- Synchronous API available for fast reads
- Well-maintained, actively developed by Expo team
- Works on iOS and Android out of the box

### drizzle-orm on top of `expo-sqlite`

- Type-safe query builder for SQLite
- Lightweight, works well with Expo
- Makes local DB queries feel like Prisma
- Has a `drizzle-kit` for local schema management

### Local Database Schema

```
operations (
  id              TEXT PRIMARY KEY,    -- Client-generated UUID
  type            TEXT NOT NULL,
  split_id        TEXT NOT NULL,
  entity_id       TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  hlc_timestamp   TEXT NOT NULL,
  payload         TEXT NOT NULL,       -- JSON
  server_seq      INTEGER,            -- NULL until confirmed by server
  synced          INTEGER DEFAULT 0   -- 0 = pending, 1 = synced
)

-- Materialized views (derived from operations, rebuilt on change)
splits (id, name, emoji, deleted)
split_members (split_id, user_id)
expenses (id, split_id, title, amount, currency, date, paid_by_id, deleted)
expense_shares (expense_id, user_id, amount)

-- Sync metadata
sync_state (
  split_id        TEXT PRIMARY KEY,
  last_server_seq INTEGER DEFAULT 0   -- Last received server sequence
)
```

### How It Works

1. **Writes**: User action → create Operation → insert into `operations` table (synced=0) → replay reducer → update materialized tables → UI updates instantly
2. **Reads**: UI reads from materialized tables (fast, indexed) — never replays operations on every read
3. **Sync**: Push unsynced operations, pull new ones, replay into materialized state

---

## 4. Sync Protocol

### Endpoints

```
POST /api/sync/:splitId
  Request:  { operations: Operation[], lastServerSeq: number }
  Response: { operations: Operation[], serverSeq: number }
```

Single endpoint per split. Client sends its pending operations AND its last known server sequence. Server responds with all operations the client hasn't seen (including the client's own, now with `serverSeq` assigned).

### Push Flow (Client → Server)

1. Client collects all unsynced operations for a split
2. Sends them to server
3. Server validates each operation using shared domain validation
4. Server assigns monotonic `serverSeq` per split
5. Server applies operations to its own materialized state (PostgreSQL)
6. Server responds with new operations since client's `lastServerSeq`

### Pull Flow (Server → Client)

1. Client sends `lastServerSeq` (can be 0 for first sync)
2. Server returns all operations with `serverSeq > lastServerSeq`
3. Client stores new operations, replays reducers, updates materialized state
4. Client updates `lastServerSeq`

### Conflict Resolution

**Financial data demands simplicity and predictability:**

- **Independent creates** (two users add expenses offline): **No conflict** — both operations are kept. This is the common case.
- **Concurrent updates** to the same expense: **Last-writer-wins by HLC timestamp**. The full expense state is in the update operation, so it's a clean replacement, not a partial merge.
- **Delete vs. update**: **Delete wins**. If user A deletes an expense while user B edits it offline, the delete takes precedence. The UI should show "this expense was deleted by another user" when the edit is rejected.
- **Invariant violations**: If an offline operation violates invariants when replayed on the server (e.g., user was removed from split), the server **rejects** that operation and returns an error operation so the client can inform the user.

### First Sync (New Device / Fresh Install)

1. Client has no local data
2. Calls sync with `lastServerSeq: 0`
3. Server returns all operations (or a snapshot + recent operations for large splits)
4. Client replays everything locally

### Compaction (Future Optimization)

For splits with very long operation histories:
- Server periodically creates **snapshots** (materialized state at a point in time)
- New clients download snapshot + operations since snapshot
- Not needed initially — small groups won't have huge histories

---

## 5. Backend Changes

### New: Operations Table

```prisma
model Operation {
  id            String   @id
  type          String
  splitId       String
  entityId      String
  userId        String
  hlcTimestamp  String
  payload       Json
  serverSeq     Int      // Monotonic per split, assigned on receipt
  createdAt     DateTime @default(now())

  @@index([splitId, serverSeq])
}
```

### Materialized State

The existing Prisma models (Split, Expense, ExpenseShare, etc.) **remain but become derived state**. They are rebuilt by applying operations through the shared domain reducers. This means:

- Existing query patterns still work (the backend can still query PostgreSQL for expenses, balances, etc.)
- The operation log is the source of truth
- Materialized state is a read-optimized cache

### Validation

Server uses `@splitters/domain` validation to check each incoming operation before accepting it. Same validation runs on client before creating the operation (fail-fast for obvious errors).

### Existing CRUD Endpoints

- **Splits & Expenses**: All writes go through the sync endpoint. Old CRUD write endpoints are removed.
- **Invitations & Notifications**: Stay as traditional CRUD — these features inherently require connectivity and don't need offline support.
- **Auth**: Stays as-is (JWT/cookie-based).

---

## 6. Frontend Changes

### Data Flow (New)

```
User Action
    ↓
Create Operation (using @splitters/domain)
    ↓
Store in local SQLite (synced=0)
    ↓
Replay reducer → update materialized tables
    ↓
UI updates instantly (reads from materialized tables)
    ↓
Manual sync pushes to server when triggered
```

### React Query Adaptation

- **Queries** read from local SQLite instead of making API calls
- **Mutations** create local operations (instant, no network needed)
- React Query's cache is backed by SQLite — survives app restarts
- `useSyncStatus()` hook exposes: online/offline, pending operation count, last sync time

### Sync Trigger: Manual (Pull-to-Refresh)

Start simple — user explicitly triggers sync (e.g., pull-to-refresh on split detail screen). This avoids background sync complexity. Can upgrade to auto-sync later.

### UI Indicators

- Sync button / pull-to-refresh
- Pending changes count (unsynced operations)
- "Deleted by another user" toasts when conflicts are resolved during sync

---

## 7. Web Support Assessment

### Effort: Moderate

- **expo-sqlite** has experimental web support (using OPFS/IndexedDB as backend) — if it matures, the same code works everywhere
- **Fallback**: Use `idb` or `Dexie.js` for web with a thin storage abstraction layer
- The shared domain package is already platform-agnostic, so only the storage layer differs

### Recommendation

**Design the storage API to be pluggable from day one**, but **implement mobile only first**. The abstraction cost is minimal (a simple interface for CRUD on operations and materialized tables). Web can be added later by implementing the same interface with IndexedDB.

**Verdict**: Defer web implementation, but don't make decisions that prevent it.

---

## 8. Recommended npm Packages

| Component | Package | Rationale |
|-----------|---------|-----------|
| Local DB (mobile) | `expo-sqlite` | Built into Expo, no native linking |
| Local DB queries | `drizzle-orm` + `drizzle-orm/expo-sqlite` | Type-safe queries, lightweight |
| Schema validation | `zod` | Works everywhere, great DX |
| UUID generation | `expo-crypto` (randomUUID) | Built into Expo, works offline |
| Network detection | `@react-native-community/netinfo` | Standard RN network status |
| Monorepo | npm workspaces (built-in) | No additional tooling |

**Not recommended:**
- PowerSync / ElectricSQL — opinionated sync that fights against custom operation model
- WatermelonDB — adds complexity; expo-sqlite + drizzle is simpler
- Automerge / Yjs (CRDTs) — overkill; explicit conflict resolution is clearer for financial data

---

## 9. Implementation Phases

Since there are no existing users, this is a **clean-slate rebuild**, not an incremental migration.

Each phase has a detailed plan in a numbered file:

1. **Phase 1** (`phase-01-npm-workspaces.md`) — Set up npm workspaces + create `@splitters/domain` package
2. **Phase 2** (`phase-02-operations-and-hlc.md`) — Define operations + Zod schemas + implement HLC
3. **Phase 3** (`phase-03-reducers.md`) — Implement reducers (operations → state) with unit tests
4. **Phase 4** (`phase-04-local-sqlite.md`) — Set up local SQLite on mobile with drizzle-orm
5. **Phase 5** (`phase-05-frontend-local-ops.md`) — Rebuild frontend to write operations locally and read from materialized state
6. **Phase 6** (`phase-06-backend-sync.md`) — Add sync endpoints to backend + operations table
7. **Phase 7** (`phase-07-frontend-sync.md`) — Implement sync on frontend (push/pull via manual trigger)
8. **Phase 8** (`phase-08-sync-ui.md`) — Add sync UI (status indicators, conflict notifications)
9. **Phase 9** (`phase-09-cleanup.md`) — Remove old CRUD endpoints, final cleanup

---

## 10. Key Risks and Trade-offs

| Risk | Mitigation |
|------|------------|
| Complexity increase | Shared domain package keeps logic DRY; reducers are pure and testable |
| Operation log growth | Compaction/snapshots (implement later when needed) |
| Clock drift between devices | HLC handles this — physical clock drift is bounded by the logical component |
| Offline delete conflicts | Delete-wins policy is simple and predictable; UI notifies affected users |
| Expo-sqlite web maturity | Storage API abstraction makes the DB layer swappable |

### Trade-offs Made

- **Last-writer-wins over CRDT merging**: Simpler, more predictable for financial data. Users occasionally overwrite each other's edits, but never silently corrupt totals.
- **Custom sync over off-the-shelf**: More work upfront, but the operation model is simple enough that a custom protocol is straightforward and avoids vendor lock-in.
- **Full operation replay over partial updates**: Simpler to reason about correctness. Performance is fine for small groups (< 10k operations per split).

---

## Decisions Made

- **Sync trigger**: Manual (pull-to-refresh) to start — keep it simple, upgrade to auto-sync later
- **Monorepo**: npm workspaces with `@splitters/domain` shared package
- **Invitations & Notifications**: Stay server-side CRUD — they inherently require connectivity
- **Local DB**: drizzle-orm on top of expo-sqlite for type-safe local queries
