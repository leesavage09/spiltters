import type { AxiosRequestConfig } from "axios";
import axios from "axios";

const getApiUrl = (): string => {
  return import.meta.env.PROD ? "" : "http://localhost:3000";
};

const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error as Error);
  },
);

export default apiClient;

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return apiClient(config).then((response) => response.data as T);
};
