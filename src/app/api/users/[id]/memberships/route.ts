import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { broadcastProjectInvite } from "@/lib/notifications";
import { getBaseUrl } from "@/lib/utils";

/**
 * ADMIN BULK MEMBERSHIP MANAGEMENT
 * Allows 'OWNER' to manage which projects a user belongs to.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Security Check: OWNER only
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  
  try {
    const { memberships } = await req.json();

    if (!Array.isArray(memberships)) {
      return NextResponse.json({ error: "Invalid memberships format" }, { status: 400 });
    }

    // Validation: All roles must be valid
    const validRoles = ["PROJECT_ADMIN", "PROJECT_REPORTER"];
    for (const m of memberships) {
      if (!m.projectId || !validRoles.includes(m.role)) {
        return NextResponse.json({ error: `Invalid membership entry: ${JSON.stringify(m)}` }, { status: 400 });
      }
    }

    // Fetch existing projects for this user to determine what is NEW
    const existing = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    const existingIds = new Set(existing.map(e => e.projectId));

    // Sync Memberships in a Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Clear ALL existing memberships for this user
      await tx.projectMember.deleteMany({
        where: { userId }
      });

      // 2. Create the NEW set of memberships
      if (memberships.length > 0) {
        await tx.projectMember.createMany({
          data: memberships.map((m: { projectId: string; role: string }) => ({
            userId,
            projectId: m.projectId,
            role: m.role
          }))
        });
      }
    });

    // 3. Notify user of NEW memberships (Invitations)
    const baseUrl = getBaseUrl(req);
    for (const m of memberships) {
      if (!existingIds.has(m.projectId)) {
        await broadcastProjectInvite({ userId, projectId: m.projectId, baseUrl });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔥 Bulk Membership Sync Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

