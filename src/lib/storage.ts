import { writeFile, unlink, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// Ensure the upload directory exists
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function uploadToStorage(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const ext = filename.split(".").pop() || "bin";
  const key = `${randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, key);

  // Ensure directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  await writeFile(filePath, file);

  // Return a relative URL that Next.js can serve from /public
  const url = `/uploads/${key}`;

  return { url, key };
}

export async function deleteFromStorage(url: string): Promise<void> {
  try {
    const filename = url.split("/").pop();
    if (!filename) return;
    
    const filePath = join(UPLOAD_DIR, filename);
    await unlink(filePath);
  } catch (error) {
    console.error("Failed to delete local file:", error);
  }
}

export function getFileType(filename: string): "image" | "log" {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return imageExtensions.includes(ext) ? "image" : "log";
}
