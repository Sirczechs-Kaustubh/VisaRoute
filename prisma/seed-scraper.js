const { PrismaClient, ScraperProvider } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.DIRECT_URL,
    },
  },
});

const SCRAPER_CONFIGS = [
  {
    provider: ScraperProvider.TLSCONTACT,
    countrySlug: "france",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://fr.tlscontact.com/gb/LON/page.php?pid=appointment",
    checkIntervalMin: 15,
    isActive: true,
  },
  {
    provider: ScraperProvider.TLSCONTACT,
    countrySlug: "germany",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://de.tlscontact.com/gb/LON/page.php?pid=appointment",
    checkIntervalMin: 15,
    isActive: true,
  },
  {
    provider: ScraperProvider.VFS_GLOBAL,
    countrySlug: "italy",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://visa.vfsglobal.com/gbr/en/ita/",
    checkIntervalMin: 15,
    isActive: true,
  },
  {
    provider: ScraperProvider.VFS_GLOBAL,
    countrySlug: "spain",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://visa.vfsglobal.com/gbr/en/esp/",
    checkIntervalMin: 30,
    isActive: true,
  },
  {
    provider: ScraperProvider.BLS,
    countrySlug: "spain",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://blsspainvisa.com/uk/",
    checkIntervalMin: 30,
    isActive: true,
  },
  {
    provider: ScraperProvider.TLSCONTACT,
    countrySlug: "france",
    residenceCountry: "GB",
    city: "Manchester",
    targetUrl: "https://fr.tlscontact.com/gb/MAN/page.php?pid=appointment",
    checkIntervalMin: 15,
    isActive: true,
  },
  {
    provider: ScraperProvider.TLSCONTACT,
    countrySlug: "france",
    residenceCountry: "GB",
    city: "Edinburgh",
    targetUrl: "https://fr.tlscontact.com/gb/EDI/page.php?pid=appointment",
    checkIntervalMin: 15,
    isActive: true,
  },
  {
    provider: ScraperProvider.VFS_GLOBAL,
    countrySlug: "italy",
    residenceCountry: "GB",
    city: "Manchester",
    targetUrl: "https://visa.vfsglobal.com/gbr/en/ita/",
    checkIntervalMin: 15,
    isActive: true,
  },
  {
    provider: ScraperProvider.VFS_GLOBAL,
    countrySlug: "netherlands",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://visa.vfsglobal.com/gbr/en/nld/",
    checkIntervalMin: 30,
    isActive: true,
  },
  {
    provider: ScraperProvider.TLSCONTACT,
    countrySlug: "switzerland",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://ch.tlscontact.com/gb/LON/page.php?pid=appointment",
    checkIntervalMin: 30,
    isActive: true,
  },
  {
    provider: ScraperProvider.TLSCONTACT,
    countrySlug: "belgium",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://be.tlscontact.com/gb/LON/page.php?pid=appointment",
    checkIntervalMin: 30,
    isActive: true,
  },
  {
    provider: ScraperProvider.VFS_GLOBAL,
    countrySlug: "germany",
    residenceCountry: "GB",
    city: "London",
    targetUrl: "https://visa.vfsglobal.com/gbr/en/deu/",
    checkIntervalMin: 15,
    isActive: true,
  },
];

async function seedScraperConfigs() {
  console.log("\n=== Scraper Config Seed ===");

  try {
    // Check if countries exist
    const countryCount = await prisma.country.count();
    if (countryCount === 0) {
      console.log("ERROR: No countries found in database.");
      console.log("Please run the main seed script first: npm run db:seed");
      console.log("Exiting without seeding scraper configs.\n");
      return false;
    }

    console.log(`Found ${countryCount} countries in database. Proceeding with scraper config seed...`);

    // Check if scraper configs already exist
    const existingConfigCount = await prisma.scraperConfig.count();
    if (existingConfigCount > 0) {
      console.log(`Found ${existingConfigCount} existing scraper configs. Checking for updates...`);

      for (const config of SCRAPER_CONFIGS) {
        const existing = await prisma.scraperConfig.findFirst({
          where: {
            provider: config.provider,
            countrySlug: config.countrySlug,
            residenceCountry: config.residenceCountry,
            city: config.city,
          },
        });

        if (existing) {
          await prisma.scraperConfig.update({
            where: { id: existing.id },
            data: {
              targetUrl: config.targetUrl,
              checkIntervalMin: config.checkIntervalMin,
              isActive: config.isActive,
            },
          });
          console.log(`  Updated: ${config.provider} - ${config.countrySlug} (${config.city})`);
        } else {
          await prisma.scraperConfig.create({ data: config });
          console.log(`  Created: ${config.provider} - ${config.countrySlug} (${config.city})`);
        }
      }
    } else {
      console.log("No existing configs found. Creating all scraper configurations...");

      for (const config of SCRAPER_CONFIGS) {
        await prisma.scraperConfig.create({ data: config });
        console.log(`  Created: ${config.provider} - ${config.countrySlug} (${config.city})`);
      }
    }

    const finalCount = await prisma.scraperConfig.count();
    console.log(`\nSeed complete: ${finalCount} scraper configs in database.`);
    console.log("==========================\n");

    return true;
  } catch (error) {
    console.error("Seed error:", error.message);
    return false;
  }
}

seedScraperConfigs()
  .then(async (success) => {
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
  })
  .catch(async (error) => {
    console.error("Fatal error:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
