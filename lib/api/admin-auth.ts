import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function authorizeAdminMutation(request: Request): NextResponse | null {
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "Admin API mutations are not configured." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization");
  const suppliedKey = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!suppliedKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const expected = Buffer.from(expectedKey);
  const supplied = Buffer.from(suppliedKey);

  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
