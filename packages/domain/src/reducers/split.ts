import type { Operation } from "../operations/schemas.js";
import type { SplitMaterializedState, SplitState, ExpenseState } from "../state/types.js";

export function reduceSplitOperation(
  state: SplitMaterializedState,
  operation: Operation,
): SplitMaterializedState {
  switch (operation.type) {
    case "create_split":
      return reduceCreateSplit(state, operation);
    case "update_split":
      return reduceUpdateSplit(state, operation);
    case "delete_split":
      return reduceDeleteSplit(state);
    case "add_member":
      return reduceAddMember(state, operation);
    case "remove_member":
      return reduceRemoveMember(state, operation);
    case "create_expense":
      return reduceCreateExpense(state, operation);
    case "update_expense":
      return reduceUpdateExpense(state, operation);
    case "delete_expense":
      return reduceDeleteExpense(state, operation);
  }
}

function reduceCreateSplit(
  state: SplitMaterializedState,
  op: Extract<Operation, { type: "create_split" }>,
): SplitMaterializedState {
  // Idempotent: skip if split already exists
  if (state.split) return state;

  const split: SplitState = {
    id: op.entityId,
    name: op.payload.name,
    emoji: op.payload.emoji,
    members: [op.userId],
    deleted: false,
  };

  return { split, expenses: new Map(state.expenses) };
}

function reduceUpdateSplit(
  state: SplitMaterializedState,
  op: Extract<Operation, { type: "update_split" }>,
): SplitMaterializedState {
  if (!state.split || state.split.deleted) return state;

  const split: SplitState = {
    ...state.split,
    ...(op.payload.name !== undefined && { name: op.payload.name }),
    ...(op.payload.emoji !== undefined && { emoji: op.payload.emoji }),
  };

  return { split, expenses: state.expenses };
}

function reduceDeleteSplit(state: SplitMaterializedState): SplitMaterializedState {
  if (!state.split || state.split.deleted) return state;

  return {
    split: { ...state.split, deleted: true },
    expenses: state.expenses,
  };
}

function reduceAddMember(
  state: SplitMaterializedState,
  op: Extract<Operation, { type: "add_member" }>,
): SplitMaterializedState {
  if (!state.split || state.split.deleted) return state;
  if (state.split.members.includes(op.payload.memberId)) return state;

  return {
    split: {
      ...state.split,
      members: [...state.split.members, op.payload.memberId],
    },
    expenses: state.expenses,
  };
}

function reduceRemoveMember(
  state: SplitMaterializedState,
  op: Extract<Operation, { type: "remove_member" }>,
): SplitMaterializedState {
  if (!state.split || state.split.deleted) return state;

  return {
    split: {
      ...state.split,
      members: state.split.members.filter((id) => id !== op.payload.memberId),
    },
    expenses: state.expenses,
  };
}

function reduceCreateExpense(
  state: SplitMaterializedState,
  op: Extract<Operation, { type: "create_expense" }>,
): SplitMaterializedState {
  // No-op if split doesn't exist or is deleted
  if (!state.split || state.split.deleted) return state;
  // Idempotent: skip if expense already exists
  if (state.expenses.has(op.entityId)) return state;

  const expense: ExpenseState = {
    id: op.entityId,
    splitId: op.splitId,
    title: op.payload.title,
    amount: op.payload.amount,
    currency: op.payload.currency,
    date: op.payload.date,
    paidById: op.payload.paidById,
    shares: op.payload.shares,
    deleted: false,
  };

  const expenses = new Map(state.expenses);
  expenses.set(op.entityId, expense);

  return { split: state.split, expenses };
}

function reduceUpdateExpense(
  state: SplitMaterializedState,
  op: Extract<Operation, { type: "update_expense" }>,
): SplitMaterializedState {
  if (!state.split || state.split.deleted) return state;

  const existing = state.expenses.get(op.entityId);
  // Can't update non-existent or deleted expense
  if (!existing || existing.deleted) return state;

  const expense: ExpenseState = {
    id: op.entityId,
    splitId: op.splitId,
    title: op.payload.title,
    amount: op.payload.amount,
    currency: op.payload.currency,
    date: op.payload.date,
    paidById: op.payload.paidById,
    shares: op.payload.shares,
    deleted: false,
  };

  const expenses = new Map(state.expenses);
  expenses.set(op.entityId, expense);

  return { split: state.split, expenses };
}

function reduceDeleteExpense(
  state: SplitMaterializedState,
  op: Extract<Operation, { type: "delete_expense" }>,
): SplitMaterializedState {
  if (!state.split || state.split.deleted) return state;

  const existing = state.expenses.get(op.entityId);
  if (!existing || existing.deleted) return state;

  const expenses = new Map(state.expenses);
  expenses.set(op.entityId, { ...existing, deleted: true });

  return { split: state.split, expenses };
}
