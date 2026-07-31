import { CheckCircle2, Clock, FileSpreadsheet, Layers, UploadCloud, XCircle } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WorkbookInfo } from "@/types";

export interface WorkbookInfoCardProps {
  info: WorkbookInfo | null;
  isLoading: boolean;
}

interface StatItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}

function StatItem({ icon: Icon, label, value, emphasize = false }: StatItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-colors",
        emphasize ? "border-emerald-200 bg-emerald-50/70" : "bg-muted/30",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          emphasize ? "bg-emerald-100 text-emerald-700" : "bg-emerald-100 text-emerald-700",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="truncate text-lg font-semibold" title={typeof value === "string" ? value : undefined}>
          {value}
        </span>
      </div>
    </div>
  );
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

/**
 * Admin-page snapshot of the currently loaded workbook.
 * Shows name, upload time, sheet count, last updated, and loaded/missing status.
 */
export default function WorkbookInfoCard({ info, isLoading }: WorkbookInfoCardProps) {
  const isMissing = !info || info.status === "missing";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Workbook</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[72px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatItem
              icon={FileSpreadsheet}
              label="Workbook Name"
              value={info?.filename ?? "—"}
            />
            <StatItem
              icon={UploadCloud}
              label="Upload Time"
              value={formatTimestamp(info?.uploadedAt)}
            />
            <StatItem
              icon={Layers}
              label="Number of Sheets"
              value={isMissing ? 0 : (info?.categoryCount ?? 0)}
            />
            <StatItem
              icon={Clock}
              label="Last Updated"
              value={isMissing ? "—" : formatTimestamp(info?.lastModified)}
            />
            <StatItem
              icon={isMissing ? XCircle : CheckCircle2}
              label="Current Status"
              emphasize={!isMissing}
              value={isMissing ? "Workbook Missing" : "Workbook Loaded"}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
