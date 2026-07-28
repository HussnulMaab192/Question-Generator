import { useCallback, useEffect, useMemo, useState } from "react";

import type { Question, QuestionCompletionStatus } from "@/types";

interface UseQuestionCompletionResult {
  statuses: QuestionCompletionStatus[];
  markCompleted: (index: number) => void;
  markPending: (index: number) => void;
  /** True once any question has been explicitly marked completed. */
  hasCompletedMarks: boolean;
}

/**
 * Owns Pending / Completed marks for every generated question.
 *
 * Independent of Memorization / Tajweed scores — changing a score never
 * flips completion, and marking completed never changes scores. Resets to
 * "pending" whenever a new question set arrives (Generate / Regenerate).
 * Frontend-only; never calls the backend.
 */
export function useQuestionCompletion(questions: Question[] | null): UseQuestionCompletionResult {
  const [statuses, setStatuses] = useState<QuestionCompletionStatus[]>([]);

  useEffect(() => {
    setStatuses(questions ? questions.map(() => "pending") : []);
  }, [questions]);

  const setStatusAt = useCallback((index: number, status: QuestionCompletionStatus) => {
    setStatuses((previous) => previous.map((value, i) => (i === index ? status : value)));
  }, []);

  const markCompleted = useCallback((index: number) => setStatusAt(index, "completed"), [setStatusAt]);
  const markPending = useCallback((index: number) => setStatusAt(index, "pending"), [setStatusAt]);

  const hasCompletedMarks = useMemo(
    () => statuses.some((status) => status === "completed"),
    [statuses],
  );

  return { statuses, markCompleted, markPending, hasCompletedMarks };
}
