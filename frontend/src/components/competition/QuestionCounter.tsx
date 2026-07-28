import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface QuestionCounterProps {
  value: number;
  min: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Used to build accessible labels, e.g. "questions for Surah Baqarah". */
  label?: string;
  /**
   * "default" (48px targets, e.g. a standalone stepper) or "compact" (for
   * dense grids like the category selector). Defaults to "default".
   */
  size?: "default" | "compact";
}

/**
 * Generic `[-] value [+]` stepper.
 *
 * Fully controlled: bounds and the current value come from the parent, so
 * this component has no selection/category logic of its own and can be
 * reused anywhere a bounded numeric stepper is needed. The `compact` size
 * still keeps touch-friendly (36px) targets while fitting a dense grid of
 * ~15+ categories.
 */
export default function QuestionCounter({
  value,
  min,
  max,
  onIncrement,
  onDecrement,
  label = "questions",
  size = "default",
}: QuestionCounterProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={cn("flex items-center justify-center", isCompact ? "gap-1" : "gap-3")}
      role="group"
      aria-label={`Number of ${label}`}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("shrink-0", isCompact ? "h-9 w-9" : "h-12 w-12")}
        onClick={onDecrement}
        disabled={value <= min}
        aria-label={`Decrease number of ${label}`}
      >
        <Minus className={isCompact ? "size-3" : "size-4"} />
      </Button>

      <span
        className={cn("text-center font-semibold tabular-nums", isCompact ? "w-5 text-sm" : "w-8 text-base")}
        aria-live="polite"
      >
        {value}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("shrink-0", isCompact ? "h-9 w-9" : "h-12 w-12")}
        onClick={onIncrement}
        disabled={value >= max}
        aria-label={`Increase number of ${label}`}
      >
        <Plus className={isCompact ? "size-3" : "size-4"} />
      </Button>
    </div>
  );
}
