import { useState } from "react";
import { Check, ChevronDown, ChevronUp, SkipForward } from "lucide-react";

import QuestionStatusBadge from "@/components/competition/QuestionStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Question, QuestionStatus } from "@/types";

export interface GeneratedQuestionCardProps {
  question: Question;
  status: QuestionStatus;
  onMarkCompleted: () => void;
  onMarkSkipped: () => void;
}

const STATUS_ACCENT_BORDER: Record<QuestionStatus, string> = {
  pending: "border-l-slate-300",
  completed: "border-l-emerald-600",
  skipped: "border-l-amber-500",
};

/**
 * Renders a question's actual content (the recitation passage today).
 *
 * Deliberately split out from the card's chrome (header/status/actions
 * below) as the single extension point for future question types: the
 * backend only produces plain text passages right now, but if/when
 * `question.questionType` grows new values (e.g. "complete-the-block",
 * "next-ayah"), branch on it here to render something else - the rest of
 * `GeneratedQuestionCard` (header, status badge, action buttons) doesn't
 * need to change.
 */
function QuestionContent({ question, isExpanded }: { question: Question; isExpanded: boolean }) {
  return (
    <p
      dir="rtl"
      lang="ar"
      className="w-full flex-1 text-center text-2xl font-medium leading-loose sm:text-[1.75rem]"
    >
      {isExpanded ? question.fullText : question.text}
    </p>
  );
}

/**
 * One generated question, always rendered alongside every other one on
 * the Generated Questions screen (no single-question navigation). Shows
 * category/number, a status badge, the question content, and controls to
 * expand the full block or mark the question completed/skipped - all of
 * which only ever affect frontend state.
 */
export default function GeneratedQuestionCard({
  question,
  status,
  onMarkCompleted,
  onMarkSkipped,
}: GeneratedQuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden border-l-4 shadow-sm", STATUS_ACCENT_BORDER[status])}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b bg-muted/30 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            Category {question.category}
          </span>
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">
            Question {question.questionNumber}
          </span>
        </div>
        <QuestionStatusBadge status={status} />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center gap-5 p-5 sm:p-6">
        <QuestionContent question={question} isExpanded={isExpanded} />

        <div className="flex w-full flex-wrap items-center justify-center gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="gap-1.5"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {isExpanded ? "Hide Full Block" : "Show Full Block"}
          </Button>

          <Button type="button" variant="brand" size="sm" onClick={onMarkCompleted} className="gap-1.5">
            <Check className="size-4" />
            Mark Completed
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMarkSkipped}
            className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
          >
            <SkipForward className="size-4" />
            Mark Skipped
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
