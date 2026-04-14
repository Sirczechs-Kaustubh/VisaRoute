// Seed initial scraper configs for UK-based applicants (MVP routes)
// Usage: node scripts/seed-scrapers.js

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const CONFIGS = [
  {
    provider: "VFS_GLOBAL",
    countrySlug: "switzerland",
    residenceCountry: "ind",
    city: "Delhi",
    targetUrl: "https://visa.vfsglobal.com/ind/en/che/login",
    selectors: null,
    useAIExtraction: false,
    checkIntervalMin: 30,
  },
];

async function main() {
  console.log("Seeding scraper configs...");

  for (const config of CONFIGS) {
    const result = await db.scraperConfig.upsert({
      where: {
        provider_countrySlug_residenceCountry_city: {
          provider: config.provider,
          countrySlug: config.countrySlug,
          residenceCountry: config.residenceCountry,
          city: config.city,
        },
      },
      update: {
        targetUrl: config.targetUrl,
        selectors: config.selectors ?? null,
        useAIExtraction: config.useAIExtraction,
        checkIntervalMin: config.checkIntervalMin,
        isActive: true,
      },
      create: config,
    });

    console.log(
      `  [${result.provider}] ${result.countrySlug}/${result.city} — ${result.id}`,
    );
  }

  console.log("\nDone. Run 'npx prisma db push' first if you haven't already.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
