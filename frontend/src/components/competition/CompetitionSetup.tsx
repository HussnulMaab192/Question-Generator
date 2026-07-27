import { AlertTriangle, RefreshCw } from "lucide-react";

import CategoryButton from "@/components/competition/CategoryButton";
import CompetitionSummary from "@/components/competition/CompetitionSummary";
import GenerateButton from "@/components/competition/GenerateButton";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { useCompetitionSetup } from "@/hooks/useCompetitionSetup";
import type { GenerateQuestionsPayload } from "@/types";

/**
 * Competition setup screen.
 *
 * Lets the examiner pick one or more categories (fetched dynamically from
 * the backend workbook), choose how many questions to draw from each, and
 * review a live summary. Question generation itself is NOT implemented
 * yet - "Generate Questions" only logs the payload it would send.
 */
export default function CompetitionSetup() {
  const { categories, isLoading, error, refetch } = useCategories();
  const {
    isSelected,
    getCount,
    toggleCategory,
    incrementCount,
    decrementCount,
    selectedCategories,
    totalQuestions,
    hasSelection,
  } = useCompetitionSetup(categories);

  const handleGenerate = () => {
    const payload: GenerateQuestionsPayload = {
      categories: selectedCategories.map(({ category, count }) => ({
        id: category.id,
        count,
      })),
    };

    // TODO: POST this payload once the question generation endpoint exists.
    console.log("Generate Questions payload:", payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoadingSpinner />
        Loading categories…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          Could not load categories
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No categories were found in the questions workbook.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            category={category}
            isSelected={isSelected(category.id)}
            count={getCount(category.id)}
            onToggle={toggleCategory}
            onIncrement={incrementCount}
            onDecrement={decrementCount}
          />
        ))}
      </div>

      <CompetitionSummary selectedCategories={selectedCategories} totalQuestions={totalQuestions} />

      <GenerateButton disabled={!hasSelection} onClick={handleGenerate} />
    </div>
  );
}
