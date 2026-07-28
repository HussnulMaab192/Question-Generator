import type { ComponentType, ReactNode } from "react";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GenerateButtonProps {
  label: ReactNode;
  loadingLabel?: ReactNode;
  /** Icon rendered before the label (hidden while loading, in favor of the spinner). */
  icon?: ComponentType<{ className?: string }>;
  disabled: boolean;
  isLoading?: boolean;
  onClick: () => void;
  variant?: ButtonProps["variant"];
  /** Optional class overrides (e.g. a slightly shorter height in the scoreboard). */
  className?: string;
}

/**
 * Primary call-to-action for triggering question generation.
 *
 * Reused for both "Generate Questions" (the main setup CTA) and
 * "Regenerate" (resends the last payload) so the loading-spinner /
 * disabled-state logic lives in exactly one place.
 */
export default function GenerateButton({
  label,
  loadingLabel = "Generating…",
  icon: Icon,
  disabled,
  isLoading = false,
  onClick,
  variant = "brand",
  className,
}: GenerateButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn("h-14 w-full text-base font-semibold sm:w-auto sm:min-w-[220px]", className)}
    >
      {isLoading ? (
        <>
          <LoadingSpinner className="size-5 text-current" />
          {loadingLabel}
        </>
      ) : (
        <>
          {Icon && <Icon className="size-5" />}
          {label}
        </>
      )}
    </Button>
  );
}
