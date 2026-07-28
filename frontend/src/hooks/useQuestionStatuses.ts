import { useCallback, useEffect, useState } from "react";

import type { Question, QuestionStatus } from "@/types";

interface UseQuestionStatusesResult {
  statuses: QuestionStatus[];
  markCompleted: (index: number) => void;
  markSkipped: (index: number) => void;
}

/**
 * Owns the Competition Mode status ("pending" | "completed" | "skipped")
 * for every generated question, keyed by array index.
 *
 * IMPORTANT: this never calls the backend. Marking a question
 * completed/skipped only ever updates this frontend state. Statuses reset
 * to "pending" for every question whenever a *new* question set arrives
 * (i.e. `questions` is a new array reference from a fresh
 * generate/regenerate) - `questions` only changes on those two actions.
 */
export function useQuestionStatuses(questions: Question[] | null): UseQuestionStatusesResult {
  const [statuses, setStatuses] = useState<QuestionStatus[]>([]);

  useEffect(() => {
    setStatuses(questions ? questions.map(() => "pending") : []);
  }, [questions]);

  const setStatusAt = useCallback((index: number, status: QuestionStatus) => {
    setStatuses((previous) => previous.map((value, i) => (i === index ? status : value)));
  }, []);

  const markCompleted = useCallback((index: number) => setStatusAt(index, "completed"), [setStatusAt]);
  const markSkipped = useCallback((index: number) => setStatusAt(index, "skipped"), [setStatusAt]);

  return { statuses, markCompleted, markSkipped };
}
