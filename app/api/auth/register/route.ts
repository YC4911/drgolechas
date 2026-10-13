import { after, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthLimit } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/validation";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { UserModel } from "@/models/user";
import { mergeGuestCartIntoUser } from "@/lib/cart/context";
import {
  isEmailDeliveryConfigured,
  sendTemplatedEmail,
} from "@/services/email";
import { absoluteUrl } from "@/lib/seo/site-url";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = registerSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const allowed = await consumeAuthLimit(
      "register",
      parsed.data.email,
      5,
      3600,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const existingUser = await UserModel.exists({ email: parsed.data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with these details already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await UserModel.create({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      role: "customer",
      active: true,
    });
    const session = await createSession(user._id.toString());
    await mergeGuestCartIntoUser(user._id.toString());
    await setSessionCookie(session.token, session.expiresAt);
    if (isEmailDeliveryConfigured()) {
      const name = user.name;
      const email = user.email;
      after(async () => {
        try {
          await sendTemplatedEmail("welcome", email, {
            name,
            signInUrl: absoluteUrl("/login"),
          });
        } catch (error) {
          console.error("Welcome email delivery failed.", error);
        }
      });
    }

    return NextResponse.json(
      {
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
