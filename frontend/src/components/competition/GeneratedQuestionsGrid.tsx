import GeneratedQuestionCard from "@/components/competition/GeneratedQuestionCard";
import type { ScoreField } from "@/hooks/useQuestionScores";
import type { Question, QuestionCompletionStatus, QuestionScore } from "@/types";

export interface GeneratedQuestionsGridProps {
  questions: Question[];
  scores: QuestionScore[];
  completionStatuses: QuestionCompletionStatus[];
  onIncrementScore: (index: number, field: ScoreField) => void;
  onDecrementScore: (index: number, field: ScoreField) => void;
  onMarkCompleted: (index: number) => void;
  onMarkPending: (index: number) => void;
}

/**
 * Shows every generated question simultaneously in a responsive grid:
 * 1 column on phones, 2 on tablets, 3 on desktop.
 */
export default function GeneratedQuestionsGrid({
  questions,
  scores,
  completionStatuses,
  onIncrementScore,
  onDecrementScore,
  onMarkCompleted,
  onMarkPending,
}: GeneratedQuestionsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {questions.map((question, index) => {
        const score = scores[index] ?? { memorization: 0, tajweed: 0 };
        const completionStatus = completionStatuses[index] ?? "pending";
        return (
          <GeneratedQuestionCard
            key={`${question.category}-${question.questionNumber}-${index}`}
            question={question}
            score={score}
            completionStatus={completionStatus}
            onIncrementMemorization={() => onIncrementScore(index, "memorization")}
            onDecrementMemorization={() => onDecrementScore(index, "memorization")}
            onIncrementTajweed={() => onIncrementScore(index, "tajweed")}
            onDecrementTajweed={() => onDecrementScore(index, "tajweed")}
            onMarkCompleted={() => onMarkCompleted(index)}
            onMarkPending={() => onMarkPending(index)}
          />
        );
      })}
    </div>
  );
}
