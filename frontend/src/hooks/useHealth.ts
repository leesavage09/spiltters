import { useQuery } from "@tanstack/react-query";
import type { HealthResponseDto } from "../generated/api.schemas";
import { getHealth } from "../generated/health/health";

const { healthControllerGetHealth } = getHealth();

export const useHealth = () => {
  return useQuery<HealthResponseDto>({
    queryKey: ["health"],
    queryFn: healthControllerGetHealth,
  });
};
