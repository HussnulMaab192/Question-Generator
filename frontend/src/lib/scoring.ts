import {
  MEMORIZATION_MAX,
  MEMORIZATION_MIN,
  SCORE_STEP,
  TAJWEED_MAX,
  TAJWEED_MIN,
  type QuestionScore,
} from "@/types";

export type ScoreField = keyof QuestionScore;

export interface ScoreFieldConfig {
  min: number;
  max: number;
  step: number;
  label: string;
}

export const SCORE_FIELD_CONFIG: Record<ScoreField, ScoreFieldConfig> = {
  memorization: {
    min: MEMORIZATION_MIN,
    max: MEMORIZATION_MAX,
    step: SCORE_STEP,
    label: "Memorization",
  },
  tajweed: {
    min: TAJWEED_MIN,
    max: TAJWEED_MAX,
    step: SCORE_STEP,
    label: "Tajweed",
  },
};

/** Round to the nearest valid half-step (avoids float noise like 1.499999). */
export function roundToStep(value: number, step: number = SCORE_STEP): number {
  return Math.round(value / step) * step;
}

export function clampScore(field: ScoreField, value: number): number {
  const { min, max, step } = SCORE_FIELD_CONFIG[field];
  const rounded = roundToStep(value, step);
  // Guard float noise after rounding (e.g. 7.5000000001).
  const clamped = Math.min(max, Math.max(min, rounded));
  return Number(clamped.toFixed(1));
}

/** Format a score for display (0 → "0", 6.5 → "6.5"). */
export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
