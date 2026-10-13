import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { Container } from "@/components/ui/container";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <Container className="py-14 sm:py-20">
      <AuthForm mode="login" nextPath={safeNextPath(next)} />
    </Container>
  );
}
