import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all projects
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwner = session.user.role === "OWNER";

  const projects = await prisma.project.findMany({
    where: isOwner ? {} : {
      members: {
        some: { userId: session.user.id }
      }
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { issues: true },
      },
      members: {
        where: isOwner ? undefined : { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  return NextResponse.json(projects);
}

// POST create project (Owner or Project Admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwner = session.user.role === "OWNER";
  
  if (!isOwner) {
    const adminOf = await prisma.projectMember.findFirst({
      where: { userId: session.user.id, role: "PROJECT_ADMIN" },
    });
    if (!adminOf) {
      return NextResponse.json({ error: "Forbidden: Only Owners or existing Project Admins can create projects." }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: { name: name.trim(), description: description?.trim() },
      });

      await tx.projectMember.create({
        data: {
          userId: session.user.id as string,
          projectId: newProject.id,
          role: "PROJECT_ADMIN", // automatically make them an admin
        },
      });

      return newProject;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A project with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
