import axios from "axios";

interface HealthResponse {
  status: string;
}

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  return typeof url === "string" ? url : "http://localhost:3000";
};

const api = axios.create({
  baseURL: getApiUrl(),
});

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>("/health");
  return response.data;
};
