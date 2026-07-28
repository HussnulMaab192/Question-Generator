import { Clock, FileSpreadsheet, Hash, Layers } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkbookInfo } from "@/types";

export interface WorkbookInfoCardProps {
  info: WorkbookInfo | null;
  isLoading: boolean;
}

interface StatItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}

function StatItem({ icon: Icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
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

/**
 * The four Admin-page stats requested for the currently loaded workbook:
 * name, last modified time, detected category count, and total question
 * count (summed across every category). Purely presentational - all
 * fetching/reloading lives in `useWorkbookInfo` / `AdminPage`.
 */
export default function WorkbookInfoCard({ info, isLoading }: WorkbookInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Workbook</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-[72px]" />
            ))}
          </div>
        ) : info ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatItem icon={FileSpreadsheet} label="Workbook Name" value={info.filename} />
            <StatItem icon={Clock} label="Last Modified" value={new Date(info.lastModified).toLocaleString()} />
            <StatItem icon={Layers} label="Categories Detected" value={info.categoryCount} />
            <StatItem icon={Hash} label="Total Questions" value={info.totalQuestions} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workbook loaded.</p>
        )}
      </CardContent>
    </Card>
  );
}
