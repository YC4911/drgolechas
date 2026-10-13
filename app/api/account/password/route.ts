import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireCustomer } from "@/lib/auth/route-guard";
import { changePasswordSchema } from "@/lib/auth/validation";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { UserModel } from "@/models/user";
import { UserSessionModel } from "@/models/user-session";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = changePasswordSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const user = await UserModel.findById(auth.customer.id)
      .select("+passwordHash")
      .exec();
    if (
      !user ||
      !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 403 },
      );
    }

    user.passwordHash = await hashPassword(parsed.data.password);
    await user.save();

    const cookieStore = await cookies();
    const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    await UserSessionModel.updateMany(
      {
        user: user._id,
        revokedAt: null,
        ...(currentToken
          ? { tokenHash: { $ne: hashSessionToken(currentToken) } }
          : {}),
      },
      { $set: { revokedAt: new Date() } },
    ).exec();

    if (!currentToken) await clearSessionCookie();
    return NextResponse.json({ data: { passwordChanged: true } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
