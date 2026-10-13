"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register" | "forgot" | "reset";

type AuthFormProps = {
  mode: AuthMode;
  nextPath?: string;
  token?: string;
};

const fieldClass = "flex flex-col gap-1.5 text-sm font-medium text-ink";

function responseMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if ("error" in value && typeof value.error === "string") return value.error;
  if ("message" in value && typeof value.message === "string")
    return value.message;
  if (
    "details" in value &&
    Array.isArray(value.details) &&
    value.details[0] &&
    typeof value.details[0] === "object" &&
    "message" in value.details[0] &&
    typeof value.details[0].message === "string"
  ) {
    return value.details[0].message;
  }
  return null;
}

const modeContent: Record<
  AuthMode,
  { title: string; description: string; endpoint: string; button: string }
> = {
  login: {
    title: "Welcome back.",
    description: "Sign in to your Dr. Golechas account.",
    endpoint: "/api/auth/login",
    button: "Sign in",
  },
  register: {
    title: "Create your account.",
    description: "A few details to get started.",
    endpoint: "/api/auth/register",
    button: "Create account",
  },
  forgot: {
    title: "Reset your password.",
    description: "Enter your account email to request a reset link.",
    endpoint: "/api/auth/forgot-password",
    button: "Send reset instructions",
  },
  reset: {
    title: "Choose a new password.",
    description: "Use a strong password you haven’t used here before.",
    endpoint: "/api/auth/reset-password",
    button: "Save new password",
  },
};

export function AuthForm({
  mode,
  nextPath = "/account",
  token = "",
}: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = modeContent[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    if (mode === "reset") payload.token = token;

    try {
      const response = await fetch(content.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        setError(
          responseMessage(result) ?? "We couldn’t complete that request.",
        );
        return;
      }

      if (mode === "login" || mode === "register") {
        router.replace(nextPath);
        router.refresh();
      } else if (mode === "reset") {
        router.replace("/login?reset=complete");
      } else {
        setMessage(
          responseMessage(result) ??
            "If the account exists, instructions will be sent.",
        );
        form.reset();
      }
    } catch {
      setError("The service is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#8c6a2d] uppercase">
        Your account
      </p>
      <h1 className="font-display text-teal mt-3 text-4xl">{content.title}</h1>
      <p className="text-muted mt-3 text-sm leading-6">{content.description}</p>

      {mode === "reset" && !token ? (
        <p
          role="alert"
          className="border-line text-ink mt-6 border p-4 text-sm"
        >
          This reset link is missing or invalid. Request a new one below.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" ? (
            <label className={fieldClass}>
              Name
              <Input name="name" autoComplete="name" required maxLength={120} />
            </label>
          ) : null}

          {mode !== "reset" ? (
            <label className={fieldClass}>
              Email
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
          ) : null}

          {mode === "register" ? (
            <label className={fieldClass}>
              Phone
              <Input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                required
              />
            </label>
          ) : null}

          {mode === "login" || mode === "register" || mode === "reset" ? (
            <label className={fieldClass}>
              {mode === "login" ? "Password" : "New password"}
              <Input
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? 1 : 12}
                maxLength={128}
                required
              />
              {mode !== "login" ? (
                <span className="text-muted text-xs font-normal">
                  At least 12 characters with upper/lowercase, a number, and a
                  symbol.
                </span>
              ) : null}
            </label>
          ) : null}

          {mode === "register" || mode === "reset" ? (
            <label className={fieldClass}>
              Confirm password
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="border border-[#a54535]/30 bg-[#fff7f4] p-3 text-sm text-[#8a3428]"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p
              role="status"
              className="border-line bg-cream text-teal border p-3 text-sm"
            >
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || (mode === "reset" && !token)}
          >
            {isSubmitting ? "Please wait…" : content.button}
          </Button>
        </form>
      )}

      <div className="text-muted mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password" className="text-teal hover:underline">
              Forgot password?
            </Link>
            <Link href="/register" className="text-teal hover:underline">
              Create account
            </Link>
          </>
        ) : null}
        {mode === "register" ? (
          <Link href="/login" className="text-teal hover:underline">
            Already have an account? Sign in
          </Link>
        ) : null}
        {mode === "forgot" || mode === "reset" ? (
          <Link href="/login" className="text-teal hover:underline">
            Back to sign in
          </Link>
        ) : null}
      </div>
    </div>
  );
}
