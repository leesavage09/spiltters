import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { Platform } from "react-native";
import { navigate } from "../navigation/navigationRef";

const PRODUCTION_URL = "https://splitters123.exp.leesavage.co.uk";
const DEV_TUNNEL_URL = "https://tpr77mm7-3000.euw.devtunnels.ms";
const DEV_LOCAL_URL = "http://localhost:3000";

export const getApiUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === "web") return DEV_LOCAL_URL;
    return DEV_TUNNEL_URL;
  }
  if (Platform.OS === "web") return "";
  return PRODUCTION_URL;
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
