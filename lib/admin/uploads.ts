import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ApiError } from "@/lib/api/errors";

const maxUploadBytes = 5 * 1024 * 1024;
const fileTypes = {
  "image/jpeg": {
    extension: "jpg",
    signature: (bytes: Buffer) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    signature: (bytes: Buffer) =>
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  "image/webp": {
    extension: "webp",
    signature: (bytes: Buffer) =>
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP",
  },
} as const;

function storageDirectory(): string {
  return process.env.ADMIN_UPLOAD_DIR?.trim() || join(process.cwd(), "uploads");
}

export async function saveAdminImage(file: File): Promise<{
  url: string;
  contentType: string;
}> {
  if (file.size < 1 || file.size > maxUploadBytes) {
    throw new ApiError("Images must be between 1 byte and 5 MB.", 413);
  }
  const type = fileTypes[file.type as keyof typeof fileTypes];
  if (!type) {
    throw new ApiError("Only JPEG, PNG, and WebP images are supported.", 415);
  }
  const content = Buffer.from(await file.arrayBuffer());
  if (!type.signature(content)) {
    throw new ApiError("The uploaded file does not match its image type.", 415);
  }
  const filename = `${randomUUID()}.${type.extension}`;
  const directory = storageDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(/*turbopackIgnore: true*/ directory, filename),
    content,
    { flag: "wx", mode: 0o640 },
  );
  return { url: `/api/uploads/${filename}`, contentType: file.type };
}

export async function readAdminImage(
  filename: string,
): Promise<{ content: Buffer; contentType: string } | null> {
  if (!/^[\da-f-]{36}\.(?:jpg|png|webp)$/i.test(filename)) return null;
  const contentType = filename.endsWith(".png")
    ? "image/png"
    : filename.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  try {
    const content = await readFile(
      join(/*turbopackIgnore: true*/ storageDirectory(), filename),
    );
    return { content, contentType };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}
