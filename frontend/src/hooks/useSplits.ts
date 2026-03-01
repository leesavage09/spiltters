import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { CreateSplitDto, MessageResponseDto, SplitResponseDto, UpdateSplitDto } from "../generated/api.schemas";
import { getSplits } from "../generated/splits/splits";

const { splitsControllerFindAll, splitsControllerCreate, splitsControllerUpdate, splitsControllerDelete } = getSplits();

interface ErrorResponse {
  message: string;
  statusCode: number;
}

export const useSplits = () => {
  return useQuery<SplitResponseDto[]>({
    queryKey: ["splits"],
    queryFn: splitsControllerFindAll,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateSplit = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SplitResponseDto,
    AxiosError<ErrorResponse>,
    CreateSplitDto
  >({
    mutationFn: splitsControllerCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] }).catch(() => {});
    },
  });
};

export const useUpdateSplit = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SplitResponseDto,
    AxiosError<ErrorResponse>,
    { id: string; data: UpdateSplitDto }
  >({
    mutationFn: ({ id, data }) => splitsControllerUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] }).catch(() => {});
    },
  });
};

export const useDeleteSplit = () => {
  const queryClient = useQueryClient();

  return useMutation<
    MessageResponseDto,
    AxiosError<ErrorResponse>,
    string
  >({
    mutationFn: splitsControllerDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] }).catch(() => {});
    },
  });
};
