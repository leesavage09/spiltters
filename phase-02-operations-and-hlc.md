# Phase 2: Define Operations + Zod Schemas + Implement HLC

## Goal

Define all operation types with Zod schemas and implement the Hybrid Logical Clock in `@splitters/domain`. After this phase, both frontend and backend can create, validate, and order operations.

## Prerequisites

- Phase 1 complete (npm workspaces + `@splitters/domain` package exists with `zod` installed)

## Steps

### 1. Implement Hybrid Logical Clock (`packages/domain/src/clock/hlc.ts`)

The HLC combines a physical timestamp with a logical counter to provide causal ordering even with clock drift.

```typescript
// HLC timestamp format: "{physicalMs}:{counter}:{nodeId}"
// Example: "1709312400000:0:abc123"
//
// Comparison: lexicographic on physical time, then counter, then nodeId
```

**HLC state**: `{ physicalMs: number, counter: number, nodeId: string }`

**Key functions to implement:**

- `createHLC(nodeId: string): HLCState` — initialize with current time, counter 0
- `tickHLC(state: HLCState): { state: HLCState, timestamp: string }` — advance clock for a local event
- `receiveHLC(local: HLCState, remoteTimestamp: string): HLCState` — update local clock after receiving a remote event
- `compareHLCTimestamps(a: string, b: string): number` — compare two HLC timestamp strings (-1, 0, 1)
- `formatHLC(state: HLCState): string` — serialize HLC state to string
- `parseHLC(timestamp: string): { physicalMs: number, counter: number, nodeId: string }` — deserialize

**Tick algorithm:**
1. `newPhysical = max(state.physicalMs, Date.now())`
2. If `newPhysical === state.physicalMs`: increment counter
3. Else: reset counter to 0
4. Update `state.physicalMs = newPhysical`, `state.counter = newCounter`

**Receive algorithm:**
1. `newPhysical = max(local.physicalMs, remote.physicalMs, Date.now())`
2. If all three equal: `counter = max(local.counter, remote.counter) + 1`
3. If `newPhysical === local.physicalMs`: `counter = local.counter + 1`
4. If `newPhysical === remote.physicalMs`: `counter = remote.counter + 1`
5. Else: `counter = 0`

**nodeId**: Use a random string per client instance (generated once on app start, stored locally). The backend server uses its own fixed nodeId.

### 2. Define operation type enum (`packages/domain/src/operations/types.ts`)

```typescript
export const OperationType = {
  CREATE_SPLIT: "create_split",
  UPDATE_SPLIT: "update_split",
  DELETE_SPLIT: "delete_split",
  ADD_MEMBER: "add_member",
  REMOVE_MEMBER: "remove_member",
  CREATE_EXPENSE: "create_expense",
  UPDATE_EXPENSE: "update_expense",
  DELETE_EXPENSE: "delete_expense",
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];
```

### 3. Define Zod schemas (`packages/domain/src/operations/schemas.ts`)

**Operation envelope schema** (common to all operations):

```typescript
const baseOperationSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(OperationType),
  splitId: z.string(),
  entityId: z.string(),
  userId: z.string(),
  hlcTimestamp: z.string(),
});
```

**Payload schemas** (one per operation type):

```typescript
const createSplitPayload = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().min(1).max(10),
});

const updateSplitPayload = z.object({
  name: z.string().min(1).max(50).optional(),
  emoji: z.string().min(1).max(10).optional(),
});

const deleteSplitPayload = z.object({});

const addMemberPayload = z.object({
  memberId: z.string(),
});

const removeMemberPayload = z.object({
  memberId: z.string(),
});

const expenseShareSchema = z.object({
  userId: z.string(),
  amount: z.number().int(),
});

const createExpensePayload = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  currency: z.enum(["GBP", "EUR", "USD"]),
  date: z.string(),  // ISO date string
  paidById: z.string(),
  shares: z.array(expenseShareSchema).min(1),
});

const updateExpensePayload = createExpensePayload;  // Full replacement, not partial

const deleteExpensePayload = z.object({});
```

**Discriminated union** (the full operation schema):

```typescript
export const operationSchema = z.discriminatedUnion("type", [
  baseOperationSchema.extend({ type: z.literal("create_split"), payload: createSplitPayload }),
  baseOperationSchema.extend({ type: z.literal("update_split"), payload: updateSplitPayload }),
  baseOperationSchema.extend({ type: z.literal("delete_split"), payload: deleteSplitPayload }),
  baseOperationSchema.extend({ type: z.literal("add_member"), payload: addMemberPayload }),
  baseOperationSchema.extend({ type: z.literal("remove_member"), payload: removeMemberPayload }),
  baseOperationSchema.extend({ type: z.literal("create_expense"), payload: createExpensePayload }),
  baseOperationSchema.extend({ type: z.literal("update_expense"), payload: updateExpensePayload }),
  baseOperationSchema.extend({ type: z.literal("delete_expense"), payload: deleteExpensePayload }),
]);

export type Operation = z.infer<typeof operationSchema>;
```

### 4. Add helper functions for creating operations

`packages/domain/src/operations/builders.ts`:

Factory functions that create properly typed operations. Each takes the HLC state, userId, and payload-specific args, and returns a validated Operation.

```typescript
export function createCreateSplitOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;  // client-generated UUID for the new split
  name: string;
  emoji: string;
}): { operation: Operation; hlcState: HLCState }
```

Each builder:
1. Ticks the HLC
2. Constructs the operation object
3. Validates it against the Zod schema (throws on invalid)
4. Returns the operation + updated HLC state

### 5. Import approach

No barrel `index.ts`. Consumers import directly from the specific module:

```typescript
import { createHLC, tickHLC, compareHLCTimestamps } from "@splitters/domain/src/clock/hlc";
import { OperationType } from "@splitters/domain/src/operations/types";
import { operationSchema } from "@splitters/domain/src/operations/schemas";
import { createCreateSplitOp } from "@splitters/domain/src/operations/builders";
```

## Files Created

- `packages/domain/src/clock/hlc.ts`
- `packages/domain/src/operations/types.ts`
- `packages/domain/src/operations/schemas.ts`
- `packages/domain/src/operations/builders.ts`

## Verification

1. `cd packages/domain && npm run typecheck` passes
2. Write a quick test script (or use `ts-node`) that:
   - Creates an HLC instance
   - Ticks it a few times and verifies timestamps are monotonically increasing
   - Creates an operation using a builder function
   - Validates the operation against the Zod schema
   - Compares two HLC timestamps and verifies ordering
3. `cd backend && npm run typecheck` still passes
4. `cd frontend && npm run typecheck` still passes

## Key Design Decisions

- **Update operations carry full state** (not partial diffs) — simplifies conflict resolution to last-writer-wins
- **HLC nodeId** is per-client-instance, not per-user — a user on two devices gets two nodeIds
- **Zod discriminated union** enables type-safe pattern matching on operation type
- **Builder functions** ensure operations are always valid at construction time
