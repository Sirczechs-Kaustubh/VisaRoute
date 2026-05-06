import type { Prisma } from "@prisma/client";
import { ApiError } from "@/server/shared/errors";
import { generateDraftToken } from "@/server/shared/tokens";
import { getStorage } from "@/server/documents/storage";
import { ApplicationsRepository } from "./applications.repository";

type DraftApplicationRecord = NonNullable<
  Awaited<ReturnType<ApplicationsRepository["findByDraftToken"]>>
>;

function toDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function compactRows<T extends Record<string, string | null | undefined>>(rows: T[]) {
  return rows.filter((row) =>
    Object.values(row).some((value) => typeof value === "string" && value.trim().length > 0),
  );
}

function mergePartialSection<T extends Record<string, unknown>>(existing: T | null | undefined, incoming: Partial<T>) {
  const merged = { ...(existing ?? {}) } as Record<string, unknown>;

  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged as T;
}

function mergeRowsByIndex<T extends Record<string, string | null | undefined>>(
  existingRows: T[],
  incomingRows: T[],
) {
  if (incomingRows.length === 0) {
    return [];
  }

  const mergedRows = [...existingRows];

  incomingRows.forEach((incomingRow, index) => {
    mergedRows[index] = mergePartialSection(mergedRows[index], incomingRow);
  });

  return compactRows(mergedRows);
}

function calculateTripLengthDays(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return null;
  }

  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function mapApplication(application: Awaited<ReturnType<ApplicationsRepository["findByDraftToken"]>>) {
  if (!application) {
    return null;
  }

  const storage = getStorage();
  const documents = (application.documents ?? [])
    .filter((doc) => doc.uploadStatus !== "DELETED")
    .map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      originalFileName: doc.originalFileName,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      uploadStatus: doc.uploadStatus,
      url: storage.getUrl(doc.storageKey),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

  return {
    id: application.id,
    draftToken: application.draftToken,
    status: application.status,
    operationalStatus: application.operationalStatus,
    currentStep: application.currentStep,
    completionPercent: application.completionPercent,
    applyingFromCountry: application.applyingFromCountry,
    submittedAt: application.submittedAt,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    country: {
      id: application.country.id,
      slug: application.country.slug,
      name: application.country.name,
      code: application.country.code,
      visaFeeEur: application.country.visaFeeEur,
      serviceFeeEur: application.country.serviceFeeEur,
    },
    applicantProfile: application.applicantProfile,
    travelPlan: application.travelPlan,
    companionGroup: application.companionGroup,
    employmentProfile: application.employmentProfile,
    visaHistoryEntries: application.visaHistoryEntries,
    refusalHistoryEntries: application.refusalHistoryEntries,
    documents,
  };
}

function calculateCompletionPercent(application: {
  applicantProfile: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    countryOfResidence?: string | null;
    purposeOfTravel?: string | null;
    travelStartDate?: Date | string | null;
    travelEndDate?: Date | string | null;
  } | null;
  travelPlan: {
    accommodationType?: string | null;
    entryCity?: string | null;
    multiCountryMode?: string | null;
    otherSchengenCountries?: string | null;
    nightsInVisaDestination?: number | null;
    schengenFirstEntryDate?: string | null;
  } | null;
  companionGroup: {
    travellingWithCompanions?: string | null;
  } | null;
  employmentProfile: {
    employmentStatus?: string | null;
  } | null;
  visaHistoryEntries: { countryName?: string | null; yearLabel?: string | null }[];
  refusalHistoryEntries: { countryName?: string | null; yearLabel?: string | null }[];
}) {
  let completedSteps = 0;

  if (
    application.applicantProfile?.firstName &&
    application.applicantProfile?.lastName &&
    application.applicantProfile?.email &&
    application.applicantProfile?.countryOfResidence &&
    application.applicantProfile?.purposeOfTravel &&
    application.applicantProfile?.travelStartDate &&
    application.applicantProfile?.travelEndDate
  ) {
    completedSteps += 1;
  }

  const tp = application.travelPlan;
  const multiOk =
    tp?.multiCountryMode !== "yes" ||
    (Boolean(tp?.otherSchengenCountries?.trim()) &&
      typeof tp?.nightsInVisaDestination === "number" &&
      tp.nightsInVisaDestination > 0 &&
      Boolean(tp?.schengenFirstEntryDate?.trim()));
  if (tp?.accommodationType && tp?.entryCity && tp?.multiCountryMode && multiOk) {
    completedSteps += 1;
  }

  if (application.companionGroup?.travellingWithCompanions) {
    completedSteps += 1;
  }

  if (application.employmentProfile?.employmentStatus) {
    completedSteps += 1;
  }

  if (application.visaHistoryEntries.length > 0) {
    completedSteps += 1;
  }

  if (application.refusalHistoryEntries.length > 0) {
    completedSteps += 1;
  }

  return Math.round((completedSteps / 13) * 100);
}

function toApplicantProfileInput(
  applicantProfile: DraftApplicationRecord["applicantProfile"],
) {
  if (!applicantProfile) {
    return null;
  }

  return {
    firstName: applicantProfile.firstName,
    lastName: applicantProfile.lastName,
    email: applicantProfile.email,
    phoneNumber: applicantProfile.phoneNumber,
    countryOfResidence: applicantProfile.countryOfResidence,
    purposeOfTravel: applicantProfile.purposeOfTravel,
    travelStartDate: applicantProfile.travelStartDate?.toISOString() ?? null,
    travelEndDate: applicantProfile.travelEndDate?.toISOString() ?? null,
  };
}

function toTravelPlanInput(
  travelPlan: DraftApplicationRecord["travelPlan"],
) {
  if (!travelPlan) {
    return null;
  }

  return {
    accommodationType: travelPlan.accommodationType,
    entryCity: travelPlan.entryCity,
    multiCountryMode: travelPlan.multiCountryMode,
    otherSchengenCountries: travelPlan.otherSchengenCountries ?? null,
    nightsInVisaDestination: travelPlan.nightsInVisaDestination ?? null,
    schengenFirstEntryDate: travelPlan.schengenFirstEntryDate ?? null,
  };
}

function toCompanionGroupInput(
  companionGroup: DraftApplicationRecord["companionGroup"],
) {
  if (!companionGroup) {
    return null;
  }

  return {
    travellingWithCompanions: companionGroup.travellingWithCompanions,
    companionsCount: companionGroup.companionsCount,
    companionMembers: [] as { name?: string | null; relationship?: string | null; passportNumber?: string | null }[],
  };
}

function toEmploymentProfileInput(
  employmentProfile: DraftApplicationRecord["employmentProfile"],
) {
  if (!employmentProfile) {
    return null;
  }

  return {
    employmentStatus: employmentProfile.employmentStatus,
  };
}

function toVisaHistoryInput(
  rows: DraftApplicationRecord["visaHistoryEntries"],
) {
  return rows.map((row) => ({
    countryName: row.countryName,
    yearLabel: row.yearLabel,
  }));
}

function toRefusalHistoryInput(
  rows: DraftApplicationRecord["refusalHistoryEntries"],
) {
  return rows.map((row) => ({
    countryName: row.countryName,
    yearLabel: row.yearLabel,
    visaTypeLabel: row.visaTypeLabel,
    reason: row.reason,
  }));
}

export class ApplicationsService {
  constructor(private readonly repository = new ApplicationsRepository()) {}

  async createApplicationDraft(countrySlug: string, userId?: string | null) {
    const country = await this.repository.findCountryBySlug(countrySlug);

    if (!country) {
      throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
    }

    const createdApplication = await this.repository.createDraft({
      countryId: country.id,
      draftToken: generateDraftToken(),
      userId: userId ?? undefined,
    });

    return mapApplication({
      ...createdApplication,
      applicantProfile: null,
      travelPlan: null,
      companionGroup: null,
      employmentProfile: null,
      visaHistoryEntries: [],
      refusalHistoryEntries: [],
      documents: [],
    });
  }

  async getApplicationDraft(draftToken: string) {
    const application = await this.repository.findByDraftToken(draftToken);

    if (!application) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    return mapApplication(application);
  }

  async updateApplicationDraft(
    draftToken: string,
    input: {
      currentStep?: number;
      applyingFromCountry?: string | null;
      applicantProfile?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
        countryOfResidence?: string | null;
        purposeOfTravel?: string | null;
        travelStartDate?: string | null;
        travelEndDate?: string | null;
      };
      travelPlan?: {
        accommodationType?: string | null;
        entryCity?: string | null;
        multiCountryMode?: string | null;
        otherSchengenCountries?: string | null;
        nightsInVisaDestination?: number | null;
        schengenFirstEntryDate?: string | null;
      };
      companionGroup?: {
        travellingWithCompanions?: string | null;
        companionsCount?: number | null;
        companionMembers?: {
          name?: string | null;
          relationship?: string | null;
          passportNumber?: string | null;
        }[];
      };
      employmentProfile?: {
        employmentStatus?: string | null;
      };
      visaHistoryEntries?: {
        countryName?: string | null;
        yearLabel?: string | null;
      }[];
      refusalHistoryEntries?: {
        countryName?: string | null;
        yearLabel?: string | null;
        visaTypeLabel?: string | null;
        reason?: string | null;
      }[];
    },
  ) {
    const existingApplication = await this.repository.findByDraftToken(draftToken);

    if (!existingApplication) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const nextStep = input.currentStep ?? existingApplication.currentStep;
    const existingApplicantProfile = toApplicantProfileInput(existingApplication.applicantProfile);
    const existingTravelPlan = toTravelPlanInput(existingApplication.travelPlan);
    const existingCompanionGroup = toCompanionGroupInput(existingApplication.companionGroup);
    const existingEmploymentProfile = toEmploymentProfileInput(existingApplication.employmentProfile);
    const existingVisaHistoryEntries = toVisaHistoryInput(existingApplication.visaHistoryEntries);
    const existingRefusalHistoryEntries = toRefusalHistoryInput(existingApplication.refusalHistoryEntries);
    const mergedApplicantProfile = input.applicantProfile
      ? mergePartialSection(existingApplicantProfile, input.applicantProfile)
      : existingApplicantProfile;
    const mergedTravelPlan = input.travelPlan
      ? mergePartialSection(existingTravelPlan, input.travelPlan)
      : existingTravelPlan;
    const mergedCompanionGroup = input.companionGroup
      ? mergePartialSection(existingCompanionGroup, input.companionGroup)
      : existingCompanionGroup;
    const mergedEmploymentProfile = input.employmentProfile
      ? mergePartialSection(existingEmploymentProfile, input.employmentProfile)
      : existingEmploymentProfile;
    const mergedVisaHistoryEntries = input.visaHistoryEntries
      ? mergeRowsByIndex(existingVisaHistoryEntries, input.visaHistoryEntries)
      : existingVisaHistoryEntries;
    const mergedRefusalHistoryEntries = input.refusalHistoryEntries
      ? mergeRowsByIndex(existingRefusalHistoryEntries, input.refusalHistoryEntries)
      : existingRefusalHistoryEntries;

    const completionPercent = calculateCompletionPercent({
      applicantProfile: mergedApplicantProfile,
      travelPlan: mergedTravelPlan,
      companionGroup: mergedCompanionGroup,
      employmentProfile: mergedEmploymentProfile,
      visaHistoryEntries: mergedVisaHistoryEntries,
      refusalHistoryEntries: mergedRefusalHistoryEntries,
    });

    const updateData: Prisma.ApplicationUpdateInput = {
      currentStep: nextStep,
      completionPercent,
      status: completionPercent > 0 ? "IN_PROGRESS" : "DRAFT",
    };

    if (input.applyingFromCountry !== undefined) {
      updateData.applyingFromCountry = input.applyingFromCountry;
    }

    if (input.applicantProfile) {
      updateData.applicantProfile = {
        upsert: {
          create: {
            firstName: mergedApplicantProfile?.firstName ?? null,
            lastName: mergedApplicantProfile?.lastName ?? null,
            email:
              typeof mergedApplicantProfile?.email === "string"
                ? mergedApplicantProfile.email.toLowerCase()
                : null,
            phoneNumber: mergedApplicantProfile?.phoneNumber ?? null,
            countryOfResidence: mergedApplicantProfile?.countryOfResidence ?? null,
            purposeOfTravel: mergedApplicantProfile?.purposeOfTravel ?? null,
            travelStartDate: toDate(mergedApplicantProfile?.travelStartDate as string | null | undefined),
            travelEndDate: toDate(mergedApplicantProfile?.travelEndDate as string | null | undefined),
          },
          update: {
            firstName: mergedApplicantProfile?.firstName ?? null,
            lastName: mergedApplicantProfile?.lastName ?? null,
            email:
              typeof mergedApplicantProfile?.email === "string"
                ? mergedApplicantProfile.email.toLowerCase()
                : null,
            phoneNumber: mergedApplicantProfile?.phoneNumber ?? null,
            countryOfResidence: mergedApplicantProfile?.countryOfResidence ?? null,
            purposeOfTravel: mergedApplicantProfile?.purposeOfTravel ?? null,
            travelStartDate: toDate(mergedApplicantProfile?.travelStartDate as string | null | undefined),
            travelEndDate: toDate(mergedApplicantProfile?.travelEndDate as string | null | undefined),
          },
        },
      };
    }

    if (input.travelPlan || (input.applicantProfile && existingApplication.travelPlan)) {
      const profileStartDate = mergedApplicantProfile?.travelStartDate ?? null;
      const profileEndDate = mergedApplicantProfile?.travelEndDate ?? null;

      updateData.travelPlan = {
        upsert: {
          create: {
            accommodationType: mergedTravelPlan?.accommodationType ?? null,
            entryCity: mergedTravelPlan?.entryCity ?? null,
            multiCountryMode: mergedTravelPlan?.multiCountryMode ?? null,
            otherSchengenCountries: mergedTravelPlan?.otherSchengenCountries ?? null,
            nightsInVisaDestination: mergedTravelPlan?.nightsInVisaDestination ?? null,
            schengenFirstEntryDate: mergedTravelPlan?.schengenFirstEntryDate ?? null,
            tripLengthDays: calculateTripLengthDays(profileStartDate, profileEndDate),
          },
          update: {
            accommodationType: mergedTravelPlan?.accommodationType ?? null,
            entryCity: mergedTravelPlan?.entryCity ?? null,
            multiCountryMode: mergedTravelPlan?.multiCountryMode ?? null,
            otherSchengenCountries: mergedTravelPlan?.otherSchengenCountries ?? null,
            nightsInVisaDestination: mergedTravelPlan?.nightsInVisaDestination ?? null,
            schengenFirstEntryDate: mergedTravelPlan?.schengenFirstEntryDate ?? null,
            tripLengthDays: calculateTripLengthDays(profileStartDate, profileEndDate),
          },
        },
      };
    }

    if (input.companionGroup) {
      updateData.companionGroup = {
        upsert: {
          create: {
            travellingWithCompanions: mergedCompanionGroup?.travellingWithCompanions ?? null,
            companionsCount: mergedCompanionGroup?.companionsCount ?? null,
          },
          update: {
            travellingWithCompanions: mergedCompanionGroup?.travellingWithCompanions ?? null,
            companionsCount: mergedCompanionGroup?.companionsCount ?? null,
          },
        },
      };
    }

    if (input.employmentProfile) {
      updateData.employmentProfile = {
        upsert: {
          create: {
            employmentStatus: mergedEmploymentProfile?.employmentStatus ?? null,
          },
          update: {
            employmentStatus: mergedEmploymentProfile?.employmentStatus ?? null,
          },
        },
      };
    }

    if (input.visaHistoryEntries) {
      updateData.visaHistoryEntries = {
        deleteMany: {},
        create: mergedVisaHistoryEntries.map((row, index) => ({
          countryName: row.countryName ?? null,
          yearLabel: row.yearLabel ?? null,
          sortOrder: index + 1,
        })),
      };
    }

    if (input.refusalHistoryEntries) {
      updateData.refusalHistoryEntries = {
        deleteMany: {},
        create: mergedRefusalHistoryEntries.map((row, index) => ({
          countryName: row.countryName ?? null,
          yearLabel: row.yearLabel ?? null,
          visaTypeLabel: row.visaTypeLabel ?? null,
          reason: row.reason ?? null,
          sortOrder: index + 1,
        })),
      };
    }

    const updatedApplication = await this.repository.updateDraft(draftToken, updateData);

    return mapApplication(updatedApplication);
  }

  async linkDraftToUser(draftToken: string, userId: string) {
    const existingApplication = await this.repository.findByDraftToken(draftToken);

    if (!existingApplication) {
      throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application draft not found");
    }

    const updatedApplication = await this.repository.updateDraft(draftToken, {
      userId,
    });

    return mapApplication(updatedApplication);
  }
}
