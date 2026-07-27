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

/**
 * A selectable question category, mirroring `backend/app/models/category.py`.
 * One category corresponds to one sheet in the questions workbook - the set
 * of categories is entirely dynamic and must never be hardcoded here.
 */
export interface Category {
  id: string;
  name: string;
  questionCount: number;
}

/**
 * One line item in the (not-yet-sent) question generation payload: a
 * category id paired with how many questions to draw from it.
 */
export interface CategorySelectionPayloadItem {
  id: string;
  count: number;
}

/**
 * Shape that will eventually be POSTed to the question generation
 * endpoint once that business logic exists. For now it is only logged to
 * the browser console from the competition setup screen.
 */
export interface GenerateQuestionsPayload {
  categories: CategorySelectionPayloadItem[];
}
