import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

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

  return NextResponse.json(issue);
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

  // Check permissions - Reporters can only update their own issues' status
  const existing = await prisma.issue.findUnique({
    where: { id },
    select: { reporterId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "OWNER";
  const isOwner = existing.reporterId === session.user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, status, severity, category } = body;
  const isAuthorizedToEdit = isAdmin || isOwner;

  // Lifecycle Logic:
  // If non-admin marks as DONE, move to IN_REVIEW instead.
  let targetStatus = status;
  if (!isAdmin && status === "DONE") {
    targetStatus = "IN_REVIEW";
  }

  const updateData: any = isAuthorizedToEdit
    ? { title, description, status: targetStatus, severity, category }
    : { status: targetStatus };

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
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, name: true },
      },
      attachments: true,
    },
  });

  // Log Activity
  if (oldIssue && targetStatus && oldIssue.status !== targetStatus) {
    await logActivity({
      issueId: id,
      userId: session.user.id,
      action: "STATUS_CHANGE",
      details: `Changed status from ${oldIssue.status} to ${targetStatus}`,
    });
  } else if (isAdmin && (title || description || severity || category)) {
      // Log generic edit for admins if other fields changed
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
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.issue.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
