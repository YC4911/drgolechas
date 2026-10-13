import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { verifyPassword } from "@/lib/auth/password";
import { requireCustomer } from "@/lib/auth/route-guard";
import { profileSchema } from "@/lib/auth/validation";
import { UserModel } from "@/models/user";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  try {
    const user = await UserModel.findById(auth.customer.id)
      .select("name email phone avatar createdAt")
      .lean()
      .exec();
    if (!user)
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 },
      );
    return NextResponse.json({
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        avatar: user.avatar ?? "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = profileSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const { currentPassword, ...updates } = parsed.data;
    if (parsed.data.email) {
      const userWithPassword = await UserModel.findById(auth.customer.id)
        .select("+passwordHash")
        .exec();
      if (
        !userWithPassword ||
        !(await verifyPassword(
          currentPassword ?? "",
          userWithPassword.passwordHash,
        ))
      ) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 403 },
        );
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      auth.customer.id,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    )
      .select("name email phone avatar")
      .lean()
      .exec();
    if (!user)
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 },
      );

    return NextResponse.json({
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        avatar: user.avatar ?? "",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
