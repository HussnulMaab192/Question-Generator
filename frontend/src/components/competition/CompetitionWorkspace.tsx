import { useEffect, useState } from "react";
import { AlertTriangle, FileWarning, RefreshCw, Sparkles } from "lucide-react";

import { reloadWorkbook } from "@/api/endpoints/reload";
import CategoryButton from "@/components/competition/CategoryButton";
import CategoryGridSkeleton from "@/components/competition/CategoryGridSkeleton";
import CompetitionSummary from "@/components/competition/CompetitionSummary";
import CompetitionToolbar from "@/components/competition/CompetitionToolbar";
import GenerateButton from "@/components/competition/GenerateButton";
import GeneratedQuestionsGrid from "@/components/competition/GeneratedQuestionsGrid";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Tooltip from "@/components/ui/tooltip";
import { useToast } from "@/contexts/ToastContext";
import { useCategories } from "@/hooks/useCategories";
import { useCompetitionSetup } from "@/hooks/useCompetitionSetup";
import { useQuestionGeneration } from "@/hooks/useQuestionGeneration";
import { useQuestionCompletion } from "@/hooks/useQuestionCompletion";
import { useQuestionScores } from "@/hooks/useQuestionScores";
import { getApiErrorMessage } from "@/lib/apiError";
import type { GenerateQuestionsPayload } from "@/types";

type Stage = "setup" | "results";

/**
 * Two-stage competition workflow, driven entirely by application state -
 * never routing:
 *
 * 1. "setup" - category selection, per-category counts, and the
 *    "Generate Questions" call-to-action. This is what the app starts on.
 * 2. "results" - every generated question shown at once with per-question
 *    Memorization / Tajweed scores, Pending/Completed marks, a scoring
 *    summary, and a toolbar to go back to setup (selections are preserved)
 *    or regenerate (resends the same request for a fresh shuffle; scores
 *    and completion marks reset).
 *
 * Both stages are rendered by this single component so
 * `useCompetitionSetup`'s selection state is never remounted/lost when
 * switching between them.
 */
export default function CompetitionWorkspace() {
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
  const { questions, pendingAction, error: generationError, generate, regenerate } = useQuestionGeneration();
  const { scores, summary, hasChanges: hasScoreChanges, incrementScore, decrementScore } =
    useQuestionScores(questions);
  const { statuses: completionStatuses, markCompleted, markPending, hasCompletedMarks } =
    useQuestionCompletion(questions);
  const { showToast } = useToast();
  const [stage, setStage] = useState<Stage>("setup");
  const [isRefreshingWorkbook, setIsRefreshingWorkbook] = useState(false);
  const [isConfirmingBackToSetup, setIsConfirmingBackToSetup] = useState(false);

  // Move to the results screen the moment a new question set successfully
  // arrives. Covers both the very first "Generate Questions" (switches
  // "setup" -> "results") and a later "Regenerate" while already on the
  // results screen (a no-op, `stage` is already "results").
  useEffect(() => {
    if (questions) setStage("results");
  }, [questions]);

  // Every fresh (re)generation gets its own success toast.
  useEffect(() => {
    if (questions) showToast("Questions generated successfully.", "success");
  }, [questions, showToast]);

  const handleGenerate = () => {
    const payload: GenerateQuestionsPayload = {
      categories: selectedCategories.map(({ category, count }) => ({
        id: category.id,
        count,
      })),
    };
    void generate(payload);
  };

  const handleRegenerate = () => void regenerate();

  const hasUnsavedProgress = hasScoreChanges || hasCompletedMarks;

  const handleBackToSetupRequest = () => {
    if (hasUnsavedProgress) {
      setIsConfirmingBackToSetup(true);
      return;
    }
    setStage("setup");
  };

  const confirmBackToSetup = () => {
    setIsConfirmingBackToSetup(false);
    setStage("setup");
  };

  const handleRefreshWorkbook = async () => {
    setIsRefreshingWorkbook(true);
    try {
      const result = await reloadWorkbook();
      await refetch();
      showToast(
        `Workbook reloaded successfully. ${result.categories} categor${
          result.categories === 1 ? "y" : "ies"
        } found.`,
        "success",
      );
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to reload workbook."), "error");
    } finally {
      setIsRefreshingWorkbook(false);
    }
  };

  if (isLoading) {
    return <CategoryGridSkeleton />;
  }

  const isMissingWorkbook = Boolean(error?.toLowerCase().includes("workbook not found"));

  if (isMissingWorkbook) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <FileWarning className="size-8 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">No workbook loaded.</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add the competition questions Excel file to the backend's data folder, then retry.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} className="gap-2">
          <RefreshCw className="size-4" />
          Retry
        </Button>
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
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} className="gap-2">
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

  const generationErrorBanner = generationError && (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{generationError}</span>
    </div>
  );

  if (stage === "results" && questions) {
    return (
      <>
        <div className="flex flex-col animate-in fade-in">
          {/* Scoreboard band — visually separate from the question cards below. */}
          <CompetitionToolbar
            questions={questions}
            summary={summary}
            isRegenerating={pendingAction === "regenerate"}
            onBackToSetup={handleBackToSetupRequest}
            onRegenerate={handleRegenerate}
          />

          {/* 32px gap so the first card never reads as part of the scoreboard. */}
          <div className="mt-8 flex flex-col gap-4">
            {generationErrorBanner}

            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No questions generated yet.</p>
            ) : (
              <GeneratedQuestionsGrid
                questions={questions}
                scores={scores}
                completionStatuses={completionStatuses}
                onIncrementScore={incrementScore}
                onDecrementScore={decrementScore}
                onMarkCompleted={markCompleted}
                onMarkPending={markPending}
              />
            )}
          </div>
        </div>

        <ConfirmDialog
          open={isConfirmingBackToSetup}
          title="Leave Generated Questions?"
          description="You've entered scores or marked questions as completed. Going back to setup and generating again will create a new shuffled set and reset that progress."
          confirmLabel="Back to Setup"
          cancelLabel="Stay Here"
          onConfirm={confirmBackToSetup}
          onCancel={() => setIsConfirmingBackToSetup(false)}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Competition Setup</h2>
          <p className="text-sm text-muted-foreground">
            Categories are loaded dynamically from the backend&apos;s questions workbook.
          </p>
        </div>
        <Tooltip label="Refresh workbook" className="self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRefreshWorkbook()}
            disabled={isRefreshingWorkbook}
            className="gap-2"
          >
            <RefreshCw className={isRefreshingWorkbook ? "size-4 animate-spin" : "size-4"} />
            {isRefreshingWorkbook ? "Refreshing…" : "Refresh Categories"}
          </Button>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
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

      <Tooltip label="Generate Questions" className="w-full sm:w-auto">
        <GenerateButton
          label="Generate Questions"
          loadingLabel="Generating…"
          icon={Sparkles}
          disabled={!hasSelection}
          isLoading={pendingAction === "generate"}
          onClick={handleGenerate}
        />
      </Tooltip>

      {generationErrorBanner}
    </div>
  );
}
