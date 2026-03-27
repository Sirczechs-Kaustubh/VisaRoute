import type { CheckContext, CheckFunction, CheckOutput } from "./checks.types";

/**
 * Check: All required personal info fields are filled.
 */
export const checkPersonalInfo: CheckFunction = (ctx) => {
  const p = ctx.application.applicantProfile;
  const missing: string[] = [];

  if (!p?.firstName) missing.push("first name");
  if (!p?.lastName) missing.push("last name");
  if (!p?.email) missing.push("email");
  if (!p?.countryOfResidence) missing.push("country of residence");
  if (!p?.purposeOfTravel) missing.push("travel purpose");
  if (!p?.travelStartDate) missing.push("travel start date");
  if (!p?.travelEndDate) missing.push("travel end date");

  if (missing.length === 0) {
    return { checkCode: "personal_info", status: "pass", title: "Personal information complete", detail: null, subDetail: null, severity: "error" };
  }
  return {
    checkCode: "personal_info",
    status: "fail",
    title: "Personal information incomplete",
    detail: `Missing: ${missing.join(", ")}`,
    subDetail: null,
    severity: "error",
  };
};

/**
 * Check: Travel dates are valid (start < end, in the future).
 */
export const checkTravelDates: CheckFunction = (ctx) => {
  const p = ctx.application.applicantProfile;
  if (!p?.travelStartDate || !p?.travelEndDate) {
    return { checkCode: "travel_dates", status: "fail", title: "Travel dates missing", detail: "Both start and end dates are required", subDetail: null, severity: "error" };
  }

  const start = new Date(p.travelStartDate);
  const end = new Date(p.travelEndDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (start >= end) {
    return { checkCode: "travel_dates", status: "fail", title: "Travel dates invalid", detail: "Start date must be before end date", subDetail: null, severity: "error" };
  }
  if (start < now) {
    return { checkCode: "travel_dates", status: "warn", title: "Travel start date is in the past", detail: "Your travel start date has already passed", subDetail: null, severity: "warning" };
  }
  return { checkCode: "travel_dates", status: "pass", title: "Travel dates valid", detail: null, subDetail: null, severity: "error" };
};

/**
 * Check: Passport uploaded.
 */
export const checkPassportPresent: CheckFunction = (ctx) => {
  const hasPassport = ctx.documents.some((d) => d.documentType === "passport" && d.uploadStatus !== "DELETED");
  if (hasPassport) {
    return { checkCode: "passport_present", status: "pass", title: "Passport uploaded", detail: null, subDetail: null, severity: "error" };
  }
  return { checkCode: "passport_present", status: "fail", title: "Passport not uploaded", detail: "Upload your passport photo page in Step 2", subDetail: null, severity: "error" };
};

/**
 * Check: Passport expiry > travel end + buffer.
 * Buffer is configurable per country group (default: 90 days for Schengen, 180 for others).
 */
export const checkPassportExpiry: CheckFunction = (ctx) => {
  const params = ctx.ruleParams["passport_expiry"] ?? {};
  const bufferDays = params.passportExpiryBufferDays ?? 90;
  const label = params.passportExpiryLabel ?? `${Math.round(bufferDays / 30)} months`;

  const passportDoc = ctx.documents.find((d) => d.documentType === "passport" && d.extractions.length > 0);
  if (!passportDoc) {
    return { checkCode: "passport_expiry", status: "warn", title: "Passport expiry not verified", detail: "Upload passport to verify expiry date", subDetail: null, severity: "warning" };
  }

  const extraction = passportDoc.extractions[0];
  let parsed: { expiryDate?: string | null } = {};
  try { parsed = JSON.parse(extraction.normalizedPayload); } catch { /* ignore */ }

  if (!parsed.expiryDate) {
    return { checkCode: "passport_expiry", status: "warn", title: "Passport expiry could not be extracted", detail: "Please verify your passport expiry manually", subDetail: null, severity: "warning" };
  }

  const travelEnd = ctx.application.applicantProfile?.travelEndDate;
  if (!travelEnd) {
    return { checkCode: "passport_expiry", status: "warn", title: "Cannot verify passport expiry without travel end date", detail: null, subDetail: null, severity: "warning" };
  }

  const expiry = new Date(parsed.expiryDate);
  const endDate = new Date(travelEnd);
  const bufferMs = bufferDays * 24 * 60 * 60 * 1000;

  if (expiry.getTime() - endDate.getTime() < bufferMs) {
    return {
      checkCode: "passport_expiry",
      status: "fail",
      title: "Passport expires too soon",
      detail: `Passport expires ${parsed.expiryDate}. Must be valid for at least ${label} after your return date.`,
      subDetail: null,
      severity: "error",
    };
  }

  return { checkCode: "passport_expiry", status: "pass", title: "Passport validity sufficient", detail: `Expires ${parsed.expiryDate}`, subDetail: null, severity: "error" };
};

/**
 * Check: Required documents are present.
 * Profile-aware: builds required/recommended lists from applicant profile data.
 * Handles scenarios like: Indian passport holder, UK resident on graduate visa, tourism to France.
 */
export const checkRequiredDocuments: CheckFunction = (ctx) => {
  const uploadedTypes = new Set(
    ctx.documents.filter((d) => d.uploadStatus !== "DELETED").map((d) => d.documentType)
  );

  const profile = ctx.application.applicantProfile;
  const employment = ctx.application.employmentProfile;
  const purpose = profile?.purposeOfTravel ?? null;
  const residenceCountry = profile?.countryOfResidence ?? null;
  const applyingFrom = ctx.application.applyingFromCountry ?? null;
  const employmentStatus = employment?.employmentStatus ?? null;

  // Determine if applicant is a third-country national applying from a non-Schengen country
  // e.g. UK resident, US resident, Indian national living in UK
  const isApplyingFromAbroad = !!(applyingFrom || residenceCountry);
  const isUKResident = residenceCountry === "gb" || applyingFrom === "gb";

  // ── Required documents ────────────────────────────────────────────────────
  const required: { type: string | string[]; label: string; condition?: boolean }[] = [
    { type: "passport", label: "Passport" },
    // Residence doc required for anyone applying from a non-Schengen country
    {
      type: ["brp", "evisa", "visa_vignette", "residence_permit"],
      label: isUKResident ? "UK BRP / eVisa / Residence permit" : "Residence / immigration document",
      condition: isApplyingFromAbroad,
    },
  ];

  // Employment-based required documents
  if (employmentStatus === "employed") {
    required.push({ type: ["payslip", "employment_letter"], label: "Payslip or employment letter" });
  } else if (employmentStatus === "self_employed") {
    required.push(
      { type: ["business_registration", "business_bank_statement", "profit_loss"], label: "Self-employment proof (business docs)" }
    );
  } else if (employmentStatus === "student") {
    required.push({ type: ["student_enrollment", "employment_letter"], label: "Student enrollment / institution letter" });
  } else if (employmentStatus === "unemployed") {
    required.push({ type: "bank_statement", label: "Bank statement (proof of funds)" });
  }

  // ── Recommended documents (based on purpose) ──────────────────────────────
  const recommended: { type: string; label: string }[] = [];

  if (purpose === "tourism" || purpose === "visiting" || !purpose) {
    recommended.push({ type: "travel_insurance", label: "Travel insurance" });
    recommended.push({ type: "flight_booking", label: "Flight reservation" });
    recommended.push({ type: "accommodation_proof", label: "Accommodation proof" });
    if (employmentStatus !== "unemployed") {
      recommended.push({ type: "bank_statement", label: "Bank statements" });
    }
    recommended.push({ type: "cover_letter", label: "Cover letter" });
  } else if (purpose === "business") {
    recommended.push({ type: "travel_insurance", label: "Travel insurance" });
    recommended.push({ type: "flight_booking", label: "Flight reservation" });
    recommended.push({ type: "accommodation_proof", label: "Accommodation / hotel booking" });
    recommended.push({ type: "bank_statement", label: "Bank statements" });
  } else if (purpose === "study") {
    recommended.push({ type: "travel_insurance", label: "Travel insurance" });
    recommended.push({ type: "flight_booking", label: "Flight reservation" });
    recommended.push({ type: "bank_statement", label: "Bank statements (proof of funds)" });
  } else {
    // Fallback
    recommended.push({ type: "travel_insurance", label: "Travel insurance" });
    recommended.push({ type: "flight_booking", label: "Flight reservation" });
    recommended.push({ type: "accommodation_proof", label: "Accommodation proof" });
    recommended.push({ type: "bank_statement", label: "Bank statements" });
  }

  // ── Evaluate required ─────────────────────────────────────────────────────
  const missing: string[] = [];

  for (const req of required) {
    if (req.condition === false) continue;
    if (Array.isArray(req.type)) {
      const hasAny = req.type.some((t) => uploadedTypes.has(t));
      if (!hasAny) missing.push(req.label);
    } else {
      if (!uploadedTypes.has(req.type)) missing.push(req.label);
    }
  }

  const missingRecommended = recommended
    .filter((r) => !uploadedTypes.has(r.type))
    .map((r) => r.label);

  if (missing.length > 0) {
    return {
      checkCode: "required_documents",
      status: "fail",
      title: "Required documents missing",
      detail: `Missing: ${missing.join(", ")}`,
      subDetail: missingRecommended.length > 0 ? `Also recommended: ${missingRecommended.join(", ")}` : null,
      severity: "error",
    };
  }

  if (missingRecommended.length > 0) {
    return {
      checkCode: "required_documents",
      status: "warn",
      title: "Some recommended documents not uploaded",
      detail: `Missing: ${missingRecommended.join(", ")}`,
      subDetail: "These are strongly recommended for a successful application",
      severity: "warning",
    };
  }

  return { checkCode: "required_documents", status: "pass", title: "All documents uploaded", detail: null, subDetail: null, severity: "error" };
};

/**
 * Check: Travel plan completeness.
 */
export const checkTravelPlan: CheckFunction = (ctx) => {
  const tp = ctx.application.travelPlan;
  const missing: string[] = [];

  if (!tp?.accommodationType) missing.push("accommodation type");
  if (!tp?.entryCity) missing.push("entry city");

  if (missing.length === 0) {
    return { checkCode: "travel_plan", status: "pass", title: "Travel plan complete", detail: null, subDetail: null, severity: "error" };
  }
  return {
    checkCode: "travel_plan",
    status: "fail",
    title: "Travel plan incomplete",
    detail: `Missing: ${missing.join(", ")}`,
    subDetail: null,
    severity: "error",
  };
};

/**
 * Check: Employment status provided.
 */
export const checkEmployment: CheckFunction = (ctx) => {
  if (ctx.application.employmentProfile?.employmentStatus) {
    return { checkCode: "employment", status: "pass", title: "Employment status provided", detail: null, subDetail: null, severity: "error" };
  }
  return { checkCode: "employment", status: "fail", title: "Employment status missing", detail: "Please provide your employment status in Step 6", subDetail: null, severity: "error" };
};

/**
 * Check: Trip duration within visa limits.
 * Max days is configurable per country group (default: 90 for Schengen).
 */
export const checkTripDuration: CheckFunction = (ctx) => {
  const params = ctx.ruleParams["trip_duration"] ?? {};
  const maxDays = params.maxStayDays ?? 90;
  const label = params.tripDurationLabel ?? `${maxDays}-day`;

  const tp = ctx.application.travelPlan;
  if (!tp?.tripLengthDays) {
    return { checkCode: "trip_duration", status: "warn", title: "Trip duration unknown", detail: "Provide travel dates to verify", subDetail: null, severity: "warning" };
  }
  if (tp.tripLengthDays > maxDays) {
    return {
      checkCode: "trip_duration",
      status: "fail",
      title: `Trip exceeds ${label} limit`,
      detail: `Your trip is ${tp.tripLengthDays} days. Maximum allowed is ${maxDays} days.`,
      subDetail: null,
      severity: "error",
    };
  }
  return { checkCode: "trip_duration", status: "pass", title: `Trip duration: ${tp.tripLengthDays} days`, detail: `Within ${label} limit`, subDetail: null, severity: "error" };
};

/**
 * All check functions in execution order.
 */
export const ALL_CHECKS: CheckFunction[] = [
  checkPersonalInfo,
  checkTravelDates,
  checkTripDuration,
  checkPassportPresent,
  checkPassportExpiry,
  checkRequiredDocuments,
  checkTravelPlan,
  checkEmployment,
];
