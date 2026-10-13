import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/models/user";
import { UserSessionModel } from "@/models/user-session";

export const SESSION_COOKIE_NAME = "dg_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface AuthenticatedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer";
}

export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  await connectToDatabase();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await UserSessionModel.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getCustomerForToken(
  token: string | undefined,
): Promise<AuthenticatedCustomer | null> {
  if (!token || token.length > 256) return null;
  await connectToDatabase();

  const session = await UserSessionModel.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  })
    .select("user")
    .lean()
    .exec();
  if (!session) return null;

  const user = await UserModel.findOne({
    _id: session.user,
    active: true,
    role: "customer",
  })
    .select("name email phone role")
    .lean()
    .exec();
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: "customer",
  };
}

export async function getCurrentCustomer(): Promise<AuthenticatedCustomer | null> {
  const cookieStore = await cookies();
  return getCustomerForToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token || token.length > 256) return;
  await connectToDatabase();
  await UserSessionModel.updateOne(
    { tokenHash: hashToken(token), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  ).exec();
}

export function hashSessionToken(token: string): string {
  return hashToken(token);
}
