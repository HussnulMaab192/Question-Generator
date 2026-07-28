import { ArrowLeft, Shuffle } from "lucide-react";

import GenerateButton from "@/components/competition/GenerateButton";
import ProgressSummary from "@/components/competition/ProgressSummary";
import { Button } from "@/components/ui/button";
import Tooltip from "@/components/ui/tooltip";
import type { Question, QuestionStatus } from "@/types";

export interface CompetitionToolbarProps {
  questions: Question[];
  statuses: QuestionStatus[];
  isRegenerating: boolean;
  onBackToSetup: () => void;
  onRegenerate: () => void;
}

interface CategoryBreakdownItem {
  category: string;
  count: number;
}

/** Groups the flat generated list by category, e.g. "30 (4)", "28 (1)". */
function summarizeByCategory(questions: Question[]): CategoryBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const question of questions) {
    counts.set(question.category, (counts.get(question.category) ?? 0) + 1);
  }
  return Array.from(counts.entries(), ([category, count]) => ({ category, count }));
}

/**
 * Header for the Generated Questions screen: what was generated (total +
 * per-category breakdown) and overall completion progress, plus the two
 * ways to leave this screen. Sticky at the top of the screen so it (and
 * its actions/progress) stay reachable while scrolling a long list of
 * question cards.
 *
 * "Back to Setup" and "Regenerate" only ever change frontend state/resend
 * the previous request - neither one re-derives the selection, so the
 * examiner's setup choices are never lost.
 */
export default function CompetitionToolbar({
  questions,
  statuses,
  isRegenerating,
  onBackToSetup,
  onRegenerate,
}: CompetitionToolbarProps) {
  const breakdown = summarizeByCategory(questions);

  return (
    <div className="sticky top-2 z-30 flex flex-col gap-4 rounded-xl border bg-card/95 p-4 shadow-md backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold tracking-tight">Generated Questions</h2>
          <p className="text-sm text-muted-foreground">
            Total Questions: <span className="font-semibold text-foreground">{questions.length}</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {breakdown.map(({ category, count }) => (
              <span
                key={category}
                className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
              >
                {category} ({count})
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Tooltip label="Back to setup">
            <Button type="button" variant="outline" onClick={onBackToSetup} className="h-14 w-full gap-2 sm:w-auto">
              <ArrowLeft className="size-4" />
              Back to Setup
            </Button>
          </Tooltip>
          <Tooltip label="Regenerate" className="w-full sm:w-auto">
            <GenerateButton
              label="Regenerate"
              loadingLabel="Regenerating…"
              icon={Shuffle}
              variant="brand"
              disabled={false}
              isLoading={isRegenerating}
              onClick={onRegenerate}
            />
          </Tooltip>
        </div>
      </div>

      <div className="border-t pt-4">
        <ProgressSummary statuses={statuses} />
      </div>
    </div>
  );
}
