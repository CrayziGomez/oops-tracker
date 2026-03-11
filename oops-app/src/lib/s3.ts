import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for MinIO / self-hosted S3
});

const BUCKET = process.env.S3_BUCKET_NAME || "oops-attachments";

export async function uploadToS3(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const ext = filename.split(".").pop() || "bin";
  const key = `attachments/${randomUUID()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  const publicUrl = process.env.S3_PUBLIC_URL
    ? `${process.env.S3_PUBLIC_URL}/${key}`
    : `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;

  return { url: publicUrl, key };
}

export async function deleteFromS3(url: string): Promise<void> {
  // Extract key from URL
  const key = url.split("/").slice(-2).join("/");
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export function getFileType(filename: string): "image" | "log" {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return imageExtensions.includes(ext) ? "image" : "log";
}
