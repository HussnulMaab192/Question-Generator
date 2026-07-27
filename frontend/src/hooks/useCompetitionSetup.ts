import { useCallback, useEffect, useMemo, useState } from "react";

import type { Category } from "@/types";

const MIN_COUNT = 1;

export interface SelectedCategoryState {
  category: Category;
  count: number;
}

interface UseCompetitionSetupResult {
  isSelected: (categoryId: string) => boolean;
  getCount: (categoryId: string) => number;
  toggleCategory: (category: Category) => void;
  incrementCount: (category: Category) => void;
  decrementCount: (category: Category) => void;
  selectedCategories: SelectedCategoryState[];
  totalQuestions: number;
  hasSelection: boolean;
}

function clampCount(value: number, max: number): number {
  const safeMax = Math.max(max, MIN_COUNT);
  return Math.min(Math.max(value, MIN_COUNT), safeMax);
}

/**
 * Owns "which categories are selected, and how many questions from each"
 * for the competition setup screen. Kept as a single hook so this logic
 * isn't duplicated across `CategoryButton`, `CompetitionSummary`, and
 * `GenerateButton` - they all just render whatever this hook gives them.
 */
export function useCompetitionSetup(categories: Category[]): UseCompetitionSetupResult {
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Keep selection in sync if the workbook-derived category list changes
  // underneath us (e.g. after a retry): drop categories that no longer
  // exist and re-clamp counts to their current `questionCount`.
  useEffect(() => {
    setCounts((prev) => {
      let changed = false;
      const next: Record<string, number> = {};

      for (const category of categories) {
        if (category.id in prev) {
          const clamped = clampCount(prev[category.id], category.questionCount);
          next[category.id] = clamped;
          if (clamped !== prev[category.id]) changed = true;
        }
      }

      if (Object.keys(next).length !== Object.keys(prev).length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [categories]);

  const isSelected = useCallback((categoryId: string) => categoryId in counts, [counts]);

  const getCount = useCallback((categoryId: string) => counts[categoryId] ?? 0, [counts]);

  const toggleCategory = useCallback((category: Category) => {
    setCounts((prev) => {
      if (category.id in prev) {
        const next = { ...prev };
        delete next[category.id];
        return next;
      }
      return { ...prev, [category.id]: clampCount(MIN_COUNT, category.questionCount) };
    });
  }, []);

  const incrementCount = useCallback((category: Category) => {
    setCounts((prev) => {
      if (!(category.id in prev)) return prev;
      return {
        ...prev,
        [category.id]: clampCount(prev[category.id] + 1, category.questionCount),
      };
    });
  }, []);

  const decrementCount = useCallback((category: Category) => {
    setCounts((prev) => {
      if (!(category.id in prev)) return prev;
      return {
        ...prev,
        [category.id]: clampCount(prev[category.id] - 1, category.questionCount),
      };
    });
  }, []);

  const selectedCategories = useMemo<SelectedCategoryState[]>(
    () =>
      categories
        .filter((category) => category.id in counts)
        .map((category) => ({ category, count: counts[category.id] })),
    [categories, counts],
  );

  const totalQuestions = useMemo(
    () => selectedCategories.reduce((sum, { count }) => sum + count, 0),
    [selectedCategories],
  );

  return {
    isSelected,
    getCount,
    toggleCategory,
    incrementCount,
    decrementCount,
    selectedCategories,
    totalQuestions,
    hasSelection: selectedCategories.length > 0,
  };
}
