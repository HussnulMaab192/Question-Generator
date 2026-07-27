import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface QuestionCounterProps {
  value: number;
  min: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Used to build accessible labels, e.g. "questions for Surah Baqarah". */
  label?: string;
}

/**
 * Generic `[-] value [+]` stepper.
 *
 * Fully controlled: bounds and the current value come from the parent, so
 * this component has no selection/category logic of its own and can be
 * reused anywhere a bounded numeric stepper is needed. Buttons are 48px
 * square to stay touch-friendly on tablets/phones.
 */
export default function QuestionCounter({
  value,
  min,
  max,
  onIncrement,
  onDecrement,
  label = "questions",
}: QuestionCounterProps) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={`Number of ${label}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-12 w-12 shrink-0"
        onClick={onDecrement}
        disabled={value <= min}
        aria-label={`Decrease number of ${label}`}
      >
        <Minus className="size-4" />
      </Button>

      <span className="w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-12 w-12 shrink-0"
        onClick={onIncrement}
        disabled={value >= max}
        aria-label={`Increase number of ${label}`}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
