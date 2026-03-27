// Seed initial scraper configs for UK-based applicants (MVP routes)
// Usage: node scripts/seed-scrapers.js

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const CONFIGS = [
  {
    provider: "TLSCONTACT",
    countrySlug: "france",
    residenceCountry: "gb",
    city: "London",
    targetUrl: "https://fr.tlscontact.com/gb/LON/page.php?pid=appointment",
    selectors: JSON.stringify([{ selector: ".dispo" }, { selector: ".calendar-day" }]),
    useAIExtraction: false,
    checkIntervalMin: 30,
  },
  {
    provider: "TLSCONTACT",
    countrySlug: "germany",
    residenceCountry: "gb",
    city: "London",
    targetUrl: "https://de.tlscontact.com/gb/LON/page.php?pid=appointment",
    selectors: JSON.stringify([{ selector: ".dispo" }, { selector: ".calendar-day" }]),
    useAIExtraction: false,
    checkIntervalMin: 30,
  },
  {
    provider: "VFS_GLOBAL",
    countrySlug: "italy",
    residenceCountry: "gb",
    city: "London",
    targetUrl: "https://visa.vfsglobal.com/gbr/en/ita/",
    selectors: null,
    useAIExtraction: true,
    checkIntervalMin: 30,
  },
  {
    provider: "VFS_GLOBAL",
    countrySlug: "spain",
    residenceCountry: "gb",
    city: "London",
    targetUrl: "https://visa.vfsglobal.com/gbr/en/esp/",
    selectors: null,
    useAIExtraction: true,
    checkIntervalMin: 30,
  },
  {
    provider: "BLS",
    countrySlug: "spain",
    residenceCountry: "gb",
    city: "London",
    targetUrl: "https://blsspainuk.com/appointment/",
    selectors: JSON.stringify([{ selector: ".appointment-slot" }, { selector: ".available" }]),
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
