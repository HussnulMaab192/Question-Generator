import { Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SelectedCategoryState } from "@/hooks/useCompetitionSetup";

export interface CompetitionSummaryProps {
  selectedCategories: SelectedCategoryState[];
  totalQuestions: number;
}

/**
 * Live read-out of the current selection.
 *
 * Purely presentational - all selection state lives in
 * `useCompetitionSetup`, so this component re-renders automatically as
 * soon as the caller's state changes, with no logic duplicated here.
 */
export default function CompetitionSummary({
  selectedCategories,
  totalQuestions,
}: CompetitionSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition Configuration</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Selected Categories</h3>

          {selectedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories selected yet.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {selectedCategories.map(({ category, count }) => (
                <li key={category.id} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="font-medium">{category.name}</span>
                  <span className="text-muted-foreground">
                    → {count} question{count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm font-medium">Total Questions</span>
          <span className="text-xl font-bold text-emerald-700">{totalQuestions}</span>
        </div>
      </CardContent>
    </Card>
  );
}
