import { ScraperRunStatus } from "@prisma/client";
import { cfScrape, cfJsonExtract } from "./cloudflare-browser";
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
        // 1. Scrape via CF Browser Rendering
        const defaultSelectors = [
          { selector: ".appointment-slot" },
          { selector: ".dispo" },
          { selector: ".calendar-day" },
        ];
        const selectors = config.selectors ? JSON.parse(config.selectors) : defaultSelectors;

        const raw = config.useAIExtraction
          ? await cfJsonExtract(config.targetUrl)
          : await cfScrape(config.targetUrl, { selectors });

        rawPayload = JSON.stringify(raw).slice(0, 2000);

        // 2. Parse provider-specific response
        const provider = PROVIDERS[config.provider];
        if (!provider) throw new Error(`Unknown provider: ${config.provider}`);

        const slots: AppointmentSlot[] = provider.parseSlots(raw);
        slotsFound = slots.length;

        // 3. Get last snapshot slots for diff
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

        // 4. Save new snapshot (rawPayload stores slots JSON for next diff)
        const countryId = await this.getCountryId(config.countrySlug);
        await this.repo.saveSnapshot({
          configId: config.id,
          countryId,
          provider: config.provider,
          city: config.city,
          slots,
          rawPayload: JSON.stringify(slots),
        });

        // 5. Notify subscribers only for genuinely new slots
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

  private countryIdCache = new Map<string, string>();

  private async getCountryId(slug: string): Promise<string> {
    if (this.countryIdCache.has(slug)) return this.countryIdCache.get(slug)!;
    const country = await db.country.findUnique({ where: { slug }, select: { id: true } });
    if (!country) throw new Error(`Country not found: ${slug}`);
    this.countryIdCache.set(slug, country.id);
    return country.id;
  }
}
