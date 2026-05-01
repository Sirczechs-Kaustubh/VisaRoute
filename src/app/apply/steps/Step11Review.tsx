"use client";

import { useEffect, useState } from "react";
import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";
import { formatPhoneDisplay } from "@/lib/phone-dial-codes";

interface ReviewData {
  destination: string;
  applyingFrom: string | null;
  warnings: string[];
  sections: {
    personal: {
      fullName: string | null;
      email: string | null;
      phone: string | null;
      countryOfResidence: string | null;
      purpose: string | null;
      travelStart: string | null;
      travelEnd: string | null;
      tripDays: number | null;
    };
    travel: {
      entryCity: string | null;
      accommodation: string | null;
      multiCountry: string | null;
      otherSchengenCountries?: string | null;
      nightsInVisaDestination?: number | null;
      schengenFirstEntryDate?: string | null;
    };
    companions: { travelling: string | null; count: number };
    employment: { status: string | null };
    visaHistory: { country: string | null; year: string | null }[];
    refusals: { country: string | null; year: string | null; visaType: string | null; reason: string | null }[];
    documents: { type: string; fileName: string; extractionStatus: string }[];
    checks: { total: number; passed: number; warnings: number; failed: number };
  };
}

function Field({ label, value }: { label: string; value: string | null | number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value ?? "—"}</p>
    </div>
  );
}

export function Step11Review({
  data,
  updateData,
  countryName,
  onSubmit,
  onBack,
  draftToken,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  countryName: string;
  onSubmit: () => void;
  onBack: () => void;
  draftToken?: string | null;
}) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!draftToken) { setLoading(false); return; }
    fetch(`/api/applications/${draftToken}/review`)
      .then((r) => r.json())
      .then((d) => { if (d.review) setReview(d.review); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [draftToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const r = review;

  return (
    <>
      <TipBox icon="✈️">
        Double-check your travel dates match exactly across your flight booking, hotel, and application form.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 9 of 10</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Review & submit your application.
      </h1>
      <p className="mt-2 text-slate-600">
        Review all details, make final edits, then submit. Critical identity/document fields are locked.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Locked critical fields</p>
        <p className="mt-1 text-sm text-slate-700">
          Destination country, passport details, and uploaded documents are locked at this stage.
        </p>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Quick edits before submit</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">First name</label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => updateData({ firstName: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Last name</label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => updateData({ lastName: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Email</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Phone number</label>
            <input
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => updateData({ phoneNumber: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Purpose of travel</label>
            <select
              value={data.purposeOfTravel}
              onChange={(e) => updateData({ purposeOfTravel: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select purpose...</option>
              <option value="tourism">Tourism</option>
              <option value="business">Business</option>
              <option value="visiting">Visiting family</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Employment status</label>
            <select
              value={data.employmentStatus}
              onChange={(e) => updateData({ employmentStatus: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select status...</option>
              <option value="employed">Employed</option>
              <option value="self-employed">Self-employed</option>
              <option value="student">Student</option>
              <option value="retired">Retired</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>
        </div>
      </section>

      {r && r.warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {r.warnings.map((w, i) => (
            <div key={i} className="rounded-xl bg-amber-50 p-3">
              <p className="flex items-center gap-2 text-sm text-amber-800"><span>▲</span> {w}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <span>👤</span> Personal details
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Full name" value={r?.sections.personal.fullName ?? ([data.firstName, data.lastName].filter(Boolean).join(" ") || null)} />
            <Field label="Email" value={r?.sections.personal.email ?? (data.email || null)} />
            <Field
              label="Phone"
              value={
                r?.sections.personal.phone ??
                formatPhoneDisplay(data.phoneDialCode, data.phoneNumber)
              }
            />
            <Field label="Residence" value={r?.sections.personal.countryOfResidence ?? null} />
            <Field label="Purpose" value={r?.sections.personal.purpose ?? null} />
            <Field label="Applying from" value={r?.applyingFrom ?? null} />
            <Field label="Travel dates" value={
              r ? `${r.sections.personal.travelStart ?? "—"} – ${r.sections.personal.travelEnd ?? "—"}` : null
            } />
            <Field label="Trip duration" value={r?.sections.personal.tripDays ? `${r.sections.personal.tripDays} days` : null} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <span>✈️</span> Travel plan
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Entry city" value={r?.sections.travel.entryCity ?? (data.entryCity || null)} />
            <Field label="Accommodation" value={r?.sections.travel.accommodation ?? null} />
            <Field label="Multi-country" value={r?.sections.travel.multiCountry === "yes" ? "Yes" : r?.sections.travel.multiCountry === "no" ? `No – ${countryName} only` : null} />
            {(r?.sections.travel.multiCountry === "yes" || data.multiCountry === "yes") && (
              <>
                <div className="col-span-2">
                  <Field
                    label="Other Schengen countries"
                    value={
                      r?.sections.travel.otherSchengenCountries ??
                      (data.otherSchengenCountries.trim() || null)
                    }
                  />
                </div>
                <Field
                  label={`Nights in ${countryName}`}
                  value={
                    r?.sections.travel.nightsInVisaDestination ??
                    (data.nightsInVisaDestination.trim()
                      ? parseInt(data.nightsInVisaDestination, 10)
                      : null)
                  }
                />
                <Field
                  label="First day in Schengen"
                  value={
                    r?.sections.travel.schengenFirstEntryDate ??
                    (data.schengenFirstEntryDate.trim() || null)
                  }
                />
              </>
            )}
            <Field label="Companions" value={
              r?.sections.companions.travelling === "yes"
                ? `${r.sections.companions.count} companion(s)`
                : r?.sections.companions.travelling === "no" ? "Solo" : null
            } />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <span>💼</span> Employment & history
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Employment" value={r?.sections.employment.status ?? (data.employmentStatus || null)} />
            <Field label="Prior Schengen visits" value={
              r && r.sections.visaHistory.length > 0
                ? r.sections.visaHistory.map((v) => `${v.country} (${v.year})`).join(", ")
                : data.visitedSchengenBefore === "no" ? "None" : null
            } />
            <div className="col-span-2">
              <Field label="Previous refusals" value={
                r && r.sections.refusals.length > 0
                  ? r.sections.refusals.map((rf) => `${rf.country} (${rf.year})`).join(", ")
                  : data.previousVisaRejections === "no" ? "None" : null
              } />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <span>📄</span> Documents & checks
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Documents uploaded" value={r ? `${r.sections.documents.length} document(s)` : `${data.uploadedDocuments.length} document(s)`} />
            {r && r.sections.checks.total > 0 && (
              <>
                <Field label="Checks passed" value={`${r.sections.checks.passed}/${r.sections.checks.total}`} />
                {r.sections.checks.failed > 0 && (
                  <Field label="Checks failed" value={`${r.sections.checks.failed}`} />
                )}
                {r.sections.checks.warnings > 0 && (
                  <Field label="Warnings" value={`${r.sections.checks.warnings}`} />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <StepFooter step={9} total={10} onBack={onBack} onNext={onSubmit} nextLabel="Submit application" />
    </>
  );
}
