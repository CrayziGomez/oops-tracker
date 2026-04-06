import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

// GET — get user profile data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isOwner = session.user.role === "OWNER";
  const isSelf = session.user.id === id;

  if (!isSelf && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      telegramChatId: true,
      telegramEnabled: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH — update own profile (any user) or any user's account (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isOwner = session.user.role === "OWNER";
  const isSelf = session.user.id === id;

  if (!isSelf && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, currentPassword, newPassword, telegramChatId, telegramEnabled } = await req.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
      }
      // Non-admins must verify their current password to change email
      if (isSelf && !isOwner) {
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password required to change email" }, { status: 400 });
        }
        const valid = await compare(currentPassword, user.passwordHash);
        if (!valid) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
      }
      updateData.email = email.trim().toLowerCase();
    }

    if (newPassword !== undefined) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      // Non-admins must verify their current password to set a new one
      if (isSelf) {
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password required" }, { status: 400 });
        }
        const valid = await compare(currentPassword, user.passwordHash);
        if (!valid) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
      }
      updateData.passwordHash = await hash(newPassword, 12);
    }

    if (telegramChatId !== undefined) {
      updateData.telegramChatId = telegramChatId;
    }

    if (telegramEnabled !== undefined) {
      updateData.telegramEnabled = telegramEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE a user (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user is the last OWNER
    if (user.role === "OWNER") {
      const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last Owner account" },
          { status: 400 }
        );
      }
    }

    // Check for related records that would block deletion
    const [issuesCount, commentsCount] = await Promise.all([
      prisma.issue.count({ where: { reporterId: id } }),
      prisma.comment.count({ where: { authorId: id } }),
    ]);

    if (issuesCount > 0 || commentsCount > 0) {
      if (force) {
        // Perform reassignment (Force Delete)
        await prisma.$transaction([
          prisma.issue.updateMany({
            where: { reporterId: id },
            data: { reporterId: session.user.id },
          }),
        ]);

        // For comments, we want to preserve content but mark as author-deleted.
        // updateMany with concat is hard in Prisma/SQLite, so we do it in a transaction
        const userComments = await prisma.comment.findMany({
          where: { authorId: id }
        });

        for (const comment of userComments) {
          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              content: `${comment.content}\n\n(Original author deleted)`,
              authorId: session.user.id
            }
          });
        }
      } else {
        return NextResponse.json(
          { 
            error: "Cannot delete user with active history", 
            details: `This user has ${issuesCount} issues and ${commentsCount} comments. Reassign or delete these records first.` 
          },
          { status: 400 }
        );
      }
    }

    // Check if they are the only admin for any projects
    const adminMemberships = await prisma.projectMember.findMany({
      where: { userId: id, role: "PROJECT_ADMIN" },
      include: { project: { select: { name: true, _count: { select: { members: { where: { role: "PROJECT_ADMIN" } } } } } } }
    });

    const soleAdminProjects = adminMemberships.filter((m: any) => m.project._count.members <= 1);
    if (soleAdminProjects.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete the sole Administrator of a project",
          details: `User is the only admin for: ${soleAdminProjects.map((m: any) => m.project.name).join(", ")}` 
        },
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: unknown) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
