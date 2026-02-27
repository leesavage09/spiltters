import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { AuthResponseDto } from "../generated/api.schemas";
import { getAuth } from "../generated/auth/auth";

const { authControllerLogin, authControllerRegister, authControllerLogout, authControllerGetProfile } = getAuth();

interface ErrorResponse {
  message: string;
  statusCode: number;
}

export const useCurrentUser = () => {
  return useQuery<AuthResponseDto>({
    queryKey: ["auth", "me"],
    queryFn: authControllerGetProfile,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AuthResponseDto,
    AxiosError<ErrorResponse>,
    { email: string; password: string }
  >({
    mutationFn: authControllerLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AuthResponseDto,
    AxiosError<ErrorResponse>,
    { email: string; password: string }
  >({
    mutationFn: authControllerRegister,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authControllerLogout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["auth"] }).catch(() => {});
    },
  });
};
