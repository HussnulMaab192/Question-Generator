import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Generic pulsing placeholder block (shadcn/ui convention) - compose it
 * into feature-specific skeletons rather than duplicating the animation
 * classes everywhere a loading state is needed.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
