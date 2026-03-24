export type CheckStatus = "pass" | "warn" | "fail";
export type CheckSeverity = "error" | "warning" | "info";

export interface CheckOutput {
  checkCode: string;
  status: CheckStatus;
  title: string;
  detail: string | null;
  subDetail: string | null;
  severity: CheckSeverity;
}

export interface RuleParams {
  /** Passport must be valid this many days beyond travel end (default 90 for Schengen) */
  passportExpiryBufferDays?: number;
  /** Maximum trip duration in days (default 90 for Schengen short-stay) */
  maxStayDays?: number;
  /** Document types that are required (e.g. ["passport"]) */
  requiredDocTypes?: string[];
  /** Document types that are recommended (e.g. ["travel_insurance", "bank_statement"]) */
  recommendedDocTypes?: string[];
  /** Whether residence document is required when applying from abroad */
  requireResidenceDoc?: boolean;
  /** Custom message for trip duration check */
  tripDurationLabel?: string;
  /** Custom message for passport expiry */
  passportExpiryLabel?: string;
  /** Any additional key-value params from the DB */
  [key: string]: unknown;
}

export interface CheckContext {
  application: {
    id: string;
    applyingFromCountry: string | null;
    countryGroupCode: string;
    applicantProfile: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phoneNumber: string | null;
      countryOfResidence: string | null;
      purposeOfTravel: string | null;
      travelStartDate: Date | null;
      travelEndDate: Date | null;
    } | null;
    travelPlan: {
      accommodationType: string | null;
      entryCity: string | null;
      multiCountryMode: string | null;
      tripLengthDays: number | null;
    } | null;
    companionGroup: {
      travellingWithCompanions: string | null;
      companionsCount: number | null;
    } | null;
    employmentProfile: {
      employmentStatus: string | null;
    } | null;
  };
  documents: {
    id: string;
    documentType: string;
    uploadStatus: string;
    extractionStatus: string;
    extractions: {
      normalizedPayload: string;
      confidence: number | null;
    }[];
  }[];
  requiredDocTypes: string[];
  /** Merged rule parameters from CheckRule records for this country group */
  ruleParams: Record<string, RuleParams>;
}

export type CheckFunction = (ctx: CheckContext) => CheckOutput;
