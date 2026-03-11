import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET dashboard stats
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const whereClause = projectId ? { projectId } : {};

  const [
    totalOpen,
    totalCritical,
    actionedThisWeek,
    recentIssues,
    projectStats,
    recentActivity,
  ] = await Promise.all([
    // Total open issues
    prisma.issue.count({
      where: { status: "OPEN", ...whereClause },
    }),
    // Total critical issues
    prisma.issue.count({
      where: { severity: "CRITICAL", status: { not: "ARCHIVED" }, ...whereClause },
    }),
    // Issues actioned this week
    prisma.issue.count({
      where: {
        status: "ACTIONED",
        updatedAt: { gte: weekAgo },
        ...whereClause,
      },
    }),
    // Recent activity (last 5 modified issues)
    prisma.issue.findMany({
      where: whereClause,
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        reporter: { select: { name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    // Per-project open issue counts (only return the filtered one if projectId is set)
    prisma.project.findMany({
      where: projectId ? { id: projectId } : {},
      include: {
        _count: {
          select: { issues: true },
        },
        issues: {
          where: { status: "OPEN" },
          select: { id: true },
        },
      },
    }),
    // Recent activity logs
    prisma.activityLog.findMany({
      where: projectId ? { issue: { projectId } } : {},
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        issue: { select: { title: true } },
      },
    }),
  ]);

  return NextResponse.json({
    metrics: {
      totalOpen,
      totalCritical,
      actionedThisWeek,
    },
    recentIssues,
    projectStats: projectStats.map((p: { id: string; name: string; _count: { issues: number }; issues: { id: string }[] }) => ({
      id: p.id,
      name: p.name,
      totalIssues: p._count.issues,
      openIssues: p.issues.length,
    })),
    recentActivity: recentActivity.map((log: any) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      userName: log.user.name,
      issueTitle: log.issue.title,
    })),
  });
}
