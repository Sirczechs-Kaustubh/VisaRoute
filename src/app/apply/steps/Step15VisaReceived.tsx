"use client";

import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

const OUTCOME_OPTIONS = [
  { id: "granted", label: "Yes (Granted)" },
  { id: "refused", label: "Refused" },
  { id: "clarification_asked", label: "Clarification asked" },
  { id: "other", label: "Other" },
] as const;

export function Step15VisaReceived({
  data,
  updateData,
  onBack,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  onBack: () => void;
}) {
  return (
    <>
      <TipBox icon="🛂">
        Finalize the visa outcome to complete customer-side tracking.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 13 of 13</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Visa received status.
      </h1>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Outcome</label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {OUTCOME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateData({ visaOutcome: opt.id })}
                className={`rounded-xl border px-4 py-2 text-left text-sm font-medium ${
                  data.visaOutcome === opt.id
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {data.visaOutcome === "granted" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Visa number
            </label>
            <input
              type="text"
              value={data.visaNumber}
              onChange={(e) => updateData({ visaNumber: e.target.value })}
              placeholder="Enter visa number"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Notes</label>
          <textarea
            value={data.visaOutcomeNotes}
            onChange={(e) => updateData({ visaOutcomeNotes: e.target.value })}
            rows={4}
            placeholder="Any final remarks about decision/outcome"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      <StepFooter step={13} total={13} onBack={onBack} onNext={() => {}} hideNext />
    </>
  );
}
