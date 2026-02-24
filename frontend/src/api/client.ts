import axios from "axios";

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof url !== "string")
    throw Error("VITE_API_URL environment variable is not set");

  return url;
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
