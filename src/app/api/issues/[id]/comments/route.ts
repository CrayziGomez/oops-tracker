import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendIssueNotification } from "@/lib/email";
import { sendIssueTelegramAlert } from "@/lib/telegram";

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

    if (issue && issue.reporterId !== session.user.id) {
      const host = req.headers.get("host");
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const baseUrl = process.env.AUTH_URL || `${protocol}://${host}`;
      const issueUrl = `${baseUrl}/issues/${issueId}`;

      // 1. Telegram Alert
      if (issue.reporter.telegramEnabled && issue.reporter.telegramChatId) {
        try {
          await sendIssueTelegramAlert({
            chatId: issue.reporter.telegramChatId,
            issueId: issueId,
            serialNumber: issue.serialNumber || 0,
            issueTitle: issue.title,
            action: "New comment added",
            url: issueUrl,
          });
        } catch (tgError) {
          console.error("Failed to send Telegram comment alert:", tgError);
        }
      }

      // 2. Email Alert
      if (issue.reporter.emailEnabled) {
        try {
          await sendIssueNotification({
            to: issue.reporter.email,
            issueTitle: issue.title,
            action: "New comment added",
            issueUrl: issueUrl,
          });
        } catch (emailError) {
          console.error("Failed to send Email comment alert:", emailError);
        }
      }
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
