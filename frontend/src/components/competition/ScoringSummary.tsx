import type { QuestionScoresSummary } from "@/hooks/useQuestionScores";
import { formatScore } from "@/lib/scoring";

export interface ScoringSummaryProps {
  summary: QuestionScoresSummary;
}

/**
 * Separated live scoring totals for the competition scoreboard:
 * Questions, Memorization XX/max, Tajweed XX/max, Overall XX/max.
 */
export default function ScoringSummary({ summary }: ScoringSummaryProps) {
  const {
    questionCount,
    memorizationTotal,
    memorizationMax,
    tajweedTotal,
    tajweedMax,
    overallTotal,
    overallMax,
  } = summary;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <SummaryTile label="Questions" primary={String(questionCount)} />
      <SummaryTile
        label="Memorization"
        primary={`${formatScore(memorizationTotal)} / ${formatScore(memorizationMax)}`}
      />
      <SummaryTile
        label="Tajweed"
        primary={`${formatScore(tajweedTotal)} / ${formatScore(tajweedMax)}`}
      />
      <SummaryTile
        label="Overall Total"
        primary={`${formatScore(overallTotal)} / ${formatScore(overallMax)}`}
        emphasize
      />
    </div>
  );
}

function SummaryTile({
  label,
  primary,
  emphasize = false,
}: {
  label: string;
  primary: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={
        emphasize
          ? "flex flex-col gap-1 rounded-lg border border-emerald-200 bg-card px-3 py-2.5"
          : "flex flex-col gap-1 rounded-lg border border-transparent bg-background/60 px-3 py-2.5"
      }
    >
      <span
        className={
          emphasize
            ? "text-[11px] font-semibold uppercase tracking-wide text-emerald-800"
            : "text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasize
            ? "text-lg font-bold tabular-nums leading-tight text-emerald-900 sm:text-xl"
            : "text-lg font-semibold tabular-nums leading-tight sm:text-xl"
        }
      >
        {primary}
      </span>
    </div>
  );
}
