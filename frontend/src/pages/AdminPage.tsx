import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import WorkbookInfoCard from "@/components/admin/WorkbookInfoCard";
import WorkbookUploadForm from "@/components/admin/WorkbookUploadForm";
import { Button } from "@/components/ui/button";
import { useWorkbookInfo } from "@/hooks/useWorkbookInfo";
import { ROUTES } from "@/routes/paths";

/**
 * Workbook administration: view the currently loaded questions workbook
 * and upload a replacement `.xlsx` file. Stats auto-refresh after upload
 * and via a quiet poll so status stays current without a manual reload.
 */
export default function AdminPage() {
  const { info, isLoading, error, refetch } = useWorkbookInfo();

  const isMissingWorkbook = Boolean(info?.status === "missing" || (!info && !isLoading && !error));

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

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isMissingWorkbook && !error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Workbook Missing</span>
            <span>
              No questions workbook is currently on disk. On cloud hosts like Render&apos;s free
              tier, the filesystem is ephemeral — files uploaded earlier are lost when the server
              sleeps or restarts. Upload the `.xlsx` file again below (or attach a persistent disk
              and set <code className="rounded bg-amber-100 px-1">DATA_DIR</code> to that mount).
            </span>
          </div>
        </div>
      )}

      <WorkbookInfoCard info={info} isLoading={isLoading} />

      <WorkbookUploadForm
        onUploaded={() => {
          void refetch();
        }}
      />
    </div>
  );
}
