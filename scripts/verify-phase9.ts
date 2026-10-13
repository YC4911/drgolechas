import assert from "node:assert/strict";
import { Types } from "mongoose";
import { generateInvoicePdf } from "@/services/invoices/pdf";
import { calculateShippingCharge } from "@/services/shipping";
import { absoluteUrl } from "@/lib/seo/site-url";
import { createProductSchema } from "@/lib/products/validation";
import { adminProductSchema } from "@/lib/admin/validation";
import { renderEmail } from "@/services/email";
import {
  isEmailDeliveryConfigured,
  sendEmail,
} from "@/services/email/provider";
import type { ShippingProvider } from "@/services/shipping";
import type { EmailTemplate, EmailTemplateData } from "@/services/email";

const templates: {
  [Template in EmailTemplate]: EmailTemplateData[Template];
} = {
  welcome: { name: "<Customer>", signInUrl: "https://store.example/login" },
  passwordReset: { resetUrl: "https://store.example/reset?token=one-time" },
  orderConfirmation: {
    name: "Customer",
    orderNumber: "DG-TEST",
    total: "INR 1,000.00",
    orderUrl: "https://store.example/account/orders/123",
  },
  paymentConfirmation: {
    name: "Customer",
    orderNumber: "DG-TEST",
    total: "INR 1,000.00",
    orderUrl: "https://store.example/account/orders/123",
  },
  orderShipped: {
    name: "Customer",
    orderNumber: "DG-TEST",
    trackingNumber: "TRACK-1",
    orderUrl: "https://store.example/account/orders/123",
  },
  orderDelivered: {
    name: "Customer",
    orderNumber: "DG-TEST",
    orderUrl: "https://store.example/account/orders/123",
  },
  cancellation: {
    name: "Customer",
    orderNumber: "DG-TEST",
    orderUrl: "https://store.example/account/orders/123",
  },
  refund: {
    name: "Customer",
    orderNumber: "DG-TEST",
    amount: "INR 1,000.00",
    orderUrl: "https://store.example/account/orders/123",
  },
};

async function main() {
  for (const [template, data] of Object.entries(templates) as [
    EmailTemplate,
    EmailTemplateData[EmailTemplate],
  ][]) {
    const message = renderEmail(template, "customer@example.com", data);
    assert.ok(message.subject);
    assert.ok(message.text);
    assert.match(message.html, /<!doctype html>/i);
  }
  assert.match(
    renderEmail("welcome", "a@example.com", templates.welcome).html,
    /&lt;Customer&gt;/,
  );
  let deliveredMessage = "";
  await sendEmail(renderEmail("welcome", "a@example.com", templates.welcome), {
    async send(message) {
      deliveredMessage = message.to;
    },
  });
  assert.equal(deliveredMessage, "a@example.com");
  const originalEmailEnvironment = {
    provider: process.env.EMAIL_PROVIDER,
    key: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    authFrom: process.env.AUTH_FROM_EMAIL,
  };
  try {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = "";
    process.env.AUTH_FROM_EMAIL = "store@example.com";
    assert.equal(isEmailDeliveryConfigured(), true);
  } finally {
    if (originalEmailEnvironment.provider === undefined)
      delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = originalEmailEnvironment.provider;
    if (originalEmailEnvironment.key === undefined)
      delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalEmailEnvironment.key;
    if (originalEmailEnvironment.from === undefined)
      delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalEmailEnvironment.from;
    if (originalEmailEnvironment.authFrom === undefined)
      delete process.env.AUTH_FROM_EMAIL;
    else process.env.AUTH_FROM_EMAIL = originalEmailEnvironment.authFrom;
  }

  assert.equal(
    calculateShippingCharge(500, {
      flatRate: 79,
      freeShippingThreshold: 999,
    }),
    79,
  );
  assert.equal(
    calculateShippingCharge(1000, {
      flatRate: 79,
      freeShippingThreshold: 999,
    }),
    0,
  );
  const testShippingProvider: ShippingProvider = {
    quote: () => 42,
  };
  assert.equal(
    calculateShippingCharge(
      500,
      { flatRate: 79, freeShippingThreshold: 999 },
      testShippingProvider,
    ),
    42,
  );
  assert.equal(
    calculateShippingCharge(500, {
      flatRate: 79,
      freeShippingThreshold: 0,
    }),
    0,
  );
  assert.equal(
    absoluteUrl("/product/test"),
    "http://localhost:3000/product/test",
  );
  assert.equal(
    createProductSchema.shape.seoKeywords.safeParse(["herbal", "wellness"])
      .success,
    true,
  );
  assert.equal(
    createProductSchema.shape.seoKeywords.safeParse(
      Array.from({ length: 31 }, (_, index) => `keyword-${index}`),
    ).success,
    false,
  );
  assert.equal(
    adminProductSchema.shape.seoKeywords.safeParse(["wellness"]).success,
    true,
  );

  const pdf = await generateInvoicePdf({
    invoiceNumber: "INV-DG-TEST",
    orderNumber: "DG-TEST",
    issuedAt: new Date("2026-01-01T00:00:00.000Z"),
    store: {
      name: "Dr. Golechas",
      legalName: "Dr. Golechas Herbal Farm",
      gstin: "TEST-GSTIN",
      address: "India",
      email: "care@example.com",
      phone: "9876543210",
    },
    customer: {
      name: "Customer",
      email: "customer@example.com",
      phone: "9876543210",
      line1: "1 Sample Road",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "India",
    },
    items: [
      {
        product: new Types.ObjectId(),
        name: "Herbal product",
        slug: "herbal-product",
        sku: "TEST-1",
        quantity: 2,
        unitPrice: 100,
        mrp: 125,
        total: 200,
        image: "",
      },
    ],
    subtotal: 200,
    discount: 10,
    tax: 18,
    pricesIncludeGst: false,
    shipping: 79,
    total: 287,
    paymentMethod: "Cash on Delivery",
  });
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 500);

  console.log(
    "Phase 9 email templates, product SEO validation, manual shipping, site URLs and invoice PDF passed.",
  );
}

void main().catch((error: unknown) => {
  console.error("Phase 9 verification failed.", error);
  process.exitCode = 1;
});
