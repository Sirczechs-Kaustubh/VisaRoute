"use client";

import { useState } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

const COUNTRIES = ["France", "Germany", "Spain", "Italy", "Netherlands", "Other"];
const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "Earlier"];
const VISA_TYPES = ["Tourist", "Business", "Transit", "Other"];

export function Step6TravelHistory({
  data,
  updateData,
  countryName,
  onNext,
  onBack,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  countryName: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [section, setSection] = useState<"history" | "refusals">("history");

  const hasVisited = data.visitedSchengenBefore === "yes";

  const addVisit = () => {
    updateData({
      previousTravelVisits: [...data.previousTravelVisits, { country: "", year: "" }],
    });
  };

  const updateVisit = (index: number, field: "country" | "year", value: string) => {
    const next = [...data.previousTravelVisits];
    next[index] = { ...next[index], [field]: value };
    updateData({ previousTravelVisits: next });
  };

  const removeVisit = (index: number) => {
    updateData({
      previousTravelVisits: data.previousTravelVisits.filter((_, i) => i !== index),
    });
  };

  const addRefusal = () => {
    updateData({
      refusalDetails: [...data.refusalDetails, { country: "", year: "", visaType: "", reason: "" }],
    });
  };

  const updateRefusal = (index: number, field: keyof typeof data.refusalDetails[0], value: string) => {
    const next = [...data.refusalDetails];
    next[index] = { ...next[index], [field]: value };
    updateData({ refusalDetails: next });
  };

  const removeRefusal = (index: number) => {
    updateData({ refusalDetails: data.refusalDetails.filter((_, i) => i !== index) });
  };

  return (
    <>
      <TipBox icon="✓">
        Prior Schengen visits boost your approval rate significantly. Even tourist stamps strengthen your application.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 6 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Travel history &amp; refusals.
      </h1>
      <p className="mt-2 text-slate-600">
        Prior visits and any past refusals &mdash; both strengthen your cover letter when declared honestly.
      </p>

      {/* Section tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setSection("history")}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
            section === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Visa History
          {hasVisited && data.previousTravelVisits.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
              {data.previousTravelVisits.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSection("refusals")}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
            section === "refusals" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Refusals
          {data.previousVisaRejections === "yes" && data.refusalDetails.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
              {data.refusalDetails.length}
            </span>
          )}
        </button>
      </div>

      {section === "history" && (
        <div className="mt-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Have you visited the Schengen area before?
          </label>
          <div className="mt-3 flex gap-4">
            <button
              type="button"
              onClick={() => updateData({
                visitedSchengenBefore: "yes",
                previousTravelVisits: data.previousTravelVisits.length ? data.previousTravelVisits : [{ country: "", year: "" }],
              })}
              className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                hasVisited ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-xl">✓</span>
              <span className="font-semibold text-slate-900">Yes</span>
            </button>
            <button
              type="button"
              onClick={() => updateData({ visitedSchengenBefore: "no", previousTravelVisits: [] })}
              className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                data.visitedSchengenBefore === "no" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-xl">✗</span>
              <span className="font-semibold text-slate-900">No</span>
            </button>
          </div>

          {hasVisited && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Tell us about each visit:</p>
              <div className="mt-3 space-y-3">
                {data.previousTravelVisits.map((visit, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <input
                      type="text"
                      value={visit.country}
                      onChange={(e) => updateVisit(i, "country", e.target.value)}
                      placeholder="Country"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={visit.year}
                      onChange={(e) => updateVisit(i, "year", e.target.value)}
                      placeholder="Year"
                      className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeVisit(i)}
                      className="text-sm text-slate-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVisit}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-primary-600 hover:border-primary-300 hover:bg-primary-50/50"
                >
                  + Add another visit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {section === "refusals" && (
        <div className="mt-6">
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="flex items-start gap-2 text-sm text-amber-800">
              <span>⚠</span> Embassies ask this directly on the form. Always declare honestly &mdash; we&apos;ll address it in your cover letter.
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Have you ever been refused a visa to any country?
            </label>
            <div className="mt-3 flex gap-4">
              <button
                type="button"
                onClick={() => updateData({
                  previousVisaRejections: "yes",
                  refusalDetails: data.refusalDetails.length ? data.refusalDetails : [{ country: "", year: "", visaType: "", reason: "" }],
                })}
                className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                  data.previousVisaRejections === "yes" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xl">✓</span>
                <span className="font-semibold text-slate-900">Yes</span>
              </button>
              <button
                type="button"
                onClick={() => updateData({ previousVisaRejections: "no", refusalDetails: [] })}
                className={`flex items-center gap-2 rounded-xl border-2 px-6 py-4 transition ${
                  data.previousVisaRejections === "no" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xl">✗</span>
                <span className="font-semibold text-slate-900">No</span>
              </button>
            </div>

            {data.previousVisaRejections === "yes" && (
              <div className="mt-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Tell us about the refusal(s):</p>
                {data.refusalDetails.map((r, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500">Country</label>
                        <select
                          value={r.country}
                          onChange={(e) => updateRefusal(i, "country", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="">Select...</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500">Year</label>
                        <select
                          value={r.year}
                          onChange={(e) => updateRefusal(i, "year", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="">Select...</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Visa type</label>
                      <select
                        value={r.visaType}
                        onChange={(e) => updateRefusal(i, "visaType", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        {VISA_TYPES.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Reason given (optional)</label>
                      <textarea
                        value={r.reason}
                        onChange={(e) => updateRefusal(i, "reason", e.target.value)}
                        placeholder="e.g. Insufficient bank balance, incomplete documents..."
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <button type="button" onClick={() => removeRefusal(i)} className="text-sm text-slate-500 hover:text-red-600">Remove</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRefusal}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-primary-600 hover:border-primary-300 hover:bg-primary-50/50"
                >
                  + Add another refusal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <StepFooter step={6} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
