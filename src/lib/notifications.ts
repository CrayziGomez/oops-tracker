import { prisma } from "@/lib/prisma";
import { sendIssueNotification } from "@/lib/email";
import { 
  sendIssueTelegramAlert, 
  sendNewIssueTelegramAlert 
} from "@/lib/telegram";

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
    // Reporters + ALL Project Members + Global Owners
    const potentialRecipients = await prisma.user.findMany({
      where: {
        OR: [
          { id: issue.reporterId },
          { role: "OWNER" },
          {
            projectMembers: {
              some: {
                projectId: issue.projectId,
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

/**
 * PROJECT INVITATION BROADCAST
 * Notifies a user when they are added to a project.
 */
export async function broadcastProjectInvite({
  userId,
  projectId,
  baseUrl
}: {
  userId: string;
  projectId: string;
  baseUrl: string;
}) {
  try {
    const [user, project] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.project.findUnique({ where: { id: projectId } })
    ]);

    if (!user || !project) return;

    const projectUrl = `${baseUrl}/projects/${project.id}`;
    const message = `You've been added to project: ${project.name}`;

    // A. Telegram
    if (user.telegramEnabled && user.telegramChatId) {
       await sendIssueTelegramAlert({
         chatId: user.telegramChatId,
         issueId: "invite",
         serialNumber: 0,
         issueTitle: project.name,
         action: "assigned to project",
         url: projectUrl
       });
    }

    // B. Email
    if (user.emailEnabled) {
      await sendIssueNotification({
        to: user.email,
        issueTitle: project.name,
        action: "assigned to project",
        issueUrl: projectUrl
      });
    }

    // C. In-App
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Project Assignment",
        message: `You have been added to ${project.name}`,
        type: "PROJECT_INVITE",
        link: `/dashboard`, // or projectUrl if absolute
      }
    });

  } catch (error) {
    console.error("🔥 Project Invite Broadcast Failed:", error);
  }
}

/**
 * NEW ISSUE BROADCAST
 * Notifies all project members and global owners when a new issue is created.
 */
export async function broadcastNewIssue({
  issueId,
  actorId,
  baseUrl
}: {
  issueId: string;
  actorId: string;
  baseUrl: string;
}) {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        reporter: { select: { name: true, email: true } },
      },
    });

    if (!issue) return;

    const sn = issue.serialNumber || 0;
    const issueUrl = `${baseUrl}/issues/${sn}`;

    // Identify Recipients: Reporters + ALL Membership + Owners (Muted check later)
    const potentialRecipients = await prisma.user.findMany({
      where: {
        OR: [
          { role: "OWNER" },
          {
            projectMembers: {
              some: { projectId: issue.projectId }
            }
          }
        ],
        NOT: { id: actorId }
      },
      select: {
        id: true,
        email: true,
        emailEnabled: true,
        telegramChatId: true,
        telegramEnabled: true,
        projectMembers: {
          where: { projectId: issue.projectId },
          select: { notificationsEnabled: true }
        },
        projectMutes: {
          where: { projectId: issue.projectId },
          select: { id: true }
        }
      }
    });

    for (const user of potentialRecipients) {
      const isMuted = user.projectMutes.length > 0;
      const projectSub = user.projectMembers[0]?.notificationsEnabled ?? true;
      if (isMuted || !projectSub) continue;

      // 1. Telegram
      if (user.telegramEnabled && user.telegramChatId) {
        await sendNewIssueTelegramAlert({
          chatId: user.telegramChatId,
          serialNumber: sn,
          issueTitle: issue.title,
          reporterName: issue.reporter.name,
          severity: issue.severity,
          category: issue.category,
          url: issueUrl
        });
      }

      // 2. Email
      if (user.emailEnabled) {
        await sendIssueNotification({
          to: user.email,
          issueTitle: issue.title,
          action: `created by ${issue.reporter.name}`,
          issueUrl: issueUrl
        });
      }

      // 3. In-App
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "New OOPS Log Shared",
          message: `[OOPS-${sn}] ${issue.reporter.name} logged: ${issue.title}`,
          type: "NEW_ISSUE",
          link: `/issues/${sn}`
        }
      });
    }
  } catch (error) {
    console.error("🔥 New Issue Broadcast Failed:", error);
  }
}

