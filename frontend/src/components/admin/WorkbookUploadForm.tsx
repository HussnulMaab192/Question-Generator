import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { uploadWorkbook } from "@/api/endpoints/admin";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@/lib/apiError";
import type { WorkbookInfo } from "@/types";

const ALLOWED_EXTENSION = ".xlsx";
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export interface WorkbookUploadFormProps {
  /** Called with the fresh workbook stats right after a successful upload. */
  onUploaded: (workbook: WorkbookInfo) => void;
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Client-side mirror of the backend's validation, for instant feedback
 * before ever hitting the network - the backend still re-validates
 * everything itself, this is purely a UX nicety. */
function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
    return `Only ${ALLOWED_EXTENSION} files are accepted.`;
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File is too large (${formatMegabytes(file.size)}). The maximum allowed size is 20 MB.`;
  }
  return null;
}

/**
 * File picker + upload action for replacing the questions workbook.
 * Accepts only `.xlsx`, caps at 20 MB (validated here for instant
 * feedback, and again on the backend as the source of truth). On success,
 * shows a toast and calls `onUploaded` with the fresh stats so the parent
 * page can update its display without a separate re-fetch; on failure,
 * shows the backend's specific error as a toast.
 */
export default function WorkbookUploadForm({ onUploaded }: WorkbookUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setValidationError(file ? validateFile(file) : null);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const clientError = validateFile(selectedFile);
    if (clientError) {
      setValidationError(clientError);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadWorkbook(selectedFile);
      showToast(result.message, "success");
      onUploaded(result.workbook);
      clearSelection();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to upload workbook."), "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Replace Workbook</CardTitle>
        <CardDescription>
          Upload a new {ALLOWED_EXTENSION} file (max 20 MB) to replace the questions workbook.
          It's validated and reloaded immediately - no server restart required.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSION}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Choose a replacement workbook file"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="gap-2 sm:w-auto"
          >
            <FileSpreadsheet className="size-4" />
            Choose {ALLOWED_EXTENSION} File
          </Button>

          {selectedFile && (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatMegabytes(selectedFile.size)}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Remove selected file"
                className="shrink-0 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>

        {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}

        <Button
          type="button"
          variant="brand"
          disabled={!selectedFile || Boolean(validationError) || isUploading}
          onClick={() => void handleUpload()}
          className="h-12 w-full gap-2 sm:w-auto"
        >
          {isUploading ? (
            <>
              <LoadingSpinner className="size-4 text-current" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Upload &amp; Replace Workbook
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
