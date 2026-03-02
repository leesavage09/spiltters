# Phase 3: Implement Reducers (Operations → State) with Unit Tests

## Goal

Implement pure reducer functions that fold a list of operations into materialized state. These are the core of the offline-first system — used identically on client and server to derive current state from the operation log.

## Prerequisites

- Phase 2 complete (operation types, Zod schemas, and HLC exist in `@splitters/domain`)

## Steps

### 1. Define materialized state types (`packages/domain/src/state/types.ts`)

```typescript
export interface SplitState {
  id: string;
  name: string;
  emoji: string;
  members: string[];   // userIds
  deleted: boolean;
}

export interface ExpenseState {
  id: string;
  splitId: string;
  title: string;
  amount: number;       // in pence/cents
  currency: string;
  date: string;         // ISO date
  paidById: string;
  shares: { userId: string; amount: number }[];
  deleted: boolean;
}

export interface SplitMaterializedState {
  split: SplitState | null;
  expenses: Map<string, ExpenseState>;  // keyed by expense ID
}
```

### 2. Implement the split reducer (`packages/domain/src/reducers/split.ts`)

A pure function that takes a `SplitMaterializedState` and an `Operation`, and returns a new `SplitMaterializedState`.

```typescript
export function reduceSplitOperation(
  state: SplitMaterializedState,
  operation: Operation,
): SplitMaterializedState
```

**Operation handling:**

| Operation | Behavior |
|-----------|----------|
| `create_split` | Create the SplitState with name, emoji, and userId as first member |
| `update_split` | Update name/emoji if split exists and not deleted |
| `delete_split` | Set `deleted: true` |
| `add_member` | Add memberId to members array (idempotent — skip if already present) |
| `remove_member` | Remove memberId from members array |
| `create_expense` | Add new ExpenseState to the expenses map |
| `update_expense` | Replace the ExpenseState (full replacement, not merge) if not deleted |
| `delete_expense` | Set `deleted: true` on the expense |

**Conflict resolution rules (built into the reducer):**

- Operations must be applied in HLC order (caller is responsible for sorting)
- Update on a deleted entity → no-op (delete wins)
- Create on an entity that already exists → no-op (idempotent)
- Delete on a non-existent entity → no-op (idempotent)

### 3. Implement the bulk replay function (`packages/domain/src/reducers/replay.ts`)

```typescript
export function replayOperations(
  operations: Operation[]  // may be unsorted
): SplitMaterializedState
```

This function:
1. Sorts operations by HLC timestamp (using `compareHLCTimestamps`)
2. Groups them by splitId (or operates on a single split's operations)
3. Reduces them one-by-one through `reduceSplitOperation`
4. Returns the final materialized state

### 4. Implement validation functions (`packages/domain/src/validation/invariants.ts`)

These check business rules that span multiple pieces of state:

```typescript
export function validateExpenseInvariants(
  expense: CreateExpensePayload | UpdateExpensePayload,
  splitMembers: string[],
): { valid: boolean; errors: string[] }
```

Checks:
- `paidById` must be in `splitMembers`
- All share `userId`s must be in `splitMembers`
- Sum of share amounts must equal total expense amount
- Amount must be positive

```typescript
export function validateOperationAgainstState(
  operation: Operation,
  state: SplitMaterializedState,
): { valid: boolean; errors: string[] }
```

Checks contextual validity:
- Can't create expense in a deleted split
- Can't update a deleted expense
- Can't remove the last member of a split (or can we? — decide based on current behavior: only single-user splits can be deleted)

### 5. Set up testing (`packages/domain`)

Install vitest (lightweight, fast, TS-native):

```bash
npm install -w @splitters/domain -D vitest
```

Add to `packages/domain/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### 6. Write unit tests (`packages/domain/src/__tests__/`)

**`reducers.test.ts`** — test the reducer with various operation sequences:

- Create a split → verify state has the split
- Create split + add member → verify members array
- Create split + create expense → verify expense in state
- Create split + create expense + delete expense → verify expense is deleted
- Create split + create expense + update expense → verify expense is updated
- Create split + delete split + create expense → expense is no-op (split deleted)
- Concurrent updates → last by HLC wins
- Idempotent creates → creating same entity twice is safe

**`hlc.test.ts`** — test the HLC:

- Monotonically increasing timestamps
- Counter increments when physical time doesn't change
- Receive merges correctly
- Comparison function orders correctly

**`validation.test.ts`** — test invariants:

- Shares must sum to amount
- PaidBy must be a member
- All share users must be members

### 7. Update barrel export

`packages/domain/src/index.ts` — add exports for:
- State types
- Reducers
- Validation functions

## Files Created

- `packages/domain/src/state/types.ts`
- `packages/domain/src/reducers/split.ts`
- `packages/domain/src/reducers/replay.ts`
- `packages/domain/src/validation/invariants.ts`
- `packages/domain/src/__tests__/reducers.test.ts`
- `packages/domain/src/__tests__/hlc.test.ts`
- `packages/domain/src/__tests__/validation.test.ts`

## Files Modified

- `packages/domain/package.json` — add vitest, add test scripts
- `packages/domain/src/index.ts` — add exports

## Verification

1. `cd packages/domain && npm test` — all tests pass
2. `cd packages/domain && npm run typecheck` — no type errors
3. `cd backend && npm run typecheck` — still passes
4. `cd frontend && npm run typecheck` — still passes

## Key Design Decisions

- **Reducers are pure functions** — no side effects, no database calls. This makes them trivially testable and identical on client/server.
- **Operations must be sorted before reducing** — the caller (client or server) is responsible for sorting. The reducer assumes correct order.
- **Full replacement for updates** — `update_expense` carries the complete expense state, not a partial diff. This avoids merge complexity.
- **Deleted entities stay in state** with `deleted: true` — this is needed so that late-arriving updates to deleted entities are correctly handled (the delete is visible to the reducer).
