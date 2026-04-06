async function main() {
  const args = process.argv.slice(2);
  const chatId = args[0];
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!chatId || !botToken) {
    console.error("❌ Error: Missing configuration.");
    console.error("Usage: npx tsx scripts/debug-telegram.ts <YOUR_CHAT_ID>");
    process.exit(1);
  }

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  console.log(`📡 Sending test message to Chat ID: ${chatId}...`);
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🚨 *OOPS Tracker Test Message*\n\nIf you are reading this, your Bot Token and Chat ID are correctly configured! ✅",
        parse_mode: "Markdown",
      }),
    });

    const result = await response.json() as any;

    if (result.ok) {
      console.log("🎉 Test message sent successfully!");
    } else {
      console.error("❌ Telegram API returned an error:");
      console.error(result);
    }
  } catch (error) {
    console.error("🔥 Network error trying to reach Telegram:", error);
  }
}

main();
