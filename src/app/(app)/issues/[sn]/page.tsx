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

  if (isNaN(serialNumber)) {
    return notFound();
  }

  const issue = await prisma.issue.findFirst({
    where: { serialNumber },
    select: { id: true, projectId: true },
  });

  if (!issue) {
    return notFound();
  }

  // Redirect to the full project-nested path
  return redirect(`/projects/${issue.projectId}/issues/${issue.id}`);
}
