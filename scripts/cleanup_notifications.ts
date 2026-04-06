import { PrismaClient } from "@prisma/client";

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
      // Extract the path after the domain (e.g., /issues/123)
      // Regex matches anything up to and including the project/issues segment
      // To be safe and support our new short links:
      // Pattern 1: http://.../issues/123 -> /issues/123
      // Pattern 2: http://.../projects/xxx/issues/yyy -> /issues/yyy (if we can find the SN)
      
      let relativeLink = n.link;
      
      // Match the /issues/[number] pattern
      const snMatch = n.link.match(/\/issues\/(\d+)$/);
      if (snMatch) {
        relativeLink = `/issues/${snMatch[1]}`;
      } else {
        // Fallback: just strip the origin if it matches a known pattern
        try {
          const url = new URL(n.link);
          relativeLink = url.pathname;
        } catch (e) {
          // If not a valid URL, skip
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
