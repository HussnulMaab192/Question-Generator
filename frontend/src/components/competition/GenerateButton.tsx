import { Button } from "@/components/ui/button";

export interface GenerateButtonProps {
  disabled: boolean;
  onClick: () => void;
}

/**
 * Large primary call-to-action for the competition setup screen.
 *
 * Stays disabled until the parent indicates there's a valid selection
 * (at least one category picked). Clicking it does not call the backend
 * yet - question generation is a future step.
 */
export default function GenerateButton({ disabled, onClick }: GenerateButtonProps) {
  return (
    <Button
      type="button"
      variant="brand"
      disabled={disabled}
      onClick={onClick}
      className="h-14 w-full text-base font-semibold sm:w-auto sm:min-w-[260px]"
    >
      Generate Questions
    </Button>
  );
}
