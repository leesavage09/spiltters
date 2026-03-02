import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { createHLC, tickHLC, formatHLC } from "../clock/hlc.js";
import { reduceSplitOperation } from "../reducers/split.js";
import { replayOperations } from "../reducers/replay.js";
import { emptyMaterializedState } from "../state/types.js";
import type { Operation } from "../operations/schemas.js";

function makeTimestamp(physicalMs: number, counter: number, nodeId: string): string {
  return formatHLC({ physicalMs, counter, nodeId });
}

function makeCreateSplitOp(overrides: Partial<Operation> & { payload?: { name: string; emoji: string } } = {}): Operation {
  return {
    id: randomUUID(),
    type: "create_split",
    splitId: "split-1",
    entityId: "split-1",
    userId: "user-1",
    hlcTimestamp: makeTimestamp(1000, 0, "node-1"),
    payload: { name: "Test Split", emoji: "🍕" },
    ...overrides,
  } as Operation;
}

function makeCreateExpenseOp(overrides: Partial<Record<string, unknown>> = {}): Operation {
  return {
    id: randomUUID(),
    type: "create_expense",
    splitId: "split-1",
    entityId: overrides.entityId ?? "expense-1",
    userId: "user-1",
    hlcTimestamp: makeTimestamp(2000, 0, "node-1"),
    payload: {
      title: "Dinner",
      amount: 5000,
      currency: "GBP",
      date: "2026-03-02",
      paidById: "user-1",
      shares: [
        { userId: "user-1", amount: 2500 },
        { userId: "user-2", amount: 2500 },
      ],
    },
    ...overrides,
  } as Operation;
}

describe("reduceSplitOperation", () => {
  it("creates a split from create_split operation", () => {
    const state = emptyMaterializedState();
    const op = makeCreateSplitOp();

    const result = reduceSplitOperation(state, op);

    expect(result.split).not.toBeNull();
    expect(result.split!.id).toBe("split-1");
    expect(result.split!.name).toBe("Test Split");
    expect(result.split!.emoji).toBe("🍕");
    expect(result.split!.members).toEqual(["user-1"]);
    expect(result.split!.deleted).toBe(false);
  });

  it("is idempotent for create_split", () => {
    const state = emptyMaterializedState();
    const op = makeCreateSplitOp();

    const s1 = reduceSplitOperation(state, op);
    const s2 = reduceSplitOperation(s1, op);

    expect(s2.split).toEqual(s1.split);
  });

  it("updates split name and emoji", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "update_split",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1500, 0, "node-1"),
      payload: { name: "Updated Name" },
    } as Operation);

    expect(state.split!.name).toBe("Updated Name");
    expect(state.split!.emoji).toBe("🍕"); // unchanged
  });

  it("deletes a split by setting deleted flag", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "delete_split",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1500, 0, "node-1"),
      payload: {},
    } as Operation);

    expect(state.split!.deleted).toBe(true);
  });

  it("adds a member to the split", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "add_member",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1500, 0, "node-1"),
      payload: { memberId: "user-2" },
    } as Operation);

    expect(state.split!.members).toEqual(["user-1", "user-2"]);
  });

  it("add_member is idempotent", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());

    const addOp = {
      id: randomUUID(),
      type: "add_member",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1500, 0, "node-1"),
      payload: { memberId: "user-2" },
    } as Operation;

    state = reduceSplitOperation(state, addOp);
    state = reduceSplitOperation(state, addOp);

    expect(state.split!.members).toEqual(["user-1", "user-2"]);
  });

  it("removes a member from the split", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "add_member",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1500, 0, "node-1"),
      payload: { memberId: "user-2" },
    } as Operation);

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "remove_member",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(2000, 0, "node-1"),
      payload: { memberId: "user-2" },
    } as Operation);

    expect(state.split!.members).toEqual(["user-1"]);
  });

  it("creates an expense", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());
    state = reduceSplitOperation(state, makeCreateExpenseOp());

    const expense = state.expenses.get("expense-1");
    expect(expense).toBeDefined();
    expect(expense!.title).toBe("Dinner");
    expect(expense!.amount).toBe(5000);
    expect(expense!.shares).toHaveLength(2);
    expect(expense!.deleted).toBe(false);
  });

  it("is idempotent for create_expense", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());
    const op = makeCreateExpenseOp();
    state = reduceSplitOperation(state, op);
    const s2 = reduceSplitOperation(state, op);

    expect(s2.expenses.get("expense-1")).toEqual(state.expenses.get("expense-1"));
  });

  it("updates an expense with full replacement", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());
    state = reduceSplitOperation(state, makeCreateExpenseOp());

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "update_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(3000, 0, "node-1"),
      payload: {
        title: "Updated Dinner",
        amount: 6000,
        currency: "EUR",
        date: "2026-03-03",
        paidById: "user-1",
        shares: [
          { userId: "user-1", amount: 3000 },
          { userId: "user-2", amount: 3000 },
        ],
      },
    } as Operation);

    const expense = state.expenses.get("expense-1");
    expect(expense!.title).toBe("Updated Dinner");
    expect(expense!.amount).toBe(6000);
    expect(expense!.currency).toBe("EUR");
  });

  it("deletes an expense", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());
    state = reduceSplitOperation(state, makeCreateExpenseOp());

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "delete_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(3000, 0, "node-1"),
      payload: {},
    } as Operation);

    expect(state.expenses.get("expense-1")!.deleted).toBe(true);
  });

  it("no-ops update on a deleted expense (delete wins)", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());
    state = reduceSplitOperation(state, makeCreateExpenseOp());

    // Delete it
    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "delete_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(3000, 0, "node-1"),
      payload: {},
    } as Operation);

    // Try to update it after deletion
    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "update_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(4000, 0, "node-1"),
      payload: {
        title: "Should not apply",
        amount: 9999,
        currency: "USD",
        date: "2026-04-01",
        paidById: "user-1",
        shares: [{ userId: "user-1", amount: 9999 }],
      },
    } as Operation);

    expect(state.expenses.get("expense-1")!.deleted).toBe(true);
    expect(state.expenses.get("expense-1")!.title).toBe("Dinner"); // unchanged
  });

  it("no-ops expense creation on a deleted split", () => {
    let state = reduceSplitOperation(emptyMaterializedState(), makeCreateSplitOp());

    state = reduceSplitOperation(state, {
      id: randomUUID(),
      type: "delete_split",
      splitId: "split-1",
      entityId: "split-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(1500, 0, "node-1"),
      payload: {},
    } as Operation);

    state = reduceSplitOperation(state, makeCreateExpenseOp({
      hlcTimestamp: makeTimestamp(2000, 0, "node-1"),
    }));

    expect(state.expenses.size).toBe(0);
  });
});

describe("replayOperations", () => {
  it("replays operations in HLC order regardless of input order", () => {
    const createOp = makeCreateSplitOp({ hlcTimestamp: makeTimestamp(1000, 0, "node-1") });
    const expenseOp = makeCreateExpenseOp({ hlcTimestamp: makeTimestamp(2000, 0, "node-1") });

    // Pass in reverse order
    const state = replayOperations([expenseOp, createOp]);

    expect(state.split).not.toBeNull();
    expect(state.split!.name).toBe("Test Split");
    expect(state.expenses.get("expense-1")).toBeDefined();
  });

  it("handles concurrent updates — last by HLC wins", () => {
    const createOp = makeCreateSplitOp({ hlcTimestamp: makeTimestamp(1000, 0, "node-1") });
    const expenseOp = makeCreateExpenseOp({ hlcTimestamp: makeTimestamp(2000, 0, "node-1") });

    const updateA = {
      id: randomUUID(),
      type: "update_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-1",
      hlcTimestamp: makeTimestamp(3000, 0, "node-a"),
      payload: {
        title: "Update A",
        amount: 5000,
        currency: "GBP",
        date: "2026-03-02",
        paidById: "user-1",
        shares: [{ userId: "user-1", amount: 2500 }, { userId: "user-2", amount: 2500 }],
      },
    } as Operation;

    const updateB = {
      id: randomUUID(),
      type: "update_expense",
      splitId: "split-1",
      entityId: "expense-1",
      userId: "user-2",
      hlcTimestamp: makeTimestamp(3000, 1, "node-b"), // Higher counter = later
      payload: {
        title: "Update B",
        amount: 5000,
        currency: "GBP",
        date: "2026-03-02",
        paidById: "user-1",
        shares: [{ userId: "user-1", amount: 2500 }, { userId: "user-2", amount: 2500 }],
      },
    } as Operation;

    const state = replayOperations([createOp, expenseOp, updateA, updateB]);

    expect(state.expenses.get("expense-1")!.title).toBe("Update B");
  });

  it("returns empty state for no operations", () => {
    const state = replayOperations([]);
    expect(state.split).toBeNull();
    expect(state.expenses.size).toBe(0);
  });
});
