import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create Admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@oops.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@oops.local",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (password: admin123)`);

  // Create Reporter user
  const reporterPassword = await hash("reporter123", 12);
  const reporter = await prisma.user.upsert({
    where: { email: "reporter@oops.local" },
    update: {},
    create: {
      name: "Reporter",
      email: "reporter@oops.local",
      passwordHash: reporterPassword,
      role: "REPORTER",
    },
  });
  console.log(`✅ Reporter user created: ${reporter.email} (password: reporter123)`);

  // Create sample projects
  const project1 = await prisma.project.upsert({
    where: { name: "Website" },
    update: {},
    create: {
      name: "Website",
      description: "Main company website",
    },
  });

  const project2 = await prisma.project.upsert({
    where: { name: "Mobile App" },
    update: {},
    create: {
      name: "Mobile App",
      description: "iOS and Android mobile application",
    },
  });

  const project3 = await prisma.project.upsert({
    where: { name: "API Gateway" },
    update: {},
    create: {
      name: "API Gateway",
      description: "Backend API services",
    },
  });

  console.log(`✅ Projects created: ${project1.name}, ${project2.name}, ${project3.name}`);

  // Create sample issues
  const sampleIssues = [
    {
      title: "Homepage loads slowly on mobile",
      description: "The homepage takes over 5 seconds to load on mobile devices. Lighthouse score is below 40 for performance.",
      severity: "HIGH",
      category: "PERFORMANCE",
      status: "OPEN",
      projectId: project1.id,
      reporterId: reporter.id,
    },
    {
      title: "Login button not visible on Safari",
      description: "The login button disappears on Safari 17.x. Likely a CSS compatibility issue.",
      severity: "CRITICAL",
      category: "BUG",
      status: "ACTIONED",
      projectId: project1.id,
      reporterId: reporter.id,
    },
    {
      title: "Add dark mode support",
      description: "Users have requested a dark mode toggle. Should follow system preferences by default.",
      severity: "MEDIUM",
      category: "FEATURE",
      status: "OPEN",
      projectId: project1.id,
      reporterId: admin.id,
    },
    {
      title: "App crashes on Android 13 during photo upload",
      description: "When uploading photos from the gallery, the app crashes with a null pointer exception on Android 13 devices.",
      severity: "CRITICAL",
      category: "BUG",
      status: "OPEN",
      projectId: project2.id,
      reporterId: reporter.id,
    },
    {
      title: "Push notifications not received on iOS",
      description: "Users report that push notifications are not being delivered on iOS 17+.",
      severity: "HIGH",
      category: "BUG",
      status: "ACTIONED",
      projectId: project2.id,
      reporterId: admin.id,
    },
    {
      title: "Rate limiting returns incorrect error codes",
      description: "The API returns 500 instead of 429 when rate limited.",
      severity: "MEDIUM",
      category: "SECURITY",
      status: "DONE",
      projectId: project3.id,
      reporterId: reporter.id,
    },
    {
      title: "Improve API documentation",
      description: "OpenAPI spec is outdated. Need to regenerate and add examples for all endpoints.",
      severity: "LOW",
      category: "OTHER",
      status: "OPEN",
      projectId: project3.id,
      reporterId: admin.id,
    },
  ];

  for (const issue of sampleIssues) {
    await prisma.issue.create({ data: issue });
  }

  console.log(`✅ ${sampleIssues.length} sample issues created`);
  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin:    admin@oops.local / admin123");
  console.log("   Reporter: reporter@oops.local / reporter123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
