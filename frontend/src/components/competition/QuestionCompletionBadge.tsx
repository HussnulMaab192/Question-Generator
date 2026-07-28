import { cn } from "@/lib/utils";
import type { QuestionCompletionStatus } from "@/types";

export interface QuestionCompletionBadgeProps {
  status: QuestionCompletionStatus;
  className?: string;
}

const STATUS_STYLES: Record<QuestionCompletionStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  completed: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<QuestionCompletionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
};

/** Colored badge for a question's Pending / Completed mark. */
export default function QuestionCompletionBadge({ status, className }: QuestionCompletionBadgeProps) {
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
