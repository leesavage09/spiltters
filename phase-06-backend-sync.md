# Phase 6: Add Sync Endpoints to Backend + Operations Table

## Goal

Add the operations table to PostgreSQL, create a sync service that receives operations from clients, validates them, assigns server sequence numbers, and returns new operations. The backend maintains both the operation log (source of truth) and materialized state (existing Prisma models).

## Prerequisites

- Phase 1-3 complete (workspaces, operation types, reducers in `@splitters/domain`)

## Steps

### 1. Add the Operation model to Prisma schema

Update `backend/prisma/schema.prisma`:

```prisma
model Operation {
  id           String   @id
  type         String   @db.VarChar(50)
  splitId      String   @map("split_id")
  entityId     String   @map("entity_id")
  userId       String   @map("user_id")
  hlcTimestamp String   @map("hlc_timestamp")
  payload      Json
  serverSeq    Int      @map("server_seq")
  createdAt    DateTime @default(now()) @map("created_at")

  split        Split    @relation(fields: [splitId], references: [id])
  user         User     @relation(fields: [userId], references: [id])

  @@index([splitId, serverSeq])
  @@map("operations")
}
```

Also add the reverse relations to the existing models:

```prisma
// In the Split model, add:
operations Operation[]

// In the User model, add:
operations Operation[]
```

### 2. Run migration

```bash
cd backend && npm run db:migrate -- --name add_operations_table
```

This creates the `operations` table with the index on `(split_id, server_seq)`.

### 3. Create the Sync module

```
backend/src/sync/
├── sync.module.ts
├── sync.controller.ts
├── sync.service.ts
└── dto/
    ├── sync-request.dto.ts
    └── sync-response.dto.ts
```

### 4. Create DTOs (`backend/src/sync/dto/`)

**`sync-request.dto.ts`:**

```typescript
export class SyncOperationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  splitId: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  hlcTimestamp: string;

  @ApiProperty()
  payload: Record<string, unknown>;
}

export class SyncRequestDto {
  @ApiProperty({ type: [SyncOperationDto] })
  operations: SyncOperationDto[];

  @ApiProperty()
  lastServerSeq: number;
}
```

**`sync-response.dto.ts`:**

```typescript
export class SyncResponseDto {
  @ApiProperty({ type: [SyncOperationDto] })
  operations: SyncOperationDto[];

  @ApiProperty()
  serverSeq: number;   // The latest server sequence number
}
```

### 5. Create the Sync controller (`backend/src/sync/sync.controller.ts`)

```typescript
@Controller("sync")
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post(":splitId")
  async sync(
    @GetUser() user: { id: string },
    @Param("splitId") splitId: string,
    @Body() dto: SyncRequestDto,
  ): Promise<SyncResponseDto> {
    return this.syncService.sync(user.id, splitId, dto);
  }
}
```

### 6. Create the Sync service (`backend/src/sync/sync.service.ts`)

This is the most complex part. The sync service:

1. **Validates** that the user is a member of the split
2. **Validates** each incoming operation using `@splitters/domain` schemas
3. **Deduplicates** — skips operations that already exist in the DB (by operation ID)
4. **Assigns server sequence numbers** — monotonically increasing per split
5. **Applies operations** to materialized state (existing Prisma models)
6. **Returns** all operations the client hasn't seen

```typescript
@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async sync(
    userId: string,
    splitId: string,
    dto: SyncRequestDto,
  ): Promise<SyncResponseDto> {
    // 1. Verify user is a member (or the split is being created)
    await this.assertSplitAccess(userId, splitId, dto.operations);

    // 2. Process incoming operations in a transaction
    const newServerSeq = await this.prisma.$transaction(async (tx) => {
      let currentSeq = await this.getMaxServerSeq(tx, splitId);

      for (const op of dto.operations) {
        // Validate with @splitters/domain
        const parsed = operationSchema.safeParse({
          ...op,
          splitId,  // Enforce splitId matches the URL param
          userId,   // Enforce userId matches the authenticated user
        });

        if (!parsed.success) continue;  // Skip invalid operations

        // Check for duplicates
        const existing = await tx.operation.findUnique({ where: { id: op.id } });
        if (existing) continue;  // Already processed

        // Assign server sequence
        currentSeq++;

        // Store the operation
        await tx.operation.create({
          data: {
            id: op.id,
            type: op.type,
            splitId,
            entityId: op.entityId,
            userId,
            hlcTimestamp: op.hlcTimestamp,
            payload: op.payload,
            serverSeq: currentSeq,
          },
        });

        // Apply to materialized state
        await this.materializeOperation(tx, parsed.data);
      }

      return currentSeq;
    });

    // 3. Return operations the client hasn't seen
    const newOps = await this.prisma.operation.findMany({
      where: {
        splitId,
        serverSeq: { gt: dto.lastServerSeq },
      },
      orderBy: { serverSeq: "asc" },
    });

    return {
      operations: newOps.map(op => ({
        id: op.id,
        type: op.type,
        splitId: op.splitId,
        entityId: op.entityId,
        userId: op.userId,
        hlcTimestamp: op.hlcTimestamp,
        payload: op.payload as Record<string, unknown>,
        serverSeq: op.serverSeq,
      })),
      serverSeq: newServerSeq,
    };
  }

  private async getMaxServerSeq(tx: PrismaTransaction, splitId: string): Promise<number> {
    const result = await tx.operation.aggregate({
      where: { splitId },
      _max: { serverSeq: true },
    });
    return result._max.serverSeq ?? 0;
  }

  private async materializeOperation(tx: PrismaTransaction, operation: Operation) {
    // Apply the operation to Prisma models (Split, Expense, ExpenseShare, SplitUser)
    switch (operation.type) {
      case "create_split":
        await tx.split.create({
          data: {
            id: operation.entityId,
            name: operation.payload.name,
            emoji: operation.payload.emoji,
            users: { create: { userId: operation.userId } },
          },
        });
        break;

      case "update_split":
        await tx.split.update({
          where: { id: operation.entityId },
          data: {
            ...(operation.payload.name && { name: operation.payload.name }),
            ...(operation.payload.emoji && { emoji: operation.payload.emoji }),
          },
        });
        break;

      case "delete_split":
        // Soft delete or hard delete depending on your preference
        // For now, delete the split and all related data
        await tx.expenseShare.deleteMany({ where: { expense: { splitId: operation.entityId } } });
        await tx.expense.deleteMany({ where: { splitId: operation.entityId } });
        await tx.splitUser.deleteMany({ where: { splitId: operation.entityId } });
        await tx.split.delete({ where: { id: operation.entityId } });
        break;

      case "add_member":
        await tx.splitUser.create({
          data: {
            splitId: operation.splitId,
            userId: operation.payload.memberId,
          },
        }).catch(() => {}); // Ignore if already exists
        break;

      case "remove_member":
        await tx.splitUser.deleteMany({
          where: {
            splitId: operation.splitId,
            userId: operation.payload.memberId,
          },
        });
        break;

      case "create_expense":
        await tx.expense.create({
          data: {
            id: operation.entityId,
            title: operation.payload.title,
            amount: operation.payload.amount,
            currency: operation.payload.currency,
            date: new Date(operation.payload.date),
            splitId: operation.splitId,
            paidById: operation.payload.paidById,
            shares: {
              create: operation.payload.shares.map(s => ({
                userId: s.userId,
                amount: s.amount,
              })),
            },
          },
        });
        break;

      case "update_expense":
        await tx.expenseShare.deleteMany({ where: { expenseId: operation.entityId } });
        await tx.expense.update({
          where: { id: operation.entityId },
          data: {
            title: operation.payload.title,
            amount: operation.payload.amount,
            currency: operation.payload.currency,
            date: new Date(operation.payload.date),
            paidById: operation.payload.paidById,
            shares: {
              create: operation.payload.shares.map(s => ({
                userId: s.userId,
                amount: s.amount,
              })),
            },
          },
        });
        break;

      case "delete_expense":
        await tx.expenseShare.deleteMany({ where: { expenseId: operation.entityId } });
        await tx.expense.delete({ where: { id: operation.entityId } }).catch(() => {});
        break;
    }
  }

  private async assertSplitAccess(
    userId: string,
    splitId: string,
    operations: SyncOperationDto[],
  ) {
    // If the first operation is create_split, the split doesn't exist yet — allow it
    if (operations.length > 0 && operations[0].type === "create_split")
      return;

    const split = await this.prisma.split.findUnique({
      where: { id: splitId },
      include: { users: true },
    });

    if (!split || !split.users.some(u => u.userId === userId))
      throw new UserSafeException("Split not found");
  }
}
```

### 7. Create the Sync module (`backend/src/sync/sync.module.ts`)

```typescript
@Module({
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
```

### 8. Register in AppModule

Add `SyncModule` to the imports array in `backend/src/app.module.ts`.

### 9. Update OpenAPI spec

After building the backend, regenerate the OpenAPI spec:

```bash
cd backend && npm run generate:openapi
```

Then regenerate the frontend API client:

```bash
cd frontend && npm run generate:api
```

This gives the frontend typed access to the sync endpoint.

## Files Created

- `backend/src/sync/sync.module.ts`
- `backend/src/sync/sync.controller.ts`
- `backend/src/sync/sync.service.ts`
- `backend/src/sync/dto/sync-request.dto.ts`
- `backend/src/sync/dto/sync-response.dto.ts`
- `backend/prisma/migrations/<timestamp>_add_operations_table/migration.sql` (generated)

## Files Modified

- `backend/prisma/schema.prisma` — add Operation model + relations
- `backend/src/app.module.ts` — import SyncModule

## Verification

1. `cd backend && npm run db:migrate` succeeds
2. `cd backend && npm run build` succeeds
3. `cd backend && npm run start:dev` starts without errors
4. Test the sync endpoint manually with curl or Postman:
   - `POST /api/sync/<splitId>` with a `create_split` operation → returns the operation with serverSeq
   - `POST /api/sync/<splitId>` with `lastServerSeq: 0` and no operations → returns all operations
   - Verify the split appears in PostgreSQL (materialized)
   - Send duplicate operation → not duplicated
5. `cd backend && npm run typecheck` passes
6. OpenAPI spec regenerated successfully

## Key Design Decisions

- **Single transaction** for processing all incoming operations — ensures atomicity. If any operation fails, none are applied.
- **Server enforces `userId` and `splitId`** — clients can't forge operations for other users or other splits.
- **Duplicate detection by operation ID** — idempotent. Safe to retry sync requests.
- **Materialized state maintained in parallel** — existing Prisma models are updated alongside the operation log. This means existing read patterns (e.g., invitations querying splits) still work.
- **`serverSeq` is monotonic per split** — clients use this to efficiently fetch "new operations since last sync". No need for global ordering.
