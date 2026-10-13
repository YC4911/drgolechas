import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
};

const variants = {
  primary:
    "bg-teal text-white hover:bg-[#0c4b5b] focus-visible:outline-offset-4",
  secondary:
    "border border-teal/30 text-teal hover:border-teal hover:bg-teal/5",
  quiet: "text-teal hover:bg-teal/5",
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
