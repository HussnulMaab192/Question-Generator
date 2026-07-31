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
 * Per-question competition scores. Purely frontend/session state - never
 * sent to or derived from the backend. Kept as a plain object so later
 * Excel/PDF export can consume the same shape without UI changes.
 *
 * Per-question total is out of 10:
 *   Memorization 0–7.5  +  Tajweed 0–2.5  =  Question Total 0–10
 */
export interface QuestionScore {
  memorization: number;
  tajweed: number;
}

/**
 * Explicit examiner mark for a generated question. Independent of scores:
 * a question can have scores entered and still remain "pending" until the
 * examiner marks it "completed". Purely frontend/session state.
 */
export type QuestionCompletionStatus = "pending" | "completed";

/** Shared step for both score fields. */
export const SCORE_STEP = 0.5;

export const MEMORIZATION_MIN = 0;
export const MEMORIZATION_MAX = 7.5;

export const TAJWEED_MIN = 0;
export const TAJWEED_MAX = 2.5;

/** Memorization max + Tajweed max per question. */
export const QUESTION_TOTAL_MAX = MEMORIZATION_MAX + TAJWEED_MAX;

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
  /** ISO 8601 timestamp from the last Admin upload, if known. */
  uploadedAt?: string | null;
  status: "loaded" | "missing";
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
