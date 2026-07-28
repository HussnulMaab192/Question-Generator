import { apiClient } from "@/api/client";
import type { ReloadResponse } from "@/types";

/**
 * Forces the backend to re-read the questions workbook from disk right
 * now, picking up sheets that were added/removed/renamed since the last
 * load. Callers should follow this with `getCategories()` to refresh
 * whatever's on screen - this endpoint only reports how many categories
 * were found, it doesn't return them.
 */
export async function reloadWorkbook(): Promise<ReloadResponse> {
  const { data } = await apiClient.post<ReloadResponse>("/reload");
  return data;
}
