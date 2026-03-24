import { db } from "@/db/client";

export interface DocumentRequirementFilters {
  visaTypeCode?: string;
  nationalityCategory?: "VISA_REQUIRED" | "VISA_EXEMPT" | "ALL";
  countryOfResidence?: string;
  purposeOfTravel?: string;
}

export class RulesRepository {
  async findVisaTypes() {
    return db.visaType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findCountryBySlug(slug: string) {
    return db.country.findUnique({
      where: { slug },
    });
  }

  async findVisaTypeByCode(code: string) {
    return db.visaType.findUnique({
      where: { code },
    });
  }

  async findDocumentRequirements(countryId: string, filters: DocumentRequirementFilters) {
    return db.documentRequirement.findMany({
      where: {
        AND: [
          { isActive: true },
          { OR: [{ countryId: null }, { countryId }] },
          filters.visaTypeCode ? { visaType: { code: filters.visaTypeCode } } : {},
          filters.nationalityCategory
            ? {
                nationalityCategory:
                  filters.nationalityCategory === "VISA_REQUIRED"
                    ? { in: ["ALL", "VISA_REQUIRED"] }
                    : { in: ["ALL"] },
              }
            : {},
          filters.countryOfResidence
            ? {
                OR: [
                  { residenceCountryCode: null },
                  { residenceCountryCode: filters.countryOfResidence },
                ],
              }
            : {},
          filters.purposeOfTravel
            ? {
                OR: [{ purposeCode: null }, { purposeCode: filters.purposeOfTravel }],
              }
            : {},
        ],
      },
      include: {
        visaType: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }
}
