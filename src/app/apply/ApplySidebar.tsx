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
}: ApplySidebarProps) {
  const [showFactors, setShowFactors] = useState(false);
  const total = visaFeeEur + serviceFeeEur;

  // Dynamic success estimate based on step progress
  const baseEstimate = Math.min(90, 20 + (currentStep - 1) * 7);
  const successEstimate = baseEstimate;
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
              <p>+ Complete all required documents</p>
              <p>+ Prior Schengen visits boost approval</p>
              <p>+ Declare any refusals honestly</p>
              <p>+ Strong cover letter with AI personalisation</p>
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
              const isComplete = s.id < currentStep;
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
                      isComplete
                        ? "bg-primary-500 text-white"
                        : isCurrent
                        ? "bg-white text-slate-900"
                        : "bg-slate-700 text-slate-500"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.id
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      isComplete
                        ? "text-slate-400"
                        : isCurrent
                        ? "font-medium text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {s.label}
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
