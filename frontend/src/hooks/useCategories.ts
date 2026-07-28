import { useCallback, useEffect, useState } from "react";

import { getCategories } from "@/api/endpoints/categories";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Category } from "@/types";

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  /** Re-fetches categories; resolves once the new state has been applied. */
  refetch: () => Promise<void>;
}

/**
 * Fetches the dynamic category list from the backend. Consumers should
 * always render whatever this returns rather than any hardcoded list -
 * the backend workbook is the single source of truth for categories.
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setCategories([]);
      setError(getApiErrorMessage(err, "Unable to load categories."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}
