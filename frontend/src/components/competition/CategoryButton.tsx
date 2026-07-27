import { Check } from "lucide-react";

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
 * One selectable category tile.
 *
 * Clicking the header toggles selection (green accent = selected). While
 * selected, it also shows how many questions are available and exposes
 * the per-category `QuestionCounter` - the counter never renders for an
 * unselected category.
 */
export default function CategoryButton({
  category,
  isSelected,
  count,
  onToggle,
  onIncrement,
  onDecrement,
}: CategoryButtonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 transition-colors",
        isSelected
          ? "border-emerald-600 bg-emerald-50"
          : "border-border bg-card hover:border-emerald-300 hover:bg-emerald-50/40",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(category)}
        aria-pressed={isSelected}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold sm:text-base">{category.name}</span>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isSelected
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-muted-foreground/30 text-transparent",
          )}
        >
          <Check className="size-3.5" />
        </span>
      </button>

      {isSelected && (
        <div className="flex flex-col gap-2 border-t border-emerald-200 pt-3">
          <span className="text-xs font-medium text-emerald-700">
            {category.questionCount} available
          </span>
          <QuestionCounter
            value={count}
            min={1}
            max={category.questionCount}
            onIncrement={() => onIncrement(category)}
            onDecrement={() => onDecrement(category)}
            label={`questions for ${category.name}`}
          />
        </div>
      )}
    </div>
  );
}
