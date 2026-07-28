import type { QuestionStatus } from "@/types";

export interface ProgressSummaryProps {
  statuses: QuestionStatus[];
}

/**
 * Segmented progress bar + counts for the current question set (e.g.
 * "Completed 5 / 10", "Skipped 1 / 10", "Pending 4 / 10"). Computes
 * everything from the raw per-question status list so counts can never
 * drift out of sync with the actual statuses.
 */
export default function ProgressSummary({ statuses }: ProgressSummaryProps) {
  const total = statuses.length;
  const completed = statuses.filter((status) => status === "completed").length;
  const skipped = statuses.filter((status) => status === "skipped").length;
  const pending = total - completed - skipped;

  const percentOf = (count: number) => (total > 0 ? (count / total) * 100 : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-emerald-600 transition-[width]"
          style={{ width: `${percentOf(completed)}%` }}
          aria-hidden="true"
        />
        <div
          className="h-full bg-amber-500 transition-[width]"
          style={{ width: `${percentOf(skipped)}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-muted-foreground sm:text-sm">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-600" aria-hidden="true" />
          Completed <span className="font-semibold text-foreground">{completed} / {total}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
          Skipped <span className="font-semibold text-foreground">{skipped} / {total}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-slate-300" aria-hidden="true" />
          Pending <span className="font-semibold text-foreground">{pending} / {total}</span>
        </span>
      </div>
    </div>
  );
}
