import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendIssueNotification } from "@/lib/email";
import { sendIssueTelegramAlert, sendNewIssueTelegramAlert } from "@/lib/telegram";
import { getBaseUrl } from "@/lib/utils";
import { broadcastIssueUpdate } from "@/lib/notifications";

// GET single issue
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reporter: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true },
      },
      attachments: true,
    },
  });

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  let currentUserRole = "NONE";
  if (session.user.role === "OWNER") {
    currentUserRole = "OWNER";
  } else {
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: session.user.id, projectId: issue.projectId },
      },
    });
    if (member) {
      currentUserRole = member.role; // PROJECT_ADMIN or PROJECT_REPORTER
    }
  }

  return NextResponse.json({ ...issue, currentUserRole });
}

// PATCH update issue
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.issue.findUnique({
    where: { id },
    select: { reporterId: true, projectId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const isGlobalOwner = session.user.role === "OWNER";
  let projectMember = null;

  if (!isGlobalOwner) {
    projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: session.user.id, projectId: existing.projectId },
      },
    });

    if (!projectMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const isProjectAdmin = isGlobalOwner || projectMember?.role === "PROJECT_ADMIN";
  const isReporter = !isProjectAdmin && projectMember?.role === "PROJECT_REPORTER";
  const isCreator = existing.reporterId === session.user.id;

  const { title, description, status, severity, category, revisionReason } = body;

  // Lifecycle Logic:
  // If a Tier 1 user tries to mark as DONE/ACTIONED, intercept and log as IN_REVIEW.
  let targetStatus = status;
  if (isReporter && status && ["ACTIONED", "DONE", "ARCHIVED"].includes(status)) {
    targetStatus = "IN_REVIEW";
  }

  const canEditMetadata = isProjectAdmin || isCreator;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (targetStatus) updateData.status = targetStatus;
  
  if (canEditMetadata) {
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (severity !== undefined) updateData.severity = severity;
    if (category !== undefined) updateData.category = category;
  }

  // Fetch old data for logging if needed
  const oldIssue = await prisma.issue.findUnique({
    where: { id },
    select: { status: true, title: true, severity: true, category: true },
  });

  const issue = await prisma.issue.update({
    where: { id },
    data: updateData,
    include: {
      reporter: {
        select: { 
          id: true, 
          name: true, 
          email: true,
          emailEnabled: true,
          telegramChatId: true,
          telegramEnabled: true
        },
      },
      project: {
        select: { id: true, name: true },
      },
      attachments: true,
    },
  });

  // Handle Revision Feedback if provided
  if (revisionReason && isProjectAdmin) {
    await prisma.comment.create({
      data: {
        content: `[REVISION REQUIRED]: ${revisionReason}`,
        issueId: id,
        authorId: session.user.id,
      },
    });
  }

  // Log Activity and Notify
  if (oldIssue && targetStatus && oldIssue.status !== targetStatus) {
    const statusChangeDetails = revisionReason 
      ? `Changed status from ${oldIssue.status} to ${targetStatus} (Reason: ${revisionReason})`
      : `Changed status from ${oldIssue.status} to ${targetStatus}`;

    await logActivity({
      issueId: id,
      userId: session.user.id,
      action: "STATUS_CHANGE",
      details: statusChangeDetails,
    });

    // BROADCAST Logic: Notify all Admins / Owners + Reporter
    const baseUrl = getBaseUrl(req);
    await broadcastIssueUpdate({
      issueId: id,
      actorId: session.user.id,
      action: "STATUS_CHANGE",
      details: targetStatus,
      baseUrl
    });
  } else if (canEditMetadata && Object.keys(updateData).length > 0 && (!updateData.status || Object.keys(updateData).length > 1)) {

      // Log generic edit for metadata changes
      await logActivity({
        issueId: id,
        userId: session.user.id,
        action: "EDIT",
        details: "Updated issue details",
      });
  }

  return NextResponse.json(issue);
}

// DELETE issue (Admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isGlobalOwner = session.user.role === "OWNER";

  if (!isGlobalOwner) {
    const existing = await prisma.issue.findUnique({
      where: { id },
      select: { projectId: true },
    });
    
    if (!existing) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: session.user.id, projectId: existing.projectId },
      },
    });

    if (projectMember?.role !== "PROJECT_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.issue.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
