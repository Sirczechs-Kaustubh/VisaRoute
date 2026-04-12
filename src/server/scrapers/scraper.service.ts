import { ScraperRunStatus } from "@prisma/client";
import {
  scrapeTLSContactFrance,
  scrapeTLSContactGermany,
  scrapeVFSItaly,
  scrapeVFSSpain,
  scrapeBLSSpain,
  type ScrapeResult,
} from "./playwright-stealth";
import { TLScontactProvider } from "./providers/tlscontact";
import { VFSGlobalProvider } from "./providers/vfs-global";
import { BLSProvider } from "./providers/bls";
import { IDataProvider } from "./providers/idata";
import { isBlockedError, diffSlots } from "./providers/base";
import type { VisaProvider, AppointmentSlot } from "./providers/base";
import { ScraperRepository } from "./scraper.repository";
import { sendAppointmentAlert } from "./notification";
import { db } from "@/db/client";

const PROVIDERS: Record<string, VisaProvider> = {
  TLSCONTACT: TLScontactProvider,
  VFS_GLOBAL: VFSGlobalProvider,
  BLS: BLSProvider,
  IDATA: IDataProvider,
};

export type ScrapeFunction = () => Promise<ScrapeResult>;

const SCRAPE_FUNCTIONS: Record<string, ScrapeFunction> = {
  "tlscontact-france": scrapeTLSContactFrance,
  "tlscontact-germany": scrapeTLSContactGermany,
  "vfs-italy": scrapeVFSItaly,
  "vfs-spain": scrapeVFSSpain,
  "bls-spain": scrapeBLSSpain,
};

export class ScraperService {
  constructor(private readonly repo = new ScraperRepository()) {}

  async runScheduledChecks(): Promise<Array<{ configId: string; status: string }>> {
    const configs = await this.repo.getDueConfigs();
    const results: Array<{ configId: string; status: string }> = [];

    for (const config of configs) {
      const startTime = Date.now();
      let status: ScraperRunStatus = "SUCCESS";
      let slotsFound = 0;
      let rawPayload: string | undefined;
      let errorMessage: string | undefined;

      try {
        const scrapeKey = `${config.provider.toLowerCase()}-${config.countrySlug.toLowerCase()}`;
        const scrapeFn = SCRAPE_FUNCTIONS[scrapeKey];

        let slots: AppointmentSlot[] = [];

        if (scrapeFn) {
          const scrapeResult = await scrapeFn();
          slots = scrapeResult.slots;
        } else {
          throw new Error(`No scraper function found for: ${scrapeKey}`);
        }

        slotsFound = slots.length;

        const lastSnapshot = await this.repo.getLatestSnapshot(config.id);
        const previousSlots: AppointmentSlot[] = [];
        if (lastSnapshot?.rawPayload) {
          try {
            const prev = JSON.parse(lastSnapshot.rawPayload);
            if (Array.isArray(prev)) previousSlots.push(...prev);
          } catch {
            // stale or non-array payload — treat as empty
          }
        }

        const countryId = await this.getCountryId(config.countrySlug);
        await this.repo.saveSnapshot({
          configId: config.id,
          countryId,
          provider: config.provider,
          city: config.city,
          slots,
          rawPayload: JSON.stringify(slots),
        });

        const newSlots = diffSlots(previousSlots, slots);
        if (newSlots.length > 0) {
          await sendAppointmentAlert({
            configId: config.id,
            countryId,
            countrySlug: config.countrySlug,
            provider: config.provider.toLowerCase(),
            city: config.city,
            slots: newSlots,
          });
        }

        results.push({ configId: config.id, status: "SUCCESS" });
      } catch (err) {
        status = isBlockedError(err) ? "BLOCKED" : "FAILED";
        errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[ScraperService] ${config.provider}/${config.countrySlug}: ${errorMessage}`);
        results.push({ configId: config.id, status });
      } finally {
        await this.repo.logRun({
          configId: config.id,
          status,
          slotsFound,
          durationMs: Date.now() - startTime,
          rawPayload,
          errorMessage,
        });
        await this.repo.updateLastChecked(config.id);
      }
    }

    return results;
  }

  async scrapeNow(configId: string): Promise<ScrapeResult> {
    const config = await this.repo.getConfig(configId);
    if (!config) throw new Error(`Config not found: ${configId}`);

    const scrapeKey = `${config.provider.toLowerCase()}-${config.countrySlug.toLowerCase()}`;
    const scrapeFn = SCRAPE_FUNCTIONS[scrapeKey];

    if (!scrapeFn) {
      throw new Error(`No scraper function found for: ${scrapeKey}`);
    }

    return scrapeFn();
  }

  private countryIdCache = new Map<string, string>();

  private async getCountryId(slug: string): Promise<string> {
    if (this.countryIdCache.has(slug)) return this.countryIdCache.get(slug)!;
    const country = await db.country.findUnique({ where: { slug }, select: { id: true } });
    if (!country) throw new Error(`Country not found: ${slug}`);
    this.countryIdCache.set(slug, country.id);
    return country.id;
  }
}
