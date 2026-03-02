export interface SplitState {
  id: string;
  name: string;
  emoji: string;
  members: string[];
  deleted: boolean;
}

export interface ExpenseState {
  id: string;
  splitId: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  paidById: string;
  shares: { userId: string; amount: number }[];
  deleted: boolean;
}

export interface SplitMaterializedState {
  split: SplitState | null;
  expenses: Map<string, ExpenseState>;
}

export function emptyMaterializedState(): SplitMaterializedState {
  return { split: null, expenses: new Map() };
}
