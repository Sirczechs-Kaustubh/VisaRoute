"use client";

import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

const EMPLOYMENT_OPTIONS = [
  { id: "employed", label: "Employed", icon: "🏢" },
  { id: "self-employed", label: "Self-employed", icon: "💡" },
  { id: "student", label: "Student", icon: "🎓" },
  { id: "job-seeking", label: "Job seeking", icon: "🔍" },
  { id: "retired", label: "Retired", icon: "🏖️" },
  { id: "other", label: "Other", icon: "👤" },
];

export function Step6Employment({
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
  return (
    <>
      <TipBox icon="💰">
        Show at least €100/day of travel in your bank account. For a 7-day trip, that&apos;s €700+ minimum clearly visible.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 5 of 11</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Your employment & finances.
      </h1>
      <p className="mt-2 text-slate-600">
        A few quick questions to complete your financial profile.
      </p>

      <div className="mt-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">What best describes you?</label>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EMPLOYMENT_OPTIONS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => updateData({ employmentStatus: data.employmentStatus === e.id ? "" : e.id })}
              className={`flex flex-col items-center rounded-xl border-2 p-6 text-center transition ${
                data.employmentStatus === e.id ? "border-primary-500 bg-primary-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <span className="text-3xl">{e.icon}</span>
              <span className="mt-2 font-semibold text-slate-900">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      <StepFooter step={5} total={11} onBack={onBack} onNext={onNext} />
    </>
  );
}
