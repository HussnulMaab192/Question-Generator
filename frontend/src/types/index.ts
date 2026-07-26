/**
 * Shared, cross-cutting TypeScript types.
 *
 * NOTE: Domain types (e.g. Question, GenerateQuestionsRequest/Response)
 * are intentionally left out until the corresponding business logic and
 * backend contracts are finalized. Mirror `backend/app/models` here once
 * they are.
 */

export interface HealthResponse {
  status: string;
  app_env: string;
  version: string;
}
