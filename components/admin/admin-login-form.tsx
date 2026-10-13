"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
          password: fields.get("password"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to sign in.");
      const destination = searchParams.get("next");
      router.replace(
        destination?.startsWith("/admin") ? destination : "/admin",
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      {error ? (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-[#18343a]">
        Admin email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          className="mt-2 min-h-12 w-full rounded border border-[#dfe6e3] bg-white px-3 outline-none focus:border-[#0d5968]"
        />
      </label>
      <label className="block text-sm font-medium text-[#18343a]">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          className="mt-2 min-h-12 w-full rounded border border-[#dfe6e3] bg-white px-3 outline-none focus:border-[#0d5968]"
        />
      </label>
      <button
        disabled={busy}
        className="min-h-12 w-full rounded bg-[#083847] px-4 text-sm font-semibold text-white hover:bg-[#0c4b5b] disabled:opacity-60"
      >
        {busy ? "Verifying access…" : "Sign in to admin"}
      </button>
    </form>
  );
}
