import apiClient from "./client";

interface AuthResponse {
  id: string;
  email: string;
}

interface MessageResponse {
  message: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/login", data);
  return response.data;
};

export const register = async (
  data: RegisterRequest,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/register", data);
  return response.data;
};

export const logout = async (): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>("/auth/logout");
  return response.data;
};

export const fetchCurrentUser = async (): Promise<AuthResponse> => {
  const response = await apiClient.get<AuthResponse>("/auth/me");
  return response.data;
};
