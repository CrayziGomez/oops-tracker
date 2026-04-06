export {};

async function setupMain() {
  const args = process.argv.slice(2);
  const baseUrl = args[0];
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!baseUrl || !botToken) {
    console.error("❌ Error: Missing configuration.");
    console.error("Ensure TELEGRAM_BOT_TOKEN is set in your environment.");
    console.error("Usage: npx tsx scripts/setup-telegram.ts <YOUR_BASE_URL>");
    process.exit(1);
  }

  const webhookUrl = `${baseUrl}/api/webhooks/telegram`;
  const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;

  console.log(`🚀 Registering Webhook: ${webhookUrl}`);
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ["message"],
      }),
    });

    const result = await response.json() as any;

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

setupMain();
