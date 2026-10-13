import { createHash } from "node:crypto";
import { connectToDatabase } from "@/lib/db/connect";
import { AuthRateLimitModel } from "@/models/auth-rate-limit";

export async function consumeAuthLimit(
  action: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  await connectToDatabase();
  const normalized = `${action}:${identifier.trim().toLowerCase()}`;
  const key = createHash("sha256").update(normalized).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
  const expired = {
    $lte: [{ $ifNull: ["$expiresAt", new Date(0)] }, now],
  };

  const result = await AuthRateLimitModel.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          count: {
            $cond: [expired, 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }],
          },
          expiresAt: { $cond: [expired, expiresAt, "$expiresAt"] },
        },
      },
    ],
    { upsert: true, returnDocument: "after", updatePipeline: true },
  )
    .select("count")
    .lean()
    .exec();

  return (result?.count ?? limit + 1) <= limit;
}
