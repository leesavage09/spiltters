import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { CreateExpenseDto, ExpenseResponseDto, MessageResponseDto, PaginatedExpensesResponseDto, UpdateExpenseDto } from "../generated/api.schemas";
import { getExpenses } from "../generated/expenses/expenses";

const { expensesControllerFindBySplit, expensesControllerCreate, expensesControllerUpdate, expensesControllerDelete } = getExpenses();

const PAGE_SIZE = 20;

import type { ErrorResponse } from "../types/api";

export const useExpenses = (splitId: string) => {
  return useInfiniteQuery<PaginatedExpensesResponseDto>({
    queryKey: ["expenses", splitId],
    queryFn: ({ pageParam }) =>
      expensesControllerFindBySplit(splitId, {
        skip: pageParam as number,
        take: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + PAGE_SIZE : undefined,
  });
};

export const useCreateExpense = (splitId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    ExpenseResponseDto,
    AxiosError<ErrorResponse>,
    { splitId: string; data: CreateExpenseDto }
  >({
    mutationFn: ({ splitId, data }) => expensesControllerCreate(splitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", splitId] }).catch(() => {});
    },
  });
};

export const useUpdateExpense = (splitId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    ExpenseResponseDto,
    AxiosError<ErrorResponse>,
    { splitId: string; expenseId: string; data: UpdateExpenseDto }
  >({
    mutationFn: ({ splitId, expenseId, data }) => expensesControllerUpdate(splitId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", splitId] }).catch(() => {});
    },
  });
};

export const useDeleteExpense = (splitId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    MessageResponseDto,
    AxiosError<ErrorResponse>,
    { splitId: string; expenseId: string }
  >({
    mutationFn: ({ splitId, expenseId }) => expensesControllerDelete(splitId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", splitId] }).catch(() => {});
    },
  });
};
