import { useCallback, useEffect, useState } from "react";

import { getCategories } from "@/api/endpoints/categories";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Category } from "@/types";

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getCategories()
      .then((data) => {
        if (isMounted) setCategories(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setCategories([]);
        setError(getApiErrorMessage(err, "Unable to load categories."));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { categories, isLoading, error, refetch };
}
