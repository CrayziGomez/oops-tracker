import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️  Starting OOPS Ticket Backfill...\n");

  // 1. Find the current maximum serial number
  const latestIssue = await prisma.issue.findFirst({
    where: { serialNumber: { not: null } },
    orderBy: { serialNumber: "desc" },
    select: { serialNumber: true },
  });

  let currentMax = latestIssue?.serialNumber ?? 0;
  console.log(`Current highest OOPS ID: OOPS-${currentMax}`);

  // 2. Fetch all issues where serialNumber is NULL, sorted by createdAt
  const pendingIssues = await prisma.issue.findMany({
    where: { serialNumber: null },
    orderBy: { createdAt: "asc" },
  });

  if (pendingIssues.length === 0) {
    console.log("No new issues found to backfill.");
    return;
  }

  console.log(`Found ${pendingIssues.length} pending issues. Assigning serial numbers...`);

  let count = 0;
  for (const issue of pendingIssues) {
    const nextNumber = currentMax + 1;
    await prisma.issue.update({
      where: { id: issue.id },
      data: { serialNumber: nextNumber },
    });
    console.log(`✅ Assigned OOPS-${nextNumber} to "${issue.title}"`);
    currentMax++;
    count++;
  }

  console.log(`\n🎉 Backfill complete! Synchronized ${count} new issues.`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
