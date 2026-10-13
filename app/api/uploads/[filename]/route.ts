import { NextResponse } from "next/server";
import { readAdminImage } from "@/lib/admin/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  try {
    const image = await readAdminImage(filename);
    if (!image) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(image.content), {
      headers: {
        "Content-Type": image.contentType,
        "Content-Length": image.content.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Image is temporarily unavailable." },
      { status: 503 },
    );
  }
}
