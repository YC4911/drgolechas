import type { EmailMessage, EmailProvider } from "@/services/email/types";

class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      throw new Error(`Email provider request failed (${response.status}).`);
    }
  }
}

export function isEmailDeliveryConfigured(): boolean {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "resend";
  const from =
    process.env.EMAIL_FROM?.trim() || process.env.AUTH_FROM_EMAIL?.trim();
  return (
    provider === "resend" &&
    Boolean(process.env.RESEND_API_KEY?.trim()) &&
    Boolean(from)
  );
}

export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "resend";
  if (provider !== "resend") {
    throw new Error(
      `The configured email provider "${provider}" is not installed.`,
    );
  }
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || process.env.AUTH_FROM_EMAIL?.trim() || "";
  if (!apiKey || !from) {
    throw new Error(
      "Email delivery requires RESEND_API_KEY and EMAIL_FROM (or AUTH_FROM_EMAIL).",
    );
  }
  return new ResendEmailProvider(apiKey, from);
}

export async function sendEmail(
  message: EmailMessage,
  provider: EmailProvider = getEmailProvider(),
): Promise<void> {
  await provider.send(message);
}
