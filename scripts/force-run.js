require("dotenv").config({ path: ".env.production" });
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  
  // Reset lastCheckedAt to force run
  await prisma.scraperConfig.updateMany({
    where: { isActive: true },
    data: { lastCheckedAt: new Date(0) }  // Unix epoch - always due
  });
  
  console.log("Reset lastCheckedAt for all active configs");
  
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});