import { ApiError } from "@/server/shared/errors";
import { RulesRepository, type DocumentRequirementFilters } from "./rules.repository";

const NATIONALITY_CATEGORY_MAP = {
  "visa-required": "VISA_REQUIRED",
  "visa-exempt": "VISA_EXEMPT",
  all: "ALL",
} as const;

/** Visa types shown per destination group (Schengen keeps the short list only). */
const VISA_TYPE_CODES_BY_COUNTRY_GROUP: Record<string, string[]> = {
  schengen: ["schengen-tourism", "schengen-business", "schengen-family-friends"],
  uk: ["uk-visitor"],
  us: ["us-b1b2"],
  canada: ["canada-visitor"],
  australia: ["australia-visitor"],
};

export class RulesService {
  constructor(private readonly repository = new RulesRepository()) {}

  async listVisaTypes() {
    const visaTypes = await this.repository.findVisaTypes();

    return visaTypes.map((visaType) => ({
      id: visaType.id,
      code: visaType.code,
      label: visaType.label,
      category: visaType.category,
    }));
  }

  async listVisaTypesForCountryGroup(countryGroupCode: string) {
    const all = await this.repository.findVisaTypes();
    const allow = VISA_TYPE_CODES_BY_COUNTRY_GROUP[countryGroupCode];
    const filtered =
      allow?.length > 0
        ? [...all].filter((v) => allow.includes(v.code)).sort((a, b) => allow.indexOf(a.code) - allow.indexOf(b.code))
        : all;

    return filtered.map((visaType) => ({
      id: visaType.id,
      code: visaType.code,
      label: visaType.label,
      category: visaType.category,
    }));
  }

  async getDocumentRequirements(
    slug: string,
    filters: Omit<DocumentRequirementFilters, "nationalityCategory"> & { nationalityCategory?: string },
  ) {
    const country = await this.repository.findCountryBySlug(slug);

    if (!country) {
      throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
    }

    const normalizedFilters: DocumentRequirementFilters = {
      visaTypeCode: filters.visaTypeCode,
      nationalityCategory: filters.nationalityCategory
        ? NATIONALITY_CATEGORY_MAP[filters.nationalityCategory as keyof typeof NATIONALITY_CATEGORY_MAP]
        : undefined,
      countryOfResidence: filters.countryOfResidence?.toLowerCase(),
      purposeOfTravel: filters.purposeOfTravel,
    };

    if (normalizedFilters.visaTypeCode) {
      const visaType = await this.repository.findVisaTypeByCode(normalizedFilters.visaTypeCode);

      if (!visaType) {
        throw new ApiError(400, "INVALID_VISA_TYPE", "Visa type is invalid");
      }
    }

    const requirements = await this.repository.findDocumentRequirements(country.id, normalizedFilters);

    return {
      country: {
        id: country.id,
        slug: country.slug,
        name: country.name,
      },
      filters: {
        visaType: normalizedFilters.visaTypeCode ?? null,
        nationalityCategory: normalizedFilters.nationalityCategory ?? null,
        countryOfResidence: normalizedFilters.countryOfResidence ?? null,
        purposeOfTravel: normalizedFilters.purposeOfTravel ?? null,
      },
      requirements: requirements.map((requirement) => ({
        id: requirement.id,
        code: requirement.code,
        name: requirement.name,
        description: requirement.description,
        required: requirement.required,
        nationalityCategory: requirement.nationalityCategory,
        visaType: requirement.visaType
          ? {
              code: requirement.visaType.code,
              label: requirement.visaType.label,
            }
          : null,
      })),
    };
  }
}
