import { AlertTriangle, RefreshCw } from "lucide-react";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Renders one selectable button per category returned by the backend.
 *
 * IMPORTANT: This component never hardcodes category names/buttons. It is
 * driven entirely by `GET /api/v1/categories`, so it automatically reflects
 * whatever sheets exist in the workbook - no frontend changes are ever
 * required when sheets are added, removed, or renamed.
 */
export default function CategorySelector({
  selectedCategoryId,
  onSelectCategory,
}: CategorySelectorProps) {
  const { categories, isLoading, error, refetch } = useCategories();

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
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        return (
          <Button
            key={category.id}
            type="button"
            variant={isSelected ? "default" : "outline"}
            aria-pressed={isSelected}
            onClick={() => onSelectCategory(category.id)}
            className="h-auto flex-col items-start gap-1 px-4 py-2.5"
          >
            <span className="text-sm font-medium">{category.name}</span>
            <span
              className={cn(
                "text-xs font-normal",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {category.questionCount} question{category.questionCount === 1 ? "" : "s"}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
