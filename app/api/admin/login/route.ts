import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { setSessionCookie } from "@/lib/auth/cookies";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { consumeAuthLimit } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { AdminModel, type AdminRole } from "@/models/admin";
import { UserModel } from "@/models/user";

const schema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const allowed = await consumeAuthLimit(
      "admin-login",
      parsed.data.email,
      5,
      900,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }
    const user = await UserModel.findOne({
      email: parsed.data.email,
      active: true,
      role: { $in: ["admin", "staff", "superadmin"] },
    })
      .select("+passwordHash name email role")
      .exec();
    const validPassword = user
      ? await verifyPassword(parsed.data.password, user.passwordHash)
      : await hashPassword(parsed.data.password).then(() => false);
    const role: AdminRole | null =
      user?.role === "admin" ||
      user?.role === "staff" ||
      user?.role === "superadmin"
        ? user.role
        : null;
    const admin = user
      ? await AdminModel.findOne({
          user: user._id,
          active: true,
          ...(role ? { role } : {}),
        }).exec()
      : null;
    if (!user || !validPassword || !admin || !role) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    const session = await createSession(user._id.toString());
    await AdminModel.updateOne(
      { _id: admin._id },
      { $set: { lastLoginAt: new Date() } },
    ).exec();
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({
      data: { id: user._id.toString(), name: user.name, role },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
