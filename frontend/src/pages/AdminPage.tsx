import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import WorkbookInfoCard from "@/components/admin/WorkbookInfoCard";
import WorkbookUploadForm from "@/components/admin/WorkbookUploadForm";
import { Button } from "@/components/ui/button";
import { useWorkbookInfo } from "@/hooks/useWorkbookInfo";
import { ROUTES } from "@/routes/paths";

/**
 * Workbook administration: view the currently loaded questions workbook
 * (name, last modified time, category/question counts) and upload a
 * replacement `.xlsx` file. Uploading validates, atomically replaces the
 * file on disk, and reloads it - no server restart required, and this
 * page's own stats refresh automatically right after a successful upload.
 */
export default function AdminPage() {
  const { info, isLoading, error, refetch } = useWorkbookInfo();

  const isMissingWorkbook = Boolean(error?.toLowerCase().includes("workbook not found"));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="sm" className="w-fit gap-2 text-muted-foreground">
          <Link to={ROUTES.home}>
            <ArrowLeft className="size-4" />
            Back to Competition Setup
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workbook Administration</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          View the currently loaded questions workbook, or upload a replacement - changes take
          effect immediately, with no server restart required.
        </p>
      </div>

      {error && !isMissingWorkbook && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isMissingWorkbook && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>No workbook loaded yet. Upload one below to get started.</span>
        </div>
      )}

      <WorkbookInfoCard info={info} isLoading={isLoading} />

      <WorkbookUploadForm
        onUploaded={() => {
          // The upload response already carries fresh stats, but refetch
          // anyway so this page stays the source of truth (e.g. the real
          // last-modified timestamp straight from disk).
          void refetch();
        }}
      />
    </div>
  );
}
