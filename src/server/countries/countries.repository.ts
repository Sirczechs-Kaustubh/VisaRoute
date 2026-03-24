import { db } from "@/db/client";
import { Prisma } from "@prisma/client";

export interface CountryListFilters {
  region?: string;
  search?: string;
  popularOnly?: boolean;
  appointmentLead?: "all" | "quick" | "standard";
}

const POPULAR_COUNTRY_SLUGS = ["france", "germany", "spain", "italy", "netherlands"];

export class CountriesRepository {
  async findMany(filters: CountryListFilters) {
    const where: Prisma.CountryWhereInput = {
      isActive: true,
    };

    if (filters.region) {
      where.region = filters.region as never;
    }

    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { code: { contains: search.toUpperCase() } },
      ];
    }

    if (filters.popularOnly) {
      where.slug = { in: POPULAR_COUNTRY_SLUGS };
    }

    if (filters.appointmentLead === "quick") {
      where.appointmentLeadWeeks = { lte: 4 };
    }

    if (filters.appointmentLead === "standard") {
      where.appointmentLeadWeeks = { gte: 5 };
    }

    return db.country.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        visaProfile: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return db.country.findUnique({
      where: { slug },
      include: {
        visaProfile: true,
      },
    });
  }

  async findGlobalProcessSteps() {
    return db.visaProcessStep.findMany({
      where: { countryId: null },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findGlobalRejectionReasons() {
    return db.rejectionReason.findMany({
      where: { countryId: null },
      orderBy: { sortOrder: "asc" },
    });
  }
}
