# Phase 4: Set Up Local SQLite on Mobile with Drizzle ORM

## Goal

Set up `expo-sqlite` with `drizzle-orm` in the frontend to provide persistent local storage. Define the local database schema (operations table + materialized view tables) and create a database service layer.

## Prerequisites

- Phase 1 complete (npm workspaces)
- Phase 2 complete (operation types exist in `@splitters/domain`)
- Phase 3 complete (state types exist in `@splitters/domain`)

## Steps

### 1. Install dependencies

```bash
# expo-sqlite is already included in Expo SDK 54, but install explicitly
npx expo install expo-sqlite

# drizzle-orm for type-safe queries
npm install -w splitters-react-native drizzle-orm

# drizzle-kit for schema management (dev only)
npm install -w splitters-react-native -D drizzle-kit
```

### 2. Define drizzle schema (`frontend/src/db/schema.ts`)

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Operations log — append-only, source of truth
export const operations = sqliteTable("operations", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  splitId: text("split_id").notNull(),
  entityId: text("entity_id").notNull(),
  userId: text("user_id").notNull(),
  hlcTimestamp: text("hlc_timestamp").notNull(),
  payload: text("payload").notNull(),          // JSON string
  serverSeq: integer("server_seq"),            // NULL until server confirms
  synced: integer("synced").notNull().default(0),  // 0=pending, 1=synced
});

// Materialized views — derived from operations, for fast reads
export const splits = sqliteTable("splits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  deleted: integer("deleted").notNull().default(0),
});

export const splitMembers = sqliteTable("split_members", {
  splitId: text("split_id").notNull(),
  userId: text("user_id").notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  splitId: text("split_id").notNull(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  date: text("date").notNull(),
  paidById: text("paid_by_id").notNull(),
  deleted: integer("deleted").notNull().default(0),
});

export const expenseShares = sqliteTable("expense_shares", {
  expenseId: text("expense_id").notNull(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
});

// Sync state — tracks last received server sequence per split
export const syncState = sqliteTable("sync_state", {
  splitId: text("split_id").primaryKey(),
  lastServerSeq: integer("last_server_seq").notNull().default(0),
});
```

### 3. Create database initialization (`frontend/src/db/database.ts`)

```typescript
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

const expo = SQLite.openDatabaseSync("splitters.db");
export const db = drizzle(expo, { schema });
```

**Important**: `openDatabaseSync` is the synchronous Expo SQLite API. The database is created on first access and persists across app restarts.

### 4. Create migration logic (`frontend/src/db/migrate.ts`)

For the initial version, use drizzle-kit push or manual `CREATE TABLE IF NOT EXISTS` statements. Since there are no existing users, we can use a simple approach:

```typescript
import * as SQLite from "expo-sqlite";

export function migrateDatabase(db: SQLite.SQLiteDatabase) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS operations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      split_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      hlc_timestamp TEXT NOT NULL,
      payload TEXT NOT NULL,
      server_seq INTEGER,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS splits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS split_members (
      split_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (split_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      split_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      date TEXT NOT NULL,
      paid_by_id TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expense_shares (
      expense_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      PRIMARY KEY (expense_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      split_id TEXT PRIMARY KEY,
      last_server_seq INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_operations_split_synced
      ON operations(split_id, synced);

    CREATE INDEX IF NOT EXISTS idx_operations_split_seq
      ON operations(split_id, server_seq);

    CREATE INDEX IF NOT EXISTS idx_expenses_split
      ON expenses(split_id);
  `);
}
```

### 5. Create database provider (`frontend/src/db/DatabaseProvider.tsx`)

A React context that initializes the database on app start and provides it to the component tree:

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";
import { migrateDatabase } from "./migrate";

type Database = ExpoSQLiteDatabase<typeof schema>;

const DatabaseContext = createContext<Database | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    const sqliteDb = SQLite.openDatabaseSync("splitters.db");
    migrateDatabase(sqliteDb);
    const drizzleDb = drizzle(sqliteDb, { schema });
    setDb(drizzleDb);
  }, []);

  if (!db) return null; // or a loading spinner

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): Database => {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error("useDatabase must be used within DatabaseProvider");
  return db;
};
```

### 6. Wire up in App.tsx

Wrap the app with `DatabaseProvider` (inside `QueryClientProvider`, outside navigation):

```tsx
<QueryClientProvider client={queryClient}>
  <DatabaseProvider>
    <PaperProvider>
      {/* ...existing app content... */}
    </PaperProvider>
  </DatabaseProvider>
</QueryClientProvider>
```

### 7. Create HLC state persistence (`frontend/src/db/hlcStore.ts`)

The HLC state (nodeId + current timestamp + counter) needs to persist across app restarts:

```typescript
import * as SQLite from "expo-sqlite";

// Store HLC state in a simple key-value table (or use AsyncStorage for just this)
// For simplicity, use a dedicated table:

// In migrate.ts, add:
// CREATE TABLE IF NOT EXISTS hlc_state (
//   key TEXT PRIMARY KEY,
//   value TEXT NOT NULL
// );

export function getHLCState(db: SQLite.SQLiteDatabase): HLCState | null { ... }
export function saveHLCState(db: SQLite.SQLiteDatabase, state: HLCState): void { ... }
```

Or simpler: use `expo-secure-store` or just generate a new nodeId each app session (nodeId doesn't need to be stable — it's just for HLC tie-breaking).

**Recommendation**: Generate a new nodeId per app install (persist in SQLite). The counter and physical time don't need persistence — they're re-derived from the wall clock on startup.

## Files Created

- `frontend/src/db/schema.ts` — drizzle table definitions
- `frontend/src/db/database.ts` — database instance
- `frontend/src/db/migrate.ts` — migration/table creation
- `frontend/src/db/DatabaseProvider.tsx` — React context provider
- `frontend/src/db/hlcStore.ts` — HLC state persistence

## Files Modified

- `frontend/package.json` — new dependencies (expo-sqlite, drizzle-orm, drizzle-kit)
- `frontend/App.tsx` (or equivalent) — wrap with `DatabaseProvider`

## Verification

1. App starts on Android/iOS without crashes
2. Database file is created at the expected location
3. All tables are created (verify by logging table names after migration)
4. Can insert a test row into `operations` and read it back
5. App survives restart — data persists
6. `cd frontend && npm run typecheck` passes

## Key Design Decisions

- **`expo-sqlite` with synchronous API** — simpler than async, and fast enough for this use case
- **Manual migrations** instead of drizzle-kit push — more control, works on mobile without build step
- **Separate materialized tables** instead of computing from operations on every read — essential for performance
- **HLC nodeId per install** — not per session, not per user. Simpler and sufficient.
- **JSON payload as TEXT** — SQLite doesn't have a JSON column type. We parse/stringify in the application layer. Drizzle can handle this with custom column types if needed.
