import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { CreateExpenseDto, ExpenseResponseDto } from "../generated/api.schemas";
import { getExpenses } from "../generated/expenses/expenses";

const { expensesControllerCreate } = getExpenses();

interface ErrorResponse {
  message: string;
  statusCode: number;
}

export const useCreateExpense = () => {
  return useMutation<
    ExpenseResponseDto,
    AxiosError<ErrorResponse>,
    { splitId: string; data: CreateExpenseDto }
  >({
    mutationFn: ({ splitId, data }) => expensesControllerCreate(splitId, data),
  });
};
