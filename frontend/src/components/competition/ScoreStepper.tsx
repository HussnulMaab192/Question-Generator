import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SCORE_MAX, SCORE_MIN } from "@/types";

export interface ScoreStepperProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

/**
 * Large, tablet-friendly `[-] N [+]` control for a single 0–10 score
 * field (Memorization or Tajweed). Fully controlled — bounds are fixed
 * by the scoring contract; the parent owns the value.
 */
export default function ScoreStepper({ label, value, onIncrement, onDecrement }: ScoreStepperProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:p-4">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="flex items-center justify-between gap-3" role="group" aria-label={label}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-14 shrink-0 touch-manipulation"
          onClick={onDecrement}
          disabled={value <= SCORE_MIN}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="size-5" />
        </Button>

        <span
          className="min-w-[3rem] text-center text-3xl font-bold tabular-nums tracking-tight"
          aria-live="polite"
        >
          {value}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-14 shrink-0 touch-manipulation"
          onClick={onIncrement}
          disabled={value >= SCORE_MAX}
          aria-label={`Increase ${label}`}
        >
          <Plus className="size-5" />
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        {SCORE_MIN}–{SCORE_MAX}
      </span>
    </div>
  );
}
