import { useCallback, useEffect, useState } from "react";

import { getWorkbookInfo } from "@/api/endpoints/admin";
import { getApiErrorMessage } from "@/lib/apiError";
import type { WorkbookInfo } from "@/types";

const POLL_INTERVAL_MS = 8_000;

interface UseWorkbookInfoResult {
  info: WorkbookInfo | null;
  isLoading: boolean;
  error: string | null;
  /** Re-fetches workbook info; resolves once the new state has been applied. */
  refetch: () => Promise<void>;
}

/**
 * Fetches metadata about the currently loaded workbook for the Admin page.
 * Polls periodically so Upload Time / status update without a manual refresh.
 */
export function useWorkbookInfo(): UseWorkbookInfoResult {
  const [info, setInfo] = useState<WorkbookInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async (options?: { quiet?: boolean }) => {
    if (!options?.quiet) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await getWorkbookInfo();
      setInfo(data);
    } catch (err) {
      setInfo(null);
      setError(getApiErrorMessage(err, "Unable to load workbook information."));
    } finally {
      if (!options?.quiet) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchInfo();
  }, [fetchInfo]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchInfo({ quiet: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [fetchInfo]);

  return {
    info,
    isLoading,
    error,
    refetch: () => fetchInfo(),
  };
}
