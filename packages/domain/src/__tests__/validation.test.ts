import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { formatHLC } from "../clock/hlc.js";
import { validateExpenseInvariants, validateOperationAgainstState } from "../validation/invariants.js";
import { emptyMaterializedState } from "../state/types.js";
import { reduceSplitOperation } from "../reducers/split.js";
import type { Operation, CreateExpensePayload } from "../operations/schemas.js";

function makeTimestamp(physicalMs: number, counter: number, nodeId: string): string {
  return formatHLC({ physicalMs, counter, nodeId });
}

const validExpense: CreateExpensePayload = {
  title: "Dinner",
  amount: 5000,
  currency: "GBP",
  date: "2026-03-02",
  paidById: "user-1",
  shares: [
    { userId: "user-1", amount: 2500 },
    { userId: "user-2", amount: 2500 },
  ],
};

describe("validateExpenseInvariants", () => {
  const members = ["user-1", "user-2"];

  it("passes for a valid expense", () => {
    const result = validateExpenseInvariants(validExpense, members);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when paidBy is not a member", () => {
    const expense = { ...validExpense, paidById: "user-999" };
    const result = validateExpenseInvariants(expense, members);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Paid-by user is not a member of this split");
  });

  it("fails when a share user is not a member", () => {
    const expense = {
      ...validExpense,
      shares: [
        { userId: "user-1", amount: 2500 },
        { userId: "user-999", amount: 2500 },
      ],
    };
    const result = validateExpenseInvariants(expense, members);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("user-999"))).toBe(true);
  });

  it("fails when shares do not sum to total amount", () => {
    const expense = {
      ...validExpense,
      shares: [
        { userId: "user-1", amount: 2000 },
        { userId: "user-2", amount: 2000 },
      ],
    };
    const result = validateExpenseInvariants(expense, members);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("does not equal"))).toBe(true);
  });

  it("can report multiple errors at once", () => {
    const expense = {
      ...validExpense,
      paidById: "user-999",
      shares: [
        { userId: "user-1", amount: 1000 },
        { userId: "user-888", amount: 1000 },
      ],
    };
    const result = validateExpenseInvariants(expense, members);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("validateOperationAgainstState", () => {
  function stateWithSplit() {
    const state = emptyMaterializedState();
    return reduceSplitOperation(state, {
      id: randomUUID(),
      type: "create_split",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1000, 0, "node-1"),
      payload: { name: "Test", emoji: "🍕" },
    } as Operation);
  }

  function stateWithSplitAndMember() {
    let state = stateWithSplit();
    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "add_member",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1100, 0, "node-1"),
      payload: { memberId: "user-2" },
    } as Operation);
    return state;
  }

  it("passes for a valid create_expense operation", () => {
    const state = stateWithSplitAndMember();
    const op = {
      id: randomUUID(),
      type: "create_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(2000, 0, "node-1"),
      payload: validExpense,
    } as Operation;

    const result = validateOperationAgainstState(op, state);
    expect(result.valid).toBe(true);
  });

  it("fails for create_expense on a deleted split", () => {
    let state = stateWithSplit();
    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "delete_split",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1500, 0, "node-1"),
      payload: {},
    } as Operation);

    const op = {
      id: randomUUID(),
      type: "create_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(2000, 0, "node-1"),
      payload: validExpense,
    } as Operation;

    const result = validateOperationAgainstState(op, state);
    expect(result.valid).toBe(false);
  });

  it("fails for update_expense on a deleted expense", () => {
    let state = stateWithSplitAndMember();
    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "create_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(2000, 0, "node-1"),
      payload: validExpense,
    } as Operation);
    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "delete_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(3000, 0, "node-1"),
      payload: {},
    } as Operation);

    const op = {
      id: randomUUID(),
      type: "update_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(4000, 0, "node-1"),
      payload: validExpense,
    } as Operation;

    const result = validateOperationAgainstState(op, state);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("deleted expense"))).toBe(true);
  });

  it("fails for update_split on a non-existent split", () => {
    const state = emptyMaterializedState();
    const op = {
      id: randomUUID(),
      type: "update_split",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1000, 0, "node-1"),
      payload: { name: "New Name" },
    } as Operation;

    const result = validateOperationAgainstState(op, state);
    expect(result.valid).toBe(false);
  });
});
