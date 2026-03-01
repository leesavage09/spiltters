import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { CreateExpenseDto, ExpenseResponseDto, PaginatedExpensesResponseDto } from "../generated/api.schemas";
import { getExpenses } from "../generated/expenses/expenses";

const { expensesControllerFindBySplit, expensesControllerCreate } = getExpenses();

const PAGE_SIZE = 20;

interface ErrorResponse {
  message: string;
  statusCode: number;
}

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
