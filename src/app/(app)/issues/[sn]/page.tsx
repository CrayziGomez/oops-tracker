import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

/**
 * SHORT LINK REDIRECTOR
 * Handles URLs like /issues/123 -> /projects/UUID/issues/UUID
 */
export default async function IssueRedirectPage({
  params,
}: {
  params: Promise<{ sn: string }>;
}) {
  const { sn } = await params;
  const serialNumber = parseInt(sn, 10);

  let issue;

  if (!isNaN(serialNumber)) {
    // 1. Try finding by Serial Number
    issue = await prisma.issue.findFirst({
      where: { serialNumber },
      select: { id: true, projectId: true },
    });
  }

  // 2. Fallback: Try finding by ID (Handles legacy notification links)
  if (!issue) {
    issue = await prisma.issue.findUnique({
      where: { id: sn },
      select: { id: true, projectId: true },
    });
  }

  if (!issue) {
    return notFound();
  }

  // Redirect to the full project-nested path
  return redirect(`/projects/${issue.projectId}/issues/${issue.id}`);
}
