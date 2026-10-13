import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...props }: SelectProps) {
  return (
    <select
      className={`border-line bg-paper text-ink focus:border-teal min-h-11 w-full rounded-sm border px-3 text-sm focus:outline-none ${className}`}
      {...props}
    />
  );
}
