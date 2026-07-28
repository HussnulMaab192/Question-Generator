/**
 * Shared, cross-cutting TypeScript types.
 *
 * Domain types below mirror `backend/app/models` - keep them in sync with
 * the backend's Pydantic models whenever the API contract changes.
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
 * Payload POSTed to `POST /api/v1/generate`.
 */
export interface GenerateQuestionsPayload {
  categories: CategorySelectionPayloadItem[];
}

/**
 * A single generated question, mirroring `backend/app/models/question.py`.
 *
 * `questionType` is reserved for future question formats (e.g.
 * "complete-the-block", "next-ayah"). It's optional and unused today -
 * the backend only produces plain recitation passages - but keeping it
 * here means new types won't require a breaking change to this
 * interface. See `GeneratedQuestionCard` for where a type-specific
 * rendering branch would hook in.
 */
export interface Question {
  category: string;
  questionNumber: number;
  text: string;
  fullText: string;
  questionType?: string;
}

/**
 * Competition Mode status for a generated question. This is purely
 * frontend/session state - it is never sent to or derived from the
 * backend.
 */
export type QuestionStatus = "pending" | "completed" | "skipped";

/**
 * Response from `POST /api/v1/reload`, mirroring
 * `backend/app/models/reload.py`.
 */
export interface ReloadResponse {
  success: boolean;
  categories: number;
}

/**
 * Snapshot of the currently loaded questions workbook, mirroring
 * `backend/app/models/workbook.py`. Powers the Admin page.
 */
export interface WorkbookInfo {
  filename: string;
  /** ISO 8601 timestamp string. */
  lastModified: string;
  categoryCount: number;
  totalQuestions: number;
}

/**
 * Response from `POST /api/v1/admin/upload-workbook`, mirroring
 * `backend/app/models/admin.py`.
 */
export interface UploadWorkbookResponse {
  success: boolean;
  message: string;
  workbook: WorkbookInfo;
}
