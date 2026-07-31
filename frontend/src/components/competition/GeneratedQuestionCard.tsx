import { useState } from "react";
import { Check, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

import QuestionCompletionBadge from "@/components/competition/QuestionCompletionBadge";
import ScoreStepper from "@/components/competition/ScoreStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SCORE_FIELD_CONFIG } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { Question, QuestionCompletionStatus, QuestionScore } from "@/types";

export interface GeneratedQuestionCardProps {
  question: Question;
  score: QuestionScore;
  completionStatus: QuestionCompletionStatus;
  onChangeMemorization: (value: number) => void;
  onChangeTajweed: (value: number) => void;
  onMarkCompleted: () => void;
  onMarkPending: () => void;
}

const COMPLETION_ACCENT_BORDER: Record<QuestionCompletionStatus, string> = {
  pending: "border-l-slate-300",
  completed: "border-l-emerald-600",
};

/**
 * Renders a question's actual content (the recitation passage today).
 *
 * Deliberately split out from the card's chrome as the single extension
 * point for future question types: branch on `question.questionType` here
 * when new formats arrive — scoring / completion controls stay unchanged.
 */
function QuestionContent({ question, isExpanded }: { question: Question; isExpanded: boolean }) {
  return (
    <p
      dir="rtl"
      lang="ar"
      className="w-full text-center text-lg font-medium leading-snug sm:text-xl sm:leading-relaxed"
    >
      {isExpanded ? question.fullText : question.text}
    </p>
  );
}

/**
 * One generated question card: category, number, Arabic text, expand
 * control, Pending/Completed mark, and typed Memorization / Tajweed scores.
 * Score changes never auto-complete a question — only the explicit mark does.
 */
export default function GeneratedQuestionCard({
  question,
  score,
  completionStatus,
  onChangeMemorization,
  onChangeTajweed,
  onMarkCompleted,
  onMarkPending,
}: GeneratedQuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = completionStatus === "completed";
  const memorizationConfig = SCORE_FIELD_CONFIG.memorization;
  const tajweedConfig = SCORE_FIELD_CONFIG.tajweed;

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-l-4 shadow-sm",
        COMPLETION_ACCENT_BORDER[completionStatus],
      )}
    >
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b bg-muted/30 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            Category {question.category}
          </span>
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">
            Question {question.questionNumber}
          </span>
        </div>
        <QuestionCompletionBadge status={completionStatus} />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center gap-3 p-4 sm:p-5">
        <QuestionContent question={question} isExpanded={isExpanded} />

        <div className="flex w-full flex-wrap items-center justify-center gap-2 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="h-11 gap-1.5 touch-manipulation"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {isExpanded ? "Hide Full Block" : "Show Full Block"}
          </Button>

          {isCompleted ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMarkPending}
              className="h-11 gap-1.5 touch-manipulation"
            >
              <RotateCcw className="size-4" />
              Mark Pending
            </Button>
          ) : (
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={onMarkCompleted}
              className="h-11 gap-1.5 touch-manipulation"
            >
              <Check className="size-4" />
              Mark Completed
            </Button>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <ScoreStepper
            label="Memorization Score"
            field="memorization"
            value={score.memorization}
            min={memorizationConfig.min}
            max={memorizationConfig.max}
            step={memorizationConfig.step}
            onChange={onChangeMemorization}
          />
          <ScoreStepper
            label="Tajweed Score"
            field="tajweed"
            value={score.tajweed}
            min={tajweedConfig.min}
            max={tajweedConfig.max}
            step={tajweedConfig.step}
            onChange={onChangeTajweed}
          />
        </div>
      </CardContent>
    </Card>
  );
}
