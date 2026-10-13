import type {
  EmailMessage,
  EmailTemplate,
  EmailTemplateData,
} from "@/services/email/types";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function templateContent(
  template: EmailTemplate,
  data: EmailTemplateData[EmailTemplate],
) {
  switch (template) {
    case "welcome": {
      const value = data as EmailTemplateData["welcome"];
      return {
        subject: "Welcome to Dr. Golechas",
        text: `Hello ${value.name}, your account is ready. Sign in: ${value.signInUrl}`,
        body: `Hello ${escapeHtml(value.name)}, your account is ready. <a href="${escapeHtml(value.signInUrl)}">Sign in to your account</a>.`,
      };
    }
    case "passwordReset": {
      const value = data as EmailTemplateData["passwordReset"];
      return {
        subject: "Reset your Dr. Golechas password",
        text: `Use this one-time link within 30 minutes to reset your password: ${value.resetUrl}`,
        body: `Use this one-time link within 30 minutes to reset your password: <a href="${escapeHtml(value.resetUrl)}">Reset password</a>.`,
      };
    }
    case "orderConfirmation": {
      const value = data as EmailTemplateData["orderConfirmation"];
      return {
        subject: `Order ${value.orderNumber} confirmed`,
        text: `Hello ${value.name}, we received order ${value.orderNumber}. Total: ${value.total}. View order: ${value.orderUrl}`,
        body: `Hello ${escapeHtml(value.name)}, we received order <strong>${escapeHtml(value.orderNumber)}</strong>. Total: ${escapeHtml(value.total)}. <a href="${escapeHtml(value.orderUrl)}">View your order</a>.`,
      };
    }
    case "paymentConfirmation": {
      const value = data as EmailTemplateData["paymentConfirmation"];
      return {
        subject: `Payment confirmed for order ${value.orderNumber}`,
        text: `Hello ${value.name}, payment for order ${value.orderNumber} is confirmed. Total: ${value.total}. View order: ${value.orderUrl}`,
        body: `Hello ${escapeHtml(value.name)}, payment for order <strong>${escapeHtml(value.orderNumber)}</strong> is confirmed. Total: ${escapeHtml(value.total)}. <a href="${escapeHtml(value.orderUrl)}">View your order</a>.`,
      };
    }
    case "orderShipped": {
      const value = data as EmailTemplateData["orderShipped"];
      return {
        subject: `Order ${value.orderNumber} has shipped`,
        text: `Hello ${value.name}, order ${value.orderNumber} has shipped.${value.trackingNumber ? ` Tracking number: ${value.trackingNumber}.` : ""} View order: ${value.orderUrl}`,
        body: `Hello ${escapeHtml(value.name)}, order <strong>${escapeHtml(value.orderNumber)}</strong> has shipped.${value.trackingNumber ? ` Tracking number: <strong>${escapeHtml(value.trackingNumber)}</strong>.` : ""} <a href="${escapeHtml(value.orderUrl)}">View your order</a>.`,
      };
    }
    case "orderDelivered": {
      const value = data as EmailTemplateData["orderDelivered"];
      return {
        subject: `Order ${value.orderNumber} delivered`,
        text: `Hello ${value.name}, order ${value.orderNumber} is marked delivered. View order: ${value.orderUrl}`,
        body: `Hello ${escapeHtml(value.name)}, order <strong>${escapeHtml(value.orderNumber)}</strong> is marked delivered. <a href="${escapeHtml(value.orderUrl)}">View your order</a>.`,
      };
    }
    case "cancellation": {
      const value = data as EmailTemplateData["cancellation"];
      return {
        subject: `Order ${value.orderNumber} cancelled`,
        text: `Hello ${value.name}, order ${value.orderNumber} has been cancelled. View order: ${value.orderUrl}`,
        body: `Hello ${escapeHtml(value.name)}, order <strong>${escapeHtml(value.orderNumber)}</strong> has been cancelled. <a href="${escapeHtml(value.orderUrl)}">View your order</a>.`,
      };
    }
    case "refund": {
      const value = data as EmailTemplateData["refund"];
      return {
        subject: `Refund update for order ${value.orderNumber}`,
        text: `Hello ${value.name}, a refund of ${value.amount} has been recorded for order ${value.orderNumber}. View order: ${value.orderUrl}`,
        body: `Hello ${escapeHtml(value.name)}, a refund of ${escapeHtml(value.amount)} has been recorded for order <strong>${escapeHtml(value.orderNumber)}</strong>. <a href="${escapeHtml(value.orderUrl)}">View your order</a>.`,
      };
    }
  }
}

export function renderEmailTemplate<T extends EmailTemplate>(
  template: T,
  to: string,
  data: EmailTemplateData[T],
): EmailMessage {
  const content = templateContent(template, data);
  return {
    to,
    subject: content.subject,
    text: content.text,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#18343a;line-height:1.6"><main style="max-width:600px;margin:24px auto;padding:24px"><h1 style="color:#083847">Dr. Golechas</h1><p>${content.body}</p></main></body></html>`,
  };
}
