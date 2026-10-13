import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { revokeSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { apiErrorResponse } from "@/lib/api/errors";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const cookieStore = await cookies();
    await revokeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    await clearSessionCookie();
    return NextResponse.json({ data: { signedOut: true } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
