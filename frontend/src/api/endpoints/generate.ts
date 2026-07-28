import { apiClient } from "@/api/client";
import type { GenerateQuestionsPayload, Question } from "@/types";

/**
 * Requests a random, duplicate-free set of questions for the given
 * category selections. Throws (via axios) on non-2xx responses - callers
 * should surface the error with `getApiErrorMessage`.
 */
export async function generateQuestions(payload: GenerateQuestionsPayload): Promise<Question[]> {
  const { data } = await apiClient.post<Question[]>("/generate", payload);
  return data;
}
