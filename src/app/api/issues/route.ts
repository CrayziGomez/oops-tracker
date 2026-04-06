import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendIssueNotification } from "@/lib/email";
import { sendNewIssueTelegramAlert } from "@/lib/telegram";

// GET issues (with filtering)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const category = searchParams.get("category");
  const limit = searchParams.get("limit");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (projectId) where.projectId = projectId;
  if (status && status !== "ALL") where.status = status;
  if (severity) where.severity = severity;
  if (category) where.category = category;

  const isOwner = session.user.role === "OWNER";
  if (!isOwner) {
    where.project = {
      members: {
        some: { userId: session.user.id }
      }
    };
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      reporter: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true },
      },
      attachments: true,
      _count: {
        select: { attachments: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    ...(limit ? { take: parseInt(limit) } : {}),
  });

  return NextResponse.json(issues);
}

// POST create issue
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, severity, category, projectId, attachments } =
      body;

    console.log("Creating issue with:", {
      userId: session.user.id,
      projectId,
      title
    });

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and project are required" },
        { status: 400 }
      );
    }

    const isOwner = session.user.role === "OWNER";
    if (!isOwner) {
      const membership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId: session.user.id, projectId },
        },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden: Not a project member" },
          { status: 403 }
        );
      }
    }

    // Use a transaction to safely increment the serial number
    const result = await prisma.$transaction(async (tx) => {
      const latestIssue = await tx.issue.findFirst({
        orderBy: { serialNumber: "desc" },
        select: { serialNumber: true },
      });

      const nextSerialNumber = (latestIssue?.serialNumber ?? 0) + 1;

      const newIssue = await tx.issue.create({
        data: {
          title,
          description,
          severity: severity || "MEDIUM",
          category: category || "BUG",
          projectId,
          reporterId: session.user.id,
          serialNumber: nextSerialNumber,
          attachments: attachments?.length
            ? {
                create: attachments.map(
                  (a: {
                    url: string;
                    filename: string;
                    type: string;
                    size?: number;
                  }) => ({
                    url: a.url,
                    filename: a.filename,
                    type: a.type,
                    size: a.size,
                  })
                ),
              }
            : undefined,
        },
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
          attachments: true,
        },
      });

      return newIssue;
    });

    const issue = result;

    await logActivity({
      issueId: issue.id,
      userId: session.user.id,
      action: "CREATION",
      details: `Issue OOPS-${issue.serialNumber} created: ${title}`,
    });

    // --- NOTIFICATION DISPATCH ---
    // Notify Global Owners and Project Admins
    try {
      const admins = await prisma.user.findMany({
        where: {
          OR: [
            { 
              role: "OWNER",
              projectMutes: {
                none: { projectId } // Not muted by owner
              }
            },
            {
              projectMembers: {
                some: { 
                  projectId, 
                  role: "PROJECT_ADMIN",
                  notificationsEnabled: true // Per-project enabled
                }
              }
            }
          ],
          NOT: { id: session.user.id } // Exclude the creator
        },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          emailEnabled: true,
          telegramChatId: true, 
          telegramEnabled: true 
        }
      });

      if (admins.length > 0) {
        const host = req.headers.get("host");
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const baseUrl = process.env.AUTH_URL || `${protocol}://${host}`;
        const issueLink = `/issues/${issue.id}`;
        const issueUrl = `${baseUrl}${issueLink}`;

        for (const admin of admins) {
          // 1. In-App Notification
          await prisma.notification.create({
            data: {
              userId: admin.id,
              title: "New OOPS Log Shared",
              message: `[OOPS-${issue.serialNumber}] ${issue.reporter.name} just logged: ${issue.title}`,
              type: "NEW_ISSUE",
              link: issueLink,
            },
          });

          // 2. Telegram Alert
          if (admin.telegramEnabled && admin.telegramChatId) {
            await sendNewIssueTelegramAlert({
              chatId: admin.telegramChatId,
              serialNumber: issue.serialNumber || 0,
              issueTitle: issue.title,
              reporterName: issue.reporter.name,
              severity: issue.severity,
              category: issue.category,
              url: issueUrl,
            });
          }

          // 3. Email Alert (Only if globally enabled)
          if (admin.emailEnabled) {
             try {
               await sendIssueNotification({
                 to: admin.email,
                 issueTitle: issue.title,
                 action: `created by ${issue.reporter.name}`,
                 issueUrl: issueUrl,
               });
             } catch (emailErr) {
               console.error(`Failed to send new issue email to ${admin.email}:`, emailErr);
             }
          }
        }
      }
    } catch (dispatchError) {
      console.error("🔥 Failed to dispatch new issue notifications:", dispatchError);
      // Non-blocking error, we don't want to fail the issue creation itself
    }

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Issue creation error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
