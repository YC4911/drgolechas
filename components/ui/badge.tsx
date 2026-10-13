import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`bg-cream text-teal inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-semibold tracking-wide ${className}`}
      {...props}
    />
  );
}
