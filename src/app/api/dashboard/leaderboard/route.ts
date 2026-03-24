import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwner = session.user.role === "OWNER";

  // Base where clause for issues
  const issueWhereClause: any = {};
  if (!isOwner) {
    issueWhereClause.project = {
      members: {
        some: { userId: session.user.id }
      }
    };
  }

  // Get users ordered by the number of issues they've reported
  // Since we need to scope the issues by projects the current user can see,
  // we do a grouped query. But Prisma's groupBy is limited with relations.
  // Instead, we can fetch all relevant issues, or find users and manually count.
  // The most efficient Prisma way for "Top Reporters" in scoped projects:
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          issues: {
            where: issueWhereClause
          }
        }
      }
    },
    where: {
      issues: {
        some: issueWhereClause
      }
    },
    orderBy: {
      issues: {
        _count: 'desc'
      }
    },
    take: 5
  });

  // Map to a cleaner format
  const leaderboard = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    count: u._count.issues
  })).sort((a, b) => b.count - a.count);

  return NextResponse.json(leaderboard);
}
