import { apiClient } from "@/api/client";
import type { Category } from "@/types";

/**
 * Fetches the dynamically-detected list of categories (one per sheet in
 * the backend's questions workbook). Never hardcode categories in the
 * frontend - always source them from this endpoint.
 */
export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}
