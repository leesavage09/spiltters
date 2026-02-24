import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { fetchCurrentUser, login, logout, register } from "../api/auth";

interface AuthResponse {
  id: string;
  email: string;
}

interface ErrorResponse {
  message: string;
  statusCode: number;
}

export const useCurrentUser = () => {
  return useQuery<AuthResponse>({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AuthResponse,
    AxiosError<ErrorResponse>,
    { email: string; password: string }
  >({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AuthResponse,
    AxiosError<ErrorResponse>,
    { email: string; password: string }
  >({
    mutationFn: register,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["auth"] }).catch(() => {});
    },
  });
};
