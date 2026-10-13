import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <Container className="py-14 sm:py-20">
      <AuthForm mode="reset" token={token ?? ""} />
    </Container>
  );
}
