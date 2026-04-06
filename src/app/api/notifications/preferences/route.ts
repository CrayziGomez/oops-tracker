import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Fetch all projects and the user's notification status for each
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id!;

  // 1. Get user's memberships
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true, notificationsEnabled: true },
  });

  // 2. Get ONLY projects user is a member of
  const joinedProjectIds = memberships.map((m: { projectId: string }) => m.projectId);
  const projects = await prisma.project.findMany({
    where: { id: { in: joinedProjectIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Combine data
  const preferences = projects.map((p: { id: string; name: string }) => {
    const membership = memberships.find((m: { projectId: string; notificationsEnabled: boolean }) => m.projectId === p.id);
    
    return {
      id: p.id,
      name: p.name,
      isMember: true, // They must be a member to be in this list now
      enabled: membership?.notificationsEnabled ?? true,
    };
  });

  // Only return projects where the user is an Admin/Owner (the only ones who get alerts anyway)
  // For simplicity, we return all, but the UI might filter or show them all.
  
  return NextResponse.json(preferences);
}

// POST — Toggle notification status for a project
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, enabled } = await req.json();
  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  }

  const userId = session.user.id!;
  const isOwner = session.user.role === "OWNER";

  // Check if they are a member
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (membership) {
    // If they are a member, update the membership flag
    await prisma.projectMember.update({
      where: { id: membership.id },
      data: { notificationsEnabled: enabled },
    });
  } else if (isOwner) {
    // If not a member but is Owner, manage a ProjectMute record
    if (enabled) {
      // Unmute: delete the mute record if it exists
      await prisma.projectMute.deleteMany({
        where: { userId, projectId },
      });
    } else {
      // Mute: create the mute record (upsert)
      await prisma.projectMute.upsert({
        where: { userId_projectId: { userId, projectId } },
        create: { userId, projectId },
        update: {},
      });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
