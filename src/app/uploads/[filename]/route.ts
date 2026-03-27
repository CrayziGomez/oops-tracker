import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Mapping common extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  log: "text/plain",
  txt: "text/plain",
  json: "application/json",
  pdf: "application/pdf",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Basic security check: prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = join(process.cwd(), "public", "uploads", filename);

  try {
    const fileBuffer = await readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(`Failed to serve upload: ${filename}`, error);
    return new NextResponse("Not Found", { status: 404 });
  }
}
