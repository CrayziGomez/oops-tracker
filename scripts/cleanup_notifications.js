const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Notification Cleanup & Privacy Reset...");

  // 1. Reset Email Notifications for ALL users
  console.log("📥 Resetting Email Notifications to OFF for all users...");
  const userUpdate = await prisma.user.updateMany({
    data: { emailEnabled: false }
  });
  console.log(`✅ Updated ${userUpdate.count} users.`);

  // 2. Fix Notification Links (Absolute to Relative)
  console.log("🔗 Converting existing Notification links to Relative Paths...");
  const notifications = await prisma.notification.findMany({
    where: {
      link: { contains: "http" } // Find absolute links
    }
  });

  let fixCount = 0;
  for (const n of notifications) {
    if (n.link) {
      let relativeLink = n.link;
      
      const snMatch = n.link.match(/\/issues\/(\d+)$/);
      if (snMatch) {
        relativeLink = `/issues/${snMatch[1]}`;
      } else {
        try {
          // Manually parse if it's a URL
          if (n.link.startsWith('http')) {
            const parts = n.link.split('/');
            const issuesIndex = parts.indexOf('issues');
            if (issuesIndex !== -1 && parts[issuesIndex + 1]) {
                relativeLink = `/issues/${parts[issuesIndex + 1]}`;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (relativeLink !== n.link) {
        await prisma.notification.update({
          where: { id: n.id },
          data: { link: relativeLink }
        });
        fixCount++;
      }
    }
  }
  console.log(`✅ Fixed ${fixCount} notification links.`);

  console.log("✨ Cleanup Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
