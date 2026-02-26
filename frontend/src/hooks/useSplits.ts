import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type {
  CreateSplitDto,
  SplitResponseDto,
} from "../generated/api.schemas";
import { getSplits } from "../generated/splits/splits";

const { splitsControllerFindAll, splitsControllerCreate } = getSplits();

//TODO Error response is not typed, need to be fixed in the backend and then updated here
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
