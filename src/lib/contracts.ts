export interface CountrySummary {
  id: string;
  slug: string;
  name: string;
  code: string;
  region: string;
  countryGroupCode: string;
  visaFeeEur: number;
  serviceFeeEur: number;
  ourServiceFeeEur: number;
  processingDaysMin: number;
  processingDaysMax: number;
  appointmentLeadWeeks: number;
  cardImageUrl: string | null;
  heroImageUrl: string | null;
  visaStayLimitDays: number | null;
  entryTypeDefault: string | null;
  /** Always at least 95 when returned from the countries API. */
  approvalRatePercent: number;
}

export interface CountryDetail extends CountrySummary {
  visaProfile: {
    visaStayLimitDays: number;
    entryTypeDefault: string;
    approvalRatePercent: number;
    overviewText: string;
    importantNotes: string | null;
    disclaimerText: string | null;
  } | null;
  processSteps: {
    id: string;
    code: string;
    title: string;
    description: string;
    sortOrder: number;
  }[];
  rejectionReasons: {
    id: string;
    code: string;
    title: string;
    description: string;
    sortOrder: number;
  }[];
}

export interface VisaTypeOption {
  id: string;
  code: string;
  label: string;
  category: string;
}

export interface DocumentRequirementResponse {
  country: {
    id: string;
    slug: string;
    name: string;
  };
  filters: {
    visaType: string | null;
    nationalityCategory: string | null;
    countryOfResidence: string | null;
    purposeOfTravel: string | null;
  };
  requirements: {
    id: string;
    code: string;
    name: string;
    description: string;
    required: boolean;
    nationalityCategory: string;
    visaType: {
      code: string;
      label: string;
    } | null;
  }[];
}

export interface PassportExtraction {
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  passportNumber: string | null;
  expiryDate: string | null;
  issuingCountry: string | null;
}

export interface ApplicationDocument {
  id: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadStatus: string;
  extractionStatus?: string;
  url: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ApplicationDraft {
  id: string;
  draftToken: string;
  status: string;
  operationalStatus: string;
  currentStep: number;
  completionPercent: number;
  applyingFromCountry: string | null;
  submittedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  country: {
    id: string;
    slug: string;
    name: string;
    code: string;
    visaFeeEur: number;
    serviceFeeEur: number;
  };
  applicantProfile: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phoneNumber: string | null;
    countryOfResidence: string | null;
    purposeOfTravel: string | null;
    travelStartDate: string | Date | null;
    travelEndDate: string | Date | null;
  } | null;
  travelPlan: {
    accommodationType: string | null;
    entryCity: string | null;
    multiCountryMode: string | null;
    otherSchengenCountries?: string | null;
    nightsInVisaDestination?: number | null;
    schengenFirstEntryDate?: string | null;
    tripLengthDays?: number | null;
  } | null;
  companionGroup: {
    travellingWithCompanions: string | null;
    companionsCount: number | null;
  } | null;
  employmentProfile: {
    employmentStatus: string | null;
  } | null;
  visaHistoryEntries: {
    countryName: string | null;
    yearLabel: string | null;
  }[];
  refusalHistoryEntries: {
    countryName: string | null;
    yearLabel: string | null;
    visaTypeLabel: string | null;
    reason: string | null;
  }[];
  documents: ApplicationDocument[];
}
