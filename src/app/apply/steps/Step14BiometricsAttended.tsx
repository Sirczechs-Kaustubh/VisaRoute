"use client";

import type { ApplicationData } from "../ApplyFlow";
import { StepFooter, TipBox } from "../StepFooter";

export function Step14BiometricsAttended({
  data,
  updateData,
  onNext,
  onBack,
}: {
  data: ApplicationData;
  updateData: (u: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <TipBox icon="🧬">
        Record biometrics attendance as soon as the appointment is completed.
      </TipBox>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Step 12 of 13</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Appointment / biometrics attended.
      </h1>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Attended
          </label>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => updateData({ biometricsAttended: "yes" })}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                data.biometricsAttended === "yes"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => updateData({ biometricsAttended: "no" })}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                data.biometricsAttended === "no"
                  ? "border-rose-500 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              No
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Notes</label>
          <textarea
            value={data.biometricsNotes}
            onChange={(e) => updateData({ biometricsNotes: e.target.value })}
            rows={4}
            placeholder="Any updates from biometrics appointment"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      <StepFooter step={12} total={13} onBack={onBack} onNext={onNext} />
    </>
  );
}
