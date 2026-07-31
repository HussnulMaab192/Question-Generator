import { useCallback, useEffect, useMemo, useState } from "react";

import { clampScore, SCORE_FIELD_CONFIG, type ScoreField } from "@/lib/scoring";
import {
  MEMORIZATION_MAX,
  MEMORIZATION_MIN,
  QUESTION_TOTAL_MAX,
  TAJWEED_MAX,
  TAJWEED_MIN,
  type Question,
  type QuestionScore,
} from "@/types";

export type { ScoreField };

export interface QuestionScoresSummary {
  questionCount: number;
  memorizationTotal: number;
  memorizationMax: number;
  tajweedTotal: number;
  tajweedMax: number;
  overallTotal: number;
  overallMax: number;
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
  setScore: (index: number, field: ScoreField, value: number) => void;
  /** Flat list pairing each generated question with its scores (export-ready). */
  getExportableScores: () => ExportableQuestionScore[];
}

function emptyScore(): QuestionScore {
  return { memorization: MEMORIZATION_MIN, tajweed: TAJWEED_MIN };
}

function summarizeScores(scores: QuestionScore[]): QuestionScoresSummary {
  const questionCount = scores.length;
  const memorizationTotal = scores.reduce((sum, score) => sum + score.memorization, 0);
  const tajweedTotal = scores.reduce((sum, score) => sum + score.tajweed, 0);
  return {
    questionCount,
    memorizationTotal: Number(memorizationTotal.toFixed(1)),
    memorizationMax: Number((questionCount * MEMORIZATION_MAX).toFixed(1)),
    tajweedTotal: Number(tajweedTotal.toFixed(1)),
    tajweedMax: Number((questionCount * TAJWEED_MAX).toFixed(1)),
    overallTotal: Number((memorizationTotal + tajweedTotal).toFixed(1)),
    overallMax: Number((questionCount * QUESTION_TOTAL_MAX).toFixed(1)),
  };
}

/**
 * Owns Memorization (0–7.5) / Tajweed (0–2.5) scores for every generated
 * question. Never calls the backend. Scores reset to zero whenever a new
 * question set arrives (Generate / Regenerate).
 */
export function useQuestionScores(questions: Question[] | null): UseQuestionScoresResult {
  const [scores, setScores] = useState<QuestionScore[]>([]);

  useEffect(() => {
    setScores(questions ? questions.map(() => emptyScore()) : []);
  }, [questions]);

  const setScore = useCallback((index: number, field: ScoreField, value: number) => {
    setScores((previous) =>
      previous.map((score, i) => {
        if (i !== index) return score;
        return { ...score, [field]: clampScore(field, value) };
      }),
    );
  }, []);

  const adjustScore = useCallback(
    (index: number, field: ScoreField, delta: number) => {
      setScores((previous) =>
        previous.map((score, i) => {
          if (i !== index) return score;
          return { ...score, [field]: clampScore(field, score[field] + delta) };
        }),
      );
    },
    [],
  );

  const incrementScore = useCallback(
    (index: number, field: ScoreField) => adjustScore(index, field, SCORE_FIELD_CONFIG[field].step),
    [adjustScore],
  );

  const decrementScore = useCallback(
    (index: number, field: ScoreField) => adjustScore(index, field, -SCORE_FIELD_CONFIG[field].step),
    [adjustScore],
  );

  const summary = useMemo(() => summarizeScores(scores), [scores]);

  const hasChanges = useMemo(
    () => scores.some((score) => score.memorization > MEMORIZATION_MIN || score.tajweed > TAJWEED_MIN),
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
        total: Number((score.memorization + score.tajweed).toFixed(1)),
      };
    });
  }, [questions, scores]);

  return {
    scores,
    summary,
    hasChanges,
    incrementScore,
    decrementScore,
    setScore,
    getExportableScores,
  };
}
