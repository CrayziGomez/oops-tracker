import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { 
  getTelegramFile, 
  downloadTelegramFile, 
  sendTelegramMessage 
} from "@/lib/telegram";
import { uploadToStorage } from "@/lib/storage";
import { broadcastIssueUpdate } from "@/lib/notifications";
import { getBaseUrl } from "@/lib/utils";

/**
 * TELEGRAM WEBHOOK HANDLER
 * Receives incoming messages from the OOPS Tracker Bot.
 */
export async function POST(req: NextRequest) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // 1. Security Check
  if (secretToken !== expectedSecret) {
    console.error(`⛔ Unauthorized Telegram Webhook: Secret mismatch.`);
    console.error(`   Received: ${secretToken ? '****' + secretToken.slice(-4) : 'MISSING'}`);
    console.error(`   Expected: ${expectedSecret ? '****' + expectedSecret.slice(-4) : 'NOT SET IN ENV'}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json({ ok: true }); 
    }

    // 1. Detect Content Type
    const chatId = message.chat.id.toString();
    const text = message.text || message.caption || "";
    const hasPhoto = !!message.photo;

    if (!text && !hasPhoto) {
      return NextResponse.json({ ok: true }); 
    }

    console.log(`📩 Received Telegram message from Chat ID ${chatId}: "${text.slice(0, 50)}..."`);

    // 2. Identify the User
    const user = await prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });

    if (!user) {
      console.warn(`❓ Unknown Telegram user (Chat ID: ${chatId}). Ensure it is linked in Profile Settings.`);
      return NextResponse.json({ ok: true });
    }

    // 3. Identify the Issue (Look for OOPS-# pattern in current message)
    const oopsMatch = text.match(/OOPS-(\d+)/i);
    let sn: number | null = null;

    if (oopsMatch) {
      sn = parseInt(oopsMatch[1], 10);
      console.log(`🔎 Found OOPS ID in message text: ${sn}`);
    }

    // 4. Try identifying via reply linkage (If they replied to a bot notification)
    if (!sn && message.reply_to_message) {
      const original = message.reply_to_message;
      const originalText = original.text || original.caption || "";
      const replyMatch = originalText.match(/OOPS-(\d+)/i);
      
      if (replyMatch) {
        sn = parseInt(replyMatch[1], 10);
        console.log(`🔎 Found OOPS ID in reply-to-message: ${sn}`);
      } else {
        console.log(`⚠️  Reply linkage found, but original message text/caption did not contain OOPS identifier.`);
      }
    }

    if (!sn) {
       console.log("❓ Could not identify OOPS ID in message or reply.");
       return NextResponse.json({ ok: true });
    }

    // 5. Fetch the Issue
    const issue = await prisma.issue.findFirst({
      where: { serialNumber: sn },
      select: { id: true, projectId: true, title: true }
    });

    if (!issue) {
      console.warn(`❌ No issue found in database with serial number: ${sn}`);
      return NextResponse.json({ ok: true });
    }

    // 6. Action Handling (Status Commands or Photo Upload)
    let processedText = text;
    let confirmationMsg = "";
    const baseUrl = getBaseUrl(req);
    const shortLink = `${baseUrl}/issues/${sn}`;

    // A. Handle Status Commands (Requires Admin/Owner)
    const lowerText = text.toLowerCase().trim();
    const statusCommands: Record<string, string> = {
      "/done": "DONE",
      "/action": "ACTIONED",
      "/open": "OPEN",
      "/archive": "ARCHIVED",
      "/close": "DONE"
    };

    let targetStatus: string | null = null;
    for (const [cmd, status] of Object.entries(statusCommands)) {
      if (lowerText.startsWith(cmd)) {
        targetStatus = status;
        processedText = text.replace(new RegExp(cmd, "i"), "").trim();
        break;
      }
    }

    if (targetStatus) {
      // Permission Check: Global OWNER or PROJECT_ADMIN
      const isGlobalOwner = user.role === "OWNER";
      const projectMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: issue.projectId } }
      });
      const isProjectAdmin = isGlobalOwner || projectMember?.role === "PROJECT_ADMIN";

      if (!isProjectAdmin) {
        await sendTelegramMessage(chatId, `⚠️ Unauthorized: Only Project Administrators can change ticket status via Telegram.`);
        return NextResponse.json({ ok: true });
      }

      await prisma.issue.update({
        where: { id: issue.id },
        data: { status: targetStatus }
      });

      await logActivity({
        issueId: issue.id,
        userId: user.id,
        action: "STATUS_CHANGE",
        details: `Status set to ${targetStatus} via Telegram`
      });

      // Broadcast the Status Change
      await broadcastIssueUpdate({
        issueId: issue.id,
        actorId: user.id,
        action: "STATUS_CHANGE",
        details: targetStatus,
        baseUrl
      });

      confirmationMsg = `✅ Ticket OOPS-${sn} marked as ${targetStatus}.`;
    }

    // B. Handle Photo Attachment
    if (hasPhoto) {
      const photos = message.photo;
      const bestPhoto = photos[photos.length - 1]; // Highest resolution
      
      const fileInfo = await getTelegramFile(bestPhoto.file_id);
      if (fileInfo) {
        const buffer = await downloadTelegramFile(fileInfo.file_path);
        if (buffer) {
          const { url } = await uploadToStorage(buffer, `tg_photo_${Date.now()}.jpg`, "image/jpeg");
          
          await prisma.attachment.create({
            data: {
              url,
              filename: `Telegram Photo`,
              type: "image",
              issueId: issue.id
            }
          });

          await logActivity({
            issueId: issue.id,
            userId: user.id,
            action: "ATTACHMENT",
            details: "Attached a photo via Telegram"
          });

          // Broadcast Attachment
          await broadcastIssueUpdate({
            issueId: issue.id,
            actorId: user.id,
            action: "ATTACHMENT",
            baseUrl
          });

          const attachmentConfirm = `📎 Photo attached to OOPS-${sn}.`;
          confirmationMsg = confirmationMsg ? `${confirmationMsg}\n${attachmentConfirm}` : attachmentConfirm;
        }
      }
    }

    // C. Add Comment (if text remains)
    if (processedText || (hasPhoto && !targetStatus)) {
      // If we only have the OOPS-ID and no actual comment text, don't add a comment
      const cleanedComment = processedText.replace(/OOPS-\d+/i, '').trim();
      
      if (cleanedComment || (hasPhoto && !targetStatus)) {
        const commentContent = cleanedComment || "[Sent a photo]";
        await prisma.comment.create({
          data: {
            content: `[MOBILE]: ${commentContent}`,
            issueId: issue.id,
            authorId: user.id,
          },
        });

        // Broadcast the Comment
        await broadcastIssueUpdate({
          issueId: issue.id,
          actorId: user.id,
          action: "COMMENT",
          baseUrl
        });

        if (!confirmationMsg) confirmationMsg = `💬 Comment added to OOPS-${sn}.`;
      }
    }

    // 7. Send Confirmation
    if (confirmationMsg) {
      await sendTelegramMessage(chatId, `${confirmationMsg}\n🔗 [View Ticket](${shortLink})`);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("🔥 Webhook processing error:", error);
    return NextResponse.json({ ok: true }); // Always acknowledge to Telegram to stop retries
  }
}
