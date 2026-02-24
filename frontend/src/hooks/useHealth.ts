import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "../api/health";

interface HealthResponse {
  status: string;
}

export const useHealth = () => {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });
};
