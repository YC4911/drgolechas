import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getCurrentAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-screen bg-[var(--color-warm-ivory)] lg:grid-cols-[1fr_1fr]">
      <section className="hidden flex-col justify-between bg-[var(--color-forest-olive)] p-12 text-white lg:flex">
        <div>
          <p className="font-display text-3xl">Dr. Golechas</p>
          <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-[var(--color-herbal-gold)] uppercase">
            Admin workspace
          </p>
        </div>
        <div className="max-w-lg">
          <p className="text-sm font-semibold tracking-[0.17em] text-[var(--color-herbal-gold)] uppercase">
            Store operations
          </p>
          <h1 className="font-display mt-4 text-5xl leading-tight">
            Thoughtful care, beautifully managed.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
            Secure access for authorized store administrators and staff.
          </p>
        </div>
        <p className="text-xs text-white/50">
          Private management area · Authorized access only
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-lg border border-[var(--color-natural-beige)] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-herbal-gold)] uppercase lg:hidden">
            Dr. Golechas · Admin
          </p>
          <h2 className="font-display mt-2 text-3xl text-[var(--color-forest-olive)]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-forest-olive)]">
            Use your provisioned administrator account to continue.
          </p>
          <AdminLoginForm />
          <p className="mt-5 text-xs leading-5 text-[var(--color-forest-olive)]">
            Admin access is provisioned by a Super Admin. Customer accounts
            cannot sign in here.
          </p>
        </div>
      </section>
    </main>
  );
}
