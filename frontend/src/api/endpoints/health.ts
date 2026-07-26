import { apiClient } from "@/api/client";
import type { HealthResponse } from "@/types";

/**
 * Calls the backend `/health` endpoint. Used to verify frontend/backend
 * connectivity (see `HomePage`).
 */
export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>("/health");
  return data;
}
