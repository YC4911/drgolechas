import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=%2Faccount");
  return children;
}
