# Phase 7: Implement Sync on Frontend (Push/Pull via Manual Trigger)

## Goal

Connect the offline-capable frontend (Phase 5) to the backend sync endpoint (Phase 6). Users can manually trigger sync (pull-to-refresh) to push local operations to the server and pull new operations from other users.

## Prerequisites

- Phase 5 complete (frontend writes operations locally)
- Phase 6 complete (backend sync endpoint exists)
- OpenAPI spec regenerated and frontend API client updated

## Steps

### 1. Create the sync service (`frontend/src/sync/syncService.ts`)

```typescript
import { db } from "../db/database";
import { operations, syncState } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { Operation } from "@splitters/domain";
import { receiveHLC } from "@splitters/domain";

// Use the generated API client (from orval) or raw axios for the sync endpoint
import { customInstance } from "../api/client";

interface SyncResult {
  pushed: number;    // operations sent to server
  pulled: number;    // operations received from server
  errors: string[];  // any error messages
}

export async function syncSplit(splitId: string): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] };

  // 1. Get unsynced local operations for this split
  const pendingOps = db.select()
    .from(operations)
    .where(and(
      eq(operations.splitId, splitId),
      eq(operations.synced, 0),
    ))
    .all();

  // 2. Get last known server sequence for this split
  const syncRecord = db.select()
    .from(syncState)
    .where(eq(syncState.splitId, splitId))
    .get();

  const lastServerSeq = syncRecord?.lastServerSeq ?? 0;

  // 3. Call the sync endpoint
  const response = await customInstance<SyncResponseDto>({
    url: `/api/sync/${splitId}`,
    method: "POST",
    data: {
      operations: pendingOps.map(op => ({
        id: op.id,
        type: op.type,
        splitId: op.splitId,
        entityId: op.entityId,
        userId: op.userId,
        hlcTimestamp: op.hlcTimestamp,
        payload: JSON.parse(op.payload),
      })),
      lastServerSeq,
    },
  });

  result.pushed = pendingOps.length;

  // 4. Mark pushed operations as synced
  for (const op of pendingOps) {
    db.update(operations)
      .set({ synced: 1 })
      .where(eq(operations.id, op.id))
      .run();
  }

  // 5. Process incoming operations from server
  for (const serverOp of response.operations) {
    // Skip operations we already have locally
    const exists = db.select()
      .from(operations)
      .where(eq(operations.id, serverOp.id))
      .get();

    if (exists) {
      // Update serverSeq if we didn't have it
      if (!exists.serverSeq) {
        db.update(operations)
          .set({ serverSeq: serverOp.serverSeq, synced: 1 })
          .where(eq(operations.id, serverOp.id))
          .run();
      }
      continue;
    }

    // Store new operation from server
    db.insert(operations).values({
      id: serverOp.id,
      type: serverOp.type,
      splitId: serverOp.splitId,
      entityId: serverOp.entityId,
      userId: serverOp.userId,
      hlcTimestamp: serverOp.hlcTimestamp,
      payload: JSON.stringify(serverOp.payload),
      serverSeq: serverOp.serverSeq,
      synced: 1,
    }).run();

    // Apply to materialized state
    materializeOperation(serverOp);

    result.pulled++;
  }

  // 6. Update sync state
  if (response.serverSeq > lastServerSeq) {
    db.insert(syncState)
      .values({ splitId, lastServerSeq: response.serverSeq })
      .onConflictDoUpdate({
        target: syncState.splitId,
        set: { lastServerSeq: response.serverSeq },
      })
      .run();
  }

  // 7. Update HLC state with received timestamps
  // (receive the max HLC timestamp from server operations to keep clocks in sync)

  return result;
}

// Sync all splits the user is a member of
export async function syncAll(): Promise<SyncResult[]> {
  const allSplits = db.select().from(splits).where(eq(splits.deleted, 0)).all();
  const results: SyncResult[] = [];

  for (const split of allSplits) {
    try {
      const result = await syncSplit(split.id);
      results.push(result);
    } catch (error) {
      results.push({
        pushed: 0,
        pulled: 0,
        errors: [extractErrorMessage(error, `Failed to sync split ${split.id}`)],
      });
    }
  }

  return results;
}
```

### 2. Handle materialization of server operations

The `materializeOperation` function (used in step 5 above) must handle incoming server operations, including those from **other users**. This is the same logic as in `operationService.ts` but may need to handle conflicts:

- **New expense from another user**: Insert into materialized tables
- **Update to an expense we also updated**: Last-writer-wins by HLC — may need to rebuild the expense from the full operation history
- **Delete of something we edited**: Remove from materialized tables

For simplicity in the first implementation: when we receive server operations, **rebuild the entire materialized state for that split** from the full operation log. This is safe and correct, though slightly slower. Optimize later if needed.

```typescript
function rebuildMaterializedState(splitId: string) {
  // 1. Get all operations for this split, sorted by HLC
  const allOps = db.select()
    .from(operations)
    .where(eq(operations.splitId, splitId))
    .all()
    .sort((a, b) => compareHLCTimestamps(a.hlcTimestamp, b.hlcTimestamp));

  // 2. Clear existing materialized state for this split
  db.delete(expenseShares).where(/* expenses in this split */).run();
  db.delete(expenses).where(eq(expenses.splitId, splitId)).run();
  db.delete(splitMembers).where(eq(splitMembers.splitId, splitId)).run();
  db.delete(splits).where(eq(splits.id, splitId)).run();

  // 3. Replay all operations through the reducer
  for (const op of allOps) {
    const parsed = JSON.parse(op.payload);
    materializeOperation({ ...op, payload: parsed });
  }
}
```

### 3. Create the sync hook (`frontend/src/hooks/useSync.ts`)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncSplit, syncAll } from "../sync/syncService";

export const useSyncSplit = (splitId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncSplit(splitId),
    onSuccess: () => {
      // Invalidate all local queries for this split
      queryClient.invalidateQueries({ queryKey: ["local", "splits"] });
      queryClient.invalidateQueries({ queryKey: ["local", "expenses", splitId] });
    },
  });
};

export const useSyncAll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local"] });
    },
  });
};

export const usePendingOperationCount = (splitId?: string) => {
  const db = useDatabase();

  return useQuery({
    queryKey: ["local", "pending-ops", splitId],
    queryFn: () => {
      const where = splitId
        ? and(eq(operations.splitId, splitId), eq(operations.synced, 0))
        : eq(operations.synced, 0);
      return db.select().from(operations).where(where).all().length;
    },
  });
};
```

### 4. Add pull-to-refresh to SplitDetailScreen

```typescript
const { mutate: sync, isPending: isSyncing } = useSyncSplit(splitId);

// In the FlatList or ScrollView:
<FlatList
  refreshing={isSyncing}
  onRefresh={() => sync()}
  // ... existing props
/>
```

### 5. Add sync-all to HomeScreen

```typescript
const { mutate: syncAll, isPending: isSyncing } = useSyncAll();

// Pull-to-refresh on the splits list:
<FlatList
  refreshing={isSyncing}
  onRefresh={() => syncAll()}
  // ... existing props
/>
```

### 6. Handle initial sync after login

When a user logs in, they need to pull all their data from the server. This is the "first sync":

```typescript
// In useLogin, after successful login:
onSuccess: async (data) => {
  queryClient.setQueryData(["auth", "me"], data);

  // Fetch user's splits from server (need a lightweight endpoint or sync all)
  // Option A: Use existing GET /api/splits to get split IDs, then sync each
  // Option B: Add a GET /api/sync/init endpoint that returns all split IDs
  // Option C: Sync on first visit to each screen (lazy)

  // Recommendation: Option C (lazy sync) — simplest
  // When the user opens the splits list, check if we have any local data.
  // If not, call the server to get their split IDs, then sync each.
};
```

**Recommended approach**: Keep the existing `GET /api/splits` endpoint as a read-only convenience. Use it on login to discover which splits the user belongs to, then sync each split lazily.

### 7. Handle first-time sync for a split

When a user first opens a split (or after accepting an invitation), they need to do an initial sync:

```typescript
// In the SplitDetail screen or the splits list:
useEffect(() => {
  const syncRecord = db.select().from(syncState).where(eq(syncState.splitId, splitId)).get();
  if (!syncRecord) {
    // Never synced this split — trigger initial sync
    sync();
  }
}, [splitId]);
```

## Files Created

- `frontend/src/sync/syncService.ts`
- `frontend/src/hooks/useSync.ts`

## Files Modified

- `frontend/src/screens/split-detail/SplitDetailScreen.tsx` — add pull-to-refresh sync
- `frontend/src/screens/HomeScreen.tsx` — add pull-to-refresh sync all
- `frontend/src/hooks/useAuth.ts` — trigger initial sync after login (optional)
- `frontend/src/hooks/useSplits.ts` — possibly add first-sync check

## Verification

1. **Create a split offline** → pull-to-refresh → split appears on the server (check DB or second client)
2. **Create an expense offline** → sync → expense appears on server
3. **Two users**: User A creates expense while offline, User B creates expense while offline, both sync → both expenses appear for both users
4. **Edit conflict**: User A edits expense title while offline, User B edits same expense while offline, both sync → last edit by HLC wins, both users see the same final state
5. **Delete conflict**: User A deletes expense while offline, User B edits same expense while offline, both sync → expense is deleted for both users
6. **First sync**: Fresh install, login, open splits list → splits load from server
7. **Pending indicator**: Create operation while offline → pending count shows > 0 → sync → pending count drops to 0
8. `cd frontend && npm run typecheck` passes

## Key Design Decisions

- **Rebuild materialized state on incoming ops** — simpler and correct. May optimize to incremental application later.
- **Sequential split syncing** — sync one split at a time. Could parallelize later, but sequential is simpler and avoids race conditions.
- **Lazy first sync** — don't download everything on login. Sync each split when the user first opens it. Faster login, less data transfer.
- **Keep `GET /api/splits` for discovery** — read-only convenience endpoint to know which splits the user belongs to. The full data comes through the sync endpoint.
