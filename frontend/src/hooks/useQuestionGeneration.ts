import { useCallback, useState } from "react";

import { generateQuestions } from "@/api/endpoints/generate";
import { getApiErrorMessage } from "@/lib/apiError";
import type { GenerateQuestionsPayload, Question } from "@/types";

type PendingAction = "generate" | "regenerate" | null;

interface UseQuestionGenerationResult {
  questions: Question[] | null;
  /** Increments every time a new result set is produced - useful as a React `key` to force cards to remount (e.g. collapsing "Show Full Block"). */
  generationId: number;
  isGenerating: boolean;
  pendingAction: PendingAction;
  error: string | null;
  /** Whether `regenerate()` has a payload to resend. */
  canRegenerate: boolean;
  generate: (payload: GenerateQuestionsPayload) => Promise<void>;
  regenerate: () => Promise<void>;
}

/**
 * Encapsulates calling `POST /api/v1/generate` for the competition setup
 * screen: tracks loading/error state and remembers the last payload sent
 * so "Regenerate" can resend it verbatim without the caller needing to
 * rebuild it from current (possibly since-changed) setup state.
 */
export function useQuestionGeneration(): UseQuestionGenerationResult {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [generationId, setGenerationId] = useState(0);
  const [lastPayload, setLastPayload] = useState<GenerateQuestionsPayload | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const runGeneration = useCallback(async (payload: GenerateQuestionsPayload, action: PendingAction) => {
    setPendingAction(action);
    setError(null);

    try {
      const result = await generateQuestions(payload);
      setQuestions(result);
      setLastPayload(payload);
      setGenerationId((id) => id + 1);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to generate questions. Please try again."));
    } finally {
      setPendingAction(null);
    }
  }, []);

  const generate = useCallback(
    (payload: GenerateQuestionsPayload) => runGeneration(payload, "generate"),
    [runGeneration],
  );

  const regenerate = useCallback(() => {
    if (!lastPayload) return Promise.resolve();
    return runGeneration(lastPayload, "regenerate");
  }, [lastPayload, runGeneration]);

  return {
    questions,
    generationId,
    isGenerating: pendingAction !== null,
    pendingAction,
    error,
    canRegenerate: lastPayload !== null,
    generate,
    regenerate,
  };
}
