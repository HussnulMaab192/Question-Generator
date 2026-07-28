import { useCallback, useEffect, useState } from "react";

import { getWorkbookInfo } from "@/api/endpoints/admin";
import { getApiErrorMessage } from "@/lib/apiError";
import type { WorkbookInfo } from "@/types";

interface UseWorkbookInfoResult {
  info: WorkbookInfo | null;
  isLoading: boolean;
  error: string | null;
  /** Re-fetches workbook info; resolves once the new state has been applied. */
  refetch: () => Promise<void>;
}

/**
 * Fetches metadata about the currently loaded workbook (filename, last
 * modified time, category/question counts) for the Admin page. Kept
 * separate from `useCategories` since the Admin page cares about the
 * workbook itself, not the selectable category list.
 */
export function useWorkbookInfo(): UseWorkbookInfoResult {
  const [info, setInfo] = useState<WorkbookInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkbookInfo();
      setInfo(data);
    } catch (err) {
      setInfo(null);
      setError(getApiErrorMessage(err, "Unable to load workbook information."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInfo();
  }, [fetchInfo]);

  return { info, isLoading, error, refetch: fetchInfo };
}
