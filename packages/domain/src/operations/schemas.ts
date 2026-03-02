import { z } from "zod";

// --- Payload schemas (one per operation type) ---

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
  date: z.string(),
  paidById: z.string(),
  shares: z.array(expenseShareSchema).min(1),
});

const updateExpensePayload = createExpensePayload; // Full replacement, not partial

const deleteExpensePayload = z.object({});

// --- Operation envelope (common fields) ---

const baseOperationSchema = z.object({
  id: z.string().uuid(),
  splitId: z.string(),
  entityId: z.string(),
  userId: z.string(),
  hlcTimestamp: z.string(),
});

// --- Discriminated union of all operations ---

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

// --- Derived payload types for convenience ---

export type CreateSplitPayload = z.infer<typeof createSplitPayload>;
export type UpdateSplitPayload = z.infer<typeof updateSplitPayload>;
export type CreateExpensePayload = z.infer<typeof createExpensePayload>;
export type UpdateExpensePayload = z.infer<typeof updateExpensePayload>;
export type ExpenseShare = z.infer<typeof expenseShareSchema>;
