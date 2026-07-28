import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Minimal, dependency-free tooltip: shows `label` above its child on
 * hover/focus. Wrap a single control (usually a `Button`) with it.
 *
 * Works for mouse/keyboard users; on touch devices (tablets - this app's
 * primary target) it simply never appears, same as the native `title`
 * attribute wouldn't - so every wrapped control must still be
 * understandable from its own visible label/icon alone.
 */
export default function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full",
          "whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-md",
          "opacity-0 transition-opacity delay-200 duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        {label}
      </span>
    </span>
  );
}
