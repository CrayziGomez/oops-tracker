import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import crypto from "crypto";

async function isProjectAdmin(userId: string, projectId: string, globalRole: string) {
  if (globalRole === "OWNER") return true;
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return membership?.role === "PROJECT_ADMIN";
}

// GET all members of a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  // Check if they have access to view this project at all
  const hasAccess = await isProjectAdmin(session.user.id, projectId, session.user.role as string) || 
    (await prisma.projectMember.findUnique({ where: { userId_projectId: { userId: session.user.id, projectId } } }));

  if (!hasAccess && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(members);
}

// POST add a member to a project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const hasAdmin = await isProjectAdmin(session.user.id, projectId, session.user.role as string);

  if (!hasAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, email, role } = await req.json();

    if ((!userId && !email) || !role) {
      return NextResponse.json(
        { error: "User ID or Email and Role are required" },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    // If email is provided, try to find the user
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true }
      });

      if (user) {
        targetUserId = user.id;
      } else {
        // User doesn't exist, create an invitation
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        const invitation = await prisma.projectInvitation.create({
          data: {
            email: email.toLowerCase().trim(),
            projectId,
            inviterId: session.user.id,
            role,
            token,
            expiresAt,
          },
          include: { project: true }
        });

        // Send email
        const host = req.headers.get("host");
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const baseUrl = process.env.AUTH_URL || `${protocol}://${host}`;
        const inviteUrl = `${baseUrl}/invite?token=${token}`;
        await sendInvitationEmail(invitation.email, invitation.project.name, inviteUrl);

        return NextResponse.json({ 
          message: "Invitation sent", 
          invitationId: invitation.id,
          status: "INVITED" 
        }, { status: 201 });
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const member = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: targetUserId, projectId } },
      update: { role },
      create: { userId: targetUserId, projectId, role },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ ...member, status: "ADDED" }, { status: 201 });
  } catch (error) {
    console.error("Failed to add component:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}

// DELETE a member from a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const hasAdmin = await isProjectAdmin(session.user.id, projectId, session.user.role as string);

  if (!hasAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Don't let someone remove themselves if they are the only admin? Optional logic.

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    return NextResponse.json({ message: "Member removed" }, { status: 200 });
  } catch (error) {
    console.error("Failed to remove member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
