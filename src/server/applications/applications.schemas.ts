import { z } from "zod";

const nullableTrimmedString = z.string().trim().min(1).nullable().optional();
const nullableDateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date value")
  .nullable()
  .optional();

export const createApplicationSchema = z.object({
  countrySlug: z.string().trim().min(1),
});

export const applicantProfileSchema = z
  .object({
    firstName: nullableTrimmedString,
    lastName: nullableTrimmedString,
    email: z.string().trim().email().nullable().optional(),
    phoneNumber: nullableTrimmedString,
    countryOfResidence: nullableTrimmedString,
    purposeOfTravel: nullableTrimmedString,
    travelStartDate: nullableDateString,
    travelEndDate: nullableDateString,
  })
  .strict();

export const travelPlanSchema = z
  .object({
    accommodationType: nullableTrimmedString,
    entryCity: nullableTrimmedString,
    multiCountryMode: nullableTrimmedString,
    otherSchengenCountries: z.string().trim().max(2000).nullable().optional(),
    nightsInVisaDestination: z.number().int().min(0).max(365).nullable().optional(),
    schengenFirstEntryDate: z.string().trim().max(32).nullable().optional(),
  })
  .strict();

export const companionGroupSchema = z
  .object({
    travellingWithCompanions: nullableTrimmedString,
    companionsCount: z.number().int().min(0).max(20).nullable().optional(),
    companionMembers: z
      .array(
        z
          .object({
            name: nullableTrimmedString,
            relationship: nullableTrimmedString,
            passportNumber: nullableTrimmedString,
          })
          .strict(),
      )
      .max(20)
      .optional(),
  })
  .strict();

export const employmentProfileSchema = z
  .object({
    employmentStatus: nullableTrimmedString,
  })
  .strict();

export const visaHistoryEntrySchema = z
  .object({
    countryName: nullableTrimmedString,
    yearLabel: nullableTrimmedString,
  })
  .strict();

export const refusalHistoryEntrySchema = z
  .object({
    countryName: nullableTrimmedString,
    yearLabel: nullableTrimmedString,
    visaTypeLabel: nullableTrimmedString,
    reason: nullableTrimmedString,
  })
  .strict();

export const updateApplicationSchema = z
  .object({
    currentStep: z.number().int().min(1).max(13).optional(),
    applyingFromCountry: z.string().trim().min(1).nullable().optional(),
    applicantProfile: applicantProfileSchema.optional(),
    travelPlan: travelPlanSchema.optional(),
    companionGroup: companionGroupSchema.optional(),
    employmentProfile: employmentProfileSchema.optional(),
    visaHistoryEntries: z.array(visaHistoryEntrySchema).optional(),
    refusalHistoryEntries: z.array(refusalHistoryEntrySchema).optional(),
  })
  .strict();
