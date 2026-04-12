import { db } from "@/db/client";
import { ScraperProvider, ScraperRunStatus } from "@prisma/client";
import type { AppointmentSlot } from "./providers/base";

export class ScraperRepository {
  async getConfig(configId: string) {
    return db.scraperConfig.findUnique({
      where: { id: configId },
    });
  }

  async getDueConfigs() {
    const now = new Date();
    const configs = await db.scraperConfig.findMany({
      where: { isActive: true },
      orderBy: { lastCheckedAt: "asc" },
    });

    return configs.filter((c) => {
      if (!c.lastCheckedAt) return true;
      const nextCheck = new Date(c.lastCheckedAt.getTime() + c.checkIntervalMin * 60 * 1000);
      return now >= nextCheck;
    });
  }

  async getLatestSnapshot(configId: string) {
    return db.appointmentAvailabilitySnapshot.findFirst({
      where: { scraperConfigId: configId },
      orderBy: { checkedAt: "desc" },
    });
  }

  async saveSnapshot(params: {
    configId: string;
    countryId: string;
    provider: ScraperProvider;
    city: string;
    slots: AppointmentSlot[];
    rawPayload?: string;
  }) {
    const hasSlots = params.slots.length > 0;
    const firstDate = params.slots[0]?.date ? new Date(params.slots[0].date) : null;
    const nextAvailableDate = firstDate && !isNaN(firstDate.getTime()) ? firstDate : null;

    return db.appointmentAvailabilitySnapshot.create({
      data: {
        countryId: params.countryId,
        scraperConfigId: params.configId,
        provider: params.provider.toLowerCase(),
        city: params.city,
        status: hasSlots ? "available" : "unavailable",
        slotsCount: params.slots.length,
        nextAvailableDate,
        checkedAt: new Date(),
        rawPayload: params.rawPayload ? params.rawPayload.slice(0, 5000) : null,
      },
    });
  }

  async updateLastChecked(configId: string) {
    return db.scraperConfig.update({
      where: { id: configId },
      data: { lastCheckedAt: new Date() },
    });
  }

  async logRun(params: {
    configId: string;
    status: ScraperRunStatus;
    slotsFound: number;
    durationMs: number;
    rawPayload?: string;
    errorMessage?: string;
  }) {
    return db.scraperRun.create({
      data: {
        configId: params.configId,
        status: params.status,
        slotsFound: params.slotsFound,
        durationMs: params.durationMs,
        rawPayload: params.rawPayload?.slice(0, 2000) ?? null,
        errorMessage: params.errorMessage ?? null,
      },
    });
  }
}
