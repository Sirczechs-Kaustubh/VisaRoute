import { ApiError } from "@/server/shared/errors";
import { RulesRepository, type DocumentRequirementFilters } from "./rules.repository";

const NATIONALITY_CATEGORY_MAP = {
  "visa-required": "VISA_REQUIRED",
  "visa-exempt": "VISA_EXEMPT",
  all: "ALL",
} as const;

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
