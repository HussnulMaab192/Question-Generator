import { useCallback, useEffect, useMemo, useState } from "react";

import {
  SCORE_FIELDS_PER_QUESTION,
  SCORE_MAX,
  SCORE_MIN,
  type Question,
  type QuestionScore,
} from "@/types";

export type ScoreField = keyof QuestionScore;

export interface QuestionScoresSummary {
  questionCount: number;
  memorizationTotal: number;
  tajweedTotal: number;
  grandTotal: number;
  /** Maximum attainable grand total: questionCount × 10 × 2. */
  maxPossible: number;
}

/**
 * One row ready for a future Excel/PDF export: question identity + scores.
 * The UI does not render this today; export flows can consume it later
 * without changing the card/summary components.
 */
export interface ExportableQuestionScore {
  category: string;
  questionNumber: number;
  memorization: number;
  tajweed: number;
  total: number;
}

interface UseQuestionScoresResult {
  scores: QuestionScore[];
  summary: QuestionScoresSummary;
  /** True once any score has been raised above the default of 0. */
  hasChanges: boolean;
  incrementScore: (index: number, field: ScoreField) => void;
  decrementScore: (index: number, field: ScoreField) => void;
  /** Flat list pairing each generated question with its scores (export-ready). */
  getExportableScores: () => ExportableQuestionScore[];
}

function emptyScore(): QuestionScore {
  return { memorization: SCORE_MIN, tajweed: SCORE_MIN };
}

function clampScore(value: number): number {
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, value));
}

function summarizeScores(scores: QuestionScore[]): QuestionScoresSummary {
  const questionCount = scores.length;
  const memorizationTotal = scores.reduce((sum, score) => sum + score.memorization, 0);
  const tajweedTotal = scores.reduce((sum, score) => sum + score.tajweed, 0);
  return {
    questionCount,
    memorizationTotal,
    tajweedTotal,
    grandTotal: memorizationTotal + tajweedTotal,
    maxPossible: questionCount * SCORE_MAX * SCORE_FIELDS_PER_QUESTION,
  };
}

/**
 * Owns Memorization / Tajweed scores (0–10) for every generated question.
 *
 * Never calls the backend. Scores reset to zero whenever a new question
 * set arrives (Generate / Regenerate). The plain `scores` array and
 * `getExportableScores()` are intentionally export-friendly so Excel/PDF
 * output can be added later without redesigning the UI.
 */
export function useQuestionScores(questions: Question[] | null): UseQuestionScoresResult {
  const [scores, setScores] = useState<QuestionScore[]>([]);

  useEffect(() => {
    setScores(questions ? questions.map(() => emptyScore()) : []);
  }, [questions]);

  const adjustScore = useCallback((index: number, field: ScoreField, delta: number) => {
    setScores((previous) =>
      previous.map((score, i) => {
        if (i !== index) return score;
        return { ...score, [field]: clampScore(score[field] + delta) };
      }),
    );
  }, []);

  const incrementScore = useCallback(
    (index: number, field: ScoreField) => adjustScore(index, field, 1),
    [adjustScore],
  );

  const decrementScore = useCallback(
    (index: number, field: ScoreField) => adjustScore(index, field, -1),
    [adjustScore],
  );

  const summary = useMemo(() => summarizeScores(scores), [scores]);

  const hasChanges = useMemo(
    () => scores.some((score) => score.memorization > SCORE_MIN || score.tajweed > SCORE_MIN),
    [scores],
  );

  const getExportableScores = useCallback((): ExportableQuestionScore[] => {
    if (!questions) return [];
    return questions.map((question, index) => {
      const score = scores[index] ?? emptyScore();
      return {
        category: question.category,
        questionNumber: question.questionNumber,
        memorization: score.memorization,
        tajweed: score.tajweed,
        total: score.memorization + score.tajweed,
      };
    });
  }, [questions, scores]);

  return {
    scores,
    summary,
    hasChanges,
    incrementScore,
    decrementScore,
    getExportableScores,
  };
}
