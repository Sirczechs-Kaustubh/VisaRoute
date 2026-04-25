require("dotenv").config({ path: ".env.production" });
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  
  const configs = await prisma.scraperConfig.findMany({
    where: { isActive: true }
  });
  
  console.log(JSON.stringify(configs, null, 2));
  
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});