import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// GET: Validate token and return invitation info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.projectInvitation.findUnique({
    where: { token },
    include: {
      project: { select: { name: true } },
      inviter: { select: { name: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation token" }, { status: 404 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Invitation has already been used" }, { status: 400 });
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
  }

  return NextResponse.json({
    email: invitation.email,
    projectName: invitation.project.name,
    inviterName: invitation.inviter.name,
    role: invitation.role,
  });
}

// POST: Accept invitation and create user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { name, password } = await req.json();

  if (!name || !password) {
    return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
  }

  try {
    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.status !== "PENDING" || new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: "Invalid, used, or expired invitation token" }, { status: 400 });
    }

    // Double check if user was created in the meantime
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const passwordHash = await hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: invitation.email,
          name,
          passwordHash,
          role: "USER", // Global role
        },
      });
      userId = user.id;
    }

    // Create project membership and update invitation status in a transaction
    await prisma.$transaction([
      prisma.projectMember.upsert({
        where: { userId_projectId: { userId, projectId: invitation.projectId } },
        update: { role: invitation.role },
        create: {
          userId,
          projectId: invitation.projectId,
          role: invitation.role,
        },
      }),
      prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
    ]);

    return NextResponse.json({ message: "Invitation accepted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json({ error: "Failed to process invitation" }, { status: 500 });
  }
}
