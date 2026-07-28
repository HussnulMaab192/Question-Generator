import GeneratedQuestionCard from "@/components/competition/GeneratedQuestionCard";
import type { Question, QuestionStatus } from "@/types";

export interface GeneratedQuestionsGridProps {
  questions: Question[];
  statuses: QuestionStatus[];
  onMarkCompleted: (index: number) => void;
  onMarkSkipped: (index: number) => void;
}

/**
 * Shows every generated question simultaneously (no single-question
 * navigation) in a responsive grid: 1 column on phones, 2 on tablets, 3
 * on desktop.
 */
export default function GeneratedQuestionsGrid({
  questions,
  statuses,
  onMarkCompleted,
  onMarkSkipped,
}: GeneratedQuestionsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {questions.map((question, index) => (
        <GeneratedQuestionCard
          key={`${question.category}-${question.questionNumber}-${index}`}
          question={question}
          status={statuses[index] ?? "pending"}
          onMarkCompleted={() => onMarkCompleted(index)}
          onMarkSkipped={() => onMarkSkipped(index)}
        />
      ))}
    </div>
  );
}
