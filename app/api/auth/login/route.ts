import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { setSessionCookie } from "@/lib/auth/cookies";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { consumeAuthLimit } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { UserModel } from "@/models/user";
import { mergeGuestCartIntoUser } from "@/lib/cart/context";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = loginSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const allowed = await consumeAuthLimit("login", parsed.data.email, 5, 900);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const user = await UserModel.findOne({
      email: parsed.data.email,
      active: true,
      role: "customer",
    })
      .select("+passwordHash name email phone")
      .exec();

    const passwordIsValid = user
      ? await verifyPassword(parsed.data.password, user.passwordHash)
      : await hashPassword(parsed.data.password).then(() => false);

    if (!user || !passwordIsValid) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    const session = await createSession(user._id.toString());
    await mergeGuestCartIntoUser(user._id.toString());
    await setSessionCookie(session.token, session.expiresAt);

    return NextResponse.json({
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
