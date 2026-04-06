import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️  Starting OOPS Ticket Backfill...\n");

  // Fetch all issues sorted by createdAt
  const issues = await prisma.issue.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (issues.length === 0) {
    console.log("No issues found to backfill.");
    return;
  }

  console.log(`Found ${issues.length} issues. Assigning serial numbers...`);

  let count = 0;
  for (const issue of issues) {
    const serialNumber = count + 1;
    await prisma.issue.update({
      where: { id: issue.id },
      data: { serialNumber },
    });
    console.log(`✅ Assigned OOPS-${serialNumber} to "${issue.title}"`);
    count++;
  }

  console.log(`\n🎉 Backfill complete! Synchronized ${count} issues.`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
