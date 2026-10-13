import { randomBytes } from "node:crypto";
import { after, NextResponse } from "next/server";
import { isEmailDeliveryConfigured } from "@/services/email";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { hashSessionToken } from "@/lib/auth/session";
import { consumeAuthLimit } from "@/lib/auth/rate-limit";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { UserModel } from "@/models/user";

const genericResponse = {
  message:
    "If an account matches that email and password recovery is available, reset instructions will be sent.",
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = forgotPasswordSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const allowed = await consumeAuthLimit(
      "forgot-password",
      parsed.data.email,
      3,
      3600,
    );
    if (!allowed) {
      return NextResponse.json(genericResponse, { status: 202 });
    }

    const emailConfigured = isEmailDeliveryConfigured();
    const user = emailConfigured
      ? await UserModel.findOne({ email: parsed.data.email, active: true })
          .select("_id")
          .exec()
      : null;

    if (user) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashSessionToken(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: expiresAt,
          },
        },
      ).exec();

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
      const resetUrl = new URL(
        `/reset-password?token=${encodeURIComponent(token)}`,
        appUrl,
      ).toString();
      after(async () => {
        try {
          await sendPasswordResetEmail(parsed.data.email, resetUrl);
        } catch (error) {
          await UserModel.updateOne(
            { _id: user._id, passwordResetTokenHash: tokenHash },
            {
              $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
            },
          ).exec();
          console.error("Password reset email delivery failed.", error);
        }
      });
    }

    return NextResponse.json(genericResponse, { status: 202 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
