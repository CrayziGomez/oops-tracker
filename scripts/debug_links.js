const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const links = await prisma.notification.findMany({
    select: { link: true }
  });
  console.log("Unique notification links:");
  const uniqueLinks = [...new Set(links.map(l => l.link))];
  console.log(JSON.stringify(uniqueLinks, null, 2));
}

main().finally(() => prisma.$disconnect());
