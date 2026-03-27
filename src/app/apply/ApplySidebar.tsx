"use client";

import { useState } from "react";
import Link from "next/link";
import { STEPS } from "./ApplyFlow";

interface ApplySidebarProps {
  countryName: string;
  countrySlug: string;
  currentStep: number;
  visaFeeEur: number;
  serviceFeeEur: number;
  purpose?: string;
  applicantName?: string;
  companionsCount?: number;
  isUKResident?: boolean;
  uploadedDocTypes?: string[];
  hasRefusals?: boolean;
  hasPriorVisits?: boolean;
  employmentStatus?: string;
  profileComplete?: boolean;
}

const PURPOSE_LABELS: Record<string, string> = {
  tourism: "Tourism",
  business: "Business",
  visiting: "Visiting family",
  study: "Study",
  medical: "Medical",
  transit: "Transit",
};

export function ApplySidebar({
  countryName,
  countrySlug,
  currentStep,
  visaFeeEur,
  serviceFeeEur,
  purpose,
  applicantName,
  companionsCount = 0,
  isUKResident = true,
  uploadedDocTypes = [],
  hasRefusals = false,
  hasPriorVisits = false,
  employmentStatus = "",
  profileComplete = false,
}: ApplySidebarProps) {
  const [showFactors, setShowFactors] = useState(false);
  const total = visaFeeEur + serviceFeeEur;

  // Data-driven success probability
  const docSet = new Set(uploadedDocTypes);
  let successEstimate = 35;
  if (profileComplete) successEstimate += 5;
  if (docSet.has("passport")) successEstimate += 10;
  if (docSet.has("brp") || docSet.has("evisa") || docSet.has("visa_vignette") || docSet.has("residence_permit")) successEstimate += 8;
  if (docSet.has("bank_statement") || docSet.has("business_bank_statement")) successEstimate += 8;
  if (docSet.has("travel_insurance")) successEstimate += 5;
  if (docSet.has("flight_booking")) successEstimate += 4;
  if (docSet.has("accommodation_proof")) successEstimate += 4;
  if (docSet.has("payslip") || docSet.has("employment_letter")) successEstimate += 5;
  if (docSet.has("cover_letter")) successEstimate += 4;
  if (hasPriorVisits) successEstimate += 5;
  if (hasRefusals) successEstimate -= 10;
  if (!employmentStatus) successEstimate -= 3;
  successEstimate = Math.max(10, Math.min(92, successEstimate));
  const successLabel =
    successEstimate >= 70 ? "Strong" : successEstimate >= 45 ? "Moderate" : "Needs work";
  const successColor =
    successEstimate >= 70
      ? "bg-emerald-500/20 text-emerald-400"
      : successEstimate >= 45
      ? "bg-amber-500/20 text-amber-400"
      : "bg-rose-500/20 text-rose-400";
  const successBarColor =
    successEstimate >= 70 ? "bg-emerald-500" : successEstimate >= 45 ? "bg-amber-500" : "bg-rose-500";

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
      <div className="flex flex-1 flex-col p-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">VisaRoute</span>
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
            SCHENGEN
          </span>
        </Link>

        {/* Country card */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Applying for
          </p>
          <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white">
              {countryName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-semibold text-white">{countryName}</p>
              <p className="text-sm text-slate-400">Schengen Visa</p>
            </div>
          </div>
        </div>

        {/* Success probability */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Visa success probability
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{successEstimate}%</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${successColor}`}>
              {successLabel}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full ${successBarColor} transition-all duration-500`}
              style={{ width: `${successEstimate}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFactors(!showFactors)}
            className="mt-2 text-xs text-primary-400 hover:text-primary-300 transition"
          >
            {showFactors ? "Hide factors" : "Show factors"}
          </button>
          {showFactors && (
            <div className="mt-2 rounded-lg bg-slate-800 p-3 text-xs text-slate-400 space-y-1">
              {docSet.has("passport") ? <p className="text-emerald-400">✓ Passport uploaded</p> : <p className="text-rose-400">✗ Passport missing</p>}
              {(docSet.has("brp") || docSet.has("evisa") || docSet.has("visa_vignette") || docSet.has("residence_permit")) ? <p className="text-emerald-400">✓ Residence doc uploaded</p> : isUKResident ? <p className="text-rose-400">✗ BRP / eVisa missing</p> : null}
              {(docSet.has("bank_statement") || docSet.has("business_bank_statement")) ? <p className="text-emerald-400">✓ Bank statements uploaded</p> : <p className="text-amber-400">⚠ Bank statements recommended</p>}
              {docSet.has("travel_insurance") ? <p className="text-emerald-400">✓ Travel insurance uploaded</p> : <p className="text-amber-400">⚠ Travel insurance recommended</p>}
              {docSet.has("flight_booking") ? <p className="text-emerald-400">✓ Flight booking uploaded</p> : <p className="text-amber-400">⚠ Flight booking recommended</p>}
              {hasPriorVisits && <p className="text-emerald-400">✓ Prior Schengen visits (positive)</p>}
              {hasRefusals && <p className="text-rose-400">✗ Prior visa refusals (risk factor)</p>}
              {employmentStatus ? <p className="text-emerald-400">✓ Employment status declared</p> : <p className="text-amber-400">⚠ Employment status missing</p>}
            </div>
          )}
        </div>

        {/* Step navigation */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Application progress
          </p>
          <nav className="mt-3 space-y-0.5">
            {STEPS.map((s) => {
              const isSkipped = s.id === 3 && !isUKResident;
              const isComplete = s.id < currentStep && !isSkipped;
              const isCurrent = s.id === currentStep;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                    isCurrent ? "bg-slate-800" : ""
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      isSkipped
                        ? "bg-slate-700 text-slate-600"
                        : isComplete
                        ? "bg-primary-500 text-white"
                        : isCurrent
                        ? "bg-white text-slate-900"
                        : "bg-slate-700 text-slate-500"
                    }`}
                  >
                    {isSkipped ? (
                      "–"
                    ) : isComplete ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.id
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      isSkipped
                        ? "text-slate-600 line-through"
                        : isComplete
                        ? "text-slate-400"
                        : isCurrent
                        ? "font-medium text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {s.label}
                    {isSkipped && <span className="ml-1 text-xs normal-case no-underline" style={{ textDecoration: "none" }}>(N/A)</span>}
                  </span>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Summary card */}
        <div className="mt-auto pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Summary
          </p>
          <div className="mt-3 space-y-2 rounded-lg bg-slate-800 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Country</span>
              <span className="font-medium text-white">{countryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Purpose</span>
              <span className="font-medium text-white">
                {purpose ? PURPOSE_LABELS[purpose] ?? purpose : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Applicant</span>
              <span className="font-medium text-white">{applicantName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Companions</span>
              <span className="font-medium text-white">
                {companionsCount > 0 ? `${companionsCount} people` : "Solo"}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Visa fee</span>
                <span className="font-medium text-white">&euro;{visaFeeEur}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-400">Service</span>
                <span className="font-medium text-white">&euro;{serviceFeeEur}</span>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-white">&euro;{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
