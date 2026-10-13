import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`border-line bg-paper overflow-hidden rounded-sm border ${className}`}
      {...props}
    />
  );
}
