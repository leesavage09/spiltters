import type { HLCState } from "../clock/hlc.js";
import { tickHLC } from "../clock/hlc.js";
import type { Operation, CreateExpensePayload, UpdateExpensePayload } from "./schemas.js";
import { operationSchema } from "./schemas.js";

interface BuilderResult {
  operation: Operation;
  hlcState: HLCState;
}

function buildOperation(
  hlcState: HLCState,
  fields: Omit<Operation, "hlcTimestamp">,
): BuilderResult {
  const { state, timestamp } = tickHLC(hlcState);
  const raw = { ...fields, hlcTimestamp: timestamp };
  const operation = operationSchema.parse(raw);
  return { operation, hlcState: state };
}

export function buildCreateSplitOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
  name: string;
  emoji: string;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "create_split",
    splitId: params.splitId,
    entityId: params.splitId,
    userId: params.userId,
    payload: { name: params.name, emoji: params.emoji },
  });
}

export function buildUpdateSplitOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
  name?: string;
  emoji?: string;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "update_split",
    splitId: params.splitId,
    entityId: params.splitId,
    userId: params.userId,
    payload: {
      ...(params.name !== undefined && { name: params.name }),
      ...(params.emoji !== undefined && { emoji: params.emoji }),
    },
  });
}

export function buildDeleteSplitOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "delete_split",
    splitId: params.splitId,
    entityId: params.splitId,
    userId: params.userId,
    payload: {},
  });
}

export function buildAddMemberOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
  memberId: string;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "add_member",
    splitId: params.splitId,
    entityId: params.splitId,
    userId: params.userId,
    payload: { memberId: params.memberId },
  });
}

export function buildRemoveMemberOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
  memberId: string;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "remove_member",
    splitId: params.splitId,
    entityId: params.splitId,
    userId: params.userId,
    payload: { memberId: params.memberId },
  });
}

export function buildCreateExpenseOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
  expenseId: string;
  expense: CreateExpensePayload;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "create_expense",
    splitId: params.splitId,
    entityId: params.expenseId,
    userId: params.userId,
    payload: params.expense,
  });
}

export function buildUpdateExpenseOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
  expenseId: string;
  expense: UpdateExpensePayload;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "update_expense",
    splitId: params.splitId,
    entityId: params.expenseId,
    userId: params.userId,
    payload: params.expense,
  });
}

export function buildDeleteExpenseOp(params: {
  hlcState: HLCState;
  userId: string;
  splitId: string;
  id: string;
  expenseId: string;
}): BuilderResult {
  return buildOperation(params.hlcState, {
    id: params.id,
    type: "delete_expense",
    splitId: params.splitId,
    entityId: params.expenseId,
    userId: params.userId,
    payload: {},
  });
}
