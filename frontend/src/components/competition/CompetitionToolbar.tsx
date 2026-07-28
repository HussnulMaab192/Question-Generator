import { ArrowLeft, Shuffle } from "lucide-react";

import GenerateButton from "@/components/competition/GenerateButton";
import ScoringSummary from "@/components/competition/ScoringSummary";
import { Button } from "@/components/ui/button";
import Tooltip from "@/components/ui/tooltip";
import type { QuestionScoresSummary } from "@/hooks/useQuestionScores";
import type { Question } from "@/types";

export interface CompetitionToolbarProps {
  questions: Question[];
  summary: QuestionScoresSummary;
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
 * Competition scoreboard for the Results screen.
 *
 * Sits at the top of the results stage as its own visual band (not part of
 * the question cards). Scrolls with the document like a normal block —
 * never sticky/fixed — so question cards never sit behind it.
 */
export default function CompetitionToolbar({
  questions,
  summary,
  isRegenerating,
  onBackToSetup,
  onRegenerate,
}: CompetitionToolbarProps) {
  const breakdown = summarizeByCategory(questions);

  return (
    <section
      aria-label="Competition scoreboard"
      className="rounded-2xl border border-border/80 bg-card px-3 py-3 shadow-lg ring-1 ring-black/5 sm:px-4 sm:py-3.5"
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Scoreboard</p>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">Generated Questions</h2>
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{questions.length}</span> total
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {breakdown.map(({ category, count }) => (
                <span
                  key={category}
                  className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                >
                  {category} ({count})
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:shrink-0">
            <Tooltip label="Back to setup">
              <Button
                type="button"
                variant="outline"
                onClick={onBackToSetup}
                className="h-12 w-full gap-2 touch-manipulation sm:w-auto"
              >
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
                className="h-12 sm:min-w-[180px]"
              />
            </Tooltip>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 sm:px-4">
          <ScoringSummary summary={summary} />
        </div>
      </div>
    </section>
  );
}
