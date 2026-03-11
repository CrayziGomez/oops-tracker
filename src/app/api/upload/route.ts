import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToS3, getFileType } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const issueId = formData.get("issueId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadToS3(buffer, file.name, file.type);
    const type = getFileType(file.name);

    // If issueId is provided, create attachment record
    if (issueId) {
      const attachment = await prisma.attachment.create({
        data: {
          url,
          filename: file.name,
          type,
          size: file.size,
          issueId,
        },
      });
      return NextResponse.json(attachment);
    }

    // Otherwise return the URL for use in issue creation
    return NextResponse.json({ url, filename: file.name, type, size: file.size });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
