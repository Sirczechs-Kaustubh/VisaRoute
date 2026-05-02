"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationDraft } from "@/lib/contracts";
import { createClient } from "@/utils/supabase/client";
import { ContactAgentModal } from "@/components/ContactAgentModal";
import { ApplySidebar } from "./ApplySidebar";
import { Step1Intro } from "./steps/Step1Intro";
import { Step2Passport } from "./steps/Step2Passport";
import { Step3Residence } from "./steps/Step3Residence";
import { Step4TripDetails } from "./steps/Step4TripDetails";
import { Step6Employment } from "./steps/Step6Employment";
import { Step6TravelHistory } from "./steps/Step6TravelHistory";
import { Step9Documents } from "./steps/Step9Documents";
import { Step10Checks } from "./steps/Step10Checks";
import { Step11Review } from "./steps/Step11Review";
import { Step12Pack } from "./steps/Step12Pack";
import { Step13AppointmentBooked } from "./steps/Step13AppointmentBooked";
import { Step14BiometricsAttended } from "./steps/Step14BiometricsAttended";
import { Step15VisaReceived } from "./steps/Step15VisaReceived";
import {
  DEFAULT_PHONE_DIAL,
  formatPhoneForStorage,
  parseStoredPhone,
} from "@/lib/phone-dial-codes";

const SINGLE_INSTANCE_DOC_TYPES = ["passport", "passport_back", "residence_permit", "brp", "visa_vignette", "evisa", "photo"];

const ALLOWED_PURPOSES = new Set(["tourism", "business", "visiting"]);
function isSingleInstance(docType: string) {
  return SINGLE_INSTANCE_DOC_TYPES.includes(docType);
}

export interface UploadedDocument {
  id: string;
  documentType: string;
  originalFileName: string;
  url: string;
  uploadStatus: string;
  extractionStatus?: string;
  extraction?: {
    type: string;
    data: Record<string, string | null>;
    confidence: number;
  } | null;
  validation?: {
    status: "PASSED" | "WARNING" | "FAILED";
    issues: string[];
    warnings: string[];
  } | null;
}

export interface CompanionMember {
  name: string;
  relationship: string;
  passportNumber: string;
}

export interface ApplicationData {
  applyingFromCountry: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164-style dial, e.g. +91 */
  phoneDialCode: string;
  /** National number only (no country code). */
  phoneNumber: string;
  countryOfResidence: string;
  purposeOfTravel: string;
  travelStartDate: string;
  travelEndDate: string;
  travellingWithCompanions: string;
  companionsCount: number;
  companionMembers: CompanionMember[];
  visitedSchengenBefore: string;
  previousTravelVisits: { country: string; year: string }[];
  previousVisaRejections: string;
  refusalDetails: { country: string; year: string; visaType: string; reason: string }[];
  passportFile: { file: File; name: string } | null;
  residenceFile: { file: File; name: string } | null;
  accommodation: string;
  entryCity: string;
  multiCountry: string;
  /** Other Schengen countries / nights (required when multiCountry is "yes") */
  otherSchengenCountries: string;
  /** Nights in the country the visa is for (numeric string for inputs) */
  nightsInVisaDestination: string;
  /** First day in the Schengen area (yyyy-mm-dd) when visiting multiple countries */
  schengenFirstEntryDate: string;
  employmentStatus: string;
  documents: Record<string, { file: File; name: string }>;
  uploadedDocuments: UploadedDocument[];
  // Passport extracted details (populated when user applies extraction in Step 2)
  passportNumber: string;
  passportNationality: string;
  passportDateOfBirth: string;
  passportSex: string;
  passportExpiryDate: string;
  passportIssuingCountry: string;
  passportIssueDate: string;
  passportIssuePlace: string;
  appointmentDateTime: string;
  appointmentLocation: string;
  officialApplicationReference: string;
  appointmentNotes: string;
  biometricsAttended: string;
  biometricsNotes: string;
  visaOutcome: string;
  visaNumber: string;
  visaOutcomeNotes: string;
}

export const STEPS = [
  { id: 1, slug: "intro", label: "Personal Info", icon: "👤" },
  { id: 2, slug: "passport", label: "Passport", icon: "🛂" },
  { id: 3, slug: "residence", label: "Residence", icon: "🏠" },
  { id: 4, slug: "trip", label: "Trip Details", icon: "✈️" },
  { id: 5, slug: "employment", label: "Employment", icon: "💼" },
  { id: 6, slug: "history", label: "Travel History", icon: "🕐" },
  { id: 7, slug: "documents", label: "Documents", icon: "📄" },
  { id: 8, slug: "checks", label: "Doc Checks", icon: "🔍" },
  { id: 9, slug: "review-submit", label: "Review & Submit", icon: "📋" },
  { id: 10, slug: "pack", label: "Visa Pack", icon: "📦" },
  { id: 11, slug: "appointment-booked", label: "Appointment Booked", icon: "📅" },
  { id: 12, slug: "biometrics-attended", label: "Biometrics Attended", icon: "🧬" },
  { id: 13, slug: "visa-received", label: "Visa Received", icon: "🛂" },
] as const;

const TOTAL_STEPS = 13;

// Map old 13-step numbers to new 11-step numbers for draft hydration
function migrateStepNumber(oldStep: number): number {
  if (!Number.isFinite(oldStep) || oldStep < 1) return 1;
  if (oldStep > TOTAL_STEPS) return TOTAL_STEPS;
  return Math.floor(oldStep);
}

interface ApplyFlowProps {
  countryName: string;
  countrySlug: string;
  visaFeeEur: number;
  serviceFeeEur: number;
  initialDraft: ApplicationDraft | null;
  userEmail?: string;
}

function emptyApplicationData(): ApplicationData {
  return {
    applyingFromCountry: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneDialCode: DEFAULT_PHONE_DIAL,
    phoneNumber: "",
    countryOfResidence: "",
    purposeOfTravel: "",
    travelStartDate: "",
    travelEndDate: "",
    travellingWithCompanions: "",
    companionsCount: 0,
    companionMembers: [],
    visitedSchengenBefore: "",
    previousTravelVisits: [],
    previousVisaRejections: "",
    refusalDetails: [],
    passportFile: null,
    residenceFile: null,
    accommodation: "",
    entryCity: "",
    multiCountry: "",
    otherSchengenCountries: "",
    nightsInVisaDestination: "",
    schengenFirstEntryDate: "",
    employmentStatus: "",
    documents: {},
    uploadedDocuments: [],
    passportNumber: "",
    passportNationality: "",
    passportDateOfBirth: "",
    passportSex: "",
    passportExpiryDate: "",
    passportIssuingCountry: "",
    passportIssueDate: "",
    passportIssuePlace: "",
    appointmentDateTime: "",
    appointmentLocation: "",
    officialApplicationReference: "",
    appointmentNotes: "",
    biometricsAttended: "",
    biometricsNotes: "",
    visaOutcome: "",
    visaNumber: "",
    visaOutcomeNotes: "",
  };
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function hydrateFromDraft(draft: ApplicationDraft): ApplicationData {
  const phoneParts = parseStoredPhone(draft.applicantProfile?.phoneNumber ?? "");
  const rawPurpose = draft.applicantProfile?.purposeOfTravel ?? "";
  return {
    ...emptyApplicationData(),
    applyingFromCountry: draft.applyingFromCountry ?? "",
    firstName: draft.applicantProfile?.firstName ?? "",
    lastName: draft.applicantProfile?.lastName ?? "",
    email: draft.applicantProfile?.email ?? "",
    phoneDialCode: phoneParts.dial,
    phoneNumber: phoneParts.local,
    countryOfResidence: draft.applicantProfile?.countryOfResidence ?? "",
    purposeOfTravel: ALLOWED_PURPOSES.has(rawPurpose) ? rawPurpose : "",
    travelStartDate: formatDate(draft.applicantProfile?.travelStartDate),
    travelEndDate: formatDate(draft.applicantProfile?.travelEndDate),
    travellingWithCompanions: draft.companionGroup?.travellingWithCompanions ?? "",
    companionsCount: draft.companionGroup?.companionsCount ?? 0,
    companionMembers: [],
    visitedSchengenBefore: draft.visaHistoryEntries.length > 0 ? "yes" : "",
    previousTravelVisits: draft.visaHistoryEntries.map((entry) => ({
      country: entry.countryName ?? "",
      year: entry.yearLabel ?? "",
    })),
    previousVisaRejections: draft.refusalHistoryEntries.length > 0 ? "yes" : "",
    refusalDetails: draft.refusalHistoryEntries.map((entry) => ({
      country: entry.countryName ?? "",
      year: entry.yearLabel ?? "",
      visaType: entry.visaTypeLabel ?? "",
      reason: entry.reason ?? "",
    })),
    accommodation: draft.travelPlan?.accommodationType ?? "",
    entryCity: draft.travelPlan?.entryCity ?? "",
    multiCountry: draft.travelPlan?.multiCountryMode ?? "",
    otherSchengenCountries: draft.travelPlan?.otherSchengenCountries ?? "",
    nightsInVisaDestination:
      draft.travelPlan?.nightsInVisaDestination != null
        ? String(draft.travelPlan.nightsInVisaDestination)
        : "",
    schengenFirstEntryDate: draft.travelPlan?.schengenFirstEntryDate ?? "",
    employmentStatus: draft.employmentProfile?.employmentStatus ?? "",
    uploadedDocuments: (draft.documents ?? []).map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      originalFileName: doc.originalFileName,
      url: doc.url,
      uploadStatus: doc.uploadStatus,
    })),
  };
}

function emptyToNull(value: string | undefined) {
  const t = value?.trim();
  return t ? t : null;
}

function parsePositiveInt(value: string | undefined): number | null {
  const n = parseInt(String(value ?? "").trim(), 10);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}

function buildDraftPayload(data: ApplicationData, step: number) {
  return {
    currentStep: step,
    applyingFromCountry: emptyToNull(data.applyingFromCountry),
    applicantProfile: {
      firstName: emptyToNull(data.firstName),
      lastName: emptyToNull(data.lastName),
      email: emptyToNull(data.email),
      phoneNumber: formatPhoneForStorage(data.phoneDialCode, data.phoneNumber),
      countryOfResidence: emptyToNull(data.countryOfResidence),
      purposeOfTravel: emptyToNull(data.purposeOfTravel),
      travelStartDate: data.travelStartDate?.trim() || null,
      travelEndDate: data.travelEndDate?.trim() || null,
    },
    travelPlan: {
      accommodationType: emptyToNull(data.accommodation),
      entryCity: emptyToNull(data.entryCity),
      multiCountryMode: emptyToNull(data.multiCountry),
      otherSchengenCountries:
        data.multiCountry === "yes" ? emptyToNull(data.otherSchengenCountries) : null,
      nightsInVisaDestination:
        data.multiCountry === "yes" ? parsePositiveInt(data.nightsInVisaDestination) : null,
      schengenFirstEntryDate:
        data.multiCountry === "yes" ? emptyToNull(data.schengenFirstEntryDate) : null,
    },
    companionGroup: {
      travellingWithCompanions: emptyToNull(data.travellingWithCompanions),
      companionsCount:
        data.travellingWithCompanions === "yes" ? data.companionsCount || 0 : data.companionsCount,
      companionMembers:
        data.travellingWithCompanions === "yes"
          ? data.companionMembers.slice(0, Math.max(data.companionsCount || 0, 0)).map((member) => ({
              name: emptyToNull(member.name),
              relationship: emptyToNull(member.relationship),
              passportNumber: emptyToNull(member.passportNumber),
            }))
          : [],
    },
    employmentProfile: {
      employmentStatus: emptyToNull(data.employmentStatus),
    },
    visaHistoryEntries:
      data.visitedSchengenBefore === "yes"
        ? data.previousTravelVisits.map((visit) => ({
            countryName: emptyToNull(visit.country),
            yearLabel: emptyToNull(visit.year),
          }))
        : [],
    refusalHistoryEntries:
      data.previousVisaRejections === "yes"
        ? data.refusalDetails.map((entry) => ({
            countryName: emptyToNull(entry.country),
            yearLabel: emptyToNull(entry.year),
            visaTypeLabel: emptyToNull(entry.visaType),
            reason: emptyToNull(entry.reason),
          }))
        : [],
  };
}

export function ApplyFlow({
  countryName,
  countrySlug,
  visaFeeEur,
  serviceFeeEur,
  initialDraft,
  userEmail,
}: ApplyFlowProps) {
  const router = useRouter();
  const [draftToken, setDraftToken] = useState(initialDraft?.draftToken ?? null);
  const [step, setStep] = useState(
    initialDraft ? migrateStepNumber(initialDraft.currentStep) : 1,
  );
  const [data, setData] = useState<ApplicationData>(
    initialDraft ? hydrateFromDraft(initialDraft) : emptyApplicationData(),
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (initialDraft) {
      setDraftToken(initialDraft.draftToken);
      setStep(migrateStepNumber(initialDraft.currentStep));
      setData(hydrateFromDraft(initialDraft));
    }
  }, [initialDraft]);

  useEffect(() => {
    if (draftToken) {
      return;
    }

    startLoading(async () => {
      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ countrySlug }),
        });

        if (!response.ok) {
          throw new Error("Could not start application");
        }

        const payload = (await response.json()) as { application: ApplicationDraft };
        setDraftToken(payload.application.draftToken);
        router.replace(`/apply?country=${countrySlug}&draft=${payload.application.draftToken}`);
      } catch {
        setSaveMessage("Could not start your application draft.");
      }
    });
  }, [countrySlug, draftToken, router, startLoading]);

  const updateData = (updates: Partial<ApplicationData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setSaveMessage(null);
  };

  async function uploadDocument(file: File, documentType: string): Promise<UploadedDocument | null> {
    if (!draftToken) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    // Pass applicant context so server can validate name/date matches
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
    if (fullName) formData.append("applicantName", fullName);
    if (data.travelStartDate) formData.append("travelStartDate", data.travelStartDate);
    if (data.travelEndDate) formData.append("travelEndDate", data.travelEndDate);
    try {
      const response = await fetch(`/api/applications/${draftToken}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message ?? "Upload failed");
      }
      const payload = await response.json();
      const doc = payload.document as UploadedDocument;
      setData((prev) => ({
        ...prev,
        uploadedDocuments: [
          ...prev.uploadedDocuments.filter((d) => !(d.documentType === documentType && isSingleInstance(documentType))),
          doc,
        ],
      }));
      return doc;
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Upload failed");
      return null;
    }
  }

  async function deleteDocument(docId: string) {
    if (!draftToken) return;
    try {
      await fetch(`/api/applications/${draftToken}/documents/${docId}`, { method: "DELETE" });
      setData((prev) => ({
        ...prev,
        uploadedDocuments: prev.uploadedDocuments.filter((d) => d.id !== docId),
      }));
    } catch {
      setSaveMessage("Could not remove document");
    }
  }

  async function persistDraft(nextStep = step) {
    if (!draftToken) {
      throw new Error("Draft token is missing");
    }

    const response = await fetch(`/api/applications/${draftToken}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildDraftPayload(dataRef.current, nextStep)),
    });

    const payload = (await response.json()) as {
      application?: ApplicationDraft;
      error?: { message?: string };
    };

    if (!response.ok || !payload.application) {
      throw new Error(payload.error?.message ?? "Could not save your progress");
    }

    // Use nextStep from navigation (incl. Step 3 skip); migrateStepNumber is only for loading old drafts.
    setStep(nextStep);
    setSaveMessage("Progress saved");
  }

  // Step 3 (Residence/BRP) is only required for UK residents
  const isUKResident = data.countryOfResidence === "gb";

  function getNextStep(current: number): number {
    const raw = current + 1;
    // Skip Step 3 for non-UK residents (BRP step is UK-only)
    if (raw === 3 && !isUKResident) return 4;
    return raw;
  }

  function getPrevStep(current: number): number {
    const raw = current - 1;
    // Skip Step 3 going backwards for non-UK residents
    if (raw === 3 && !isUKResident) return 2;
    return raw;
  }

  function handleNext() {
    if (step >= TOTAL_STEPS) {
      return;
    }

    const nextStep = getNextStep(step);
    startSaving(async () => {
      try {
        await persistDraft(nextStep);
      } catch (error) {
        // Do not block user progression when autosave fails (e.g. transient network issues).
        setStep(nextStep);
        setSaveMessage(
          error instanceof Error
            ? `${error.message}. You can continue; we'll save when connection recovers.`
            : "Could not save your progress. You can continue and save later.",
        );
      }
    });
  }

  function handleBack() {
    if (step <= 1) {
      return;
    }

    const previousStep = getPrevStep(step);
    startSaving(async () => {
      try {
        await persistDraft(previousStep);
      } catch (error) {
        // Navigation should remain available even if persistence fails.
        setStep(previousStep);
        setSaveMessage(
          error instanceof Error
            ? `${error.message}. You can continue; we'll save when connection recovers.`
            : "Could not save your progress. You can continue and save later.",
        );
      }
    });
  }

  function handleManualSave() {
    startSaving(async () => {
      try {
        await persistDraft(step);
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : "Could not save your progress");
      }
    });
  }

  function handleReviewSubmit() {
    if (!draftToken) {
      setSaveMessage("Could not submit: draft token is missing.");
      return;
    }

    startSaving(async () => {
      try {
        // Save all latest edits first, then submit, then move to final Visa Pack step.
        await persistDraft(9);
        const response = await fetch(`/api/applications/${draftToken}/submit`, { method: "POST" });
        const payload = (await response.json()) as { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Submission failed");
        }
        setStep(10);
        setSaveMessage("Application submitted successfully");
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : "Submission failed");
      }
    });
  }

  const currentStepInfo = STEPS.find((entry) => entry.id === step) ?? STEPS[0];
  const progressPercent = Math.max(initialDraft?.completionPercent ?? 0, Math.round((step / TOTAL_STEPS) * 100));

  return (
    <>
    <div className="flex min-h-screen">
      <ApplySidebar
        countryName={countryName}
        countrySlug={countrySlug}
        currentStep={step}
        visaFeeEur={visaFeeEur}
        serviceFeeEur={serviceFeeEur}
        purpose={data.purposeOfTravel}
        applicantName={[data.firstName, data.lastName].filter(Boolean).join(" ") || undefined}
        companionsCount={data.travellingWithCompanions === "yes" ? data.companionsCount : 0}
        isUKResident={isUKResident}
        uploadedDocTypes={data.uploadedDocuments.map((d) => d.documentType)}
        hasRefusals={data.previousVisaRejections === "yes" && data.refusalDetails.length > 0}
        hasPriorVisits={data.visitedSchengenBefore === "yes" && data.previousTravelVisits.length > 0}
        employmentStatus={data.employmentStatus}
        profileComplete={!!(data.firstName && data.lastName && data.email && data.purposeOfTravel && data.travelStartDate && data.travelEndDate)}
      />

      <div className="flex flex-1 flex-col bg-slate-50/90">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <nav className="text-sm text-slate-600">
            <Link href="/" className="hover:text-primary-600 transition">
              VisaRoute
            </Link>
            <span className="mx-2 text-slate-300">›</span>
            <Link href={`/country/${countrySlug}`} className="hover:text-primary-600 transition">
              {countryName}
            </Link>
            <span className="mx-2 text-slate-300">›</span>
            <span className="font-medium text-slate-900">{currentStepInfo.label}</span>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {saveMessage && (
              <span className={`hidden text-xs sm:block ${saveMessage.includes("saved") ? "text-emerald-600" : "text-slate-500"}`}>
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving || isLoading || !draftToken}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
            </button>
            {userEmail && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
                <span className="hidden max-w-[140px] truncate text-xs text-slate-500 sm:block" title={userEmail}>
                  {userEmail}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    router.push("/");
                    router.refresh();
                  }}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile step indicator */}
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">
              {currentStepInfo.icon} {currentStepInfo.label}
            </span>
            <span>{step}/{TOTAL_STEPS}</span>
          </div>
          <div className="mt-2 flex gap-1">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s.id <= step ? "bg-primary-500" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-2xl">
            {saveMessage && !saveMessage.includes("saved") && (
              <div
                className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                role="alert"
              >
                {saveMessage}
              </div>
            )}
            {/* Progress header */}
            <div className="mb-6 hidden flex-col gap-2 lg:flex">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Application complete {progressPercent}%
                </p>
                {draftToken && (
                  <span className="text-xs text-slate-400">
                    Draft: {draftToken.slice(0, 8)}...
                  </span>
                )}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Step content */}
            <div className="animate-in fade-in duration-200">
              {step === 1 && (
                <Step1Intro data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />
              )}
              {step === 2 && (
                <Step2Passport data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} uploadDocument={uploadDocument} deleteDocument={deleteDocument} />
              )}
              {step === 3 && (
                <Step3Residence data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} uploadDocument={uploadDocument} deleteDocument={deleteDocument} draftToken={draftToken} />
              )}
              {step === 4 && (
                <Step4TripDetails data={data} updateData={updateData} countryName={countryName} countrySlug={countrySlug} onNext={handleNext} onBack={handleBack} />
              )}
              {step === 5 && (
                <Step6Employment data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} />
              )}
              {step === 6 && (
                <Step6TravelHistory data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} />
              )}
              {step === 7 && (
                <Step9Documents data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} uploadDocument={uploadDocument} deleteDocument={deleteDocument} />
              )}
              {step === 8 && (
                <Step10Checks data={data} countryName={countryName} onNext={handleNext} onBack={handleBack} draftToken={draftToken} />
              )}
              {step === 9 && (
                <Step11Review
                  data={data}
                  updateData={updateData}
                  countryName={countryName}
                  onSubmit={handleReviewSubmit}
                  onBack={handleBack}
                  draftToken={draftToken}
                />
              )}
              {step === 10 && (
                <Step12Pack
                  data={data}
                  countryName={countryName}
                  onNext={handleNext}
                  onBack={handleBack}
                  draftToken={draftToken}
                />
              )}
              {step === 11 && (
                <Step13AppointmentBooked
                  data={data}
                  updateData={updateData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {step === 12 && (
                <Step14BiometricsAttended
                  data={data}
                  updateData={updateData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {step === 13 && (
                <Step15VisaReceived
                  data={data}
                  updateData={updateData}
                  onBack={handleBack}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
    <ContactAgentModal defaultCountry={countryName} />
    </>
  );
}
