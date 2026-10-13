import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`border-line bg-paper text-ink placeholder:text-muted focus:border-teal min-h-11 w-full rounded-sm border px-3 text-sm focus:outline-none ${className}`}
      {...props}
    />
  );
}
