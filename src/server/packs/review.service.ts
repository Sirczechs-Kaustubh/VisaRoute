import { db } from "@/db/client";
import { ApiError } from "@/server/shared/errors";

const PURPOSE_LABELS: Record<string, string> = {
  tourism: "Tourism", business: "Business", visiting: "Visiting family",
  study: "Study", medical: "Medical", transit: "Transit",
};

const ACCOMMODATION_LABELS: Record<string, string> = {
  hotel: "Hotel", airbnb: "Airbnb", friends: "With friends/family", hostel: "Hostel",
};

const RESIDENCE_LABELS: Record<string, string> = {
  gb: "United Kingdom", in: "India", us: "United States", ae: "UAE",
  ng: "Nigeria", pk: "Pakistan", bd: "Bangladesh", ph: "Philippines", za: "South Africa",
};

export class ReviewService {
  async getReview(draftToken: string) {
    const application = await db.application.findUnique({
      where: { draftToken },
      include: {
        country: true,
        applicantProfile: true,
        travelPlan: true,
        companionGroup: true,
        employmentProfile: true,
        visaHistoryEntries: { orderBy: { sortOrder: "asc" } },
        refusalHistoryEntries: { orderBy: { sortOrder: "asc" } },
        documents: { where: { uploadStatus: { not: "DELETED" } } },
        checkResults: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const ap = application.applicantProfile;
    const tp = application.travelPlan;
    const cg = application.companionGroup;
    const ep = application.employmentProfile;

    const formatDate = (d: Date | null | undefined) =>
      d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

    // Compute warnings
    const warnings: string[] = [];
    const failedChecks = application.checkResults.filter((c) => c.status === "fail");
    const warnChecks = application.checkResults.filter((c) => c.status === "warn");

    if (failedChecks.length > 0) {
      warnings.push(`${failedChecks.length} check(s) failed — review before submitting`);
    }
    if (warnChecks.length > 0) {
      warnings.push(`${warnChecks.length} warning(s) — consider addressing these`);
    }
    if (!ap?.firstName || !ap?.lastName) warnings.push("Name is incomplete");
    if (!ap?.email) warnings.push("Email is missing");
    if (application.documents.length === 0) warnings.push("No documents uploaded");

    return {
      applicationId: application.id,
      destination: application.country.name,
      applyingFrom: application.applyingFromCountry
        ? RESIDENCE_LABELS[application.applyingFromCountry] ?? application.applyingFromCountry
        : null,
      status: application.status,
      warnings,
      sections: {
        personal: {
          fullName: [ap?.firstName, ap?.lastName].filter(Boolean).join(" ") || null,
          email: ap?.email ?? null,
          phone: ap?.phoneNumber ?? null,
          countryOfResidence: ap?.countryOfResidence
            ? RESIDENCE_LABELS[ap.countryOfResidence] ?? ap.countryOfResidence
            : null,
          purpose: ap?.purposeOfTravel ? PURPOSE_LABELS[ap.purposeOfTravel] ?? ap.purposeOfTravel : null,
          travelStart: formatDate(ap?.travelStartDate),
          travelEnd: formatDate(ap?.travelEndDate),
          tripDays: tp?.tripLengthDays ?? null,
        },
        travel: {
          entryCity: tp?.entryCity ?? null,
          accommodation: tp?.accommodationType
            ? ACCOMMODATION_LABELS[tp.accommodationType] ?? tp.accommodationType
            : null,
          multiCountry: tp?.multiCountryMode ?? null,
        },
        companions: {
          travelling: cg?.travellingWithCompanions ?? null,
          count: cg?.companionsCount ?? 0,
        },
        employment: {
          status: ep?.employmentStatus ?? null,
        },
        visaHistory: application.visaHistoryEntries.map((e) => ({
          country: e.countryName, year: e.yearLabel,
        })),
        refusals: application.refusalHistoryEntries.map((e) => ({
          country: e.countryName, year: e.yearLabel,
          visaType: e.visaTypeLabel, reason: e.reason,
        })),
        documents: application.documents.map((d) => ({
          type: d.documentType,
          fileName: d.originalFileName,
          extractionStatus: d.extractionStatus,
        })),
        checks: {
          total: application.checkResults.length,
          passed: application.checkResults.filter((c) => c.status === "pass").length,
          warnings: warnChecks.length,
          failed: failedChecks.length,
        },
      },
    };
  }
}
