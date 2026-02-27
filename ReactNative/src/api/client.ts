import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { Platform } from "react-native";
import { navigate } from "../navigation/navigationRef";

const getApiUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === "android") return "http://10.0.2.2:3000";
    return "http://localhost:3000";
  }
  return "";
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
    )
      navigate("Login");
    return Promise.reject(error as Error);
  },
);

export default apiClient;

export const customInstance = async <T>(
  config: AxiosRequestConfig,
): Promise<T> => {
  const response = await apiClient(config);
  return response.data as T;
};
