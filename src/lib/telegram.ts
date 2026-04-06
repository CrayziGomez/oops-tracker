const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Sends a message to a specific Telegram Chat ID.
 */
export async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Skipping notification.");
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API Error: ${data.description}`);
    }

    return data;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return null;
  }
}

/**
 * High-level helper to send an issue alert to a user.
 */
export async function sendIssueTelegramAlert({
  chatId,
  issueId,
  serialNumber,
  issueTitle,
  action,
  url,
}: {
  chatId: string;
  issueId: string;
  serialNumber: number;
  issueTitle: string;
  action: string;
  url: string;
}) {
  const message = 
    `🔔 *OOPS Update: OOPS-${serialNumber}*\n\n` +
    `*Issue:* ${issueTitle}\n` +
    `*Action:* ${action}\n\n` +
    `🔗 [View Details](${url})\n\n` +
    `💬 _Reply to this message to add a comment._`;

  return sendTelegramMessage(chatId, message);
}

/**
 * High-level helper to send a NEW issue alert to Admins.
 */
export async function sendNewIssueTelegramAlert({
  chatId,
  serialNumber,
  issueTitle,
  reporterName,
  severity,
  category,
  url,
}: {
  chatId: string;
  serialNumber: number;
  issueTitle: string;
  reporterName: string;
  severity: string;
  category: string;
  url: string;
}) {
  const message = 
    `🆕 *New OOPS Log: OOPS-${serialNumber}*\n\n` +
    `*Title:* ${issueTitle}\n` +
    `*Reporter:* ${reporterName}\n` +
    `*Severity:* ${severity}\n` +
    `*Category:* ${category}\n\n` +
    `🔗 [View Details](${url})\n\n` +
    `💬 _Reply to this message to add a comment._`;

  return sendTelegramMessage(chatId, message);
}

/**
 * Registers the webhook URL with Telegram.
 */
export async function setTelegramWebhook(webhookUrl: string, secretToken: string) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");

  const response = await fetch(`${BASE_URL}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ["message"],
    }),
  });

  return await response.json();
}
