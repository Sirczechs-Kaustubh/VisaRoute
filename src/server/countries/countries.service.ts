import { normalizeApprovalRatePercent } from "@/lib/approval-rate";
import { ApiError } from "@/server/shared/errors";
import { CountriesRepository, type CountryListFilters } from "./countries.repository";

const REGION_MAP: Record<string, string> = {
  "Western Europe": "WESTERN_EUROPE",
  Nordic: "NORDIC",
  "Central/Eastern Europe": "CENTRAL_EASTERN_EUROPE",
  "Southern Europe": "SOUTHERN_EUROPE",
};

const REGION_LABELS: Record<string, string> = {
  WESTERN_EUROPE: "Western Europe",
  NORDIC: "Nordic",
  CENTRAL_EASTERN_EUROPE: "Central/Eastern Europe",
  SOUTHERN_EUROPE: "Southern Europe",
  BRITISH_ISLES: "British Isles",
  NORTH_AMERICA: "North America",
  OCEANIA: "Oceania",
  EAST_ASIA: "East Asia",
};

export class CountriesService {
  constructor(private readonly repository = new CountriesRepository()) {}

  async listCountries(filters: CountryListFilters) {
    const normalizedFilters = {
      ...filters,
      region: filters.region ? REGION_MAP[filters.region] ?? filters.region : undefined,
    };

    const countries = await this.repository.findMany(normalizedFilters);

    return countries.map((country) => ({
      id: country.id,
      slug: country.slug,
      name: country.name,
      code: country.code,
      region: REGION_LABELS[country.region],
      countryGroupCode: country.countryGroupCode,
      visaFeeEur: country.visaFeeEur,
      serviceFeeEur: country.serviceFeeEur,
      ourServiceFeeEur: country.serviceFeeEur,
      processingDaysMin: country.processingDaysMin,
      processingDaysMax: country.processingDaysMax,
      appointmentLeadWeeks: country.appointmentLeadWeeks,
      cardImageUrl: country.cardImageUrl,
      heroImageUrl: country.heroImageUrl,
      visaStayLimitDays: country.visaProfile?.visaStayLimitDays ?? null,
      entryTypeDefault: country.visaProfile?.entryTypeDefault ?? null,
      approvalRatePercent: normalizeApprovalRatePercent(country.visaProfile?.approvalRatePercent),
      visaProfile: country.visaProfile
        ? {
            visaStayLimitDays: country.visaProfile.visaStayLimitDays,
            entryTypeDefault: country.visaProfile.entryTypeDefault,
            approvalRatePercent: normalizeApprovalRatePercent(country.visaProfile.approvalRatePercent),
          }
        : null,
    }));
  }

  async getCountryBySlug(slug: string) {
    const country = await this.repository.findBySlug(slug);

    if (!country) {
      throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
    }

    const [processSteps, rejectionReasons] = await Promise.all([
      this.repository.findGlobalProcessSteps(),
      this.repository.findGlobalRejectionReasons(),
    ]);

    return {
      id: country.id,
      slug: country.slug,
      name: country.name,
      code: country.code,
      region: REGION_LABELS[country.region],
      countryGroupCode: country.countryGroupCode,
      visaFeeEur: country.visaFeeEur,
      serviceFeeEur: country.serviceFeeEur,
      ourServiceFeeEur: country.serviceFeeEur,
      processingDaysMin: country.processingDaysMin,
      processingDaysMax: country.processingDaysMax,
      appointmentLeadWeeks: country.appointmentLeadWeeks,
      cardImageUrl: country.cardImageUrl,
      heroImageUrl: country.heroImageUrl,
      visaStayLimitDays: country.visaProfile?.visaStayLimitDays ?? null,
      entryTypeDefault: country.visaProfile?.entryTypeDefault ?? null,
      approvalRatePercent: normalizeApprovalRatePercent(country.visaProfile?.approvalRatePercent),
      visaProfile: country.visaProfile
        ? {
            visaStayLimitDays: country.visaProfile.visaStayLimitDays,
            entryTypeDefault: country.visaProfile.entryTypeDefault,
            approvalRatePercent: normalizeApprovalRatePercent(country.visaProfile.approvalRatePercent),
            overviewText: country.visaProfile.overviewText,
            importantNotes: country.visaProfile.importantNotes,
            disclaimerText: country.visaProfile.disclaimerText,
          }
        : null,
      processSteps: processSteps.map((step) => ({
        id: step.id,
        code: step.code,
        title: step.title,
        description: step.description,
        sortOrder: step.sortOrder,
      })),
      rejectionReasons: rejectionReasons.map((reason) => ({
        id: reason.id,
        code: reason.code,
        title: reason.title,
        description: reason.description,
        sortOrder: reason.sortOrder,
      })),
    };
  }
}
