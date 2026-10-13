import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  checkoutSchema,
  razorpayVerificationSchema,
} from "@/lib/checkout/validation";
import {
  getRazorpayCheckoutMode,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/razorpay";
import { parseWebhookPayment } from "@/lib/payments/processing";

const savedEnvironment = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  mockMode: process.env.RAZORPAY_MOCK_MODE,
  nodeEnv: process.env.NODE_ENV,
};

try {
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_MOCK_MODE = "true";
  Reflect.set(process.env, "NODE_ENV", "development");
  assert.equal(getRazorpayCheckoutMode(), "mock");
  Reflect.set(process.env, "NODE_ENV", "production");
  assert.equal(getRazorpayCheckoutMode(), "unavailable");

  const keySecret = "unit-test-key-secret";
  const webhookSecret = "unit-test-webhook-secret";
  Reflect.set(process.env, "NODE_ENV", "development");
  process.env.RAZORPAY_KEY_ID = "rzp_test_public_key";
  process.env.RAZORPAY_KEY_SECRET = keySecret;
  process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

  const orderId = "order_test_123";
  const paymentId = "pay_test_456";
  const paymentSignature = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  assert.equal(
    verifyRazorpaySignature(orderId, paymentId, paymentSignature),
    true,
  );
  assert.equal(
    verifyRazorpaySignature(orderId, paymentId, "0".repeat(64)),
    false,
  );

  const webhookBody = '{"event":"payment.captured"}';
  const webhookSignature = createHmac("sha256", webhookSecret)
    .update(webhookBody)
    .digest("hex");
  assert.equal(
    verifyRazorpayWebhookSignature(webhookBody, webhookSignature),
    true,
  );
  assert.equal(
    verifyRazorpayWebhookSignature(webhookBody, "0".repeat(64)),
    false,
  );
  assert.equal(
    razorpayVerificationSchema.safeParse({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: paymentSignature,
    }).success,
    true,
  );
  assert.equal(
    checkoutSchema.safeParse({
      paymentMethod: "razorpay",
      addressId: "507f1f77bcf86cd799439011",
    }).success,
    true,
  );

  assert.equal(
    parseWebhookPayment({
      id: paymentId,
      order_id: orderId,
      amount: 12500,
      currency: "INR",
      status: "captured",
      method: "upi",
    })?.status,
    "captured",
  );
  assert.equal(
    parseWebhookPayment({
      id: paymentId,
      amount: 12500,
      currency: "INR",
      status: "captured",
    }),
    null,
  );
  console.info(
    "Verified payment mode safety, payment/webhook signatures, checkout validation, and webhook payload validation.",
  );
} finally {
  if (savedEnvironment.keyId === undefined) delete process.env.RAZORPAY_KEY_ID;
  else process.env.RAZORPAY_KEY_ID = savedEnvironment.keyId;
  if (savedEnvironment.keySecret === undefined)
    delete process.env.RAZORPAY_KEY_SECRET;
  else process.env.RAZORPAY_KEY_SECRET = savedEnvironment.keySecret;
  if (savedEnvironment.webhookSecret === undefined)
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  else process.env.RAZORPAY_WEBHOOK_SECRET = savedEnvironment.webhookSecret;
  if (savedEnvironment.mockMode === undefined)
    delete process.env.RAZORPAY_MOCK_MODE;
  else process.env.RAZORPAY_MOCK_MODE = savedEnvironment.mockMode;
  if (savedEnvironment.nodeEnv === undefined)
    Reflect.deleteProperty(process.env, "NODE_ENV");
  else Reflect.set(process.env, "NODE_ENV", savedEnvironment.nodeEnv);
}
