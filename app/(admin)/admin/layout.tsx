import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin-login?next=%2Fadmin");
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
