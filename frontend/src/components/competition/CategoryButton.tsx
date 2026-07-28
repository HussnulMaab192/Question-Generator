import { Check } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";

import QuestionCounter from "@/components/competition/QuestionCounter";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export interface CategoryButtonProps {
  category: Category;
  isSelected: boolean;
  count: number;
  onToggle: (category: Category) => void;
  onIncrement: (category: Category) => void;
  onDecrement: (category: Category) => void;
}

/**
 * One compact, selectable category tile.
 *
 * The ENTIRE tile is the toggle control (not just the label) - it's a
 * `div` with `role="button"` rather than a native `<button>` because it
 * needs to contain the counter's own nested buttons when selected (native
 * buttons can't be nested inside one another). Clicks/keypresses on the
 * counter call `stopPropagation()` so adjusting the count never also
 * toggles selection.
 *
 * Designed for a dense grid of ~15+ categories: unselected tiles show
 * just the category label; selecting one adds a "✓ selected" indicator
 * and a compact `QuestionCounter` underneath. Category names/ids are
 * never hardcoded here - whatever `category` the caller passes (derived
 * dynamically from the backend workbook) is what renders.
 */
export default function CategoryButton({
  category,
  isSelected,
  count,
  onToggle,
  onIncrement,
  onDecrement,
}: CategoryButtonProps) {
  const handleToggle = () => onToggle(category);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  const stopPropagation = (event: MouseEvent | KeyboardEvent) => event.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Category ${category.name}, ${category.questionCount} question${
        category.questionCount === 1 ? "" : "s"
      } available`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex cursor-pointer flex-col items-stretch gap-1.5 rounded-lg border-2 p-1.5 transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
        isSelected
          ? "border-emerald-600 bg-emerald-50"
          : "border-border bg-card hover:border-emerald-300 hover:bg-emerald-50/40",
      )}
    >
      <div className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1 text-center">
        <span className="w-full truncate text-sm font-bold leading-tight" title={category.name}>
          {category.name}
        </span>
        {isSelected && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
            <Check className="size-3" aria-hidden="true" />
            selected
          </span>
        )}
      </div>

      {isSelected && (
        <div onClick={stopPropagation} onKeyDown={stopPropagation}>
          <QuestionCounter
            value={count}
            min={1}
            max={category.questionCount}
            onIncrement={() => onIncrement(category)}
            onDecrement={() => onDecrement(category)}
            label={`questions for ${category.name}`}
            size="compact"
          />
        </div>
      )}
    </div>
  );
}
