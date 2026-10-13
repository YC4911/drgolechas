import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthLimit } from "@/lib/auth/rate-limit";
import { hashSessionToken } from "@/lib/auth/session";
import { resetPasswordSchema } from "@/lib/auth/validation";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { UserModel } from "@/models/user";
import { UserSessionModel } from "@/models/user-session";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = resetPasswordSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const tokenHash = hashSessionToken(parsed.data.token);
    const allowed = await consumeAuthLimit(
      "reset-password",
      tokenHash,
      5,
      3600,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Request a new reset link." },
        { status: 429 },
      );
    }

    const user = await UserModel.findOneAndUpdate(
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
        active: true,
      },
      {
        $set: { passwordHash: await hashPassword(parsed.data.password) },
        $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
      },
      { returnDocument: "after" },
    )
      .select("_id")
      .exec();

    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or expired. Request a new one." },
        { status: 400 },
      );
    }

    await UserSessionModel.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ).exec();

    return NextResponse.json({ data: { passwordReset: true } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
