import { prisma } from "@/lib/prisma";
import { sendIssueNotification } from "@/lib/email";
import { sendIssueTelegramAlert } from "@/lib/telegram";

interface BroadcastOptions {
  issueId: string;
  actorId: string;
  action: "COMMENT" | "STATUS_CHANGE" | "ATTACHMENT";
  details?: string;
  baseUrl: string;
}

/**
 * CENTRALIZED NOTIFICATION SERVICE
 * Orchestrates Email, Telegram, and In-App notifications.
 */
export async function broadcastIssueUpdate({
  issueId,
  actorId,
  action,
  details,
  baseUrl
}: BroadcastOptions) {
  try {
    // 1. Fetch Issue & Context
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        reporter: true,
      },
    });

    if (!issue) return;

    const sn = issue.serialNumber || 0;
    const issueUrl = `${baseUrl}/issues/${sn}`; // Use the NEW short-link redirector
    const actionLabel = 
      action === "COMMENT" ? "New comment added" :
      action === "STATUS_CHANGE" ? `Status updated: ${details}` :
      "New attachment added";

    // 2. Identify Potential Recipients
    // Reporters + Project Admins + Global Owners
    const potentialRecipients = await prisma.user.findMany({
      where: {
        OR: [
          { id: issue.reporterId },
          { role: "OWNER" },
          {
            projectMembers: {
              some: {
                projectId: issue.projectId,
                role: "PROJECT_ADMIN",
              },
            },
          },
        ],
        NOT: { id: actorId }, // Exclude the person who triggered the update
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailEnabled: true,
        telegramChatId: true,
        telegramEnabled: true,
        projectMembers: {
          where: { projectId: issue.projectId },
          select: { notificationsEnabled: true },
        },
        projectMutes: {
          where: { projectId: issue.projectId },
          select: { id: true },
        },
      },
    });

    // 3. Filter and Dispatch
    for (const user of potentialRecipients) {
      const isMuted = user.projectMutes.length > 0;
      const projectSub = user.projectMembers[0]?.notificationsEnabled ?? true;

      // Skip if explicitly muted or unsubscribed at project level
      if (isMuted || !projectSub) continue;

      // A. Telegram Alert
      if (user.telegramEnabled && user.telegramChatId) {
        try {
          await sendIssueTelegramAlert({
            chatId: user.telegramChatId,
            issueId: issue.id,
            serialNumber: sn,
            issueTitle: issue.title,
            action: actionLabel,
            url: issueUrl,
          });
        } catch (e) {
          console.error(`Telegram delivery failed for ${user.email}:`, e);
        }
      }

      // B. Email Alert
      if (user.emailEnabled) {
        try {
          await sendIssueNotification({
            to: user.email,
            issueTitle: issue.title,
            action: actionLabel,
            issueUrl: issueUrl,
          });
        } catch (e) {
          console.error(`Email delivery failed for ${user.email}:`, e);
        }
      }

      // C. In-App Notification Record
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `OOPS-${sn}: ${actionLabel}`,
            message: `${issue.title}`,
            type: "ISSUE_UPDATE",
            link: `/issues/${sn}`,
          },
        });
      } catch (e) {
        console.warn(`In-app notification creation failed for ${user.email}:`, e);
      }
    }
  } catch (error) {
    console.error("🔥 Global Notification Broadcast Error:", error);
  }
}
