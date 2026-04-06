import { setTelegramWebhook } from "../src/lib/telegram";

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0];

  if (!baseUrl) {
    console.error("❌ Usage: npx tsx scripts/setup-telegram.ts <YOUR_BASE_URL>");
    console.error("Example: npx tsx scripts/setup-telegram.ts https://oops.yourdomain.com");
    process.exit(1);
  }

  const webhookUrl = `${baseUrl}/api/webhooks/telegram`;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || "default_secret_if_none";

  console.log(`🚀 Registering Webhook: ${webhookUrl}`);
  console.log(`🔒 Using Secret Token: ${secretToken.substring(0, 10)}...`);

  try {
    const result = await setTelegramWebhook(webhookUrl, secretToken);
    if (result.ok) {
      console.log("✅ Webhook registered successfully!");
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error("❌ Failed to register webhook:");
      console.error(result);
    }
  } catch (error) {
    console.error("🔥 Error setting up Telegram webhook:", error);
    process.exit(1);
  }
}

main();
