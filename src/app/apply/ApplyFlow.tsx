"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationDraft } from "@/lib/contracts";
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
import { Step13Appointment } from "./steps/Step13Appointment";

const SINGLE_INSTANCE_DOC_TYPES = ["passport", "passport_back", "residence_permit", "brp", "visa_vignette", "evisa", "photo"];
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
}

export interface ApplicationData {
  applyingFromCountry: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryOfResidence: string;
  purposeOfTravel: string;
  travelStartDate: string;
  travelEndDate: string;
  travellingWithCompanions: string;
  companionsCount: number;
  visitedSchengenBefore: string;
  previousTravelVisits: { country: string; year: string }[];
  previousVisaRejections: string;
  refusalDetails: { country: string; year: string; visaType: string; reason: string }[];
  passportFile: { file: File; name: string } | null;
  residenceFile: { file: File; name: string } | null;
  accommodation: string;
  entryCity: string;
  multiCountry: string;
  employmentStatus: string;
  documents: Record<string, { file: File; name: string }>;
  uploadedDocuments: UploadedDocument[];
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
  { id: 9, slug: "review", label: "Review", icon: "📋" },
  { id: 10, slug: "pack", label: "Visa Pack", icon: "📦" },
  { id: 11, slug: "submit", label: "Submit", icon: "✓" },
] as const;

const TOTAL_STEPS = 11;

// Map old 13-step numbers to new 11-step numbers for draft hydration
function migrateStepNumber(oldStep: number): number {
  if (oldStep <= 4) return oldStep;
  if (oldStep === 5) return 4; // companions merged into trip details
  if (oldStep === 6) return 5; // employment
  if (oldStep <= 8) return 6; // visa history + refusals merged
  if (oldStep === 9) return 7; // documents
  if (oldStep === 10) return 8; // checks
  if (oldStep === 11) return 9; // review
  if (oldStep === 12) return 10; // pack
  return 11; // submit
}

interface ApplyFlowProps {
  countryName: string;
  countrySlug: string;
  visaFeeEur: number;
  serviceFeeEur: number;
  initialDraft: ApplicationDraft | null;
}

function emptyApplicationData(): ApplicationData {
  return {
    applyingFromCountry: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryOfResidence: "",
    purposeOfTravel: "",
    travelStartDate: "",
    travelEndDate: "",
    travellingWithCompanions: "",
    companionsCount: 0,
    visitedSchengenBefore: "",
    previousTravelVisits: [],
    previousVisaRejections: "",
    refusalDetails: [],
    passportFile: null,
    residenceFile: null,
    accommodation: "",
    entryCity: "",
    multiCountry: "",
    employmentStatus: "",
    documents: {},
    uploadedDocuments: [],
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
  return {
    ...emptyApplicationData(),
    applyingFromCountry: draft.applyingFromCountry ?? "",
    firstName: draft.applicantProfile?.firstName ?? "",
    lastName: draft.applicantProfile?.lastName ?? "",
    email: draft.applicantProfile?.email ?? "",
    phoneNumber: draft.applicantProfile?.phoneNumber ?? "",
    countryOfResidence: draft.applicantProfile?.countryOfResidence ?? "",
    purposeOfTravel: draft.applicantProfile?.purposeOfTravel ?? "",
    travelStartDate: formatDate(draft.applicantProfile?.travelStartDate),
    travelEndDate: formatDate(draft.applicantProfile?.travelEndDate),
    travellingWithCompanions: draft.companionGroup?.travellingWithCompanions ?? "",
    companionsCount: draft.companionGroup?.companionsCount ?? 0,
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

function buildDraftPayload(data: ApplicationData, step: number) {
  return {
    currentStep: step,
    applyingFromCountry: data.applyingFromCountry || null,
    applicantProfile: {
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      countryOfResidence: data.countryOfResidence || null,
      purposeOfTravel: data.purposeOfTravel || null,
      travelStartDate: data.travelStartDate || null,
      travelEndDate: data.travelEndDate || null,
    },
    travelPlan: {
      accommodationType: data.accommodation || null,
      entryCity: data.entryCity || null,
      multiCountryMode: data.multiCountry || null,
    },
    companionGroup: {
      travellingWithCompanions: data.travellingWithCompanions || null,
      companionsCount:
        data.travellingWithCompanions === "yes" ? data.companionsCount || 0 : data.companionsCount,
    },
    employmentProfile: {
      employmentStatus: data.employmentStatus || null,
    },
    visaHistoryEntries:
      data.visitedSchengenBefore === "yes"
        ? data.previousTravelVisits.map((visit) => ({
            countryName: visit.country || null,
            yearLabel: visit.year || null,
          }))
        : [],
    refusalHistoryEntries:
      data.previousVisaRejections === "yes"
        ? data.refusalDetails.map((entry) => ({
            countryName: entry.country || null,
            yearLabel: entry.year || null,
            visaTypeLabel: entry.visaType || null,
            reason: entry.reason || null,
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
      body: JSON.stringify(buildDraftPayload(data, nextStep)),
    });

    const payload = (await response.json()) as {
      application?: ApplicationDraft;
      error?: { message?: string };
    };

    if (!response.ok || !payload.application) {
      throw new Error(payload.error?.message ?? "Could not save your progress");
    }

    setStep(migrateStepNumber(payload.application.currentStep));
    setSaveMessage("Progress saved");
  }

  function handleNext() {
    if (step >= TOTAL_STEPS) {
      return;
    }

    const nextStep = step + 1;
    startSaving(async () => {
      try {
        await persistDraft(nextStep);
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : "Could not save your progress");
        return;
      }
    });
  }

  function handleBack() {
    if (step <= 1) {
      return;
    }

    const previousStep = step - 1;
    startSaving(async () => {
      try {
        await persistDraft(previousStep);
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : "Could not save your progress");
        return;
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

  const currentStepInfo = STEPS.find((entry) => entry.id === step) ?? STEPS[0];
  const progressPercent = Math.max(initialDraft?.completionPercent ?? 0, Math.round((step / TOTAL_STEPS) * 100));

  return (
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
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className={`text-xs ${saveMessage.includes("saved") ? "text-emerald-600" : "text-slate-500"}`}>
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving || isLoading || !draftToken}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              {isSaving ? "Saving..." : "Save"}
            </button>
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
                <Step1Intro data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} />
              )}
              {step === 2 && (
                <Step2Passport data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} uploadDocument={uploadDocument} deleteDocument={deleteDocument} />
              )}
              {step === 3 && (
                <Step3Residence data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} uploadDocument={uploadDocument} deleteDocument={deleteDocument} draftToken={draftToken} />
              )}
              {step === 4 && (
                <Step4TripDetails data={data} updateData={updateData} countryName={countryName} onNext={handleNext} onBack={handleBack} />
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
                <Step11Review data={data} countryName={countryName} onNext={handleNext} onBack={handleBack} draftToken={draftToken} />
              )}
              {step === 10 && (
                <Step12Pack data={data} countryName={countryName} onNext={handleNext} onBack={handleBack} draftToken={draftToken} />
              )}
              {step === 11 && (
                <Step13Appointment
                  data={data}
                  countryName={countryName}
                  countrySlug={countrySlug}
                  visaFeeEur={visaFeeEur}
                  serviceFeeEur={serviceFeeEur}
                  onBack={handleBack}
                  draftToken={draftToken}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
