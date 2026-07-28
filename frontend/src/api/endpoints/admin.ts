import { apiClient } from "@/api/client";
import type { UploadWorkbookResponse, WorkbookInfo } from "@/types";

/** Metadata about the currently loaded questions workbook, for the Admin page. */
export async function getWorkbookInfo(): Promise<WorkbookInfo> {
  const { data } = await apiClient.get<WorkbookInfo>("/admin/workbook");
  return data;
}

/**
 * Uploads a replacement .xlsx workbook. The backend validates it,
 * atomically replaces the current file on disk, and reloads it - the
 * response's `workbook` field already reflects the new state.
 *
 * Deliberately doesn't set a `Content-Type` header itself - `apiClient`
 * has no blanket default, so axios/the browser sets the correct
 * `multipart/form-data` boundary automatically for this `FormData` body.
 */
export async function uploadWorkbook(file: File): Promise<UploadWorkbookResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<UploadWorkbookResponse>("/admin/upload-workbook", formData, {
    // Uploads (up to 20 MB) can take longer than the default timeout,
    // especially over a competition venue's Wi-Fi.
    timeout: 60_000,
  });
  return data;
}
