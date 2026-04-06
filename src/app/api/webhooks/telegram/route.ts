import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

/**
 * TELEGRAM WEBHOOK HANDLER
 * Receives incoming messages from the OOPS Tracker Bot.
 */
export async function POST(req: NextRequest) {
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // 1. Security Check
  if (secretToken !== expectedSecret) {
    console.error("⛔ Unauthorized Webhook Attempt: Invalid Secret Token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true }); // Acknowledge non-text messages
    }

    const chatId = message.chat.id.toString();
    const text = message.text;

    // 2. Identify the User
    const user = await prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });

    if (!user) {
      console.warn(`📩 Received message from unknown Chat ID: ${chatId}`);
      // Future: Could send a "Welcome! Please link your ID in OOPS Settings" message back.
      return NextResponse.json({ ok: true });
    }

    // 3. Identify the Issue (Look for OOPS-# pattern)
    // We search the text for something like "OOPS-123"
    const oopsMatch = text.match(/OOPS-(\d+)/i);
    let issueId: string | null = null;

    if (oopsMatch) {
      const serialNumber = parseInt(oopsMatch[1], 10);
      const issue = await prisma.issue.findFirst({
        where: { serialNumber },
        select: { id: true },
      });
      if (issue) issueId = issue.id;
    }

    // 4. Try identifying via reply linkage (If they replied to a bot notification)
    if (!issueId && message.reply_to_message && message.reply_to_message.text) {
      const replyText = message.reply_to_message.text;
      const replyMatch = replyText.match(/OOPS-(\d+)/i);
      if (replyMatch) {
        const serialNumber = parseInt(replyMatch[1], 10);
        const issue = await prisma.issue.findFirst({
          where: { serialNumber },
          select: { id: true },
        });
        if (issue) issueId = issue.id;
      }
    }

    if (!issueId) {
       // Could not determine which issue to comment on
       console.log("❓ Could not identify OOPS ID in message or reply.");
       return NextResponse.json({ ok: true });
    }

    // 5. Add Comment
    await prisma.comment.create({
      data: {
        content: `[MOBILE REPLY]: ${text}`,
        issueId,
        authorId: user.id,
      },
    });

    await logActivity({
      issueId,
      userId: user.id,
      action: "COMMENT",
      details: "Added comment via Telegram",
    });

    console.log(`✅ Telegram response added to OOPS identifier match for user ${user.name}`);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("🔥 Webhook processing error:", error);
    return NextResponse.json({ ok: true }); // Always acknowledge to Telegram to stop retries
  }
}
