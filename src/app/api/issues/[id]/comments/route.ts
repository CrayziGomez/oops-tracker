import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendIssueNotification } from "@/lib/email";
import { sendIssueTelegramAlert } from "@/lib/telegram";
import { getBaseUrl } from "@/lib/utils";
import { broadcastIssueUpdate } from "@/lib/notifications";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: issueId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { issueId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: issueId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        issueId,
        authorId: session.user.id!,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await logActivity({
      issueId,
      userId: session.user.id!,
      action: "COMMENT",
      details: `Added a comment`,
    });

    // Notify Reporter
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { 
        reporter: {
          select: { 
            id: true, 
            name: true,
            email: true,
            emailEnabled: true,
            telegramChatId: true, 
            telegramEnabled: true 
          }
        }
      }
    });

    // BROADCAST Logic (Phase 3): Notify Admins / Owners + Reporter
    if (issue) {
      const baseUrl = getBaseUrl(req);
      // BROADCAST Logic: Notify Admins / Owners + Reporter
      await broadcastIssueUpdate({
        issueId,
        actorId: session.user.id!,
        action: "COMMENT",
        baseUrl
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
