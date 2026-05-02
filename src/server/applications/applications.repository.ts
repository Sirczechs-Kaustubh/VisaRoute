import { db } from "@/db/client";
import type { Prisma } from "@prisma/client";

export class ApplicationsRepository {
  async findCountryBySlug(slug: string) {
    return db.country.findUnique({
      where: { slug },
    });
  }

  async createDraft(params: { countryId: string; draftToken: string; userId?: string }) {
    return db.application.create({
      data: {
        countryId: params.countryId,
        draftToken: params.draftToken,
        userId: params.userId,
      },
      include: {
        country: true,
      },
    });
  }

  async findByDraftToken(draftToken: string) {
    return db.application.findUnique({
      where: { draftToken },
      include: {
        country: true,
        applicantProfile: true,
        travelPlan: true,
        companionGroup: true,
        employmentProfile: true,
        visaHistoryEntries: {
          orderBy: { sortOrder: "asc" },
        },
        refusalHistoryEntries: {
          orderBy: { sortOrder: "asc" },
        },
        documents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async updateDraft(draftToken: string, data: Prisma.ApplicationUpdateInput) {
    return db.application.update({
      where: { draftToken },
      data,
      include: {
        country: true,
        applicantProfile: true,
        travelPlan: true,
        companionGroup: true,
        employmentProfile: true,
        visaHistoryEntries: {
          orderBy: { sortOrder: "asc" },
        },
        refusalHistoryEntries: {
          orderBy: { sortOrder: "asc" },
        },
        documents: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }
}
