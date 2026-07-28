import { cn } from "@/lib/utils";
import type { QuestionStatus } from "@/types";

export interface QuestionStatusBadgeProps {
  status: QuestionStatus;
  className?: string;
}

const STATUS_STYLES: Record<QuestionStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  completed: "bg-emerald-100 text-emerald-800",
  skipped: "bg-amber-100 text-amber-800",
};

const STATUS_LABELS: Record<QuestionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  skipped: "Skipped",
};

/**
 * Colored badge for a question's Competition Mode status. Central place
 * for status → color/label mapping so it never drifts between the card,
 * toolbar, and progress summary.
 */
export default function QuestionStatusBadge({ status, className }: QuestionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
