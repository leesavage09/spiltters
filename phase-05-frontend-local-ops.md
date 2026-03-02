# Phase 5: Rebuild Frontend to Write Operations Locally and Read from Materialized State

## Goal

Replace the current REST-based data flow with local operations. After this phase, the frontend creates operations, stores them in SQLite, reduces them into materialized state, and reads from local tables — all without network calls for splits and expenses. Auth, invitations, and notifications remain server-based.

## Prerequisites

- Phase 1-4 complete (workspaces, operations, reducers, local SQLite all set up)

## Steps

### 1. Create the local operation service (`frontend/src/db/operationService.ts`)

This is the core write path. It:
1. Takes a user action (e.g., "create expense")
2. Creates an Operation using `@splitters/domain` builders
3. Inserts it into the local `operations` table
4. Replays the reducer to update materialized tables

```typescript
import { db } from "./database";
import { operations, splits, expenses, expenseShares, splitMembers } from "./schema";
import { createCreateSplitOp, createCreateExpenseOp, /* etc */ } from "@splitters/domain";
import { reduceSplitOperation } from "@splitters/domain";
import type { Operation } from "@splitters/domain";

export class OperationService {
  constructor(private db: Database, private hlcState: HLCState) {}

  createSplit(userId: string, name: string, emoji: string): string {
    const splitId = generateUUID();
    const { operation, hlcState } = createCreateSplitOp({
      hlcState: this.hlcState,
      userId,
      splitId,
      name,
      emoji,
    });
    this.hlcState = hlcState;
    this.applyOperation(operation);
    return splitId;
  }

  createExpense(userId: string, splitId: string, payload: CreateExpensePayload): string {
    const expenseId = generateUUID();
    const { operation, hlcState } = createCreateExpenseOp({
      hlcState: this.hlcState,
      userId,
      splitId,
      expenseId,
      ...payload,
    });
    this.hlcState = hlcState;
    this.applyOperation(operation);
    return expenseId;
  }

  // ... similar methods for update, delete, addMember, removeMember

  private applyOperation(operation: Operation) {
    // 1. Insert into operations table
    this.db.insert(operations).values({
      id: operation.id,
      type: operation.type,
      splitId: operation.splitId,
      entityId: operation.entityId,
      userId: operation.userId,
      hlcTimestamp: operation.hlcTimestamp,
      payload: JSON.stringify(operation.payload),
      synced: 0,
    }).run();

    // 2. Update materialized tables based on operation type
    this.materializeOperation(operation);
  }

  private materializeOperation(operation: Operation) {
    // Switch on operation.type and update the appropriate materialized tables
    // This is essentially the reducer logic but applied to SQLite tables
    switch (operation.type) {
      case "create_split":
        this.db.insert(splits).values({
          id: operation.entityId,
          name: operation.payload.name,
          emoji: operation.payload.emoji,
          deleted: 0,
        }).run();
        this.db.insert(splitMembers).values({
          splitId: operation.entityId,
          userId: operation.userId,
        }).run();
        break;
      // ... handle other operation types
    }
  }
}
```

### 2. Create a React context for the operation service (`frontend/src/db/OperationServiceProvider.tsx`)

```typescript
const OperationServiceContext = createContext<OperationService | null>(null);

export const OperationServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useDatabase();
  const { data: user } = useCurrentUser();

  const service = useMemo(() => {
    if (!db) return null;
    const hlcState = loadOrCreateHLCState(db);
    return new OperationService(db, hlcState);
  }, [db]);

  return (
    <OperationServiceContext.Provider value={service}>
      {children}
    </OperationServiceContext.Provider>
  );
};

export const useOperationService = () => {
  const service = useContext(OperationServiceContext);
  if (!service) throw new Error("useOperationService must be used within OperationServiceProvider");
  return service;
};
```

### 3. Rewrite data hooks to read from local SQLite

**Replace `useSplits` hook** — currently fetches from server via React Query + orval:

```typescript
// OLD: queries server
export const useSplits = () => {
  return useQuery<SplitResponseDto[]>({
    queryKey: ["splits"],
    queryFn: splitsControllerFindAll,
    staleTime: 5 * 60 * 1000,
  });
};

// NEW: queries local SQLite
export const useSplits = () => {
  const db = useDatabase();
  return useQuery({
    queryKey: ["local", "splits"],
    queryFn: () => {
      const allSplits = db.select().from(splits).where(eq(splits.deleted, 0)).all();
      // For each split, get members
      return allSplits.map(split => ({
        ...split,
        members: db.select().from(splitMembers).where(eq(splitMembers.splitId, split.id)).all(),
      }));
    },
  });
};
```

**Replace `useExpenses` hook** — currently uses infinite query against server:

```typescript
// NEW: queries local SQLite
export const useExpenses = (splitId: string) => {
  const db = useDatabase();
  return useQuery({
    queryKey: ["local", "expenses", splitId],
    queryFn: () => {
      const allExpenses = db.select().from(expenses)
        .where(and(eq(expenses.splitId, splitId), eq(expenses.deleted, 0)))
        .orderBy(desc(expenses.date))
        .all();
      // For each expense, get shares
      return allExpenses.map(expense => ({
        ...expense,
        shares: db.select().from(expenseShares).where(eq(expenseShares.expenseId, expense.id)).all(),
      }));
    },
  });
};
```

**Note**: We're switching from infinite query (pagination) to loading all expenses for a split. Since data is local, pagination is unnecessary — SQLite is fast enough to load thousands of rows instantly. If this becomes a performance issue later, add virtual list rendering (not pagination).

### 4. Rewrite mutation hooks to create local operations

**Replace `useCreateSplit`:**

```typescript
// NEW: creates local operation
export const useCreateSplit = () => {
  const queryClient = useQueryClient();
  const operationService = useOperationService();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: (data: { name: string; emoji: string }) => {
      const splitId = operationService.createSplit(user.id, data.name, data.emoji);
      return splitId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local", "splits"] });
    },
  });
};
```

**Replace `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`** — same pattern: call `operationService` method, invalidate local query cache.

### 5. Keep auth, invitations, and notifications hooks unchanged

These still use the server API:
- `useCurrentUser`, `useLogin`, `useRegister`, `useLogout`, `useUpdateProfile` — unchanged
- `useCreateInvitation`, `useAcceptInvitation` — unchanged
- `useNotifications`, `useUnreadNotificationCount`, `useMarkNotificationRead` — unchanged

### 6. Update screens to use new hook signatures

The screen components may need minor updates if the return types changed (e.g., `SplitResponseDto` → local split type). Key screens to update:

- `HomeScreen.tsx` — uses `useSplits()`, `useCreateSplit()`
- `SplitDetailScreen.tsx` — uses `useExpenses()`, `useCreateExpense()`, `useUpdateSplit()`, `useDeleteSplit()`
- `ExpenseDetailScreen.tsx` — uses `useUpdateExpense()`, `useDeleteExpense()`

The response shapes should be kept as close to the existing DTOs as possible to minimize screen changes.

### 7. Update App.tsx provider tree

```tsx
<QueryClientProvider client={queryClient}>
  <DatabaseProvider>
    <OperationServiceProvider>
      <PaperProvider>
        <SnackbarProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SnackbarProvider>
      </PaperProvider>
    </OperationServiceProvider>
  </DatabaseProvider>
</QueryClientProvider>
```

## Files Created

- `frontend/src/db/operationService.ts`
- `frontend/src/db/OperationServiceProvider.tsx`

## Files Modified

- `frontend/src/hooks/useSplits.ts` — rewritten to read from local SQLite
- `frontend/src/hooks/useExpenses.ts` — rewritten to read from local SQLite
- `frontend/src/screens/HomeScreen.tsx` — minor type adjustments if needed
- `frontend/src/screens/split-detail/SplitDetailScreen.tsx` — minor type adjustments
- `frontend/src/screens/expense-detail/ExpenseDetailScreen.tsx` — minor type adjustments
- `frontend/App.tsx` — add `OperationServiceProvider`

## Files NOT Modified (remain server-based)

- `frontend/src/hooks/useAuth.ts`
- `frontend/src/hooks/useInvitations.ts`
- `frontend/src/hooks/useNotifications.ts`
- All generated API files (`frontend/src/generated/`)

## Verification

1. App starts without crashes
2. Create a split → appears in the splits list instantly (no network needed)
3. Create an expense → appears in the expenses list instantly
4. Update an expense → changes reflected immediately
5. Delete an expense → disappears from the list
6. Kill and restart the app → all data persists
7. Put phone in airplane mode → all CRUD operations still work
8. Auth still works (requires network for login/register)
9. `cd frontend && npm run typecheck` passes

## Key Design Decisions

- **No pagination for local reads** — SQLite is fast enough to load all expenses for a split. Simpler code, instant UI.
- **React Query still used** — but queries read from SQLite instead of network. This preserves the existing reactive UI pattern (invalidate on mutation → re-read → re-render).
- **Operation service as class** — holds HLC state as mutable instance state. Simpler than threading HLC through every hook.
- **Materialization happens inline** — when an operation is created, the materialized tables are updated immediately. No separate "rebuild" step needed for local operations.

## Important Notes

- After this phase, the app works **offline-only**. Splits and expenses exist only on the device. Sync comes in Phase 7.
- Users who were added via invitations (server-side) won't appear in local split members yet. This is addressed in Phase 7 when sync populates local state from the server.
- The `add_member` operation will eventually be triggered by the sync process (when the server tells us a new member was added via invitation). For now, creating a split automatically adds the creating user as a member.
