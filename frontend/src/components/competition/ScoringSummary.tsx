import type { QuestionScoresSummary } from "@/hooks/useQuestionScores";

export interface ScoringSummaryProps {
  summary: QuestionScoresSummary;
}

/**
 * Compact live scoring totals for the competition scoreboard.
 * Purely derived from `useQuestionScores` so it cannot drift from the cards.
 */
export default function ScoringSummary({ summary }: ScoringSummaryProps) {
  const { questionCount, memorizationTotal, tajweedTotal, grandTotal, maxPossible } = summary;

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-5">
        <Stat label="Questions" value={questionCount} />
        <Stat label="Memorization" value={memorizationTotal} />
        <Stat label="Tajweed" value={tajweedTotal} />
      </div>

      <div className="flex items-baseline justify-between gap-3 rounded-lg border border-emerald-200 bg-card px-3 py-2 sm:min-w-[9.5rem] sm:justify-start sm:gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">Grand Total</span>
        <span className="text-xl font-bold tabular-nums leading-none text-emerald-900 sm:text-2xl">
          {grandTotal}
          <span className="text-sm font-semibold text-emerald-700/80"> / {maxPossible}</span>
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums leading-none sm:text-lg">{value}</span>
    </div>
  );
}
