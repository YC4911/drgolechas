import { sendTemplatedEmail } from "@/services/email";

export function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  return sendTemplatedEmail("passwordReset", email, { resetUrl });
}
