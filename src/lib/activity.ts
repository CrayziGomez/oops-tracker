import { prisma } from "./prisma";

export type ActivityAction = "STATUS_CHANGE" | "COMMENT" | "ATTACHMENT" | "CREATION" | "EDIT";

export async function logActivity({
  issueId,
  userId,
  action,
  details,
}: {
  issueId: string;
  userId: string;
  action: ActivityAction;
  details?: string;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        issueId,
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw, we don't want to break the main flow if logging fails
    return null;
  }
}
