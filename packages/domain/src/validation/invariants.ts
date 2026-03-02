import type { CreateExpensePayload, UpdateExpensePayload, Operation } from "../operations/schemas.js";
import type { SplitMaterializedState } from "../state/types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateExpenseInvariants(
  expense: CreateExpensePayload | UpdateExpensePayload,
  splitMembers: string[],
): ValidationResult {
  const errors: string[] = [];
  const memberSet = new Set(splitMembers);

  if (!memberSet.has(expense.paidById))
    errors.push("Paid-by user is not a member of this split");

  for (const share of expense.shares) {
    if (!memberSet.has(share.userId))
      errors.push(`User ${share.userId} is not a member of this split`);
  }

  const sharesTotal = expense.shares.reduce((sum, s) => sum + s.amount, 0);
  if (sharesTotal !== expense.amount)
    errors.push(`Shares sum (${sharesTotal}) does not equal total amount (${expense.amount})`);

  return { valid: errors.length === 0, errors };
}

export function validateOperationAgainstState(
  operation: Operation,
  state: SplitMaterializedState,
): ValidationResult {
  const errors: string[] = [];

  if (operation.type === "create_expense" || operation.type === "update_expense") {
    if (!state.split || state.split.deleted)
      errors.push("Cannot create/update expense in a deleted or non-existent split");

    if (state.split) {
      const expenseResult = validateExpenseInvariants(operation.payload, state.split.members);
      errors.push(...expenseResult.errors);
    }
  }

  if (operation.type === "update_expense") {
    const existing = state.expenses.get(operation.entityId);
    if (existing?.deleted)
      errors.push("Cannot update a deleted expense");
  }

  if (operation.type === "delete_expense") {
    const existing = state.expenses.get(operation.entityId);
    if (!existing)
      errors.push("Expense does not exist");
    else if (existing.deleted)
      errors.push("Expense is already deleted");
  }

  if (operation.type === "update_split" || operation.type === "delete_split") {
    if (!state.split || state.split.deleted)
      errors.push("Split does not exist or is already deleted");
  }

  return { valid: errors.length === 0, errors };
}
