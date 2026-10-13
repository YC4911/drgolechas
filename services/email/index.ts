import { absoluteUrl } from "@/lib/seo/site-url";
import type { EmailTemplate, EmailTemplateData } from "@/services/email/types";
import { sendEmail } from "@/services/email/provider";
import { renderEmailTemplate } from "@/services/email/templates";

export * from "@/services/email/provider";
export * from "@/services/email/templates";
export * from "@/services/email/types";

export function renderEmail<T extends EmailTemplate>(
  template: T,
  to: string,
  data: EmailTemplateData[T],
) {
  return renderEmailTemplate(template, to, data);
}

export async function sendTemplatedEmail<T extends EmailTemplate>(
  template: T,
  to: string,
  data: EmailTemplateData[T],
): Promise<void> {
  await sendEmail(renderEmail(template, to, data));
}

export function accountOrderUrl(orderId: string): string {
  return absoluteUrl(`/account/orders/${encodeURIComponent(orderId)}`);
}
