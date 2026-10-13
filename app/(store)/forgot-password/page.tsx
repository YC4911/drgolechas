import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Container className="py-14 sm:py-20">
      <AuthForm mode="forgot" />
    </Container>
  );
}
