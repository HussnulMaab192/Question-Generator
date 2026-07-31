import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { clampScore, formatScore, type ScoreField } from "@/lib/scoring";

export interface ScoreStepperProps {
  label: string;
  field: ScoreField;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

/**
 * Strip everything except digits and a single decimal point, then keep only
 * half-step fractions ("" / "0" / "5" after the dot) so letters, signs,
 * scientific notation, spaces, and junk never enter the field.
 */
function sanitizeScoreDraft(raw: string): string {
  let cleaned = "";
  let seenDot = false;

  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      cleaned += ch;
    } else if (ch === "." && !seenDot) {
      cleaned += ".";
      seenDot = true;
    }
  }

  const dotIndex = cleaned.indexOf(".");
  if (dotIndex === -1) {
    return cleaned;
  }

  const intPart = cleaned.slice(0, dotIndex);
  const fracPart = cleaned.slice(dotIndex + 1);

  // Allow intermediate "6." while typing toward 6.0 / 6.5.
  if (fracPart.length === 0) {
    return `${intPart}.`;
  }

  const firstFrac = fracPart[0];
  if (firstFrac === "0" || firstFrac === "5") {
    return `${intPart}.${firstFrac}`;
  }

  // Invalid first fraction digit (e.g. typed 6.3) — keep the trailing dot.
  return `${intPart}.`;
}

function parseScoreDraft(draft: string): number | null {
  if (draft === "" || draft === ".") {
    return null;
  }
  const parsed = Number.parseFloat(draft);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Large, tablet-friendly typed score input (no + / − steppers).
 * Digits and one decimal only; values clamp/snap to the field's half-step rules.
 * Valid numbers update the parent immediately so live totals stay in sync
 * while typing; blur / Enter normalizes the displayed text.
 */
export default function ScoreStepper({
  label,
  field,
  value,
  min,
  max,
  step,
  onChange,
}: ScoreStepperProps) {
  const [draft, setDraft] = useState(formatScore(value));

  useEffect(() => {
    setDraft(formatScore(value));
  }, [value]);

  const commitDraft = () => {
    const parsed = parseScoreDraft(draft);
    if (parsed === null) {
      // Empty / incomplete draft → restore the last committed valid value.
      setDraft(formatScore(value));
      return;
    }
    const next = clampScore(field, parsed);
    onChange(next);
    setDraft(formatScore(next));
  };

  const applyDraft = (raw: string) => {
    const nextDraft = sanitizeScoreDraft(raw);
    setDraft(nextDraft);

    const parsed = parseScoreDraft(nextDraft);
    if (parsed !== null) {
      onChange(clampScore(field, parsed));
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Covers typing and paste: invalid characters are stripped before state updates.
    applyDraft(event.target.value);
  };

  const handleBlur = () => {
    commitDraft();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
      (event.target as HTMLInputElement).blur();
    } else if (event.key === "Escape") {
      setDraft(formatScore(value));
      (event.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 transition-colors sm:p-3.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.]?[05]?"
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label={`${label} value`}
        className="h-14 w-full touch-manipulation rounded-md border border-input bg-background px-3 text-center text-2xl font-bold tabular-nums tracking-tight shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-600"
      />
      <span className="text-xs text-muted-foreground">
        {formatScore(min)}–{formatScore(max)} · step {formatScore(step)}
      </span>
    </div>
  );
}
